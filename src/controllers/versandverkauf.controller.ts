import { FastifyReply, FastifyRequest } from 'fastify'
import { PrismaClient } from '../../generated/prisma';
import { cmykToHex } from '../utils/color.util';

const prisma = new PrismaClient();

// Verkauf frägt Fertigmaterial an
export const materialBestaendeAbrufen = async (
  req: FastifyRequest<{
    Body: {
      category: string;
      aufdruck: string | null;
      groesse: string;
      farbe_json: {
        cyan: number;
        magenta: number;
        yellow: number;
        black: number;
      };
      typ: string;
    }[];
  }>,
  reply: FastifyReply
) => {
  try {
    const anfragen = req.body;

    if (
      !Array.isArray(anfragen) ||
      anfragen.some(
        (a) =>
          typeof a.category !== 'string' ||
          typeof a.groesse !== 'string' ||
          typeof a.typ !== 'string' ||
          typeof a.farbe_json !== 'object' ||
          (typeof a.aufdruck !== 'string' && a.aufdruck !== null)
      )
    ) {
      return reply.status(400).send({ error: 'Ungültiges Anfrageformat' });
    }

    const rohLager = await prisma.lager.findFirst({
      where: { bezeichnung: 'Rohmateriallager' },
    });

    const fertigLager = await prisma.lager.findFirst({
      where: { bezeichnung: 'Fertigmateriallager' },
    });

    if (!rohLager || !fertigLager) {
      return reply.status(500).send({ error: 'Lager konnte nicht gefunden werden' });
    }

    const result = [];

    for (const { category, aufdruck, groesse, farbe_json, typ } of anfragen) {
      const isRohmaterial =
        farbe_json.cyan === 0 &&
        farbe_json.magenta === 0 &&
        farbe_json.yellow === 0 &&
        farbe_json.black === 0 &&
        (!aufdruck || aufdruck.trim() === '');

      const zielLager = isRohmaterial ? rohLager : fertigLager;

      let material = await prisma.material.findFirst({
        where: {
          category,
          url: aufdruck,
          groesse,
          farbe_json: { equals: farbe_json },
          typ,
        },
      });

      if (!material) {
        const hexCode = cmykToHex(farbe_json);

        material = await prisma.material.create({
          data: {
            lager_ID: zielLager.lager_ID,
            category,
            farbe_json: { equals: farbe_json },
            url: aufdruck,
            groesse,
            farbe: hexCode,
            typ,
            standardmaterial: isRohmaterial,
          },
        });
      }

      const bestand = await prisma.lagerbestand.aggregate({
        where: { material_ID: material.material_ID },
        _sum: { menge: true },
      });

      result.push({
        material_ID: material.material_ID,
        category: material.category,
        url: material.url,
        groesse: material.groesse,
        farbe: farbe_json,
        typ: material.typ,
        anzahl: bestand._sum.menge || 0,
        lager: zielLager.bezeichnung,
      });
    }

    return reply.send(result);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen des Materialbestands' });
  }
};

// Verkauf fordert Auslagerung an
export async function erstelleAuslagerungsAuftraegeVerkauf(
  req: FastifyRequest<{
    Body: {
      material_ID: number;
      anzahl: number;
      bestellposition?: string;
    }[];
  }>,
  reply: FastifyReply
) {
  const bestellungen = req.body;

  try {
    if (
      !Array.isArray(bestellungen) ||
      bestellungen.some(
        (b) =>
          typeof b.material_ID !== 'number' || typeof b.anzahl !== 'number'
      )
    ) {
      return reply.status(400).send({ error: 'Ungültiges Anfrageformat' });
    }

    const result = [];
    let auftraegeErstellt = false;

    for (const { material_ID, anzahl, bestellposition } of bestellungen) {
      const material = await prisma.material.findUnique({
        where: { material_ID },
      });

      if (!material) {
        result.push({ material_ID, Fehler: 'Material nicht gefunden' });
        continue;
      }

      const lagerbestaende = await prisma.lagerbestand.findMany({
        where: { material_ID },
        orderBy: { eingang_ID: 'asc' },
      });

      const reservierungen = await prisma.auftrag.findMany({
        where: {
          material_ID,
          status: 'Auslagerung angefordert',
        },
        select: {
          menge: true,
          lagerbestand_ID: true,
        },
      });

      const reservierteMengen = reservierungen.reduce((acc, auftrag) => {
        acc[auftrag.lagerbestand_ID] =
          (acc[auftrag.lagerbestand_ID] || 0) + auftrag.menge;
        return acc;
      }, {} as Record<number, number>);

      const gesamtVerfuegbar = lagerbestaende.reduce((sum, bestand) => {
        const verfuegbar =
          bestand.menge - (reservierteMengen[bestand.lagerbestand_ID] || 0);
        return sum + Math.max(verfuegbar, 0);
      }, 0);

      if (gesamtVerfuegbar < anzahl) {
        result.push({
          material_ID,
          Fehler: 'Nicht genügend Fertigmaterial verfügbar',
        });
        continue;
      }

      let verbleibend = anzahl;
      const angelegteAuftraege = [];

      for (const bestand of lagerbestaende) {
        if (verbleibend <= 0) break;

        const reserviert = reservierteMengen[bestand.lagerbestand_ID] || 0;
        const verfuegbar = bestand.menge - reserviert;

        if (verfuegbar <= 0) continue;

        const entnahme = Math.min(verfuegbar, verbleibend);

        const auftrag = await prisma.auftrag.create({
          data: {
            lager_ID: bestand.lager_ID,
            material_ID,
            menge: entnahme,
            status: 'Auslagerung angefordert',
            lagerbestand_ID: bestand.lagerbestand_ID,
            angefordertVon: 'Verkauf und Versand',
            bestellposition: bestellposition ?? null,
          },
        });

        angelegteAuftraege.push({
          auftrag_ID: auftrag.auftrag_ID,
          lagerbestand_ID: bestand.lagerbestand_ID,
          menge: entnahme,
        });

        verbleibend -= entnahme;
        auftraegeErstellt = true;
      }

      if (angelegteAuftraege.length === 0) {
        result.push({
          material_ID,
          Fehler: 'Alle Bestände bereits reserviert',
        });
      } else {
        result.push({ material_ID, Auftraege: angelegteAuftraege });
      }
    }

    if (!auftraegeErstellt) {
      return reply
        .status(409)
        .send({ error: 'Kein Auftrag konnte erstellt werden', details: result });
    }

    return reply.status(200).send({ result });
  } catch (error) {
    console.error('Fehler beim Erstellen der Aufträge:', error);
    return reply
      .status(500)
      .send({ error: 'Interner Serverfehler bei Auftragserstellung' });
  }
}


// Kategorien und dazugehörige Typen auslesen 
export const getKategorienMitGroessenUndTypen = async (
  _req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const materialEintraege = await prisma.material.findMany({
      where: {
        category: {
          notIn: ['Farbe', 'Verpackung', 'Druckfolie'],
        },
      },
      select: {
        category: true,
        groesse: true,
        typ: true,
      },
    });

    const gruppiert: Record<
      string,
      { groessen: Set<string>; typen: Set<string> }
    > = {};

    for (const eintrag of materialEintraege) {
      const kategorie = eintrag.category;
      if (!gruppiert[kategorie]) {
        gruppiert[kategorie] = {
          groessen: new Set(),
          typen: new Set(),
        };
      }
      if (eintrag.groesse) gruppiert[kategorie].groessen.add(eintrag.groesse);
      if (eintrag.typ) gruppiert[kategorie].typen.add(eintrag.typ);
    }

    const ergebnis = Object.entries(gruppiert).map(([kategorie, { groessen, typen }]) => ({
      kategorie,
      groessen: Array.from(groessen),
      typen: Array.from(typen),
    }));

    return reply.send(ergebnis);
  } catch (error) {
    console.error('Fehler beim Abrufen der Kategorien:', error);
    return reply.status(500).send({ error: 'Interner Serverfehler' });
  }
};
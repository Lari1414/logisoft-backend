import { FastifyReply, FastifyRequest } from 'fastify'
import { PrismaClient } from '../../generated/prisma';
import { cmykToHex } from '../utils/color.util';

const prisma = new PrismaClient();

// Verkauf frägt Fertigmaterial an
export const materialBestand = async (
  req: FastifyRequest<{
    Body: {
      category: string;
      aufdruck: string;
      groesse: string;
      farbe_json: {
        cyan: number;
        magenta: number;
        yellow: number;
        black: number;
      }
      typ: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { category, aufdruck, groesse, farbe_json, typ } = req.body;

    let material = await prisma.material.findFirst({
      where: {
        category: category,
        url: aufdruck,
        groesse: groesse,
        farbe_json: {
          equals: farbe_json
        },
        typ: typ,
      },
    });

    const fertiglager = await prisma.lager.findFirst({
      where: {
        bezeichnung: "Fertigmateriallager",
      },
    });

    if (!fertiglager) {
      return reply.status(500).send({ error: 'Fertigmateriallager nicht gefunden' });
    }

    if (!material) {
      const hexCode = cmykToHex(farbe_json);

      material = await prisma.material.create({
        data: {
          lager_ID: fertiglager?.lager_ID,
          category: category,
          farbe_json: {
            equals: farbe_json,
          },
          url: aufdruck,
          groesse: groesse,
          farbe: hexCode,
          typ: typ,
          standardmaterial: false
        },
      });
    }

    const bestand = await prisma.lagerbestand.aggregate({
      where: {
        material_ID: material.material_ID,
      },
      _sum: {
        menge: true,
      },
    });

    const anzahl = bestand._sum.menge || 0;

    return reply.send({
      material_ID: material.material_ID,
      category: material.category,
      url: material.url,
      groesse: material.groesse,
      farbe: material.farbe,
      typ: material.typ,
      anzahl,
    });
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
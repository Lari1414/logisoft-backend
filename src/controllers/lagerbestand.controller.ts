import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';
import { cmykToHex } from '../utils/color.util';

const prisma = new PrismaClient();

interface CreateLagerbestandBody {
  eingang_ID: number;
  lager_ID: number;
  material_ID: number;
  menge: number;
  qualitaet_ID: number;
}

// POST: Lagerbestand anlegen
export const createLagerbestand = async (
  req: FastifyRequest<{ Body: CreateLagerbestandBody }>,
  reply: FastifyReply
) => {
  try {
    const neuerEintrag = await prisma.lagerbestand.create({ data: req.body });
    return reply.status(201).send(neuerEintrag);
  } catch (error) {
    console.error('Fehler bei createLagerbestand:', error);
    return reply.status(500).send({ error: 'Fehler beim Erstellen des Lagerbestands' });
  }
};

// GET: Alle Lagerbestände
export const getAllLagerbestaende = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const eintraege = await prisma.lagerbestand.findMany({
      include: {
        material: true, qualitaet: true
      },
      orderBy: {
        lagerbestand_ID: 'asc',
      },
    });
    return reply.send(eintraege);
  } catch (error) {
    console.error('Fehler bei getAllLagerbestaende:', error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Lagerbestände' });
  }
};

// GET: Lagerbestände mit Lager 1 und Menge > 0
export const getAllLagerbestaendeRoh = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const eintraege = await prisma.lagerbestand.findMany({
      where: {
        lager_ID: 1, menge: { gt: 0 }
      },
      include: {
        material: true, qualitaet: true
      },
      orderBy: {
        lagerbestand_ID: 'asc',
      },
    });
    return reply.send(eintraege);
  } catch (error) {
    console.error('Fehler bei getAllLagerbestaendeRoh:', error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Lagerbestände' });
  }
};

// GET: Lagerbestände mit Lager 2 und Menge > 0
export const getAllLagerbestaendeFertig = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const eintraege = await prisma.lagerbestand.findMany({
      where: {
        lager_ID: 2, menge: { gt: 0 }
      },
      include: {
        material: true
      },
      orderBy: {
        lagerbestand_ID: 'asc',
      },
    });
    return reply.send(eintraege);
  } catch (error) {
    console.error('Fehler bei getAllLagerbestaendeFertig:', error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Lagerbestände' });
  }
};

// GET: Einzelnen Lagerbestand
export const getLagerbestandById = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const bestand = await prisma.lagerbestand.findUnique({ where: { lagerbestand_ID: id } });

    if (!bestand) {
      return reply.status(404).send({ error: 'Lagerbestand nicht gefunden' });
    }

    return reply.send(bestand);
  } catch (error) {
    console.error('Fehler bei getLagerbestandById:', error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen des Lagerbestands' });
  }
};

// PUT: Lagerbestand aktualisieren
export const updateLagerbestandById = async (
  req: FastifyRequest<{ Params: { id: string }, Body: Partial<CreateLagerbestandBody> }>,
  reply: FastifyReply
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await prisma.lagerbestand.update({
      where: { lagerbestand_ID: id },
      data: req.body,
    });

    return reply.send(updated);
  } catch (error: any) {
    console.error('Fehler bei updateLagerbestandById:', error);
    if (error.code === 'P2025') {
      return reply.status(404).send({ error: 'Lagerbestand nicht gefunden' });
    }
    return reply.status(500).send({ error: 'Fehler beim Aktualisieren des Lagerbestands' });
  }
};

// DELETE: Lagerbestand löschen
export const deleteLagerbestandById = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.lagerbestand.delete({ where: { lagerbestand_ID: id } });
    return reply.status(204).send();
  } catch (error: any) {
    console.error('Fehler bei deleteLagerbestandById:', error);
    if (error.code === 'P2025') {
      return reply.status(404).send({ error: 'Lagerbestand nicht gefunden' });
    }
    return reply.status(500).send({ error: 'Fehler beim Löschen des Lagerbestands' });
  }
};

// POST: Auslagern
export const auslagernMaterial = async (
  req: FastifyRequest<{ Body: { lagerbestand_ID: number; menge: number } }>,
  reply: FastifyReply
) => {
  try {
    const { lagerbestand_ID, menge } = req.body;
    const bestand = await prisma.lagerbestand.findUnique({ where: { lagerbestand_ID } });

    if (!bestand) {
      return reply.status(404).send({ error: 'Lagerbestand nicht gefunden' });
    }

    if (bestand.menge < menge) {
      return reply.status(400).send({ error: 'Nicht genügend Material im Lagerbestand' });
    }

    await prisma.lagerbestand.update({
      where: { lagerbestand_ID },
      data: { menge: bestand.menge - menge },
    });

    return reply.status(200).send({ message: 'Material erfolgreich ausgelagert' });
  } catch (error) {
    console.error('Fehler bei auslagernMaterial:', error);
    return reply.status(500).send({ error: 'Fehler beim Auslagern des Materials' });
  }
};

// POST: Einlagern Rohmaterial
export const einlagernRohmaterial = async (
  req: FastifyRequest<{
    Body: {
      eingang_ID: number;
      lager_ID: number;
      menge: number;
      qualitaet_ID: number;
      category: string;
      standardmaterial: boolean;
      farbe_json: { cyan: number; magenta: number; yellow: number; black: number };
      typ: string;
      groesse: string;
      url?: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const {
      eingang_ID,
      lager_ID,
      menge,
      qualitaet_ID,
      category,
      standardmaterial,
      farbe_json,
      typ,
      groesse,
      url
    } = req.body;

    let material = await prisma.material.findFirst({
      where: {
        lager_ID,
        category,
        standardmaterial,
        farbe_json: { equals: farbe_json },
        typ,
        groesse
      }
    });

    const hexCode = cmykToHex(farbe_json);

    if (!material) {
      material = await prisma.material.create({
        data: {
          lager_ID,
          category,
          farbe: hexCode,
          standardmaterial,
          farbe_json,
          typ,
          groesse,
          url
        }
      });
    }

    const bestand = await prisma.lagerbestand.findFirst({
      where: { material_ID: material.material_ID, lager_ID, qualitaet_ID }
    });

    if (bestand) {
      const aktualisiert = await prisma.lagerbestand.update({
        where: { lagerbestand_ID: bestand.lagerbestand_ID },
        data: { menge: bestand.menge + menge }
      });

      return reply.status(200).send(aktualisiert);
    } else {
      const neu = await prisma.lagerbestand.create({
        data: {
          eingang_ID,
          lager_ID,
          material_ID: material.material_ID,
          menge,
          qualitaet_ID
        }
      });

      return reply.status(201).send(neu);
    }
  } catch (error) {
    console.error('Fehler bei einlagernRohmaterial:', error);
    return reply.status(500).send({ error: 'Fehler beim Einlagern des Materials', details: error });
  }
};

// POST: Einlagern Fertigmaterial
export const einlagernFertigmaterial = async (
  req: FastifyRequest<{
    Body: {
      lager_ID: number;
      menge: number;
      standardmaterial: boolean;
      farbe_json: { cyan: number; magenta: number; yellow: number; black: number };
      typ: string;
      groesse: string;
      url?: string;
      category: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const {
      lager_ID,
      menge,
      farbe_json,
      standardmaterial,
      typ,
      groesse,
      url,
      category
    } = req.body;

    let material = await prisma.material.findFirst({
      where: {
        lager_ID,
        farbe_json: { equals: farbe_json },
        typ,
        groesse
      }
    });

    const hexCode = cmykToHex(farbe_json);


    if (!material) {
      material = await prisma.material.create({
        data: {
          lager_ID,
          farbe: hexCode,
          farbe_json,
          standardmaterial,
          typ,
          groesse,
          url,
          category
        }
      });
    }

    const bestand = await prisma.lagerbestand.findFirst({
      where: { material_ID: material.material_ID, lager_ID }
    });

    if (bestand) {
      const aktualisiert = await prisma.lagerbestand.update({
        where: { lagerbestand_ID: bestand.lagerbestand_ID },
        data: { menge: bestand.menge + menge }
      });

      return reply.status(200).send(aktualisiert);
    } else {
      const neu = await prisma.lagerbestand.create({
        data: {
          lager_ID,
          material_ID: material.material_ID,
          menge
        }
      });

      return reply.status(201).send(neu);
    }
  } catch (error) {
    console.error('Fehler bei einlagernFertigmaterial:', error);
    return reply.status(500).send({ error: 'Fehler beim Einlagern des Fertigmaterials', details: error });
  }
};
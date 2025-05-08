// src/controllers/lagerbestand.controller.ts
import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

interface CreateLagerbestandBody {
  eingang_ID: number;
  lager_ID: number;
  material_ID: number;
  menge: number;
  qualitaet_ID:number;
}

// POST: Lagerbestand anlegen
export const createLagerbestand = async (
  req: FastifyRequest<{ Body: CreateLagerbestandBody }>,
  reply: FastifyReply
) => {
  try {
    const { eingang_ID, lager_ID, material_ID, menge,qualitaet_ID } = req.body;

    const neuerEintrag = await prisma.lagerbestand.create({
      data: {
        eingang_ID,
        lager_ID,
        material_ID,
        menge,
        qualitaet_ID
      },
    });

    return reply.status(201).send(neuerEintrag);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Erstellen des Lagerbestands' });
  }
};

// GET: Alle Lagerbestände abrufen
export const getAllLagerbestaende = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const eintraege = await prisma.lagerbestand.findMany();
    return reply.send(eintraege);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Lagerbestände' });
  }
};

// GET: Einzelnen Lagerbestand abrufen
export const getLagerbestandById = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const bestand = await prisma.lagerbestand.findUnique({
      where: { lagerbestand_ID: id },
    });

    if (!bestand) {
      return reply.status(404).send({ error: 'Lagerbestand nicht gefunden' });
    }

    return reply.send(bestand);
  } catch (error) {
    console.error(error);
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
    const data = req.body;

    const updated = await prisma.lagerbestand.update({
      where: { lagerbestand_ID: id },
      data,
    });

    return reply.send(updated);
  } catch (error: any) {
    console.error(error);
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
    await prisma.lagerbestand.delete({
      where: { lagerbestand_ID: id },
    });

    return reply.status(204).send();
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return reply.status(404).send({ error: 'Lagerbestand nicht gefunden' });
    }
    return reply.status(500).send({ error: 'Fehler beim Löschen des Lagerbestands' });
  }
};

export const getMaterialBestand = async (
  req: FastifyRequest<{
    Body: {
      category: string;
      aufdruck: string;  // Dies ist die URL
      groesse: string;
      farbe: string;
      typ: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const {category, aufdruck, groesse, farbe, typ } = req.body;

    // 1. Suche das passende Material in der Materialtabelle
    let material = await prisma.material.findFirst({
      where: {
        category: category,
        url: aufdruck,
        groesse: groesse,
        farbe: farbe,
        typ: typ,
      },
    });

    // Wenn kein Material gefunden wurde, erstellen wir einen neuen Eintrag
    if (!material) {
      const istUrlGueltig = typeof aufdruck === 'string' && aufdruck.trim() !== '';

      material = await prisma.material.create({
        data: {
          lager_ID: istUrlGueltig ? 2 : 1,
          category: category,
          url: istUrlGueltig ? aufdruck : null,
          groesse: groesse,
          farbe: farbe,
          typ: typ,
        },
      });
    }


    // 2. Berechne die Gesamtmenge des Materials im Lagerbestand
    const bestand = await prisma.lagerbestand.aggregate({
      where: {
        material_ID: material.material_ID,  // Material aus der Materialtabelle
      },
      _sum: {
        menge: true,  // Summiere die Mengen
      },
    });

    const anzahl = bestand._sum.menge || 0;  // Wenn keine Mengen gefunden werden, ist es 0

    // 3. Antwort mit der Anzahl und den Materialdetails
    return reply.send({
      material_ID: material.material_ID, // Die material_ID zurückgeben
      anzahl,
    });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen des Materialbestands' });
  }
};


import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

interface CreateQualitaetBody {
  viskositaet: number;
  ppml: number;
  saugfaehigkeit: number;
  weissgrad: number;
}

// POST: Qualität erstellen
export const createQualitaet = async (req: FastifyRequest<{ Body: CreateQualitaetBody }>, reply: FastifyReply) => {
  try {
    const { viskositaet, ppml, saugfaehigkeit, weissgrad } = req.body;

    const neueQualitaet = await prisma.qualitaet.create({
      data: {
        viskositaet,
        ppml,
        saugfaehigkeit,
        weissgrad,
      },
    });

    return reply.status(201).send(neueQualitaet);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Erstellen der Qualität' });
  }
};

// GET: Alle Qualitätsdatensätze
export const getAllQualitaeten = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const daten = await prisma.qualitaet.findMany();
    return reply.send(daten);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Qualitätsdaten' });
  }
};

// GET: Qualität nach ID
export const getQualitaetById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = parseInt(req.params.id, 10);

    const qualitaet = await prisma.qualitaet.findUnique({
      where: { qualitaet_ID: id },
    });

    if (!qualitaet) {
      return reply.status(404).send({ error: 'Qualität nicht gefunden' });
    }

    return reply.send(qualitaet);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Qualität' });
  }
};

// PUT: Qualität aktualisieren
export const updateQualitaetById = async (
  req: FastifyRequest<{ Params: { id: string }, Body: Partial<CreateQualitaetBody> }>,
  reply: FastifyReply
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = req.body;

    const updated = await prisma.qualitaet.update({
      where: { qualitaet_ID: id },
      data,
    });

    return reply.send(updated);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return reply.status(404).send({ error: 'Qualität nicht gefunden' });
    }
    return reply.status(500).send({ error: 'Fehler beim Aktualisieren der Qualität' });
  }
};

// DELETE: Qualität löschen
export const deleteQualitaetById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = parseInt(req.params.id, 10);

    await prisma.qualitaet.delete({
      where: { qualitaet_ID: id },
    });

    return reply.status(204).send();
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return reply.status(404).send({ error: 'Qualität nicht gefunden' });
    }
    return reply.status(500).send({ error: 'Fehler beim Löschen der Qualität' });
  }
};
import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

interface CreateMindestbestandBody {
  material_ID: number;
  mindestbestand: number;
}

// POST: Mindestbestand erstellen
export const createMindestbestand = async (req: FastifyRequest<{ Body: CreateMindestbestandBody }>, reply: FastifyReply) => {
  try {
    const { material_ID, mindestbestand } = req.body;

    const neuerMindestbestand = await prisma.mindestbestand.create({
      data: {
        material_ID,
        mindestbestand,
      },
    });

    return reply.status(201).send(neuerMindestbestand);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Erstellen des Mindestbestands' });
  }
};

// GET: Alle Mindestbestände abrufen
export const getAllMindestbestand = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const eintraege = await prisma.mindestbestand.findMany();
    return reply.send(eintraege);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Mindestbestände' });
  }
};

// GET: Mindestbestand nach ID
export const getMindestbestandById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = parseInt(req.params.id, 10);

    const bestand = await prisma.mindestbestand.findUnique({
      where: { mindestbestand_ID: id },
    });

    if (!bestand) {
      return reply.status(404).send({ error: 'Mindestbestand nicht gefunden' });
    }

    return reply.send(bestand);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen des Mindestbestands' });
  }
};

// PUT: Mindestbestand aktualisieren
export const updateMindestbestandById = async (req: FastifyRequest<{ Params: { id: string }, Body: Partial<CreateMindestbestandBody> }>, reply: FastifyReply) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = req.body;

    const updated = await prisma.mindestbestand.update({
      where: { mindestbestand_ID: id },
      data,
    });

    return reply.send(updated);
  } catch (error: any) {
    console.error(error);

    if (error.code === 'P2025') {
      return reply.status(404).send({ error: 'Mindestbestand nicht gefunden' });
    }

    return reply.status(500).send({ error: 'Fehler beim Aktualisieren des Mindestbestands' });
  }
};

// DELETE: Mindestbestand löschen
export const deleteMindestbestandById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = parseInt(req.params.id, 10);

    await prisma.mindestbestand.delete({
      where: { mindestbestand_ID: id },
    });

    return reply.status(204).send();
  } catch (error: any) {
    console.error(error);

    if (error.code === 'P2025') {
      return reply.status(404).send({ error: 'Mindestbestand nicht gefunden' });
    }

    return reply.status(500).send({ error: 'Fehler beim Löschen des Mindestbestands' });
  }
};

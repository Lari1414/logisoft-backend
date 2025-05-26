import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

interface CreateLagerBody {
  bezeichnung: string;
}

// POST /createLager – Lager anlegen
export const createLager = async (request: FastifyRequest<{ Body: CreateLagerBody }>, reply: FastifyReply) => {
  try {
    const { bezeichnung } = request.body;

    const neuesLager = await prisma.lager.create({
      data: {
        bezeichnung,
      },
    });

    reply.status(201).send(neuesLager);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: 'Fehler beim Erstellen des Lagers' });
  }
};

// GET /allLager – Alle Läger abrufen
export const getAllLager = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const laeger = await prisma.lager.findMany({
      orderBy: {
        lager_ID: 'asc',
      },
    });

    reply.send(laeger);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: 'Fehler beim Abrufen der Läger' });
  }
};

export const getLagerById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;

    const lager = await prisma.lager.findUnique({
      where: { lager_ID: parseInt(id, 10) },
    });

    if (!lager) {
      return reply.status(404).send({ error: 'Lager nicht gefunden' });
    }

    reply.send(lager);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: 'Fehler beim Abrufen des Lagers' });
  }
};

export const updateLagerById = async (request: FastifyRequest<{ Params: { id: string }, Body: { bezeichnung: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const { bezeichnung } = request.body;

    const updated = await prisma.lager.update({
      where: { lager_ID: parseInt(id, 10) },
      data: { bezeichnung },
    });

    reply.send(updated);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: 'Fehler beim Aktualisieren des Lagers' });
  }
};
export const deleteLagerById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    await prisma.lager.delete({
      where: { lager_ID: parseInt(id, 10) },
    });

    reply.status(204).send();
  } catch (error: any) {
    console.error(error);

    if (error.code === 'P2025') {
      return reply.status(404).send({ error: 'Lager nicht gefunden' });
    }

    reply.status(500).send({ error: 'Fehler beim Löschen des Lagers' });
  }
};
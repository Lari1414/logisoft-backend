import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

// POST: Adresse erstellen
export const createAdresse = async (req: FastifyRequest<{ Body: { strasse: string, ort: string, plz: number } }>, reply: FastifyReply) => {
  try {
    const data = req.body;
    const neueAdresse = await prisma.adresse.create({ data });
    reply.status(201).send(neueAdresse);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: 'Fehler beim Erstellen der Adresse' });
  }
};

// GET: Alle Adressen abrufen
export const getAllAdressen = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const adressen = await prisma.adresse.findMany({
      orderBy: {
        adresse_ID: 'asc',
      },
    });
    reply.send(adressen);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: 'Fehler beim Abrufen der Adressen' });
  }
};

// GET: Adresse nach ID abrufen
export const getAdresseById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const adresse = await prisma.adresse.findUnique({
      where: { adresse_ID: parseInt(req.params.id, 10) },
    });

    if (!adresse) {
      return reply.status(404).send({ error: 'Adresse nicht gefunden' });
    }

    reply.send(adresse);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: 'Fehler beim Abrufen der Adresse' });
  }
};

// PUT: Adresse aktualisieren
export const updateAdresseById = async (req: FastifyRequest<{ Params: { id: string }, Body: { strasse: string, ort: string, plz: number } }>, reply: FastifyReply) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await prisma.adresse.update({
      where: { adresse_ID: id },
      data: req.body,
    });
    reply.send(updated);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: 'Fehler beim Aktualisieren der Adresse' });
  }
};

// DELETE: Adresse löschen
export const deleteAdresseById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.adresse.delete({
      where: { adresse_ID: id },
    });
    reply.status(204).send();
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: 'Fehler beim Löschen der Adresse' });
  }
};

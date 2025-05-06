import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

// Typen für Lieferant
interface LieferantInput {
  firmenname: string;
  kontaktperson: string;
  adresse_ID: number;  // Foreign Key zur Adresse
}

// POST: Lieferant erstellen
export const createLieferant = async (request: FastifyRequest<{ Body: LieferantInput }>, reply: FastifyReply) => {
  try {
    const { firmenname, kontaktperson, adresse_ID } = request.body;
    const neuerLieferant = await prisma.lieferant.create({
      data: {
        firmenname,
        kontaktperson,
        adresse_ID,  // Verknüpfung mit Adresse über ID
      },
    });
    reply.status(201).send(neuerLieferant);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Fehler beim Anlegen des Lieferanten' });
  }
};

// GET: Alle Lieferanten
export const getAllLieferant = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const lieferanten = await prisma.lieferant.findMany({
      include: { adresse: true },  // Adresse mit einbeziehen
    });
    reply.send(lieferanten);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: 'Fehler beim Abrufen der Lieferanten' });
  }
};

// GET: Lieferant nach ID
export const getLieferantById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const lieferant = await prisma.lieferant.findUnique({
      where: { lieferant_ID: parseInt(request.params.id, 10) },
      include: { adresse: true },  // Adresse mit einbeziehen
    });

    if (!lieferant) {
      return reply.status(404).send({ error: 'Lieferant nicht gefunden' });
    }

    reply.send(lieferant);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: 'Fehler beim Abrufen des Lieferanten' });
  }
};

// PUT: Lieferant aktualisieren
export const updateLieferantById = async (
  request: FastifyRequest<{ Params: { id: string }; Body: LieferantInput }>,
  reply: FastifyReply
) => {
  try {
    const { firmenname, kontaktperson, adresse_ID } = request.body;
    const lieferantId = parseInt(request.params.id, 10);

    const lieferant = await prisma.lieferant.findUnique({
      where: { lieferant_ID: lieferantId },
    });

    if (!lieferant) {
      return reply.status(404).send({ error: 'Lieferant nicht gefunden' });
    }

    const updatedLieferant = await prisma.lieferant.update({
      where: { lieferant_ID: lieferantId },
      data: {
        firmenname,
        kontaktperson,
        adresse_ID,  // Adresse bleibt referenziert
      },
    });

    reply.send(updatedLieferant);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: 'Fehler beim Aktualisieren des Lieferanten' });
  }
};

// DELETE: Lieferant löschen
export const deleteLieferantById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const id = parseInt(request.params.id, 10);
    const lieferant = await prisma.lieferant.findUnique({
      where: { lieferant_ID: id },
    });

    if (!lieferant) {
      return reply.status(404).send({ error: 'Lieferant nicht gefunden' });
    }

    // Optionale Logik: Lösche Adresse, wenn nicht anders genutzt
    // await prisma.adresse.delete({ where: { adresse_ID: lieferant.adresse_ID } });

    await prisma.lieferant.delete({
      where: { lieferant_ID: id },
    });

    reply.status(204).send();
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: 'Fehler beim Löschen des Lieferanten' });
  }
};

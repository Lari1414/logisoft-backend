import { PrismaClient } from '../../generated/prisma'; // Beachte den Pfad zu deinem Prisma Client
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

interface EingangBody {
  material_ID: number;
  materialbestellung_ID: number;
  menge: number;
  status?: string;
  qualitaet_ID: number;
  lieferdatum: string; // ISO-Datumstring (z.B. "2025-05-04T00:00:00.000Z")
}

// POST: Neuer Wareneingang
export const createEingang = async (req: FastifyRequest<{ Body: EingangBody }>, reply: FastifyReply) => {
  try {
    const eingang = await prisma.wareneingang.create({
      data: {
        material_ID: req.body.material_ID,
        materialbestellung_ID: req.body.materialbestellung_ID,
        menge: req.body.menge,
        status: req.body.status,
        qualitaet_ID: req.body.qualitaet_ID,
        lieferdatum: new Date(req.body.lieferdatum), // Umwandlung des Strings in ein Date-Objekt
      },
    });
    reply.status(201).send(eingang);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Fehler beim Erstellen des Wareneingangs' });
  }
};

// GET: Alle Wareneingänge
export const getAllEingaenge = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await prisma.wareneingang.findMany({
      include: {
        material: true,           // Bezug zum Material (Materialmodell)
        materialbestellung: true, // Bezug zur Materialbestellung
        qualitaet: true,         // Bezug zur Qualität (Qualitätsmodell)
      },
    });
    reply.send(result);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Fehler beim Abrufen der Wareneingänge' });
  }
};

// GET: Einzelner Wareneingang
export const getEingangById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const eingang = await prisma.wareneingang.findUnique({
      where: { eingang_ID: parseInt(req.params.id, 10) }, // Eingangs-ID zur Abfrage
      include: {
        material: true,           // Bezug zum Material (Materialmodell)
        materialbestellung: true, // Bezug zur Materialbestellung
        qualitaet: true,         // Bezug zur Qualität (Qualitätsmodell)
      },
    });
    if (!eingang) {
      return reply.status(404).send({ error: 'Wareneingang nicht gefunden' });
    }
    reply.send(eingang);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Fehler beim Abrufen des Wareneingangs' });
  }
};

// PUT: Wareneingang aktualisieren
export const updateEingangById = async (req: FastifyRequest<{ Params: { id: string }, Body: Partial<EingangBody> }>, reply: FastifyReply) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await prisma.wareneingang.update({
      where: { eingang_ID: id },
      data: req.body,  // Hier wird der Body verwendet, der die Änderungen enthält
    });
    reply.send(updated);
  } catch (err: any) {
    console.error(err);
    if (err.code === 'P2025') {
      return reply.status(404).send({ error: 'Wareneingang nicht gefunden' });
    }
    reply.status(500).send({ error: 'Fehler beim Aktualisieren' });
  }
};

// DELETE: Wareneingang löschen
export const deleteEingangById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.wareneingang.delete({ where: { eingang_ID: id } });
    reply.status(204).send();  // Kein Inhalt, aber erfolgreiche Löschung
  } catch (err: any) {
    console.error(err);
    if (err.code === 'P2025') {
      return reply.status(404).send({ error: 'Wareneingang nicht gefunden' });
    }
    reply.status(500).send({ error: 'Fehler beim Löschen' });
  }
};

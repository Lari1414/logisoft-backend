import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

interface EingangBody {
  material_ID: number;
  materialbestellung_ID: number;
  menge: number;
  status?: string;
  lieferdatum: string;
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
        lieferdatum: new Date(req.body.lieferdatum),
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
        material: true,
        materialbestellung: true,
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
      where: { eingang_ID: parseInt(req.params.id, 10) },
      include: {
        material: true,
        materialbestellung: true,
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
      data: req.body,
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
    reply.status(204).send();
  } catch (err: any) {
    console.error(err);
    if (err.code === 'P2025') {
      return reply.status(404).send({ error: 'Wareneingang nicht gefunden' });
    }
    reply.status(500).send({ error: 'Fehler beim Löschen' });
  }
};

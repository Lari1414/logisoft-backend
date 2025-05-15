import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

interface BestellungInput {
  lieferant_ID: number;
  material_ID: number;
  menge: number;
}

// POST: Materialbestellung erstellen
export const createMaterialbestellung = async (
  req: FastifyRequest<{ Body: BestellungInput }>,
  reply: FastifyReply
) => {
  try {
    const bestellung = await prisma.materialbestellung.create({
      data: {
        menge: req.body.menge,
        status: 'offen',
        lieferant: {
          connect: { lieferant_ID: req.body.lieferant_ID },
        },
        material: {
          connect: { material_ID: req.body.material_ID },
        },
      },
    });
    return reply.status(201).send(bestellung);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Erstellen der Bestellung' });
  }
};

// GET: Alle Bestellungen
export const getAllMaterialbestellungen = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const bestellungen = await prisma.materialbestellung.findMany({
      include: {
        lieferant: true,
        material: true,
      },
    });
    return reply.send(bestellungen);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Bestellungen' });
  }
};

// GET: Alle Bestellungen mit Status "bestellt"
export const getAllMaterialbestellungenBestellt = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const bestellungen = await prisma.materialbestellung.findMany({
      where: {
        status: 'bestellt',
      },
      include: {
        lieferant: true,
        material: true,
      },
    });
    return reply.send(bestellungen);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Bestellungen' });
  }
};

// GET: Alle Bestellungen mit Status "offen"
export const getAllMaterialbestellungenBestellen = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const bestellungen = await prisma.materialbestellung.findMany({
      where: {
        status: 'offen',
      },
      include: {
        lieferant: true,
        material: true,
      },
    });
    return reply.send(bestellungen);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Bestellungen' });
  }
};

// GET: Bestellung nach ID
export const getMaterialbestellungById = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const bestellung = await prisma.materialbestellung.findUnique({
      where: { materialbestellung_ID: id },
      include: {
        lieferant: true,
        material: true,
      },
    });

    if (!bestellung) {
      return reply.status(404).send({ error: 'Bestellung nicht gefunden' });
    }

    return reply.send(bestellung);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Bestellung' });
  }
};

// PUT: Bestellung aktualisieren
export const updateMaterialbestellungenStatus = async (
  req: FastifyRequest<{ Body: { ids: number[] } }>,
  reply: FastifyReply
) => {
  try {
    const { ids } = req.body;

    const result = await prisma.materialbestellung.updateMany({
      where: {
        materialbestellung_ID: { in: ids },
        status: 'offen',
      },
      data: {
        status: 'bestellt',
      },
    });

    return reply.send({ updatedCount: result.count });
  } catch (error: any) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Aktualisieren der Bestellungen' });
  }
};

// DELETE: Bestellung löschen
export const deleteMaterialbestellungById = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.materialbestellung.delete({
      where: { materialbestellung_ID: id },
    });
    return reply.status(204).send();
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return reply.status(404).send({ error: 'Bestellung nicht gefunden' });
    }
    return reply.status(500).send({ error: 'Fehler beim Löschen der Bestellung' });
  }
};

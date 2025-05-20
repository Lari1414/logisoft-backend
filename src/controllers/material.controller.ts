import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

interface CreateMaterialBody {
  lager_ID: number;
  category?: string;
  standardmaterial: boolean;
  farbe?: string;
  farbe_json: {
    cyan: string;
    magenta: string;
    yellow: string;
    balck: string;
  }
  typ?: string;
  groesse?: string;
  url?: string;
}

// POST: Material erstellen
export const createMaterial = async (req: FastifyRequest<{ Body: CreateMaterialBody }>, reply: FastifyReply) => {
  try {
    const { lager_ID, category, farbe, typ, groesse, url, farbe_json, standardmaterial } = req.body;

    const newMaterial = await prisma.material.create({
      data: {
        lager_ID,
        category,
        farbe,
        farbe_json: {
          equals: farbe_json,
        },
        standardmaterial,
        typ,
        groesse,
        url,
      },
    });

    return reply.status(201).send(newMaterial);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Erstellen des Materials' });
  }
};

// GET: Alle Materialien abrufen
export const getAllMaterials = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const materials = await prisma.material.findMany();
    return reply.send(materials);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Materialien', message: error });
  }
};

// GET : Nur Rohmaterial anzeigen
export const getRawMaterials = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const rohLager = await prisma.lager.findFirst({
      where: { bezeichnung: 'Rohmateriallager' },
    });

    if (!rohLager) {
      return reply.status(500).send({ error: 'Rohmateriallager nicht gefunden' });
    }

    const materials = await prisma.material.findMany({
      where: {
        lager_ID: rohLager.lager_ID,
      },
    });

    return reply.send(materials);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Rohmaterialien' });
  }
};

// GET : Nur Fertmaterial anzeigen
export const getFinishedMaterials = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const fertigLager = await prisma.lager.findFirst({
      where: { bezeichnung: 'Fertigmateriallager' },
    });

    if (!fertigLager) {
      return reply.status(500).send({ error: 'Fertigmateriallager nicht gefunden' });
    }

    const materials = await prisma.material.findMany({
      where: {
        lager_ID: fertigLager.lager_ID,
      },
    });

    return reply.send(materials);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Fertigmaterialien' });
  }
};

// GET: Einzelnes Material abrufen
export const getMaterialById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = parseInt(req.params.id, 10);
    const material = await prisma.material.findUnique({
      where: { material_ID: id },
    });

    if (!material) {
      return reply.status(404).send({ error: 'Material nicht gefunden' });
    }

    return reply.send(material);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen des Materials' });
  }
};

// PUT: Material aktualisieren
export const updateMaterialById = async (req: FastifyRequest<{ Params: { id: string }, Body: Partial<CreateMaterialBody> }>, reply: FastifyReply) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = req.body;

    const updated = await prisma.material.update({
      where: { material_ID: id },
      data,
    });

    return reply.send(updated);
  } catch (error: any) {
    console.error(error);

    if (error.code === 'P2025') {
      return reply.status(404).send({ error: 'Material nicht gefunden' });
    }

    return reply.status(500).send({ error: 'Fehler beim Aktualisieren des Materials' });
  }
};

// DELETE: Material löschen
export const deleteMaterialById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = parseInt(req.params.id, 10);

    await prisma.material.delete({
      where: { material_ID: id },
    });

    return reply.status(204).send();
  } catch (error: any) {
    console.error(error);

    if (error.code === 'P2025') {
      return reply.status(404).send({ error: 'Material nicht gefunden' });
    }

    return reply.status(500).send({ error: 'Fehler beim Löschen des Materials' });
  }
};
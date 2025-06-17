import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';
import { cmykToHex } from '../utils/color.util';

const prisma = new PrismaClient();

interface CreateMaterialBody {
  lager_ID: number;
  category: string;
  standardmaterial: boolean;
  materialbezeichnung: string | null;
  farbe_json: {
    cyan: number;
    magenta: number;
    yellow: number;
    black: number;
  }
  typ?: string;
  groesse?: string;
  url?: string;
  farbe?: string;
}

// POST: Material erstellen
export const createMaterial = async (req: FastifyRequest<{ Body: CreateMaterialBody }>, reply: FastifyReply) => {
  try {
    const { lager_ID, category, typ, groesse, url, farbe_json, standardmaterial, materialbezeichnung } = req.body;

    const hexCode = cmykToHex(farbe_json);

    const newMaterial = await prisma.material.create({
      data: {
        lager_ID,
        category,
        farbe: hexCode,
        farbe_json,
        standardmaterial,
        materialbezeichnung,
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
    const materials = await prisma.material.findMany({
      orderBy: {
        material_ID: 'asc',
      },
    });
    return reply.send(materials);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({
      error: 'Fehler beim Abrufen der Materialien',
      message: error,
    });
  }
};

// GET: Standard Materialien abrufen
export const getStandardMaterials = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const materials = await prisma.material.findMany({
      where: {
        standardmaterial: true,
      },
      orderBy: {
        material_ID: 'asc',
      },
    });
    return reply.send(materials);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({
      error: 'Fehler beim Abrufen der Materialien',
      message: error,
    });
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
      orderBy: {
        material_ID: 'asc',
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
      orderBy: {
        material_ID: 'asc',
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

    if (data.farbe_json) {
      const hexCode = cmykToHex(data.farbe_json);
      data.farbe = hexCode;
    }

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

// GET : Kategorien anzeigen
export const getAllMaterialCategories = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const kategorien = await prisma.material.findMany({
      where: {
        NOT: {
          category: null,
        } as any,
      },
      distinct: ['category'],
      select: {
        category: true,
      },
      orderBy: {
        category: 'asc',
      },
    });

    reply.send(kategorien);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: 'Fehler beim Abrufen der Kategorien' });
  }
};
// src/controllers/material.controller.ts
import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

// Prisma-Client-Instanz
const prisma = new PrismaClient();

// Interface für den Request Body
interface CreateMaterialBody {
  lager_ID: number;
  category?: string;
  farbe?: string;
  typ?: string;
  groesse?: string;
  url?: string;
}

// POST: Material erstellen
export const createMaterial = async (req: FastifyRequest<{ Body: CreateMaterialBody }>, reply: FastifyReply) => {
  try {
    const { lager_ID, category, farbe, typ, groesse, url } = req.body;

    // Material in der Datenbank erstellen
    const newMaterial = await prisma.material.create({
      data: {
        lager_ID,
        category,
        farbe,
        typ,
        groesse,
        url,
      },
    });

    return reply.status(201).send(newMaterial); // Rückgabe des neuen Materials
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Erstellen des Materials' });
  }
};

// GET: Alle Materialien abrufen
export const getAllMaterials = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const materials = await prisma.material.findMany();
    return reply.send(materials); // Rückgabe der Liste von Materialien
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Materialien' });
  }
};


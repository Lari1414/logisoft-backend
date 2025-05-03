import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const createLieferant = async (req: Request, res: Response) => {
  try {
    const { firmenname, kontaktperson, adresse } = req.body;

    const neueAdresse = await prisma.adresse.create({
      data: adresse,
    });

    const neuerLieferant = await prisma.lieferant.create({
      data: {
        firmenname,
        kontaktperson,
        adresse_ID: neueAdresse.adresse_ID,
      },
    });

    res.status(201).json(neuerLieferant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Anlegen' });
  }
};
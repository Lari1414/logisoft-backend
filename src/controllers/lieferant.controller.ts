import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

export const createLieferant = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { firmenname, kontaktperson, adresse } = request.body as {
      firmenname: string;
      kontaktperson: string;
      adresse: {
        strasse: string;
        ort: string;
        plz: number;
      };
    };

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

    reply.status(201).send(neuerLieferant);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Fehler beim Anlegen' });
  }
};

import { FastifyReply, FastifyRequest } from 'fastify'
import { PrismaClient } from '../../generated/prisma';
import { cmykToHex } from '../utils/color.util';

const prisma = new PrismaClient();

export const getMaterialBestand = async (
  req: FastifyRequest<{
    Body: {
      category: string;
      aufdruck: string;
      groesse: string;
      standardmaterial: boolean;
      farbe_json: {
        cyan: number;
        magenta: number;
        yellow: number;
        black: number;
      }
      typ: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { category, aufdruck, groesse, farbe_json, typ, standardmaterial } = req.body;

    let material = await prisma.material.findFirst({
      where: {
        category: category,
        url: aufdruck,
        groesse: groesse,
        farbe_json: {
          equals: farbe_json
        },
        typ: typ,
      },
    });

    if (!material) {
      const istUrlGueltig = typeof aufdruck === 'string' && aufdruck.trim() !== '';

      const hexCode = cmykToHex(farbe_json);


      material = await prisma.material.create({
        data: {
          lager_ID: istUrlGueltig ? 2 : 1,
          category: category,
          standardmaterial: standardmaterial,
          farbe_json: {
            equals: farbe_json,
          },
          url: istUrlGueltig ? aufdruck : null,
          groesse: groesse,
          farbe: hexCode,
          typ: typ,
        },
      });
    }

    const bestand = await prisma.lagerbestand.aggregate({
      where: {
        material_ID: material.material_ID,
      },
      _sum: {
        menge: true,
      },
    });

    const anzahl = bestand._sum.menge || 0;

    return reply.send({
      material_ID: material.material_ID,
      category: material.category,
      url: material.url,
      groesse: material.groesse,
      farbe: material.farbe,
      typ: material.typ,
      anzahl,
    });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen des Materialbestands' });
  }
};
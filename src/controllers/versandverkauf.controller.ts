import { FastifyReply, FastifyRequest } from 'fastify'
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();
export const getMaterialBestand = async (
  req: FastifyRequest<{
    Body: {
      category: string;
      aufdruck: string;  // Dies ist die URL
      groesse: string;
      farbe: string;
      typ: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const {category, aufdruck, groesse, farbe, typ } = req.body;

    // 1. Suche das passende Material in der Materialtabelle
    let material = await prisma.material.findFirst({
      where: {
        category: category,
        url: aufdruck,
        groesse: groesse,
        farbe: farbe,
        typ: typ,
      },
    });

    // Wenn kein Material gefunden wurde, erstellen wir einen neuen Eintrag
    if (!material) {
      const istUrlGueltig = typeof aufdruck === 'string' && aufdruck.trim() !== '';

      material = await prisma.material.create({
        data: {
          lager_ID: istUrlGueltig ? 2 : 1,
          category: category,
          url: istUrlGueltig ? aufdruck : null,
          groesse: groesse,
          farbe: farbe,
          typ: typ,
        },
      });
    }


    // 2. Berechne die Gesamtmenge des Materials im Lagerbestand
    const bestand = await prisma.lagerbestand.aggregate({
      where: {
        material_ID: material.material_ID,  // Material aus der Materialtabelle
      },
      _sum: {
        menge: true,  // Summiere die Mengen
      },
    });

    const anzahl = bestand._sum.menge || 0;  // Wenn keine Mengen gefunden werden, ist es 0

    // 3. Antwort mit der Anzahl und den Materialdetails
    return reply.send({
      material_ID: material.material_ID, // Die material_ID zurückgeben
      category: material.category,
      url:  material.url ,
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


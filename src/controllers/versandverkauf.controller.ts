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

export async function erstelleAuslagerungsAuftrag(
  req: FastifyRequest<{
    Body: {
      material_ID: number;
      anzahl: number;
      bestellposition?: string;
    };
  }>,
  reply: FastifyReply
) {
  const { material_ID, anzahl, bestellposition } = req.body;

  try {

    const lagerbestand = await prisma.lagerbestand.findFirst({
      where: { material_ID },
    });

    if (!lagerbestand) {
      return reply.status(404).send({ error: 'Lagerbestand nicht gefunden' });
    }

    const neuerAuftrag = await prisma.auftrag.create({
      data: {
        material_ID,
        menge: anzahl,
        status: 'Auslagerung angefordert',
        lagerbestand_ID: lagerbestand.lagerbestand_ID,
        lager_ID: lagerbestand.lager_ID,
        bestellposition: bestellposition ?? null,
        angefordertVon: "Verkauf und Versand"
      },
    });

    return reply.send(neuerAuftrag);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Erstellen des Auftrags' });
  }
}

/* export async function setzeAuftragAufAbholbereitHandler(
  req: FastifyRequest<{
    Body: {
      auftrag_ID: number;
    };
  }>,
  reply: FastifyReply
) {
  const { auftrag_ID } = req.body;

  try {
    const auftrag = await prisma.auftrag.findUnique({
      where: { auftrag_ID },
    });

    if (!auftrag) {
      return reply.status(404).send({ error: `Auftrag mit ID ${auftrag_ID} nicht gefunden` });
    }

    if (!auftrag.bestellposition) {
      return reply.status(400).send({ error: `bestellposition fehlt für Auftrag ${auftrag_ID}` });
    }

    await prisma.auftrag.update({
      where: { auftrag_ID },
      data: { status: 'abholbereit' },
    });

    const response = await axios.patch(
      `https://verkaufundversand/bestellposition/${auftrag.bestellposition}`,
      { status: 'abholbereit' },
      { headers: { 'Content-Type': 'application/json' } }
    );

    return reply.send({ success: true, statusCode: response.status });
  } catch (error) {
    console.error('Fehler:', error);
    return reply.status(500).send({ error: 'Auftrag konnte nicht aktualisiert werden' });
  }
}

export async function setzeAuftragAufAbholbereit(
  req: FastifyRequest<{
    Body: {
      auftrag_ID: number;
    };
  }>,
  reply: FastifyReply
) {
  const { auftrag_ID } = req.body;

  try {
    const auftrag = await prisma.auftrag.findUnique({
      where: { auftrag_ID },
    });

    if (!auftrag) {
      return reply.status(404).send({ error: `Auftrag mit ID ${auftrag_ID} nicht gefunden` });
    }

    if (!auftrag.bestellposition) {
      return reply.status(400).send({ error: `bestellposition fehlt für Auftrag ${auftrag_ID}` });
    }

    await prisma.auftrag.update({
      where: { auftrag_ID },
      data: { status: 'abholbereit' },
    });

    const response = await axios.patch(
      `https://verkaufundversand/bestellposition/${auftrag.bestellposition}`,
      { status: 'abholbereit' },
      { headers: { 'Content-Type': 'application/json' } }
    );

    return reply.send({ success: true, statusCode: response.status });
  } catch (error) {
    console.error('Fehler:', error);
    return reply.status(500).send({ error: 'Auftrag konnte nicht aktualisiert werden' });
  }
} */
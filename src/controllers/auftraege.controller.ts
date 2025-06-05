import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '../../generated/prisma';
import axios from 'axios';

const prisma = new PrismaClient();

// POST: Material einlagern
export const materialEinlagern = async (
  req: FastifyRequest<{
    Body: {
      auftragIds: number[];
    };
  }>,
  reply: FastifyReply
) => {
  const { auftragIds } = req.body;

  try {
    for (const auftragId of auftragIds) {
      const auftrag = await prisma.auftrag.findUnique({
        where: { auftrag_ID: auftragId },
      });

      if (!auftrag) {
        console.warn(`Auftrag ${auftragId} nicht gefunden – übersprungen`);
        continue;
      }

      if (auftrag.status !== 'Einlagerung angefordert') {
        console.warn(`Auftrag ${auftragId} hat Status "${auftrag.status}" – übersprungen`);
        continue;
      }

      const bestand = await prisma.lagerbestand.findFirst({
        where: {
          lagerbestand_ID: auftrag.lagerbestand_ID,
        },
      });

      if (!bestand) {
        console.warn(`Lagerbestand für Auftrag ${auftragId} nicht gefunden – übersprungen`);
        continue;
      }

      await prisma.lagerbestand.update({
        where: { lagerbestand_ID: bestand.lagerbestand_ID },
        data: {
          menge: bestand.menge + auftrag.menge,
        },
      });

      await prisma.auftrag.update({
        where: { auftrag_ID: auftragId },
        data: {
          status: 'Einlagerung abgeschlossen',
        },
      });
    }

    return reply.send({ status: 'Einlagerung abgeschlossen' });
  } catch (error) {
    console.error('Fehler beim Einlagern von Aufträgen:', error);
    return reply.status(500).send({ error: 'Einlagerung fehlgeschlagen' });
  }
};

// POST: Material auslagern
export const materialAuslagern = async (
  req: FastifyRequest<{
    Body: {
      auftragIds: number[];
    };
  }>,
  reply: FastifyReply
) => {
  const { auftragIds } = req.body;

  try {
    const benachrichtigungenProduktionRohm: any[] = [];
    const benachrichtigungenProduktion: any[] = [];
    const benachrichtigungenVerkauf: any[] = [];

    for (const auftragId of auftragIds) {
      const auftrag = await prisma.auftrag.findUnique({
        where: { auftrag_ID: auftragId },
      });

      if (!auftrag || auftrag.status !== 'Auslagerung angefordert') {
        continue;
      }

      const bestand = await prisma.lagerbestand.findUnique({
        where: { lagerbestand_ID: auftrag.lagerbestand_ID },
      });

      if (!bestand || bestand.menge < auftrag.menge) {
        continue;
      }

      const material = await prisma.material.findUnique({
        where: { material_ID: auftrag.material_ID },
      });

      if (!material) {
        continue;
      }

      await prisma.lagerbestand.update({
        where: { lagerbestand_ID: bestand.lagerbestand_ID },
        data: {
          menge: bestand.menge - auftrag.menge,
        },
      });

      await prisma.auftrag.update({
        where: { auftrag_ID: auftragId },
        data: {
          status: 'Auslagerung abgeschlossen',
        },
      });

      const qualitaet = await prisma.qualitaet.findUnique({
        where: { qualitaet_ID: bestand.qualitaet_ID ?? 0 },
      });

      if (auftrag.angefordertVon === 'Produktion') {

        if (['Farbe', 'Druckfolie', 'Verpackung'].includes(material.category)) {
          if (['Farbe'].includes(material.category)) {
            benachrichtigungenProduktionRohm.push({
              bezeichnung: material.category,
              ppml: qualitaet?.ppml || 0,
              viskositaet: qualitaet?.viskositaet || 0,
              deltaE: qualitaet?.deltaE || 0,
              menge: auftrag.menge,
            });
          }
          else {
            benachrichtigungenProduktionRohm.push({
              bezeichnung: material.category,
              menge: auftrag.menge,
            });
          }
        } else {

          benachrichtigungenProduktion.push({
            artikelnummer: material.material_ID,
            saugfaehigkeit: qualitaet?.saugfaehigkeit || 0,
            weissgrad: qualitaet?.weissgrad || 0,
            menge: auftrag.menge,
          });
        }
      } else if (auftrag.angefordertVon === 'Verkauf und Versand') {
        benachrichtigungenVerkauf.push({
          bestellposition: auftrag.bestellposition,
          status: 'abholbereit',
        });
      }
    }

    if (benachrichtigungenProduktion.length > 0) {
      await axios.post('https://backend-your-shirt-gmbh-production.up.railway.app/materialBestellung/materialien-bereitgestellt', benachrichtigungenProduktion);
    }

    if (benachrichtigungenProduktionRohm.length > 0) {
      await axios.post('https://backend-your-shirt-gmbh-production.up.railway.app/materialKanister/api/bereitstellen', benachrichtigungenProduktionRohm);
    }

    if (benachrichtigungenVerkauf.length > 0) {
      await axios.post('http://verkauf-service/ware-bereitgestellt', benachrichtigungenVerkauf);
    }

    return reply.send({ status: 'Auslagerung abgeschlossen' });
  } catch (error) {
    console.error('Fehler beim Auslagern von Aufträgen:', error);
    return reply.status(500).send({ error: 'Auslagerung fehlgeschlagen' });
  }
}

// GET: Historie
export const getHistorie = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const historie = await prisma.auftrag.findMany({
      where: {
        status: {
          in: ["Einlagerung abgeschlossen", "Auslagerung abgeschlossen"],
        },
      },
      orderBy: {
        auftrag_ID: 'asc'
      }
    });

    return reply.send(historie);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Historie' });
  }
};

// GET: Aufträge
export const getAuftraege = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const auftraege = await prisma.auftrag.findMany({
      where: {
        status: {
          in: ["Einlagerung angefordert", "Auslagerung angefordert"],
        },
      },
      orderBy: {
        auftrag_ID: 'asc'
      }
    });

    return reply.send(auftraege);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Aufträge' });
  }
};

// GET: Aufträge mit Status "Einlagerung angefordert"
export const getEinlagerungsAuftraege = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const auftraege = await prisma.auftrag.findMany({
      where: {
        status: {
          in: ["Einlagerung angefordert"],
        },
      },
      orderBy: {
        auftrag_ID: 'asc'
      }
    });

    return reply.send(auftraege);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Aufträge' });
  }
};

// GET: Aufträge mit Status "Auslagerung angefordert"
export const getAuslagerungsAuftraege = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const auftraege = await prisma.auftrag.findMany({
      where: {
        status: {
          in: ["Auslagerung angefordert"],
        },
      },
      orderBy: {
        auftrag_ID: 'asc'
      }
    });

    return reply.send(auftraege);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Aufträge' });
  }
};
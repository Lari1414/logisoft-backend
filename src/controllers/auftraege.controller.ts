// src/controllers/auftraege.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '../../generated/prisma';
import axios from 'axios';

const prisma = new PrismaClient();

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
    // Dein bestehender Code hierhin verschieben
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
      },
    });

    return reply.send(neuerAuftrag);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Erstellen des Auftrags' });
  }
}

export async function setzeAuftragAufAbholbereitHandler(
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
}


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
    for (const auftragId of auftragIds) {
      const auftrag = await prisma.auftrag.findUnique({
        where: { auftrag_ID: auftragId },
      });

      if (!auftrag) {
        console.warn(`Auftrag ${auftragId} nicht gefunden – übersprungen`);
        continue;
      }

      if (auftrag.status !== 'Auslagerung angefordert') {
        console.warn(`Auftrag ${auftragId} hat Status "${auftrag.status}" – übersprungen`);
        continue;
      }

      const bestand = await prisma.lagerbestand.findFirst({
        where: {
          material_ID: auftrag.material_ID,
          lager_ID: auftrag.lager_ID,
        },
      });

      if (!bestand) {
        console.warn(`Lagerbestand für Auftrag ${auftragId} nicht gefunden – übersprungen`);
        continue;
      }

      if (bestand.menge < auftrag.menge) {
        console.warn(`Nicht genug Bestand für Auftrag ${auftragId} (verfügbar: ${bestand.menge}, benötigt: ${auftrag.menge}) – übersprungen`);
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
    }

    return reply.send({ status: 'Auslagerung abgeschlossen' });
  } catch (error) {
    console.error('Fehler beim Auslagern von Aufträgen:', error);
    return reply.status(500).send({ error: 'Auslagerung fehlgeschlagen' });
  }
};

// GET: Historie
export const getHistorie = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const historie = await prisma.auftrag.findMany({
      where: {
        status: {
          in: ["Einlagerung abgeschlossen", "Auslagerung abgeschlossen"],
        },
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
          in: ["Einlagerung angefordert", "Ausgelagerung angefordert"],
        },
      }
    });

    return reply.send(auftraege);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Aufträge' });
  }
};
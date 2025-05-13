// src/controllers/lagerbestand.controller.ts
import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

interface CreateLagerbestandBody {
  eingang_ID: number;
  lager_ID: number;
  material_ID: number;
  menge: number;
  qualitaet_ID:number;
}

// POST: Lagerbestand anlegen
export const createLagerbestand = async (
  req: FastifyRequest<{ Body: CreateLagerbestandBody }>,
  reply: FastifyReply
) => {
  try {
    const { eingang_ID, lager_ID, material_ID, menge,qualitaet_ID } = req.body;

    const neuerEintrag = await prisma.lagerbestand.create({
      data: {
        eingang_ID,
        lager_ID,
        material_ID,
        menge,
        qualitaet_ID
      },
    });

    return reply.status(201).send(neuerEintrag);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Erstellen des Lagerbestands' });
  }
};

// GET: Alle Lagerbestände abrufen
export const getAllLagerbestaende = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const eintraege = await prisma.lagerbestand.findMany({
      include: {
        material: true,
        qualitaet: true
      }});
    return reply.send(eintraege);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Lagerbestände' });
  }
};
export const getAllLagerbestaendeRoh = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const eintraege = await prisma.lagerbestand.findMany({
      where: {
        lager_ID: 1
      },
      include: {
        material: true,
        qualitaet: true
      }});
    return reply.send(eintraege);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Lagerbestände' });
  }
};
export const getAllLagerbestaendeFertig = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const eintraege = await prisma.lagerbestand.findMany({
      where: {
        lager_ID: 2
      },
      include: {
        material: true
      }});
    return reply.send(eintraege);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Lagerbestände' });
  }
};

// GET: Einzelnen Lagerbestand abrufen
export const getLagerbestandById = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const bestand = await prisma.lagerbestand.findUnique({
      where: { lagerbestand_ID: id },
    });

    if (!bestand) {
      return reply.status(404).send({ error: 'Lagerbestand nicht gefunden' });
    }

    return reply.send(bestand);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen des Lagerbestands' });
  }
};

// PUT: Lagerbestand aktualisieren
export const updateLagerbestandById = async (
  req: FastifyRequest<{ Params: { id: string }, Body: Partial<CreateLagerbestandBody> }>,
  reply: FastifyReply
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = req.body;

    const updated = await prisma.lagerbestand.update({
      where: { lagerbestand_ID: id },
      data,
    });

    return reply.send(updated);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return reply.status(404).send({ error: 'Lagerbestand nicht gefunden' });
    }
    return reply.status(500).send({ error: 'Fehler beim Aktualisieren des Lagerbestands' });
  }
};

// DELETE: Lagerbestand löschen
export const deleteLagerbestandById = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.lagerbestand.delete({
      where: { lagerbestand_ID: id },
    });

    return reply.status(204).send();
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return reply.status(404).send({ error: 'Lagerbestand nicht gefunden' });
    }
    return reply.status(500).send({ error: 'Fehler beim Löschen des Lagerbestands' });
  }
};

// POST: Material auslagern
export const auslagernMaterial = async (
  req: FastifyRequest<{ Body: { material_ID: number; menge: number } }>,
  reply: FastifyReply
) => {
  try {
    const { material_ID, menge } = req.body;

    // Zuerst alle Einträge im Lagerbestand mit dieser material_ID abrufen
    const lagerbestände = await prisma.lagerbestand.findMany({
      where: { material_ID },
    });

    // Die gesamt Menge des Materials im Lagerbestand berechnen
    const gesamtBestand = lagerbestände.reduce((sum, bestand) => sum + bestand.menge, 0);

    // Überprüfen, ob genug Bestand vorhanden ist
    if (gesamtBestand < menge) {
      return reply.status(400).send({ error: 'Nicht genügend Material im Lager' });
    }

    let verbleibendeMenge = menge;

    // Lagerbestände in Reihenfolge abarbeiten und die Menge reduzieren
    for (const bestand of lagerbestände) {
      if (verbleibendeMenge === 0) break;

      if (bestand.menge >= verbleibendeMenge) {
        // Wenn der aktuelle Eintrag die verbleibende Menge decken kann
        await prisma.lagerbestand.update({
          where: { lagerbestand_ID: bestand.lagerbestand_ID },
          data: { menge: bestand.menge - verbleibendeMenge },
        });
        verbleibendeMenge = 0;
      } else {
        // Wenn der aktuelle Eintrag nicht genug Bestand hat
        await prisma.lagerbestand.update({
          where: { lagerbestand_ID: bestand.lagerbestand_ID },
          data: { menge: 0 },
        });
        verbleibendeMenge -= bestand.menge;
      }
    }

    return reply.status(200).send({ message: 'Material erfolgreich ausgelagert' });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Auslagern des Materials' });
  }
};
export const einlagernMaterial = async (
  req: FastifyRequest<{
    Body: {
      eingang_ID: number;
      lager_ID: number;
      menge: number;
      qualitaet_ID: number;
      category: string;
      farbe: string;
      typ: string;
      groesse: string;
      url?: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const {
      eingang_ID,
      lager_ID,
      menge,
      qualitaet_ID,
      category,
      farbe,
      typ,
      groesse,
      url
    } = req.body;

    // Schritt 1: Existierendes Material suchen oder neues Material anlegen
    let material = await prisma.material.findFirst({
      where: {
        lager_ID,
        category,
        farbe,
        typ,
        groesse
      }
    });

    // Falls kein Material gefunden wird, neues Material anlegen
    if (!material) {
      material = await prisma.material.create({
        data: {
          lager_ID,
          category,
          farbe,
          typ,
          groesse,
          url
        }
      });
    }

    // Schritt 2: Lagerbestand prüfen
    const vorhandenerBestand = await prisma.lagerbestand.findFirst({
      where: {
        material_ID: material.material_ID,
        lager_ID,
        qualitaet_ID
      }
    });

    if (vorhandenerBestand) {
      // Menge erhöhen, wenn der Bestand existiert
      const aktualisiert = await prisma.lagerbestand.update({
        where: { lagerbestand_ID: vorhandenerBestand.lagerbestand_ID },
        data: {
          menge: vorhandenerBestand.menge + menge
        }
      });

      return reply.status(200).send(aktualisiert);
    } else {
      // Neuen Lagerbestand anlegen
      const neuerEintrag = await prisma.lagerbestand.create({
        data: {
          eingang_ID,
          lager_ID,
          material_ID: material.material_ID, // Material ID muss korrekt gesetzt werden
          menge,
          qualitaet_ID
        }
      });

      return reply.status(201).send(neuerEintrag);
    }

  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Einlagern des Materials', details: error });
  }
};

import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';
import { startOfDay, endOfDay } from 'date-fns';
const prisma = new PrismaClient();

type EingangBody = {
  materialDetails: {
    category?: string;
    farbe?: {
      cyan: string;
      magenta: string;
      yellow: string;
      black: string;
    };
    typ?: string;
    groesse?: string;
  };
  qualitaet?: {
    viskositaet?: number;
    ppml?: number;
    deltaE?: number;
    saugfaehigkeit?: number;
    weissgrad?: number;
  };
  materialbestellung_ID: number;
  menge: number;
  lieferdatum: string;
};

// POST: Neuer Wareneingang
export const createEingang = async (
  req: FastifyRequest<{ Body: EingangBody }>,
  reply: FastifyReply
) => {
  try {
    const {
      materialDetails,
      qualitaet,
      materialbestellung_ID,
      menge,
      lieferdatum
    } = req.body;

    const rohmaterialLager = await prisma.lager.findFirst({
      where: { bezeichnung: 'Rohmateriallager' },
    });

    if (!rohmaterialLager) {
      return reply.status(404).send({ error: 'Rohmateriallager nicht gefunden' });
    }

    // 1. MATERIAL: prüfen oder erstellen
    let material = await prisma.material.findFirst({
      where: {
        lager_ID: rohmaterialLager.lager_ID,
        category: materialDetails.category,
        farbe: {
          equals: materialDetails.farbe
        },
        typ: materialDetails.typ,
        groesse: materialDetails.groesse,
      },
    });

    if (!material) {
      material = await prisma.material.create({
        data: {
          ...materialDetails,
          lager_ID: rohmaterialLager.lager_ID,
        },
      });
    }

    // 2. QUALITÄT: prüfen oder erstellen
    let qualitaetEntry = null;
    if (qualitaet) {
      qualitaetEntry = await prisma.qualitaet.findFirst({
        where: {
          viskositaet: qualitaet.viskositaet ?? null,
          ppml: qualitaet.ppml ?? null,
          deltaE: qualitaet.deltaE ?? null,
          saugfaehigkeit: qualitaet.saugfaehigkeit ?? null,
          weissgrad: qualitaet.weissgrad ?? null,
        },
      });

      if (!qualitaetEntry) {
        qualitaetEntry = await prisma.qualitaet.create({
          data: qualitaet,
        });
      }
    }

    // 3. WARENEINGANG anlegen
    const eingang = await prisma.wareneingang.create({
      data: {
        material_ID: material.material_ID,
        materialbestellung_ID,
        menge,
        status: "eingetroffen",
        lieferdatum: new Date(lieferdatum),
        qualitaet_ID: qualitaetEntry?.qualitaet_ID,
      },
    });

    return reply.status(201).send(eingang);
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ error: "Fehler beim Erstellen des Wareneingangs" });
  }
};

// GET: Alle Wareneingänge
export const getAllEingaenge = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await prisma.wareneingang.findMany({
      include: {
        material: true,
        materialbestellung: true,
      },
    });
    reply.send(result);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Fehler beim Abrufen der Wareneingänge' });
  }
};


export const getAllEingaengeHeute = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const now = new Date();
    const result = await prisma.wareneingang.findMany({
      where: {
        lieferdatum: {
          gte: startOfDay(now), // >= heute um 00:00 Uhr
          lte: endOfDay(now),   // <= heute um 23:59:59
        },
      },
    });

    reply.send(result);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Fehler beim Abrufen der Wareneingänge' });
  }
};

// GET: Einzelner Wareneingang
export const getEingangById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const eingang = await prisma.wareneingang.findUnique({
      where: { eingang_ID: parseInt(req.params.id, 10) },
      include: {
        material: true,
        materialbestellung: true,
      },
    });
    if (!eingang) {
      return reply.status(404).send({ error: 'Wareneingang nicht gefunden' });
    }
    reply.send(eingang);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Fehler beim Abrufen des Wareneingangs' });
  }
};

// PUT: Wareneingang sperren
export const updateEingaengeSperren = async (
  req: FastifyRequest<{ Body: { ids: number[] } }>,
  reply: FastifyReply
) => {
  try {
    const ids = req.body.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return reply.status(400).send({ error: 'Keine gültigen IDs übergeben' });
    }

    const result = await prisma.wareneingang.updateMany({
      where: {
        eingang_ID: { in: ids },
      },
      data: {
        status: 'gesperrt',
      },
    });

    if (result.count === 0) {
      return reply.status(404).send({ error: 'Keine passenden Einträge gefunden' });
    }

    reply.send({ updatedCount: result.count });
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Fehler beim Aktualisieren' });
  }
};

// PUT: Wareneingang aktualisieren
// export const updateEingangById = async (req: FastifyRequest<{ Params: { id: string }, Body: Partial<EingangBody> }>, reply: FastifyReply) => {
//   try {
//     const id = parseInt(req.params.id, 10);
//     const updated = await prisma.wareneingang.update({
//       where: { eingang_ID: id },
//       data: req.body,
//     });
//     reply.send(updated);
//   } catch (err: any) {
//     console.error(err);
//     if (err.code === 'P2025') {
//       return reply.status(404).send({ error: 'Wareneingang nicht gefunden' });
//     }
//     reply.status(500).send({ error: 'Fehler beim Aktualisieren' });
//   }
// };

// DELETE: Wareneingang löschen
export const deleteEingangById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.wareneingang.delete({ where: { eingang_ID: id } });
    reply.status(204).send();
  } catch (err: any) {
    console.error(err);
    if (err.code === 'P2025') {
      return reply.status(404).send({ error: 'Wareneingang nicht gefunden' });
    }
    reply.status(500).send({ error: 'Fehler beim Löschen' });
  }
};



// POST: Wareneingang einlagern
export const wareneingangEingelagern = async (
  req: FastifyRequest<{ Body: { ids: number[] } }>,
  reply: FastifyReply
) => {
  try {
    const ids = req.body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return reply.status(400).send({ error: 'Keine gültigen IDs übergeben' });
    }

    const rohmaterialLager = await prisma.lager.findFirst({
      where: { bezeichnung: 'Rohmateriallager' },
    });

    if (!rohmaterialLager) {
      return reply.status(404).send({ error: 'Rohmateriallager nicht gefunden' });
    }

    const rohmaterialLagerId = rohmaterialLager.lager_ID;

    let erfolgreichEingelagert = 0;
    let übersprungen = 0;

    for (const id of ids) {
      const wareneingang = await prisma.wareneingang.findUnique({
        where: { eingang_ID: id },
      });

      if (!wareneingang) continue;

      if (wareneingang.status === 'gesperrt') {
        übersprungen++;
        continue;
      }

      await prisma.lagerbestand.create({
        data: {
          eingang_ID: wareneingang.eingang_ID,
          lager_ID: rohmaterialLagerId,
          material_ID: wareneingang.material_ID,
          menge: wareneingang.menge,
          qualitaet_ID: wareneingang.qualitaet_ID ?? undefined,
        },
      });

      await prisma.wareneingang.update({
        where: { eingang_ID: id },
        data: {
          status: 'eingelagert',
        },
      });

      erfolgreichEingelagert++;
    }

    return reply.send({
      erfolgreichEingelagert,
      übersprungen,
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ error: 'Fehler beim Einlagern' });
  }
};
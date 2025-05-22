import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';
import { startOfDay, endOfDay } from 'date-fns';
import { cmykToHex } from '../utils/color.util';

const prisma = new PrismaClient();

type EingangBody = {
  materialDetails: {
    category?: string;
    standardmaterial: boolean;
    farbe_json: {
      cyan: number;
      magenta: number;
      yellow: number;
      black: number;
    };
    typ?: string;
    groesse?: string;
  };
  qualitaet?: {
    viskositaet?: number;
    ppml?: number;
    saugfaehigkeit?: number;
    weissgrad?: number;
  };
  materialbestellung_ID: number;
  menge: number;
  lieferdatum: string;
};

// Erstellt einen neuen Wareneingang
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
      lieferdatum,
    } = req.body;

    const rohmaterialLager = await prisma.lager.findFirst({
      where: { bezeichnung: 'Rohmateriallager' },
    });

    if (!rohmaterialLager) {
      return reply.status(404).send({ error: 'Rohmateriallager nicht gefunden' });
    }

    let material = await prisma.material.findFirst({
      where: {
        lager_ID: rohmaterialLager.lager_ID,
        category: materialDetails.category,
        farbe_json: { equals: materialDetails.farbe_json },
        typ: materialDetails.typ,
        groesse: materialDetails.groesse,
      },
    });

    const hexCode = cmykToHex(materialDetails.farbe_json);

    if (!material) {
      material = await prisma.material.create({
        data: {
          ...materialDetails,
          lager_ID: rohmaterialLager.lager_ID,
          farbe: hexCode
        },
      });
    }

    let qualitaetEntry = null;
    if (qualitaet) {
      qualitaetEntry = await prisma.qualitaet.findFirst({
        where: {
          viskositaet: qualitaet.viskositaet ?? null,
          ppml: qualitaet.ppml ?? null,
          saugfaehigkeit: qualitaet.saugfaehigkeit ?? null,
          weissgrad: qualitaet.weissgrad ?? null,
        },
      });

      if (!qualitaetEntry) {
        qualitaetEntry = await prisma.qualitaet.create({ data: qualitaet });
      }
    }

    const eingang = await prisma.wareneingang.create({
      data: {
        material_ID: material.material_ID,
        materialbestellung_ID,
        menge,
        status: 'eingetroffen',
        lieferdatum: new Date(lieferdatum),
        qualitaet_ID: qualitaetEntry?.qualitaet_ID,
      },
    });

    return reply.status(201).send(eingang);
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ error: 'Fehler beim Erstellen des Wareneingangs' });
  }
};

// Gibt alle Wareneingänge zurück
export const getAllEingaenge = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await prisma.wareneingang.findMany({
      include: { material: true, materialbestellung: true },
    });
    reply.send(result);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Fehler beim Abrufen der Wareneingänge' });
  }
};

// Gibt alle heutigen Wareneingänge zurück
export const getAllEingaengeHeute = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const now = new Date();
    const result = await prisma.wareneingang.findMany({
      where: {
        lieferdatum: {
          gte: startOfDay(now),
          lte: endOfDay(now),
        },
      },
    });
    reply.send(result);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Fehler beim Abrufen der Wareneingänge' });
  }
};

// Gibt einen bestimmten Wareneingang zurück
export const getEingangById = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const eingang = await prisma.wareneingang.findUnique({
      where: { eingang_ID: parseInt(req.params.id, 10) },
      include: { material: true, materialbestellung: true },
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

// Sperrt ausgewählte Wareneingänge
export const updateEingaengeSperren = async (
  req: FastifyRequest<{ Body: { ids: number[] } }>,
  reply: FastifyReply
) => {
  try {
    const ids = req.body.ids;

    if (!ids?.length) {
      return reply.status(400).send({ error: 'Keine gültigen IDs übergeben' });
    }

    const result = await prisma.wareneingang.updateMany({
      where: { eingang_ID: { in: ids } },
      data: { status: 'gesperrt' },
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

// Entsperrt ausgewählte Wareneingänge
export const updateEingaengeEntsperren = async (
  req: FastifyRequest<{ Body: { ids: number[] } }>,
  reply: FastifyReply
) => {
  try {
    const ids = req.body.ids;

    if (!ids?.length) {
      return reply.status(400).send({ error: 'Keine gültigen IDs übergeben' });
    }

    const result = await prisma.wareneingang.updateMany({
      where: { eingang_ID: { in: ids } },
      data: { status: 'eingetroffen' },
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

// Löscht einen Wareneingang
export const deleteEingangById = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
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

// Lagert Wareneingänge ein
export const wareneingangEingelagern = async (
  req: FastifyRequest<{ Body: { ids: number[] } }>,
  reply: FastifyReply
) => {
  try {
    const ids = req.body.ids;

    if (!ids?.length) {
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

      if (!wareneingang || wareneingang.status === 'gesperrt') {
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
        data: { status: 'eingelagert' },
      });

      erfolgreichEingelagert++;
    }

    reply.send({ erfolgreichEingelagert, übersprungen });
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Fehler beim Einlagern' });
  }
};

// Wareneingang aktualisieren
export const updateEingangById = async (
  req: FastifyRequest<{ Params: { id: string }, Body: Partial<EingangBody> }>,
  reply: FastifyReply
) => {
  try {
    const id = parseInt(req.params.id, 10);

    const dataToUpdate: any = {};
    if (req.body.menge !== undefined) dataToUpdate.menge = req.body.menge;
    if (req.body.lieferdatum !== undefined) dataToUpdate.lieferdatum = new Date(req.body.lieferdatum);
    if (req.body.materialbestellung_ID !== undefined) dataToUpdate.materialbestellung_ID = req.body.materialbestellung_ID;

    const updated = await prisma.wareneingang.update({
      where: { eingang_ID: id },
      data: dataToUpdate,
    });

    reply.send(updated);
  } catch (err: any) {
    console.error(err);
    if (err.code === 'P2025') {
      return reply.status(404).send({ error: 'Wareneingang nicht gefunden' });
    }
    reply.status(500).send({ error: 'Fehler beim Aktualisieren' });
  }
};

// Reklamationen anlegen
export const createReklamation = async (
  req: FastifyRequest<{
    Body: {
      wareneingang_ID: number;
      menge: number;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { wareneingang_ID, menge } = req.body;

    const eingang = await prisma.wareneingang.findUnique({
      where: { eingang_ID: wareneingang_ID },
    });

    if (!eingang) {
      return reply.status(404).send({
        error: `Wareneingang mit ID ${wareneingang_ID} nicht gefunden`,
      });
    }

    if (eingang.status !== 'gesperrt') {
      return reply.status(400).send({
        error: `Wareneingang ${wareneingang_ID} ist nicht gesperrt und kann nicht reklamiert werden.`,
      });
    }

    if (menge > eingang.menge) {
      return reply.status(400).send({
        error: `Reklamierte Menge (${menge}) überschreitet vorhandene Menge (${eingang.menge}) für Wareneingang ${wareneingang_ID}`,
      });
    }

    await prisma.reklamation.create({
      data: {
        wareneingang_ID,
        menge,
        status: 'reklamiert',
      },
    });

    const neueMenge = eingang.menge - menge;

    await prisma.wareneingang.update({
      where: { eingang_ID: wareneingang_ID },
      data: {
        menge: neueMenge,
        status: neueMenge === 0 ? 'reklamiert' : eingang.status,
      },
    });

    return reply.status(201).send({
      message: `Reklamation erfolgreich erstellt für Wareneingang ${wareneingang_ID}`,
    });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Anlegen der Reklamation.' });
  }
};
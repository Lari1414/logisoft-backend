import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

interface EingangBody {
  material_ID: number;
  materialbestellung_ID: number;
  menge: number;
  status?: string;
  lieferdatum: string;
}

// POST: Neuer Wareneingang
export const createEingang = async (req: FastifyRequest<{ Body: EingangBody }>, reply: FastifyReply) => {
  try {
    const eingang = await prisma.wareneingang.create({
      data: {
        material_ID: req.body.material_ID,
        materialbestellung_ID: req.body.materialbestellung_ID,
        menge: req.body.menge,
        status: req.body.status,
        lieferdatum: new Date(req.body.lieferdatum),
      },
    });
    reply.status(201).send(eingang);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Fehler beim Erstellen des Wareneingangs' });
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
export const updateEingangById = async (req: FastifyRequest<{ Params: { id: string }, Body: Partial<EingangBody> }>, reply: FastifyReply) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await prisma.wareneingang.update({
      where: { eingang_ID: id },
      data: req.body,
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

      let lagerbestand = await prisma.lagerbestand.findFirst({
        where: {
          material_ID: wareneingang.material_ID,
          eingang_ID: wareneingang.eingang_ID,
          lager_ID: rohmaterialLagerId,
        },
      });

      if (lagerbestand) {
        await prisma.lagerbestand.update({
          where: { lagerbestand_ID: lagerbestand.lagerbestand_ID },
          data: {
            menge: lagerbestand.menge + wareneingang.menge,
          },
        });
      } else {
        return reply.status(500).send({ error: 'Fehler beim Einlagern: Lagerbestand nicht gefunden.' });
      }

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


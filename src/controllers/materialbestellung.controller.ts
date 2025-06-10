import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '../../generated/prisma';
import { CMYK, cmykToHex } from '../utils/color.util';

const prisma = new PrismaClient();

interface BestellungInput {
  lieferant_ID: number;
  material_ID: number;
  menge: number;
}

// POST: Materialbestellung erstellen
export const createMaterialbestellung = async (
  req: FastifyRequest<{ Body: BestellungInput }>,
  reply: FastifyReply
) => {
  try {
    const bestellung = await prisma.materialbestellung.create({
      data: {
        menge: req.body.menge,
        status: 'offen',
        lieferant: {
          connect: { lieferant_ID: req.body.lieferant_ID },
        },
        material: {
          connect: { material_ID: req.body.material_ID },
        },
      },
    });
    return reply.status(201).send(bestellung);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Erstellen der Bestellung' });
  }
};

// GET: Alle Bestellungen
export const getAllMaterialbestellungen = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const bestellungen = await prisma.materialbestellung.findMany({
      where: { status: { in: ["offen", "bestellt"] } },
      include: {
        lieferant: true,
        material: true,
      },
      orderBy: {
        materialbestellung_ID: 'asc',
      },
    });
    return reply.send(bestellungen);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Bestellungen' });
  }
};

// GET: Alle Bestellungen mit Status "bestellt"
export const getAllMaterialbestellungenBestellt = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const bestellungen = await prisma.materialbestellung.findMany({
      where: {
        status: 'bestellt',
      },
      include: {
        lieferant: true,
        material: true,
      },
      orderBy: {
        materialbestellung_ID: 'asc',
      },
    });
    return reply.send(bestellungen);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Bestellungen' });
  }
};

// GET: Alle Bestellungen mit Status "offen"
export const getAllMaterialbestellungenBestellen = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const bestellungen = await prisma.materialbestellung.findMany({
      where: {
        status: 'offen',
      },
      include: {
        lieferant: true,
        material: true,
      },
      orderBy: {
        materialbestellung_ID: 'asc',
      },
    });

    return reply.send(bestellungen);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Bestellungen' });
  }
};

// GET: Bestellung nach ID
export const getMaterialbestellungById = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const bestellung = await prisma.materialbestellung.findUnique({
      where: { materialbestellung_ID: id },
      include: {
        lieferant: true,
        material: true,
      },
    });

    if (!bestellung) {
      return reply.status(404).send({ error: 'Bestellung nicht gefunden' });
    }

    return reply.send(bestellung);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Abrufen der Bestellung' });
  }
};

// PUT: Bestellungen Status aktualisieren
export const updateMaterialbestellungenStatus = async (
  req: FastifyRequest<{ Body: { ids: number[] } }>,
  reply: FastifyReply
) => {
  try {
    const { ids } = req.body;

    const bestellungen = await prisma.materialbestellung.findMany({
      where: {
        materialbestellung_ID: { in: ids },
        status: 'offen',
      },
      include: {
        lieferant: true,
      },
    });

    const ohneLieferant = bestellungen.filter(b => b.lieferant === null);

    if (ohneLieferant.length > 0) {
      return reply.status(400).send({
        error: 'Folgende Bestellungen haben keinen zugewiesenen Lieferanten und können nicht bestellt werden.',
        fehlendeLieferanten: ohneLieferant.map(b => b.materialbestellung_ID),
      });
    }

    const result = await prisma.materialbestellung.updateMany({
      where: {
        materialbestellung_ID: { in: ids },
        status: 'offen',
      },
      data: {
        status: 'bestellt',
      },
    });

    return reply.send({ updatedCount: result.count });
  } catch (error: any) {
    console.error(error);
    return reply.status(500).send({ error: 'Fehler beim Aktualisieren der Bestellungen' });
  }
};

// PUT: Bestellung aktualisieren
export const updateBestellungById = async (
  req: FastifyRequest<{ Params: { id: string }; Body: Partial<BestellungInput> }>,
  reply: FastifyReply
) => {
  try {
    const bestellId = parseInt(req.params.id, 10);

    const updated = await prisma.materialbestellung.update({
      where: { materialbestellung_ID: bestellId },
      data: req.body,
    });

    return reply.send(updated);
  } catch (error: any) {
    console.error(error);

    if (error.code === 'P2025') {
      return reply.status(404).send({ error: 'Materialbestellung nicht gefunden' });
    }

    return reply.status(500).send({ error: 'Fehler beim Aktualisieren der Bestellung' });
  }
};

// DELETE: Bestellung löschen
export const deleteMaterialbestellungById = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.materialbestellung.delete({
      where: { materialbestellung_ID: id },
    });
    return reply.status(204).send();
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return reply.status(404).send({ error: 'Bestellung nicht gefunden' });
    }
    return reply.status(500).send({ error: 'Fehler beim Löschen der Bestellung' });
  }
};

export const createWareneingaengeZuBestellung = async (
  req: FastifyRequest<{
    Body: {
      materialDetails?: {
        category: string;
        standardmaterial: boolean;
        farbe_json: {
          cyan: number;
          magenta: number;
          yellow: number;
          black: number;
        };
        typ?: string | null;
        groesse?: string | null;
      };
      materialbestellung_ID: number;
      lieferdatum: string;
      guterTeil?: {
        menge: number;
        qualitaet?: {
          viskositaet?: number;
          ppml?: number;
          deltaE?: number
          saugfaehigkeit?: number;
          weissgrad?: number;
        };
      };
      gesperrterTeil?: {
        menge: number;
        qualitaet?: {
          viskositaet?: number;
          ppml?: number;
          deltaE?: number;
          saugfaehigkeit?: number;
          weissgrad?: number;
        };
      };
      reklamierterTeil?: {
        menge: number;
      };
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const {
      materialDetails,
      materialbestellung_ID,
      lieferdatum,
      guterTeil,
      gesperrterTeil,
      reklamierterTeil,
    } = req.body;

    if (!lieferdatum) {
      return reply.status(400).send({ error: 'Lieferdatum fehlt' });
    }

    const rohmaterialLager = await prisma.lager.findFirst({
      where: { bezeichnung: 'Rohmateriallager' },
    });

    if (!rohmaterialLager) {
      return reply.status(404).send({ error: 'Rohmateriallager nicht gefunden' });
    }

    const bestellung = await prisma.materialbestellung.findUnique({
      where: { materialbestellung_ID },
      include: { material: true },
    });

    if (!bestellung || !bestellung.material) {
      return reply.status(404).send({ error: 'Material zur Bestellung nicht gefunden' });
    }

    const details = materialDetails ?? {
      category: bestellung.material.category,
      standardmaterial: bestellung.material.standardmaterial,
      farbe_json: bestellung.material.farbe_json,
      typ: bestellung.material.typ,
      groesse: bestellung.material.groesse,
    };

    const hexCode = cmykToHex(details.farbe_json as CMYK);
    const safeFarbeJson = details.farbe_json ?? undefined;

    let material = await prisma.material.findFirst({
      where: {
        lager_ID: rohmaterialLager.lager_ID,
        category: details.category,
        farbe_json: { equals: safeFarbeJson },
        typ: details.typ,
        groesse: details.groesse,
      },
    });

    if (!material) {
      material = await prisma.material.create({
        data: {
          lager_ID: rohmaterialLager.lager_ID,
          farbe: hexCode,
          category: details.category,
          standardmaterial: details.standardmaterial,
          farbe_json: safeFarbeJson,
          typ: details.typ,
          groesse: details.groesse,
        },
      });
    }

    if (guterTeil && guterTeil.menge > 0) {
      let qualitaetEntry = null;
      if (guterTeil.qualitaet) {
        qualitaetEntry = await prisma.qualitaet.findFirst({
          where: {
            viskositaet: guterTeil.qualitaet.viskositaet ?? null,
            ppml: guterTeil.qualitaet.ppml ?? null,
            deltaE: guterTeil.qualitaet.deltaE ?? null,
            saugfaehigkeit: guterTeil.qualitaet.saugfaehigkeit ?? null,
            weissgrad: guterTeil.qualitaet.weissgrad ?? null,
          },
        });

        if (!qualitaetEntry) {
          qualitaetEntry = await prisma.qualitaet.create({ data: guterTeil.qualitaet });
        }
      }

      await prisma.wareneingang.create({
        data: {
          material_ID: material.material_ID,
          materialbestellung_ID,
          menge: guterTeil.menge,
          status: 'eingetroffen',
          lieferdatum: new Date(lieferdatum),
          qualitaet_ID: qualitaetEntry?.qualitaet_ID,
        },
      });
    }

    if (gesperrterTeil && gesperrterTeil.menge > 0) {
      let qualitaetGesperrtEntry = null;
      if (gesperrterTeil.qualitaet) {
        qualitaetGesperrtEntry = await prisma.qualitaet.findFirst({
          where: {
            viskositaet: gesperrterTeil.qualitaet.viskositaet ?? null,
            ppml: gesperrterTeil.qualitaet.ppml ?? null,
            deltaE: gesperrterTeil.qualitaet.deltaE ?? null,
            saugfaehigkeit: gesperrterTeil.qualitaet.saugfaehigkeit ?? null,
            weissgrad: gesperrterTeil.qualitaet.weissgrad ?? null,
          },
        });

        if (!qualitaetGesperrtEntry) {
          qualitaetGesperrtEntry = await prisma.qualitaet.create({ data: gesperrterTeil.qualitaet });
        }
      }

      await prisma.wareneingang.create({
        data: {
          material_ID: material.material_ID,
          materialbestellung_ID,
          menge: gesperrterTeil.menge,
          status: 'gesperrt',
          lieferdatum: new Date(lieferdatum),
          qualitaet_ID: qualitaetGesperrtEntry?.qualitaet_ID,
        },
      });
    }

    if (reklamierterTeil && reklamierterTeil.menge > 0) {
      const rekl = await prisma.wareneingang.create({
        data: {
          material_ID: material.material_ID,
          materialbestellung_ID,
          menge: reklamierterTeil.menge,
          status: 'reklamiert',
          lieferdatum: new Date(lieferdatum),
        },
      });

      await prisma.reklamation.create({
        data: {
          wareneingang_ID: rekl.eingang_ID,
          menge: reklamierterTeil.menge,
          status: 'reklamiert',
        },
      });
    }

    await prisma.materialbestellung.update({
      where: { materialbestellung_ID },
      data: { status: 'erledigt' },
    });

    return reply.status(201).send({ message: 'Wareneingänge erfolgreich erstellt' });
  } catch (err) {
    console.error('Fehler in createWareneingaengeZuBestellung:', err);
    return reply.status(500).send({ error: 'Fehler beim Anlegen der Wareneingänge' });
  }
};
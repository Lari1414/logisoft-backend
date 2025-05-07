import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

export const produktionBestelltMaterial = async (
    _req: FastifyRequest<{ Body: { Artikelnummer: number; Anzahl: number } }>,
    reply: FastifyReply
) => {
    try {
        const { Artikelnummer, Anzahl } = _req.body;
        const materialId = parseInt(Artikelnummer.toString(), 10);

        const material = await prisma.material.findFirst({
            where: { material_ID: materialId },
        });

        if (!material) {
            return reply.status(404).send({ error: 'Material nicht gefunden' });
        }

        const lagerbestaende = await prisma.lagerbestand.findMany({
            where: { material_ID: materialId },
            orderBy: { eingang_ID: 'asc' },
            include: { qualitaet: true },
        });

        console.log('Lagerbestaende:', lagerbestaende);
        const gesamtMenge = lagerbestaende.reduce((sum, b) => sum + b.menge, 0);

        if (gesamtMenge < Anzahl) {
            return reply.status(400).send({ error: 'Nicht genügend Rohmaterial vorhanden' });
        }

        let verbleibendeAnzahl = Anzahl;
        const verwendeteBestaende = [];

        for (const bestand of lagerbestaende) {
            if (verbleibendeAnzahl <= 0) break;

            const entnahme = Math.min(bestand.menge, verbleibendeAnzahl);

            if (entnahme === bestand.menge) {
                await prisma.lagerbestand.delete({ where: { lagerbestand_ID: bestand.lagerbestand_ID } });
            } else {
                await prisma.lagerbestand.update({
                    where: { lagerbestand_ID: bestand.lagerbestand_ID },
                    data: { menge: bestand.menge - entnahme },
                });
            }

            verwendeteBestaende.push({
                lagerbestand_ID: bestand.lagerbestand_ID,
                entnommen: entnahme,
                qualitaet: bestand.qualitaet,
            });

            verbleibendeAnzahl -= entnahme;
        }

        return reply.send({
            Artikelnummer: material.material_ID,
            verwendet: verwendeteBestaende,
        });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: 'Fehler beim Verarbeiten der Bestellung' });
    }
};

export const rohmaterialAbfragen = async (
    _req: FastifyRequest<{
        Body: {
            category: string;
            farbe: string;
            typ: string;
            groesse: string;
        };
    }>,
    reply: FastifyReply
) => {
    try {
        const { category, farbe, typ, groesse } = _req.body;

        // Hol das Lager mit der Bezeichnung 'Rohmateriallager'
        const rohLager = await prisma.lager.findFirst({
            where: { bezeichnung: 'Rohmateriallager' },
        });

        if (!rohLager) {
            return reply.status(500).send({ error: 'Rohmateriallager nicht gefunden' });
        }

        const material = await prisma.material.findFirst({
            where: {
                category,
                farbe,
                typ,
                groesse,
                lager_ID: rohLager.lager_ID,
            },
        });

        if (!material) {
            return reply.status(404).send({ error: 'Kein passendes Material gefunden' });
        }

        const lagerbestaende = await prisma.lagerbestand.findMany({
            where: {
                material_ID: material.material_ID,
                lager_ID: rohLager.lager_ID,
            },
        });

        const gesamtmenge = lagerbestaende.reduce((sum, eintrag) => sum + eintrag.menge, 0);

        return reply.send({
            Artikelnummer: material.material_ID,
            Anzahl: gesamtmenge,
        });
    } catch (error) {
        console.error('Fehler bei Rohmaterial-Abfrage:', error);
        return reply.status(500).send({ error: 'Interner Serverfehler bei Rohmaterial-Abfrage' });
    }
};

export const fertigmaterialAbfragen = async (
    _req: FastifyRequest<{ Params: { artikelnummer: string } }>,
    reply: FastifyReply
) => {
    try {
        const materialId = parseInt(_req.params.artikelnummer, 10);
        if (isNaN(materialId)) {
            return reply.status(400).send({ error: 'Ungültige Artikelnummer' });
        }

        const fertigLager = await prisma.lager.findFirst({
            where: { bezeichnung: 'Fertigmateriallager' },
        });

        if (!fertigLager) {
            return reply.status(500).send({ error: 'Fertigmateriallager nicht gefunden' });
        }

        const material = await prisma.material.findUnique({
            where: { material_ID: materialId },
        });

        if (!material) {
            return reply.status(404).send({ error: 'Material nicht gefunden' });
        }

        const lagerbestaende = await prisma.lagerbestand.findMany({
            where: {
                material_ID: materialId,
                lager_ID: fertigLager.lager_ID,
            },
            include: { material: true },
        });

        const gruppiert: Record<string, { farbe: string | null; groesse: string | null; menge: number }> = {};

        for (const bestand of lagerbestaende) {
            const farbe = bestand.material.farbe ?? 'unbekannt';
            const groesse = bestand.material.groesse ?? 'unbekannt';
            const key = `${farbe}-${groesse}`;

            if (!gruppiert[key]) {
                gruppiert[key] = {
                    farbe,
                    groesse,
                    menge: 0,
                };
            }

            gruppiert[key].menge += bestand.menge;
        }

        return reply.send({
            Artikelnummer: materialId,
            verfuegbar: Object.values(gruppiert),
        });
    } catch (error) {
        console.error('Fehler im Abfrage-Controller:', error);
        return reply.status(500).send({ error: 'Fehler beim Abrufen des Lagerbestands' });
    }
};

export const rohmaterialBereitstellen = async (
    _req: FastifyRequest<{ Body: { bezeichnung: string; eigenschaft: string | null } }>,
    reply: FastifyReply
) => {
    try {
        const { bezeichnung, eigenschaft } = _req.body;

        // Finde das Rohmateriallager
        const rohLager = await prisma.lager.findFirst({
            where: { bezeichnung: 'Rohmateriallager' },
        });

        if (!rohLager) {
            return reply.status(500).send({ error: 'Rohmateriallager nicht gefunden' });
        }

        // Finde passendes Material
        const material = await prisma.material.findFirst({
            where: {
                lager_ID: rohLager.lager_ID,
                category: bezeichnung,
                farbe: eigenschaft ?? undefined, // wenn null, ignorieren
            },
        });

        if (!material) {
            return reply.status(404).send({ error: 'Material nicht gefunden' });
        }

        // Finde passenden Lagerbestand mit Menge > 0
        const lagerbestand = await prisma.lagerbestand.findFirst({
            where: {
                lager_ID: rohLager.lager_ID,
                material_ID: material.material_ID,
                menge: { gt: 0 },
            },
        });

        if (!lagerbestand) {
            return reply.status(400).send({ error: 'Kein ausreichender Bestand vorhanden' });
        }

        // Menge um 1 reduzieren
        await prisma.lagerbestand.update({
            where: { lagerbestand_ID: lagerbestand.lagerbestand_ID },
            data: { menge: { decrement: 1 } },
        });

        return reply.send({ status: 'bereitgestellt' });
    } catch (error) {
        console.error('Fehler beim Bereitstellen von Rohmaterial:', error);
        return reply.status(500).send({ error: 'Interner Serverfehler' });
    }
};
import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

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
                    material_ID: auftrag.material_ID,
                    lager_ID: auftrag.lager_ID,
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
                    status: 'eingelagert',
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
                    status: 'ausgelagert',
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
                    in: ["eingelagert", "ausgelagert"],
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
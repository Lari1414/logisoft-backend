import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

// POST: Material einlagern
export const materialEinlagern = async (req: FastifyRequest<{ Body: { strasse: string, ort: string, plz: number } }>, reply: FastifyReply) => {

};

// POST: Material auslagern
export const materialAuslagern = async (req: FastifyRequest<{ Body: { strasse: string, ort: string, plz: number } }>, reply: FastifyReply) => {

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
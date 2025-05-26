import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

export const getAllReklamationen = async (
    req: FastifyRequest,
    reply: FastifyReply
) => {
    try {
        const reklamationen = await prisma.reklamation.findMany({
            orderBy: {
                reklamation_ID: 'asc',
            },
        });

        return reply.status(200).send(reklamationen);
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: 'Fehler beim Abrufen der Reklamationen.' });
    }
};
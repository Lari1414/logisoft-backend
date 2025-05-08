import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();
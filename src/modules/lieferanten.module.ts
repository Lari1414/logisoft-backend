import { FastifyInstance } from 'fastify';
import lieferantRoutes from '../routes/lieferanten.routes';

export async function lieferantModule(app: FastifyInstance) {
  await app.register(lieferantRoutes);
}

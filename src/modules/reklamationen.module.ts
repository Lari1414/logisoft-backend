import { FastifyInstance } from 'fastify';
import reklamationenRoutes from '../routes/reklamationen.routes';

export async function reklamationenModule(app: FastifyInstance) {
  await app.register(reklamationenRoutes);
}

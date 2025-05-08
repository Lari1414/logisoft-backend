import { FastifyInstance } from 'fastify';
import auftraegeRoutes from '../routes/auftraege.routes';

export async function auftraegeModule(app: FastifyInstance) {
  await app.register(auftraegeRoutes);
}
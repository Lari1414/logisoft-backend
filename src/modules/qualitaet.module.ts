import { FastifyInstance } from 'fastify';
import qualitaetRoutes from '../routes/qualitaet.routes';

export async function qualitaetModule(app: FastifyInstance) {
  await app.register(qualitaetRoutes);
}

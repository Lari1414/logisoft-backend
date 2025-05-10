import { FastifyInstance } from 'fastify';
import lagerRoutes from '../routes/lager.routes';

export async function lagerModule(app: FastifyInstance) {
  await app.register(lagerRoutes);
}

import { FastifyInstance } from 'fastify';
import lagerRoutes from '../routes/lager.routes';

export async function lagerModule(app: FastifyInstance) {
  // Hier definierst du die Routen für Lager
  await app.register(lagerRoutes);
}

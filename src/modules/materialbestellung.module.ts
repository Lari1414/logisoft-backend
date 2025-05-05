import { FastifyInstance } from 'fastify';
import materialbestellungRoutes from '../routes/materialbestellung.routes';

export async function materialbestellungModule(app: FastifyInstance) {
  await app.register(materialbestellungRoutes);
}

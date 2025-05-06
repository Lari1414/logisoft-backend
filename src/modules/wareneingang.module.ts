import { FastifyInstance } from 'fastify';
import wareneingangRoutes from '../routes/wareneingang.routes';

export async function wareneingangModule(app: FastifyInstance) {
  await app.register(wareneingangRoutes);
}

import { FastifyInstance } from 'fastify';
import mindestbestandRoutes from '../routes/mindestbestand.routes';

export async function mindestbestandModule(app: FastifyInstance) {
  await app.register(mindestbestandRoutes);
}

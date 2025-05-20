import { FastifyInstance } from 'fastify';
import materialRoutes from '../routes/material.routes';

export async function materialModule(app: FastifyInstance) {
  await app.register(materialRoutes);
}

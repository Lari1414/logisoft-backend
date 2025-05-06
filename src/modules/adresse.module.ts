import { FastifyInstance } from 'fastify';
import adresseRoutes from '../routes/adresse.routes';

export async function adresseModule(app: FastifyInstance) {
  await app.register(adresseRoutes);
}

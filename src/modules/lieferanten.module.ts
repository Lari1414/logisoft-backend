import { FastifyInstance } from 'fastify';
import lieferantenRoutes from '../routes/lieferanten.routes'; // richtiger Pfad zur Route

export async function lieferantenModule(app: FastifyInstance) {
  await app.register(lieferantenRoutes); // alle Routen werden eingebunden
}

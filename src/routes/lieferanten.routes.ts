import { FastifyInstance } from 'fastify';
import { createLieferant } from '../controllers/lieferant.controller';

export default async function lieferantenRoutes(app: FastifyInstance) {
  app.post('/', createLieferant);
}

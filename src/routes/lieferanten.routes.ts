import { FastifyInstance } from 'fastify';
import { createLieferant, getAllLieferant, getLieferantById, updateLieferantById, deleteLieferantById } from '../controllers/lieferant.controller';

export default async function lieferantRoutes(app: FastifyInstance) {
  app.post('/', createLieferant);
  app.get('/', getAllLieferant);
  app.get('/:id', getLieferantById);
  app.put('/:id', updateLieferantById);
  app.delete('/:id', deleteLieferantById);
}

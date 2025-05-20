import { FastifyInstance } from 'fastify';
import {
  createLieferant,
  getAllLieferant,
  getLieferantById,
  updateLieferantById,
  deleteLieferantById
} from '../controllers/lieferant.controller';

export default async function lieferantRoutes(app: FastifyInstance) {
  // GET
  app.get('/', getAllLieferant);
  app.get('/:id', getLieferantById);

  // POST
  app.post('/', createLieferant);

  // PUT
  app.put('/:id', updateLieferantById);

  // DELETE
  app.delete('/:id', deleteLieferantById);
}
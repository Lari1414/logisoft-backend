import { FastifyInstance } from 'fastify';
import {
  createQualitaet,
  getAllQualitaeten,
  getQualitaetById,
  updateQualitaetById,
  deleteQualitaetById
} from '../controllers/qualitaet.controller';

export default async function qualitaetRoutes(app: FastifyInstance) {
  // POST
  app.post('/', createQualitaet);

  // GET
  app.get('/', getAllQualitaeten);
  app.get('/:id', getQualitaetById);

  // PUT
  app.put('/:id', updateQualitaetById);

  // DELETE
  app.delete('/:id', deleteQualitaetById);
}
import { FastifyInstance } from 'fastify';
import {
  createAdresse,
  getAllAdressen,
  getAdresseById,
  updateAdresseById,
  deleteAdresseById
} from '../controllers/adresse.controller';

export default async function adresseRoutes(app: FastifyInstance) {
  // GET
  app.get('/', getAllAdressen);
  app.get('/:id', getAdresseById);

  // POST
  app.post('/', createAdresse);

  // PUT
  app.put('/:id', updateAdresseById);

  // DELETE
  app.delete('/:id', deleteAdresseById);
}
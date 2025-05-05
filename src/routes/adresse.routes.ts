import { FastifyInstance } from 'fastify';
import { createAdresse, getAllAdressen, getAdresseById, updateAdresseById, deleteAdresseById } from '../controllers/adresse.controller';

export default async function adresseRoutes(app: FastifyInstance) {
  app.post('/', createAdresse);
  app.get('/', getAllAdressen);
  app.get('/:id', getAdresseById);
  app.put('/:id', updateAdresseById);
  app.delete('/:id', deleteAdresseById);
}

import { FastifyInstance } from 'fastify';
import {
  createLager,
  getAllLager,
  getLagerById,
  updateLagerById
} from '../controllers/lager.controller';

export default async function lagerRoutes(app: FastifyInstance) {
  // GET
  app.get('/', getAllLager);
  app.get('/:id', getLagerById);

  //POST
  app.post('/', createLager);

  // PUT
  app.put('/:id', updateLagerById);
}
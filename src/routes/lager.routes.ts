import { FastifyInstance } from 'fastify';
import { createLager, getAllLager, getLagerById, updateLagerById } from '../controllers/lager.controller';

export default async function lagerRoutes(app: FastifyInstance) {
  // POST: Lager erstellen
  app.post('/', createLager);
  // GET: Alle Läger abrufen
  app.get('/', getAllLager);
  //GET: Ein bestimmtest Lager abrufen
  app.get('/:id', getLagerById);
  //Updaten eines Lagers
  app.put('/:id', updateLagerById);
}

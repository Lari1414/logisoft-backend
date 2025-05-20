import { FastifyInstance } from 'fastify';
import {
  createLagerbestand,
  getAllLagerbestaende,
  getLagerbestandById,
  updateLagerbestandById,
  deleteLagerbestandById,
  auslagernMaterial,
  einlagernRohmaterial,
  getAllLagerbestaendeRoh,
  getAllLagerbestaendeFertig,
  einlagernFertigmaterial
} from '../controllers/lagerbestand.controller'

export default async function lagerbestandRoutes(app: FastifyInstance) {
  // GET
  app.get('/', getAllLagerbestaende);
  app.get('/roh', getAllLagerbestaendeRoh);
  app.get('/fertig', getAllLagerbestaendeFertig);
  app.get('/:id', getLagerbestandById);

  // POST
  app.post('/', createLagerbestand);
  app.post('/auslagern', auslagernMaterial);
  app.post('/einlagernRoh', einlagernRohmaterial);
  app.post('/einlagernFertig', einlagernFertigmaterial);

  // PUT
  app.put('/:id', updateLagerbestandById);

  // DELETE
  app.delete('/:id', deleteLagerbestandById);
}
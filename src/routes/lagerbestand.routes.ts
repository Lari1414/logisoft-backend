// src/routes/lagerbestand.routes.ts
import { FastifyInstance } from 'fastify';
import {
  createLagerbestand,
  getAllLagerbestaende,
  getLagerbestandById,
  updateLagerbestandById,
  deleteLagerbestandById,
  auslagernMaterial,
  einlagernMaterial,
  getAllLagerbestaendeRoh,
  getAllLagerbestaendeFertig
} from '../controllers/lagerbestand.controller'

export default async function lagerbestandRoutes(app: FastifyInstance) {
  // POST: Lagerbestand erstellen
  app.post('/', createLagerbestand);

  // GET: Alle Lagerbestände abrufen
  app.get('/', getAllLagerbestaende);
  // GET: Alle Lagerbestände abrufen von Rohmaterial
  app.get('/roh', getAllLagerbestaendeRoh);
  // GET: Alle Lagerbestände abrufen von Fertigmaterial
  app.get('/fertig', getAllLagerbestaendeFertig);

  // GET: Lagerbestand nach ID abrufen
  app.get('/:id', getLagerbestandById);

  // PUT: Lagerbestand aktualisieren
  app.put('/:id', updateLagerbestandById);

  // DELETE: Lagerbestand löschen
  app.delete('/:id', deleteLagerbestandById);

  //POST: Auslagern
  app.post('/auslagern',auslagernMaterial);
  //POST: Einlagern
  app.post('/einlagern',einlagernMaterial);

}

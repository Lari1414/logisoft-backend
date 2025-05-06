// src/routes/lagerbestand.routes.ts
import { FastifyInstance } from 'fastify';
import {
  createLagerbestand,
  getAllLagerbestaende,
  getLagerbestandById,
  updateLagerbestandById,
  deleteLagerbestandById,
  getMaterialBestand
} from '../controllers/lagerbestand.controller'

export default async function lagerbestandRoutes(app: FastifyInstance) {
  // POST: Lagerbestand erstellen
  app.post('/', createLagerbestand);

  // GET: Alle Lagerbestände abrufen
  app.get('/', getAllLagerbestaende);

  // GET: Lagerbestand nach ID abrufen
  app.get('/:id', getLagerbestandById);

  // PUT: Lagerbestand aktualisieren
  app.put('/:id', updateLagerbestandById);

  // DELETE: Lagerbestand löschen
  app.delete('/:id', deleteLagerbestandById);
  //GET: Materialbestand - Schnittstelle 1
  app.post('/materialbestand', getMaterialBestand);
}

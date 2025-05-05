// src/routes/qualität.routes.ts
import { FastifyInstance } from 'fastify';
import {
  createQualitaet,
  getAllQualitaeten,
  getQualitaetById,
  updateQualitaetById,
  deleteQualitaetById
} from '../controllers/qualitaet.controller';

export default async function qualitaetRoutes(app: FastifyInstance) {
  // POST: Neue Qualität anlegen
  app.post('/', createQualitaet);

  // GET: Alle Qualitätsdatensätze abrufen
  app.get('/', getAllQualitaeten);

  // GET: Qualität nach ID abrufen
  app.get('/:id', getQualitaetById);

  // PUT: Qualität aktualisieren
  app.put('/:id', updateQualitaetById);

  // DELETE: Qualität löschen
  app.delete('/:id', deleteQualitaetById);
}

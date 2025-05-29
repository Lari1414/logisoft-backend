// src/routes/versandverkauf.routes.ts
import { FastifyInstance } from 'fastify';
import {
  materialBestaendeAbrufen,
  erstelleAuslagerungsAuftraegeVerkauf,
  getKategorienMitGroessenUndTypen
} from '../controllers/versandverkauf.controller'

export default async function versandverkaufRoutes(app: FastifyInstance) {
  // GET
  app.get('/kategorien', getKategorienMitGroessenUndTypen);

  // POST
  app.post('/materialbestand', materialBestaendeAbrufen);
  app.post('/auslagerung', erstelleAuslagerungsAuftraegeVerkauf);
}
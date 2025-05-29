// src/routes/versandverkauf.routes.ts
import { FastifyInstance } from 'fastify';
import {
  materialBestand,
  erstelleAuslagerungsAuftraegeVerkauf,
  getKategorienMitGroessenUndTypen
} from '../controllers/versandverkauf.controller'

export default async function versandverkaufRoutes(app: FastifyInstance) {
  // GET
  app.get('/kategorien', getKategorienMitGroessenUndTypen);

  // POST
  app.post('/materialbestand', materialBestand);
  app.post('/auslagerung', erstelleAuslagerungsAuftraegeVerkauf);
}
// src/routes/material.routes.ts
import { FastifyInstance } from 'fastify';
import { createMaterial, getAllMaterials } from '../controllers/material.controller';

export default async function materialRoutes(app: FastifyInstance) {
  // POST: Material erstellen
  app.post('/', createMaterial);

  // GET: Alle Materialien abrufen
  app.get('/', getAllMaterials);
}

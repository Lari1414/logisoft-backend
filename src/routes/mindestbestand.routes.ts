// src/routes/material.routes.ts
import { FastifyInstance } from 'fastify';
import { createMindestbestand, getAllMindestbestand, getMindestbestandById, updateMindestbestandById, deleteMindestbestandById} from '../controllers/mindestbestand.controller';


export default async function materialRoutes(app: FastifyInstance) {
  // POST: Material erstellen
  app.post('/', createMindestbestand);
  // GET: Alle Materialien abrufen
  app.get('/', getAllMindestbestand);
  // GET: Material nach ID abrufen
  app.get('/:id', getMindestbestandById);
  // PUT: Updaten eines Materials
  app.put('/:id', updateMindestbestandById);
  //DELETE: Löschen eines Materials
  app.delete('/:id', deleteMindestbestandById);
}

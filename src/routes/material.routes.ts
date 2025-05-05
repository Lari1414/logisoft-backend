// src/routes/material.routes.ts
import { FastifyInstance } from 'fastify';
import { createMaterial, getAllMaterials, getMaterialById, updateMaterialById, deleteMaterialById} from '../controllers/material.controller';


export default async function materialRoutes(app: FastifyInstance) {
  // POST: Material erstellen
  app.post('/', createMaterial);
  // GET: Alle Materialien abrufen
  app.get('/', getAllMaterials);
  // GET: Material nach ID abrufen
  app.get('/:id', getMaterialById);
  // PUT: Updaten eines Materials
  app.put('/:id', updateMaterialById);
  //DELETE: Löschen eines Materials
  app.delete('/:id', deleteMaterialById);
}

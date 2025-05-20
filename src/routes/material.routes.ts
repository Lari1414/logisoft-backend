import { FastifyInstance } from 'fastify';
import {
  createMaterial,
  getAllMaterials,
  getMaterialById,
  updateMaterialById,
  deleteMaterialById,
  getRawMaterials,
  getFinishedMaterials
} from '../controllers/material.controller';


export default async function materialRoutes(app: FastifyInstance) {
  // GET
  app.get('/', getAllMaterials);
  app.get('/rohm', getRawMaterials);
  app.get('/fertig', getFinishedMaterials);
  app.get('/:id', getMaterialById);

  // POST
  app.post('/', createMaterial);

  // PUT
  app.put('/:id', updateMaterialById);

  // DELETE
  app.delete('/:id', deleteMaterialById);
}
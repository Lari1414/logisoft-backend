import { FastifyInstance } from 'fastify';
import {
  createMaterialbestellung,
  getAllMaterialbestellungen,
  getMaterialbestellungById,
  updateMaterialbestellungById,
  deleteMaterialbestellungById
} from '../controllers/materialbestellung.controller';

export default async function materialbestellungRoutes(app: FastifyInstance) {
  app.post('/', createMaterialbestellung);
  app.get('/', getAllMaterialbestellungen);
  app.get('/:id', getMaterialbestellungById);
  app.put('/:id', updateMaterialbestellungById);
  app.delete('/:id', deleteMaterialbestellungById);
}

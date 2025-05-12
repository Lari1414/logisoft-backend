import { FastifyInstance } from 'fastify';
import {
  createMaterialbestellung,
  getAllMaterialbestellungen,
  getMaterialbestellungById,
  updateMaterialbestellungById,
  deleteMaterialbestellungById,
  getAllMaterialbestellungenBestellt,
  getAllMaterialbestellungenBestellen
} from '../controllers/materialbestellung.controller'

export default async function materialbestellungRoutes(app: FastifyInstance) {
  app.post('/', createMaterialbestellung);
  app.get('/', getAllMaterialbestellungen);
  app.get('/bestellt', getAllMaterialbestellungenBestellt);
  app.get('/bestellen', getAllMaterialbestellungenBestellen);
  app.get('/:id', getMaterialbestellungById);
  app.put('/:id', updateMaterialbestellungById);
  app.delete('/:id', deleteMaterialbestellungById);
}

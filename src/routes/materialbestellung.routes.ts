import { FastifyInstance } from 'fastify';
import {
  createMaterialbestellung,
  getAllMaterialbestellungen,
  getMaterialbestellungById,
  deleteMaterialbestellungById,
  getAllMaterialbestellungenBestellt,
  getAllMaterialbestellungenBestellen,
  updateMaterialbestellungenStatus
} from '../controllers/materialbestellung.controller'

export default async function materialbestellungRoutes(app: FastifyInstance) {
  app.post('/', createMaterialbestellung);
  app.get('/', getAllMaterialbestellungen);
  app.get('/bestellt', getAllMaterialbestellungenBestellt);
  app.get('/offen', getAllMaterialbestellungenBestellen);
  app.get('/:id', getMaterialbestellungById);
  app.put('/absenden', updateMaterialbestellungenStatus);
  app.delete('/:id', deleteMaterialbestellungById);
}

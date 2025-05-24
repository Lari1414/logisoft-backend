import { FastifyInstance } from 'fastify';
import {
  createMaterialbestellung,
  getAllMaterialbestellungen,
  getMaterialbestellungById,
  deleteMaterialbestellungById,
  getAllMaterialbestellungenBestellt,
  getAllMaterialbestellungenBestellen,
  updateMaterialbestellungenStatus,
  createWareneingaengeZuBestellung
} from '../controllers/materialbestellung.controller'

export default async function materialbestellungRoutes(app: FastifyInstance) {
  // GET
  app.get('/', getAllMaterialbestellungen);
  app.get('/bestellt', getAllMaterialbestellungenBestellt);
  app.get('/offen', getAllMaterialbestellungenBestellen);
  app.get('/:id', getMaterialbestellungById);

  // POST
  app.post('/', createMaterialbestellung);
  app.post('/wareneingaenge', createWareneingaengeZuBestellung);

  // PUT
  app.put('/absenden', updateMaterialbestellungenStatus);

  // DELETE
  app.delete('/:id', deleteMaterialbestellungById);
}
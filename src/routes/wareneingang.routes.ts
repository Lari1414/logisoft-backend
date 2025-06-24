import { FastifyInstance } from 'fastify';
import {
  createEingang,
  getAllEingaenge,
  getEingangById,
  updateEingangById,
  deleteEingangById,
  updateEingaengeSperren,
  updateEingaengeEntsperren,
  wareneingangEingelagern,
  getAllEingaengeHeute,
  createReklamation,
  getAllEingaengeOhneRekl
} from '../controllers/wareneingang.controller';

export default async function wareneingangRoutes(app: FastifyInstance) {
  // GET
  app.get('/', getAllEingaengeOhneRekl);
  app.get('/:id', getEingangById);
  app.get('/heute', getAllEingaengeHeute)
  app.get('/alle', getAllEingaenge);

  // POST
  app.post('/', createEingang);
  app.post('/einlagern', wareneingangEingelagern);
  app.post('/reklamation', createReklamation);

  // PUT
  app.put('/:id', updateEingangById);
  app.put('/sperren', updateEingaengeSperren);
  app.put('/entsperren', updateEingaengeEntsperren);

  // DELETE
  app.delete('/:id', deleteEingangById);
}
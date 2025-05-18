import { FastifyInstance } from 'fastify';
import {
  createEingang,
  getAllEingaenge,
  getEingangById,
  //updateEingangById,
  deleteEingangById,
  updateEingaengeSperren,
  wareneingangEingelagern,
  getAllEingaengeHeute
} from '../controllers/wareneingang.controller';

export default async function wareneingangRoutes(app: FastifyInstance) {
  app.post('/', createEingang);
  app.get('/', getAllEingaenge);
  app.get('/:id', getEingangById);
  //app.put('/:id', updateEingangById);
  app.delete('/:id', deleteEingangById);
  app.get('/heute', getAllEingaengeHeute)
  app.put('/sperren', updateEingaengeSperren);
  app.post('/einlagern', wareneingangEingelagern);
}

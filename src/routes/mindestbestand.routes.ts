import { FastifyInstance } from 'fastify';
import {
  createMindestbestand,
  getAllMindestbestand,
  getMindestbestandById,
  updateMindestbestandById,
  deleteMindestbestandById
} from '../controllers/mindestbestand.controller';


export default async function materialRoutes(app: FastifyInstance) {
  // GET
  app.get('/', getAllMindestbestand);
  app.get('/:id', getMindestbestandById);

  // POST
  app.post('/', createMindestbestand);

  // PUT
  app.put('/:id', updateMindestbestandById);

  // DELETE
  app.delete('/:id', deleteMindestbestandById);
}
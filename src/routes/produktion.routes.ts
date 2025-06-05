import { FastifyInstance } from 'fastify';
import {
  produktionBestelltMaterial,
  produktionBestelltRohmaterial,
  rohmaterialZurueckgeben,
  fertigmaterialAnliefern
} from '../controllers/produktion.controller';

export default async function produktionRouten(app: FastifyInstance) {
  app.post('/material/bestellen', produktionBestelltMaterial);
  app.post('/rohmaterial/bestellen', produktionBestelltRohmaterial);
  app.post('/rohmaterial/zurueckgeben', rohmaterialZurueckgeben);
  app.post('/fertigmaterial/anliefern', fertigmaterialAnliefern);
}
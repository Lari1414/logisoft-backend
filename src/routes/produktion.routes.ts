import { FastifyInstance } from 'fastify';
import { fertigmaterialAbfragen, produktionBestelltMaterial, rohmaterialAbfragen, rohmaterialBereitstellen, rohmaterialZurueckgeben } from '../controllers/produktion.controller';

export default async function produktionRouten(app: FastifyInstance) {
  app.post('/material/bestellen', produktionBestelltMaterial);
  app.post('/rohmaterial/abfragen', rohmaterialAbfragen);
  app.get('/fertigmaterial/abfragen/:artikelnummer', fertigmaterialAbfragen);
  app.post('/rohmaterial/bereitstellen', rohmaterialBereitstellen);
  app.post('/rohmaterial/zurueckgeben', rohmaterialZurueckgeben);
}

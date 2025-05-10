import { FastifyInstance } from 'fastify';
import { materialEinlagern, materialAuslagern, getHistorie, getAuftraege } from '../controllers/auftraege.controller';

export default async function auftraegeRoutes(app: FastifyInstance) {
    app.post('/material/einlagern', materialEinlagern);
    app.post('/material/auslagern', materialAuslagern);
    app.get('/historie/abfragen', getHistorie);
    app.get('/abfragen', getAuftraege);
}
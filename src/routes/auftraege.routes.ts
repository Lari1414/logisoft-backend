import { FastifyInstance } from 'fastify';
import {
    erstelleAuslagerungsAuftrag,
    setzeAuftragAufAbholbereit,
    materialEinlagern,
    materialAuslagern,
    getHistorie,
    getAuftraege,
    getEinlagerungsAuftraege,
    getAuslagerungsAuftraege
} from '../controllers/auftraege.controller';

export default async function auftraegeRoutes(app: FastifyInstance) {
    // GET
    app.get('/historie/abfragen', getHistorie);
    app.get('/abfragen', getAuftraege);
    app.get('/abfragen/einlagerung', getEinlagerungsAuftraege);
    app.get('/abfragen/auslagerung', getAuslagerungsAuftraege);

    // POST
    app.post('/erstelleAuslagerungsAuftrag', erstelleAuslagerungsAuftrag);
    app.post('/setzeAuftragAufAbholbereit', setzeAuftragAufAbholbereit);
    app.post('/material/einlagern', materialEinlagern);
    app.post('/material/auslagern', materialAuslagern);
}
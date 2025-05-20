import { FastifyInstance } from 'fastify';
import lagerbestandRoutes from '../routes/lagerbestand.routes';


export async function lagerbestandModule(app: FastifyInstance) {

  await app.register(lagerbestandRoutes);
}

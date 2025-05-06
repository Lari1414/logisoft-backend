import { FastifyInstance } from 'fastify';
import  qualitaetRoutes  from '../routes/qualitaet.routes';


export async function qualitaetModule(app: FastifyInstance) {
  // Hier definierst du die POST-Routen für Material
  await app.register(qualitaetRoutes);
}

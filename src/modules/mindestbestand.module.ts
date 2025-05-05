import { FastifyInstance } from 'fastify';
import  mindestbestandRoutes  from '../routes/mindestbestand.routes';


export async function mindestbestandModule(app: FastifyInstance) {
  // Hier definierst du die POST-Routen für Material
  await app.register(mindestbestandRoutes);
}

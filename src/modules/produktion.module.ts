import { FastifyInstance } from 'fastify';
import produktionRouten from '../routes/produktion.routes';


export async function produktionModule(app: FastifyInstance) {
  // Hier definierst du die POST-Routen für Material
  await app.register(produktionRouten);
}
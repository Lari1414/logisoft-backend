import { FastifyInstance } from 'fastify';
import produktionRouten from '../routes/produktion.routes';

export async function produktionModule(app: FastifyInstance) {
  await app.register(produktionRouten);
}
// src/modules/versandverkauf.module.ts
import { FastifyInstance } from 'fastify';
import versandverkaufRoutes from '../routes/versandverkauf.routes';


export async function versandverkaufModule(app: FastifyInstance) {

  await app.register(versandverkaufRoutes);
}

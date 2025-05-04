import { FastifyInstance } from 'fastify';
import  materialRoutes  from '../routes/material.routes';


export async function materialModule(app: FastifyInstance) {
  // Hier definierst du die POST-Routen für Material
  await app.register(materialRoutes);
}

// src/routes/versandverkauf.routes.ts
import { FastifyInstance } from 'fastify';
import {
  getMaterialBestand
} from '../controllers/versandverkauf.controller'

export default async function versandverkaufRoutes(app: FastifyInstance) {
  //GET: Materialbestand - Schnittstelle 1
  app.post('/materialbestand', getMaterialBestand);
}

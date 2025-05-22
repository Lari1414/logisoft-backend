import { FastifyInstance } from 'fastify';
import {
    getAllReklamationen
} from '../controllers/reklamationen.controller';

export default async function reklamationenRoutes(app: FastifyInstance) {
    // GET
    app.get('/', getAllReklamationen);
}
import { FastifyInstance } from 'fastify';
import { lieferantenModule } from './lieferanten.module';  // Lieferanten-Modul importieren
import { materialModule } from './material.module'; // Material-Modul importieren

export async function registerModules(app: FastifyInstance) {
  // Registriere das Lieferanten-Modul unter dem Präfix '/api/lieferanten'
  await app.register(lieferantenModule, { prefix: '/api/lieferanten' });

  // Registriere das Material-Modul unter dem Präfix '/api/materials'
  await app.register(materialModule, { prefix: '/api/materials' });
}

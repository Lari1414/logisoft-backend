// src/utils/server.ts
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { registerPlugins } from './plugins/register-plugins';
import { registerModules } from './modules/register-modules';

export async function createServer(): Promise<FastifyInstance> {
  const app = Fastify({ ignoreTrailingSlash: true, logger: true });
  app.addHook('onRequest', (request, reply, done) => {
    console.log(`Incoming request: ${request.raw.method} ${request.raw.url}`);
    done(); // Gehe weiter zur nächsten Middleware oder Route
  });
  app.register(cors, {
    origin: [
      'http://localhost:5173',
      'http://localhost:80',
      'https://mawi-frontend-c4g8d9befvdjg4ae.swedencentral-01.azurewebsites.net',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  await registerPlugins(app);
  await registerModules(app);

  app.get('/', () => {
    return 'pong';
  });
  app.after(() => {
    console.log('\n📦 Registrierte API-Routen:');
    app.printRoutes();
  });

  return app;
}

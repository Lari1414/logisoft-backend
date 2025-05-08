import { FastifyInstance } from 'fastify';
import { lieferantModule } from './lieferanten.module';
import { materialModule } from './material.module';
import { lagerModule } from './lager.module';
import { mindestbestandModule } from './mindestbestand.module';
import { qualitaetModule } from './qualitaet.module';
import { adresseModule } from './adresse.module';
import { materialbestellungModule } from './materialbestellung.module';
import { wareneingangModule } from './wareneingang.module';
import { lagerbestandModule } from './lagerbestand.module';
import { produktionModule } from './produktion.module';
import { versandverkaufModule } from './versandverkauf.module'

export async function registerModules(app: FastifyInstance) {
  await app.register(lieferantModule, { prefix: '/api/lieferanten' });
  await app.register(materialModule, { prefix: '/api/materials' });
  await app.register(lagerModule, { prefix: '/api/lager' });
  await app.register(mindestbestandModule, { prefix: '/api/mindestbestand' });
  await app.register(qualitaetModule, { prefix: '/api/qualitaet' });
  await app.register(adresseModule, { prefix: '/api/adressen' });
  await app.register(materialbestellungModule, { prefix: '/api/materialbestellungen' });
  await app.register(wareneingangModule, { prefix: '/api/wareneingaenge' });
  await app.register(lagerbestandModule, { prefix: '/api/lagerbestand' });
  await app.register(produktionModule, { prefix: '/api/produktion' });
  await app.register(versandverkaufModule, { prefix: '/api/versandverkauf' });
  await app.register(versandverkaufModule, { prefix: '/api/auftraege' });
}

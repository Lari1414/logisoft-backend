import { PrismaClient } from '../generated/prisma';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();
faker.seed(123); // für konsistente Ergebnisse

async function main() {
  // 1. Erstelle Lager 1 (Rohmateriallager) und Lager 2 (Fertigmateriallager)
  let rohmaterialLager = await prisma.lager.findUnique({
    where: { lager_ID: 1 },
  });

  if (!rohmaterialLager) {
    // Erstelle Lager 1 (Rohmateriallager), wenn es nicht existiert
    rohmaterialLager = await prisma.lager.create({
      data: {
        bezeichnung: 'Rohmateriallager',
      },
    });
  }

  let fertigmaterialLager = await prisma.lager.findUnique({
    where: { lager_ID: 2 },
  });

  if (!fertigmaterialLager) {
    // Erstelle Lager 2 (Fertigmateriallager), wenn es nicht existiert
    fertigmaterialLager = await prisma.lager.create({
      data: {
        bezeichnung: 'Fertigmateriallager',
      },
    });
  }

  // 2. Erzeuge 5 Adressen
  const adressen = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      prisma.adresse.create({
        data: {
          strasse: faker.location.streetAddress(),
          ort: faker.location.city(),
          plz: parseInt(faker.location.zipCode('#####')),
        },
      })
    )
  );

  // 3. Erzeuge 5 Lieferanten mit Adresse
  const lieferanten = await Promise.all(
    adressen.map((adresse) =>
      prisma.lieferant.create({
        data: {
          firmenname: faker.company.name(),
          kontaktperson: faker.person.fullName(),
          adresse_ID: adresse.adresse_ID,
        },
      })
    )
  );

  // 4. Erzeuge 10 Textilmaterialien und weise sie entweder Lager 1 oder Lager 2 zu
  const materialien = await Promise.all(
    Array.from({ length: 10 }).map(() =>
      prisma.material.create({
        data: {
          lager_ID: Math.random() < 0.5 ? rohmaterialLager.lager_ID : fertigmaterialLager.lager_ID,  // Zufällig Lager 1 oder Lager 2
          category: 'Textil',  // Alle Materialien sind Textilmaterialien
          farbe: faker.color.human(),
          typ: faker.commerce.productAdjective(),
          groesse: faker.helpers.arrayElement(['S', 'M', 'L', 'XL']),
          url: faker.internet.url(),
        },
      })
    )
  );

  // 5. Erzeuge Qualitäten
  const qualitaeten = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      prisma.qualitaet.create({
        data: {
          viskositaet: faker.number.float({ min: 0.5, max: 5.0 }),
          ppml: faker.number.int({ min: 100, max: 500 }),
          deltaE: faker.number.float({ min: 0.1, max: 3.0 }),
          saugfaehigkeit: faker.number.float({ min: 1.0, max: 10.0 }),
          weissgrad: faker.number.int({ min: 80, max: 100 }),
        },
      })
    )
  );

  // 6. Materialbestellungen + Wareneingänge + Lagerbestand
  for (let i = 0; i < 10; i++) {
    const mat = faker.helpers.arrayElement(materialien);
    const lieferant = faker.helpers.arrayElement(lieferanten);
    const quali = faker.helpers.arrayElement(qualitaeten);

    const bestellung = await prisma.materialbestellung.create({
      data: {
        lieferant_ID: lieferant.lieferant_ID,
        material_ID: mat.material_ID,
        status: 'Bestellt',
      },
    });

    const eingang = await prisma.wareneingang.create({
      data: {
        material_ID: mat.material_ID,
        materialbestellung_ID: bestellung.materialbestellung_ID,
        menge: faker.number.int({ min: 10, max: 100 }),
        status: 'Eingelagert',
        qualitaet_ID: quali.qualitaet_ID,
        lieferdatum: faker.date.recent(),
      },
    });

    await prisma.lagerbestand.create({
      data: {
        eingang_ID: eingang.eingang_ID,
        lager_ID: mat.lager_ID,  // Verweist auf das korrekte Lager
        material_ID: mat.material_ID,
        menge: eingang.menge,
      },
    });
  }

  // 7. Mindestbestand einmalig pro Material
  for (const mat of materialien) {
    await prisma.mindestbestand.create({
      data: {
        material_ID: mat.material_ID,
        mindestbestand: faker.number.int({ min: 5, max: 20 }),
      },
    });
  }

  console.log(' Seed erfolgreich abgeschlossen');
}

main()
  .catch((e) => {
    console.error(' Seed Fehler:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

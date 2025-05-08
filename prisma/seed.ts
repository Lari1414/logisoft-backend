import { PrismaClient } from '../generated/prisma';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();
faker.seed(123); // für konsistente Ergebnisse

async function main() {
  // 1. Lösche alle bestehenden Daten (mit Sicherstellung, dass keine Foreign Key-Fehler auftreten)
  await prisma.lagerbestand.deleteMany();
  await prisma.wareneingang.deleteMany();
  await prisma.materialbestellung.deleteMany();
  await prisma.material.deleteMany();
  await prisma.mindestbestand.deleteMany();

  // Lösche Lieferanten zuerst, weil sie auf Adressen verweisen
  await prisma.lieferant.deleteMany();

  // Lösche Adressen, nachdem alle Lieferanten gelöscht wurden
  await prisma.adresse.deleteMany();

  // Lösche Lager
  await prisma.lager.deleteMany();

  // 2. Erstelle Lager 1 (Rohmateriallager) und Lager 2 (Fertigmateriallager)
  let rohmaterialLager = await prisma.lager.findUnique({
    where: { lager_ID: 1 },
  });

  if (!rohmaterialLager) {
    rohmaterialLager = await prisma.lager.create({
      data: {
        lager_ID: 1,
        bezeichnung: 'Rohmateriallager',
      },
    });
  }

  let fertigmaterialLager = await prisma.lager.findUnique({
    where: { lager_ID: 2 },
  });

  if (!fertigmaterialLager) {
    fertigmaterialLager = await prisma.lager.create({
      data: {
        lager_ID: 2,
        bezeichnung: 'Fertigmateriallager',
      },
    });
  }

  // 3. Erzeuge 3 Adressen
  const adressen = await Promise.all(
    Array.from({ length: 3 }).map(() =>
      prisma.adresse.create({
        data: {
          strasse: faker.location.streetAddress(),
          ort: faker.location.city(),
          plz: parseInt(faker.location.zipCode('#####')),
        },
      })
    )
  );

  // 4. Erzeuge 3 Lieferanten mit Adresse
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

  // 5. Erzeuge 5 Materialien mit festen Typen und Kategorie "T-Shirt"
  const typVarianten = ['V-Ausschnitt', 'Oversize', 'Top', 'Sport', 'Rundhals'];
  const materialien = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      prisma.material.create({
        data: {
          lager_ID: Math.random() < 0.5 ? rohmaterialLager.lager_ID : fertigmaterialLager.lager_ID,
          category: 'T-Shirt',
          farbe: faker.color.human(),
          typ: faker.helpers.arrayElement(typVarianten),
          groesse: faker.helpers.arrayElement(['S', 'M', 'L', 'XL']),
          url: faker.internet.url(),
        },
      })
    )
  );

  // 6. Erzeuge 3 Rohmaterialien
  const categorys = ['Verpackung', 'Farbe', 'Druckfolie'];
  const rohmaterialien = await Promise.all(
    Array.from({ length: 3 }).map(() =>
      prisma.material.create({
        data: {
          lager_ID: rohmaterialLager.lager_ID,
          category: faker.helpers.arrayElement(categorys),
          farbe: faker.color.human(),
          typ: null,  // Typ bleibt null für Rohmaterialien
          groesse: null,  // Größe bleibt null
          url: null,  // URL bleibt null
        },
      })
    )
  );

  // 7. Erzeuge Qualitäten
  const qualitaeten = await Promise.all(
    Array.from({ length: 3 }).map(() =>
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

  // 8. Materialbestellungen, Wareneingänge, Lagerbestand
  for (let i = 0; i < 5; i++) {
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
        lieferdatum: faker.date.recent(),
      },
    });

    // Überprüfe, ob `qualitaet_ID` gesetzt werden kann (bei Materialien mit Qualität)
    const qualitaetID = mat.category === 'T-Shirt' ? quali.qualitaet_ID : null;

    // Überprüfen, ob `qualitaet_ID` NULL sein kann und es sicher setzen
    await prisma.lagerbestand.create({
      data: {
        eingang_ID: eingang.eingang_ID,
        lager_ID: mat.lager_ID,
        material_ID: mat.material_ID,
        menge: eingang.menge,
        qualitaet_ID: quali.qualitaet_ID  // Überprüfe und setze NULL, wenn nicht benötigt
      },
    });

    // **Füge Mindestbestand für jedes Material hinzu**
    await prisma.mindestbestand.create({
      data: {
        material_ID: mat.material_ID,
        mindestbestand: faker.number.int({ min: 5, max: 20 }),
      },
    });
  }

  // 9. Materialbestellungen, Wareneingänge, Lagerbestand für Rohmaterial
  for (let i = 0; i < 3; i++) {
    const rohmat = faker.helpers.arrayElement(rohmaterialien);
    const rohmatlieferant = faker.helpers.arrayElement(lieferanten);
    const rohmatquali = faker.helpers.arrayElement(qualitaeten);

    const rohmatbestellung = await prisma.materialbestellung.create({
      data: {
        lieferant_ID: rohmatlieferant.lieferant_ID,
        material_ID: rohmat.material_ID,
        status: 'Bestellt',
      },
    });

    const rohmateingang = await prisma.wareneingang.create({
      data: {
        material_ID: rohmat.material_ID,
        materialbestellung_ID: rohmatbestellung.materialbestellung_ID,
        menge: faker.number.int({ min: 10, max: 100 }),
        status: 'Eingelagert',
        lieferdatum: faker.date.recent(),
      },
    });

    // Rohmaterial benötigt keine Qualitaet_ID, also setze es auf NULL
    await prisma.lagerbestand.create({
      data: {
        eingang_ID: rohmateingang.eingang_ID,
        lager_ID: rohmat.lager_ID,
        material_ID: rohmat.material_ID,
        menge: rohmateingang.menge,
        qualitaet_ID: rohmatquali.qualitaet_ID,
      },
    });

    // **Füge Mindestbestand für Rohmaterial hinzu**
    await prisma.mindestbestand.create({
      data: {
        material_ID: rohmat.material_ID,
        mindestbestand: faker.number.int({ min: 5, max: 20 }),
      },
    });
  }

  console.log('Seed erfolgreich abgeschlossen');
}

main()
  .catch((e) => {
    console.error('Seed Fehler:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

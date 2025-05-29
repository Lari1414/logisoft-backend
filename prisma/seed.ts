import { Material, PrismaClient } from '../generated/prisma';
import { faker } from '@faker-js/faker';
import { cmykToHex } from '../src/utils/color.util';

const prisma = new PrismaClient();
faker.seed(123);

let materialien: Material[] = [];

async function main() {

  await prisma.auftrag.deleteMany();
  await prisma.lagerbestand.deleteMany();
  await prisma.wareneingang.deleteMany();
  await prisma.materialbestellung.deleteMany();
  await prisma.mindestbestand.deleteMany();
  await prisma.material.deleteMany();
  await prisma.lieferant.deleteMany();
  await prisma.adresse.deleteMany();
  await prisma.lager.deleteMany();

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

  const typVarianten = ['V-Ausschnitt', 'Oversize', 'Top', 'Sport', 'Rundhals'];
  const groessen = ['S', 'M', 'L'];

  const standardFarben = [
    { name: 'Weiß', cmyk: { cyan: 0, magenta: 0, yellow: 0, black: 0 } },
    { name: 'Rot', cmyk: { cyan: 0, magenta: 100, yellow: 100, black: 0 } },
    { name: 'Blau', cmyk: { cyan: 100, magenta: 100, yellow: 0, black: 0 } },
    { name: 'Grau', cmyk: { cyan: 0, magenta: 0, yellow: 0, black: 30 } }
  ];

  const materials: any[] = [];

  for (const typ of typVarianten) {
    for (const groesse of groessen) {
      for (const farbe of standardFarben) {
        const hexCode = cmykToHex(farbe.cmyk);
        const istWeiss = farbe.name === 'Weiß';
        const lager_ID = istWeiss ? rohmaterialLager.lager_ID : fertigmaterialLager.lager_ID;

        materials.push(
          prisma.material.create({
            data: {
              lager_ID,
              category: 'T-Shirt',
              standardmaterial: true,
              typ,
              groesse,
              url: istWeiss ? null : faker.internet.url(),
              farbe: hexCode,
              farbe_json: farbe.cmyk,
            },
          })
        );
      }
    }
  }

  await Promise.all(materials);

  const extraFertigMaterialien: ReturnType<typeof prisma.material.create>[] = [];

  for (let i = 0; i < 6; i++) {
    const hasPrint = faker.datatype.boolean();
    const color = {
      cyan: faker.number.int({ min: 0, max: 100 }),
      magenta: faker.number.int({ min: 0, max: 100 }),
      yellow: faker.number.int({ min: 0, max: 100 }),
      black: faker.number.int({ min: 0, max: 100 }),
    };

    const hexCode = cmykToHex(color);

    extraFertigMaterialien.push(
      prisma.material.create({
        data: {
          lager_ID: fertigmaterialLager.lager_ID,
          category: 'T-Shirt',
          standardmaterial: false,
          typ: hasPrint ? `Bedruckt ${faker.helpers.arrayElement(typVarianten)}` : faker.helpers.arrayElement(typVarianten),
          groesse: faker.helpers.arrayElement(groessen),
          url: faker.image.url(),
          farbe: hexCode,
          farbe_json: color,
        },
      })
    );
  }

  await Promise.all(extraFertigMaterialien);

  const verpackung = await prisma.material.create({
    data: {
      lager_ID: rohmaterialLager.lager_ID,
      category: 'Verpackung',
      standardmaterial: true,
      typ: 'Karton braun',
      groesse: null,
      url: null,
      farbe: null,
      farbe_json: {
        cyan: null, magenta: null, yellow: null, black: null
      },
    },
  });

  // Rohmaterialien - Farbe (CMYK)
  const farbenCMYK = [
    { cyan: 100, magenta: 0, yellow: 0, black: 0 },     // Cyan
    { cyan: 0, magenta: 100, yellow: 0, black: 0 },     // Magenta
    { cyan: 0, magenta: 0, yellow: 100, black: 0 },     // Yellow
    { cyan: 0, magenta: 0, yellow: 0, black: 100 },     // Black
  ];

  const farben = await Promise.all(
    farbenCMYK.map((farbe) => {
      return prisma.material.create({
        data: {
          lager_ID: rohmaterialLager.lager_ID,
          category: 'Farbe',
          standardmaterial: true,
          typ: 'Standardfarbe',
          groesse: null,
          url: null,
          farbe: cmykToHex(farbe),
          farbe_json: farbe,
        },
      });
    })
  );

  // Rohmaterialien - Druckfolie (schwarz & weiß)
  const druckfolien = await Promise.all(
    [
      { cyan: 0, magenta: 0, yellow: 0, black: 100 },
      { cyan: 0, magenta: 0, yellow: 0, black: 0 },
    ].map((farbe, i) => {
      return prisma.material.create({
        data: {
          lager_ID: rohmaterialLager.lager_ID,
          category: 'Druckfolie',
          standardmaterial: true,
          typ: i === 0 ? 'Schwarz' : 'Weiß',
          groesse: null,
          url: null,
          farbe: cmykToHex(farbe),
          farbe_json: farbe,
        },
      });
    })
  );

  // Qualitäten für T-Shirts (weissgrad & saugfaehigkeit)
  const tshirtQualitaeten = await Promise.all(
    Array.from({ length: 3 }).map(() =>
      prisma.qualitaet.create({
        data: {
          weissgrad: faker.number.int({ min: 80, max: 100 }),
          saugfaehigkeit: faker.number.float({ min: 1.0, max: 10.0 }),
          ppml: null,
          viskositaet: null
        },
      })
    )
  );

  // Qualitäten für Farben (ppml & viskositaet)
  const farbenQualitaeten = await Promise.all(
    Array.from({ length: 3 }).map(() =>
      prisma.qualitaet.create({
        data: {
          ppml: faker.number.int({ min: 100, max: 500 }),
          viskositaet: faker.number.float({ min: 0.5, max: 5.0 }),
          weissgrad: null,
          saugfaehigkeit: null
        },
      })
    )
  );

  const qualitaeten = [...tshirtQualitaeten, ...farbenQualitaeten];

  const materialien: Material[] = await prisma.material.findMany();

  // Filtere Rohmaterialien (T-Shirts, Farben, Druckfolie, Verpackung)
  const rohmaterialien = materialien.filter(mat =>
    mat.lager_ID === rohmaterialLager.lager_ID &&
    ['T-Shirt', 'Farbe', 'Druckfolie', 'Verpackung'].includes(mat.category!)
  );

  for (let i = 0; i < 10; i++) {
    const mat = faker.helpers.arrayElement(rohmaterialien);
    const lieferant = faker.helpers.arrayElement(lieferanten);

    // Wähle die passende Qualität
    let qualitaetID: number | null = null;
    if (mat.category === 'T-Shirt') {
      qualitaetID = faker.helpers.arrayElement(tshirtQualitaeten).qualitaet_ID;
    } else if (mat.category === 'Farbe') {
      qualitaetID = faker.helpers.arrayElement(farbenQualitaeten).qualitaet_ID;
    } else {
      qualitaetID = null; // Verpackung, Druckfolie etc. brauchen evtl. keine
    }

    const menge = faker.number.int({ min: 10, max: 100 });

    const bestellung = await prisma.materialbestellung.create({
      data: {
        lieferant_ID: lieferant.lieferant_ID,
        material_ID: mat.material_ID,
        status: 'offen',
        menge,
      },
    });

    const eingang = await prisma.wareneingang.create({
      data: {
        material_ID: mat.material_ID,
        materialbestellung_ID: bestellung.materialbestellung_ID,
        menge,
        status: 'eingetroffen',
        lieferdatum: faker.date.recent(),
        qualitaet_ID: qualitaetID,
      },
    });

    await prisma.lagerbestand.create({
      data: {
        eingang_ID: eingang.eingang_ID,
        lager_ID: mat.lager_ID,
        material_ID: mat.material_ID,
        menge: eingang.menge,
        qualitaet_ID: qualitaetID,
      },
    });

    const existing = await prisma.mindestbestand.findUnique({
      where: { material_ID: mat.material_ID },
    });

    if (!existing) {
      await prisma.mindestbestand.create({
        data: {
          material_ID: mat.material_ID,
          mindestbestand: faker.number.int({ min: 5, max: 20 }),
        },
      });
    }
  }

  // 9. Lagerbestand für Fertigmaterialien direkt anlegen (ohne Wareneingang)
  const fertigmaterialien = materialien.filter(
    (mat) => mat.lager_ID === fertigmaterialLager.lager_ID
  );

  for (const mat of fertigmaterialien) {
    // Qualität nur für T-Shirts setzen
    const passendeQuali = mat.category === 'T-Shirt'
      ? faker.helpers.arrayElement(qualitaeten.filter(q => q.saugfaehigkeit !== null))
      : null;

    await prisma.lagerbestand.create({
      data: {
        lager_ID: mat.lager_ID,
        material_ID: mat.material_ID,
        menge: faker.number.int({ min: 5, max: 50 }),
        qualitaet_ID: passendeQuali?.qualitaet_ID ?? null,
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
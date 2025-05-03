-- CreateTable
CREATE TABLE "Material" (
    "material_ID" SERIAL NOT NULL,
    "lager_ID" INTEGER NOT NULL,
    "category" TEXT,
    "farbe" TEXT,
    "typ" TEXT,
    "groesse" TEXT,
    "url" TEXT,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("material_ID")
);

-- CreateTable
CREATE TABLE "Wareneingang" (
    "eingang_ID" SERIAL NOT NULL,
    "material_ID" INTEGER NOT NULL,
    "materialbestellung_g_ID" INTEGER NOT NULL,
    "menge" INTEGER NOT NULL,
    "status" TEXT,
    "qualitaet_ID" INTEGER NOT NULL,
    "lieferdatum" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wareneingang_pkey" PRIMARY KEY ("eingang_ID")
);

-- CreateTable
CREATE TABLE "Materialbestellungen" (
    "materialbestellung_ID" SERIAL NOT NULL,
    "lieferanten_ID" INTEGER NOT NULL,
    "material_ID" INTEGER NOT NULL,
    "status" TEXT,

    CONSTRAINT "Materialbestellungen_pkey" PRIMARY KEY ("materialbestellung_ID")
);

-- CreateTable
CREATE TABLE "Lieferant" (
    "lieferant_ID" SERIAL NOT NULL,
    "firmenname" TEXT,
    "kontaktperson" TEXT,
    "adresse_ID" INTEGER NOT NULL,

    CONSTRAINT "Lieferant_pkey" PRIMARY KEY ("lieferant_ID")
);

-- CreateTable
CREATE TABLE "Adresse" (
    "adresse_ID" SERIAL NOT NULL,
    "strasse" TEXT,
    "ort" TEXT,
    "plz" INTEGER,

    CONSTRAINT "Adresse_pkey" PRIMARY KEY ("adresse_ID")
);

-- CreateTable
CREATE TABLE "Lager" (
    "lager_ID" SERIAL NOT NULL,
    "bezeichnung" TEXT,

    CONSTRAINT "Lager_pkey" PRIMARY KEY ("lager_ID")
);

-- CreateTable
CREATE TABLE "Qualitaet" (
    "qualitaet_ID" SERIAL NOT NULL,
    "viskositaet" DOUBLE PRECISION,
    "ppml" INTEGER,
    "deltaE" DOUBLE PRECISION,
    "saugfaehigkeit" DOUBLE PRECISION,
    "weissgrad" INTEGER,

    CONSTRAINT "Qualitaet_pkey" PRIMARY KEY ("qualitaet_ID")
);

-- CreateTable
CREATE TABLE "Lagerbestand" (
    "lagerbestand_ID" SERIAL NOT NULL,
    "eingang_ID" INTEGER NOT NULL,
    "lager_ID" INTEGER NOT NULL,
    "material_ID" INTEGER NOT NULL,
    "menge" INTEGER NOT NULL,

    CONSTRAINT "Lagerbestand_pkey" PRIMARY KEY ("lagerbestand_ID")
);

-- CreateTable
CREATE TABLE "Mindestbestand" (
    "mindestbestand_ID" SERIAL NOT NULL,
    "material_ID" INTEGER NOT NULL,
    "mindestbestand" INTEGER NOT NULL,

    CONSTRAINT "Mindestbestand_pkey" PRIMARY KEY ("mindestbestand_ID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lieferant_adresse_ID_key" ON "Lieferant"("adresse_ID");

-- CreateIndex
CREATE UNIQUE INDEX "Mindestbestand_material_ID_key" ON "Mindestbestand"("material_ID");

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_lager_ID_fkey" FOREIGN KEY ("lager_ID") REFERENCES "Lager"("lager_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wareneingang" ADD CONSTRAINT "Wareneingang_material_ID_fkey" FOREIGN KEY ("material_ID") REFERENCES "Material"("material_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wareneingang" ADD CONSTRAINT "Wareneingang_materialbestellung_g_ID_fkey" FOREIGN KEY ("materialbestellung_g_ID") REFERENCES "Materialbestellungen"("materialbestellung_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wareneingang" ADD CONSTRAINT "Wareneingang_qualitaet_ID_fkey" FOREIGN KEY ("qualitaet_ID") REFERENCES "Qualitaet"("qualitaet_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Materialbestellungen" ADD CONSTRAINT "Materialbestellungen_lieferanten_ID_fkey" FOREIGN KEY ("lieferanten_ID") REFERENCES "Lieferant"("lieferant_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Materialbestellungen" ADD CONSTRAINT "Materialbestellungen_material_ID_fkey" FOREIGN KEY ("material_ID") REFERENCES "Material"("material_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lieferant" ADD CONSTRAINT "Lieferant_adresse_ID_fkey" FOREIGN KEY ("adresse_ID") REFERENCES "Adresse"("adresse_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lagerbestand" ADD CONSTRAINT "Lagerbestand_eingang_ID_fkey" FOREIGN KEY ("eingang_ID") REFERENCES "Wareneingang"("eingang_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lagerbestand" ADD CONSTRAINT "Lagerbestand_lager_ID_fkey" FOREIGN KEY ("lager_ID") REFERENCES "Lager"("lager_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lagerbestand" ADD CONSTRAINT "Lagerbestand_material_ID_fkey" FOREIGN KEY ("material_ID") REFERENCES "Material"("material_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mindestbestand" ADD CONSTRAINT "Mindestbestand_material_ID_fkey" FOREIGN KEY ("material_ID") REFERENCES "Material"("material_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

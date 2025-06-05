-- CreateTable
CREATE TABLE "Material" (
    "material_ID" SERIAL NOT NULL,
    "lager_ID" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "farbe" TEXT,
    "farbe_json" JSONB,
    "typ" TEXT,
    "groesse" TEXT,
    "url" TEXT,
    "standardmaterial" BOOLEAN NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("material_ID")
);

-- CreateTable
CREATE TABLE "Materialbestellung" (
    "materialbestellung_ID" SERIAL NOT NULL,
    "lieferant_ID" INTEGER,
    "material_ID" INTEGER NOT NULL,
    "status" TEXT,
    "menge" INTEGER NOT NULL,

    CONSTRAINT "Materialbestellung_pkey" PRIMARY KEY ("materialbestellung_ID")
);

-- CreateTable
CREATE TABLE "Wareneingang" (
    "eingang_ID" SERIAL NOT NULL,
    "material_ID" INTEGER,
    "materialbestellung_ID" INTEGER NOT NULL,
    "menge" INTEGER NOT NULL,
    "status" TEXT,
    "lieferdatum" TIMESTAMP(3) NOT NULL,
    "qualitaet_ID" INTEGER,

    CONSTRAINT "Wareneingang_pkey" PRIMARY KEY ("eingang_ID")
);

-- CreateTable
CREATE TABLE "Lieferant" (
    "lieferant_ID" SERIAL NOT NULL,
    "firmenname" TEXT NOT NULL,
    "kontaktperson" TEXT NOT NULL,
    "adresse_ID" INTEGER NOT NULL,

    CONSTRAINT "Lieferant_pkey" PRIMARY KEY ("lieferant_ID")
);

-- CreateTable
CREATE TABLE "Adresse" (
    "adresse_ID" SERIAL NOT NULL,
    "strasse" TEXT NOT NULL,
    "ort" TEXT NOT NULL,
    "plz" INTEGER NOT NULL,

    CONSTRAINT "Adresse_pkey" PRIMARY KEY ("adresse_ID")
);

-- CreateTable
CREATE TABLE "Lager" (
    "lager_ID" SERIAL NOT NULL,
    "bezeichnung" TEXT NOT NULL,

    CONSTRAINT "Lager_pkey" PRIMARY KEY ("lager_ID")
);

-- CreateTable
CREATE TABLE "Qualitaet" (
    "qualitaet_ID" SERIAL NOT NULL,
    "viskositaet" DOUBLE PRECISION,
    "ppml" INTEGER,
    "saugfaehigkeit" DOUBLE PRECISION,
    "weissgrad" INTEGER,
    "deltaE" DOUBLE PRECISION,

    CONSTRAINT "Qualitaet_pkey" PRIMARY KEY ("qualitaet_ID")
);

-- CreateTable
CREATE TABLE "Lagerbestand" (
    "lagerbestand_ID" SERIAL NOT NULL,
    "eingang_ID" INTEGER,
    "lager_ID" INTEGER NOT NULL,
    "material_ID" INTEGER NOT NULL,
    "menge" INTEGER NOT NULL,
    "qualitaet_ID" INTEGER,

    CONSTRAINT "Lagerbestand_pkey" PRIMARY KEY ("lagerbestand_ID")
);

-- CreateTable
CREATE TABLE "Mindestbestand" (
    "mindestbestand_ID" SERIAL NOT NULL,
    "material_ID" INTEGER NOT NULL,
    "mindestbestand" INTEGER NOT NULL,

    CONSTRAINT "Mindestbestand_pkey" PRIMARY KEY ("mindestbestand_ID")
);

-- CreateTable
CREATE TABLE "Auftrag" (
    "auftrag_ID" SERIAL NOT NULL,
    "lager_ID" INTEGER NOT NULL,
    "material_ID" INTEGER,
    "menge" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "lagerbestand_ID" INTEGER NOT NULL,
    "bestellposition" TEXT,
    "angefordertVon" TEXT NOT NULL,

    CONSTRAINT "Auftrag_pkey" PRIMARY KEY ("auftrag_ID")
);

-- CreateTable
CREATE TABLE "Reklamation" (
    "reklamation_ID" SERIAL NOT NULL,
    "menge" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "wareneingang_ID" INTEGER NOT NULL,

    CONSTRAINT "Reklamation_pkey" PRIMARY KEY ("reklamation_ID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mindestbestand_material_ID_key" ON "Mindestbestand"("material_ID");

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_lager_ID_fkey" FOREIGN KEY ("lager_ID") REFERENCES "Lager"("lager_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Materialbestellung" ADD CONSTRAINT "Materialbestellung_lieferant_ID_fkey" FOREIGN KEY ("lieferant_ID") REFERENCES "Lieferant"("lieferant_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Materialbestellung" ADD CONSTRAINT "Materialbestellung_material_ID_fkey" FOREIGN KEY ("material_ID") REFERENCES "Material"("material_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wareneingang" ADD CONSTRAINT "Wareneingang_qualitaet_ID_fkey" FOREIGN KEY ("qualitaet_ID") REFERENCES "Qualitaet"("qualitaet_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wareneingang" ADD CONSTRAINT "Wareneingang_material_ID_fkey" FOREIGN KEY ("material_ID") REFERENCES "Material"("material_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wareneingang" ADD CONSTRAINT "Wareneingang_materialbestellung_ID_fkey" FOREIGN KEY ("materialbestellung_ID") REFERENCES "Materialbestellung"("materialbestellung_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lieferant" ADD CONSTRAINT "Lieferant_adresse_ID_fkey" FOREIGN KEY ("adresse_ID") REFERENCES "Adresse"("adresse_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lagerbestand" ADD CONSTRAINT "Lagerbestand_eingang_ID_fkey" FOREIGN KEY ("eingang_ID") REFERENCES "Wareneingang"("eingang_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lagerbestand" ADD CONSTRAINT "Lagerbestand_lager_ID_fkey" FOREIGN KEY ("lager_ID") REFERENCES "Lager"("lager_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lagerbestand" ADD CONSTRAINT "Lagerbestand_material_ID_fkey" FOREIGN KEY ("material_ID") REFERENCES "Material"("material_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lagerbestand" ADD CONSTRAINT "Lagerbestand_qualitaet_ID_fkey" FOREIGN KEY ("qualitaet_ID") REFERENCES "Qualitaet"("qualitaet_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mindestbestand" ADD CONSTRAINT "Mindestbestand_material_ID_fkey" FOREIGN KEY ("material_ID") REFERENCES "Material"("material_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auftrag" ADD CONSTRAINT "Auftrag_lager_ID_fkey" FOREIGN KEY ("lager_ID") REFERENCES "Lager"("lager_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auftrag" ADD CONSTRAINT "Auftrag_material_ID_fkey" FOREIGN KEY ("material_ID") REFERENCES "Material"("material_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auftrag" ADD CONSTRAINT "Auftrag_lagerbestand_ID_fkey" FOREIGN KEY ("lagerbestand_ID") REFERENCES "Lagerbestand"("lagerbestand_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reklamation" ADD CONSTRAINT "Reklamation_wareneingang_ID_fkey" FOREIGN KEY ("wareneingang_ID") REFERENCES "Wareneingang"("eingang_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

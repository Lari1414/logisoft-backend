-- CreateTable
CREATE TABLE "Auftrag" (
    "auftrag_ID" SERIAL NOT NULL,
    "lager_ID" INTEGER NOT NULL,
    "material_ID" INTEGER NOT NULL,
    "menge" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "lagerbestand_ID" INTEGER NOT NULL,

    CONSTRAINT "Auftrag_pkey" PRIMARY KEY ("auftrag_ID")
);

-- AddForeignKey
ALTER TABLE "Auftrag" ADD CONSTRAINT "Auftrag_lager_ID_fkey" FOREIGN KEY ("lager_ID") REFERENCES "Lager"("lager_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auftrag" ADD CONSTRAINT "Auftrag_material_ID_fkey" FOREIGN KEY ("material_ID") REFERENCES "Material"("material_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auftrag" ADD CONSTRAINT "Auftrag_lagerbestand_ID_fkey" FOREIGN KEY ("lagerbestand_ID") REFERENCES "Lagerbestand"("lagerbestand_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "BestellpositionsPuffer" (
    "id" SERIAL NOT NULL,
    "bestellposition" TEXT NOT NULL,
    "artikelnummer" INTEGER NOT NULL,
    "menge" INTEGER NOT NULL,

    CONSTRAINT "BestellpositionsPuffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reklamation" (
    "reklamation_ID" SERIAL NOT NULL,
    "menge" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "wareneingang_ID" INTEGER NOT NULL,

    CONSTRAINT "Reklamation_pkey" PRIMARY KEY ("reklamation_ID")
);

-- AddForeignKey
ALTER TABLE "Reklamation" ADD CONSTRAINT "Reklamation_wareneingang_ID_fkey" FOREIGN KEY ("wareneingang_ID") REFERENCES "Wareneingang"("eingang_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

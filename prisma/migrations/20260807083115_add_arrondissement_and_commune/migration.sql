-- AlterTable
ALTER TABLE "Structure" ADD COLUMN     "arrondissementCode" TEXT;

-- CreateTable
CREATE TABLE "Arrondissement" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departementNumero" TEXT NOT NULL,
    "population" INTEGER,

    CONSTRAINT "Arrondissement_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Commune" (
    "codeInsee" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "codesPostaux" TEXT[],
    "population" INTEGER,
    "arrondissementCode" TEXT,

    CONSTRAINT "Commune_pkey" PRIMARY KEY ("codeInsee")
);

-- CreateIndex
CREATE INDEX "Arrondissement_departementNumero_idx" ON "Arrondissement"("departementNumero");

-- CreateIndex
CREATE INDEX "Commune_nameNormalized_idx" ON "Commune"("nameNormalized");

-- AddForeignKey
ALTER TABLE "Arrondissement" ADD CONSTRAINT "Arrondissement_departementNumero_fkey" FOREIGN KEY ("departementNumero") REFERENCES "Departement"("numero") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commune" ADD CONSTRAINT "Commune_arrondissementCode_fkey" FOREIGN KEY ("arrondissementCode") REFERENCES "Arrondissement"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_arrondissementCode_fkey" FOREIGN KEY ("arrondissementCode") REFERENCES "Arrondissement"("code") ON DELETE SET NULL ON UPDATE CASCADE;

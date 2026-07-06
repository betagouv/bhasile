-- CreateTable
CREATE TABLE "Rmu" (
    "id" SERIAL NOT NULL,
    "departementNumero" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "deboutesSansMesureAdministrative" INTEGER,
    "misesEnDemeure" INTEGER,
    "referesEngages" INTEGER,
    "referesExecutes" INTEGER,

    CONSTRAINT "Rmu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rmu_departementNumero_date_key" ON "Rmu"("departementNumero", "date");

-- AddForeignKey
ALTER TABLE "Rmu" ADD CONSTRAINT "Rmu_departementNumero_fkey" FOREIGN KEY ("departementNumero") REFERENCES "Departement"("numero") ON DELETE RESTRICT ON UPDATE CASCADE;

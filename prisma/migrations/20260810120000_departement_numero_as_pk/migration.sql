-- CpomDepartement : departementId -> departementNumero
ALTER TABLE "public"."CpomDepartement" ADD COLUMN "departementNumero" TEXT;

UPDATE "public"."CpomDepartement" cd
SET "departementNumero" = d."numero"
FROM "public"."Departement" d
WHERE d."id" = cd."departementId";

ALTER TABLE "public"."CpomDepartement" ALTER COLUMN "departementNumero" SET NOT NULL;
ALTER TABLE "public"."CpomDepartement" DROP CONSTRAINT "CpomDepartement_departementId_fkey";
ALTER TABLE "public"."CpomDepartement" DROP CONSTRAINT "CpomDepartement_pkey";
DROP INDEX "public"."CpomDepartement_departementId_idx";
ALTER TABLE "public"."CpomDepartement" DROP COLUMN "departementId";
ALTER TABLE "public"."CpomDepartement" ADD CONSTRAINT "CpomDepartement_pkey" PRIMARY KEY ("cpomId", "departementNumero");
CREATE INDEX "CpomDepartement_departementNumero_idx" ON "public"."CpomDepartement"("departementNumero");

-- RoleDepartement : departementId -> departementNumero
ALTER TABLE "public"."RoleDepartement" ADD COLUMN "departementNumero" TEXT;

UPDATE "public"."RoleDepartement" rd
SET "departementNumero" = d."numero"
FROM "public"."Departement" d
WHERE d."id" = rd."departementId";

ALTER TABLE "public"."RoleDepartement" ALTER COLUMN "departementNumero" SET NOT NULL;
ALTER TABLE "public"."RoleDepartement" DROP CONSTRAINT "RoleDepartement_departementId_fkey";
ALTER TABLE "public"."RoleDepartement" DROP CONSTRAINT "RoleDepartement_pkey";
ALTER TABLE "public"."RoleDepartement" DROP COLUMN "departementId";
ALTER TABLE "public"."RoleDepartement" ADD CONSTRAINT "RoleDepartement_pkey" PRIMARY KEY ("departementNumero", "roleId");

ALTER TABLE "public"."Structure" DROP CONSTRAINT "Structure_departementAdministratif_fkey";
ALTER TABLE "public"."StructureVersion" DROP CONSTRAINT "StructureVersion_departementAdministratif_fkey";
ALTER TABLE "public"."Dna" DROP CONSTRAINT "Dna_departementAdministratif_fkey";
ALTER TABLE "public"."Rmu" DROP CONSTRAINT "Rmu_departementNumero_fkey";

ALTER TABLE "public"."Departement" DROP CONSTRAINT "Departement_pkey";
DROP INDEX "public"."Departement_numero_key";
ALTER TABLE "public"."Departement" DROP COLUMN "id";
ALTER TABLE "public"."Departement" ADD CONSTRAINT "Departement_pkey" PRIMARY KEY ("numero");

ALTER TABLE "public"."CpomDepartement" ADD CONSTRAINT "CpomDepartement_departementNumero_fkey" FOREIGN KEY ("departementNumero") REFERENCES "public"."Departement"("numero") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."RoleDepartement" ADD CONSTRAINT "RoleDepartement_departementNumero_fkey" FOREIGN KEY ("departementNumero") REFERENCES "public"."Departement"("numero") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Structure" ADD CONSTRAINT "Structure_departementAdministratif_fkey" FOREIGN KEY ("departementAdministratif") REFERENCES "public"."Departement"("numero") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."StructureVersion" ADD CONSTRAINT "StructureVersion_departementAdministratif_fkey" FOREIGN KEY ("departementAdministratif") REFERENCES "public"."Departement"("numero") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Dna" ADD CONSTRAINT "Dna_departementAdministratif_fkey" FOREIGN KEY ("departementAdministratif") REFERENCES "public"."Departement"("numero") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."Rmu" ADD CONSTRAINT "Rmu_departementNumero_fkey" FOREIGN KEY ("departementNumero") REFERENCES "public"."Departement"("numero") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "ActeAdministratif" DROP CONSTRAINT "ActeAdministratif_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "Activite" DROP CONSTRAINT "Activite_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "Adresse" DROP CONSTRAINT "Adresse_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "Campaign" DROP CONSTRAINT "Campaign_structureCodeDna_fkey";

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "Controle" DROP CONSTRAINT "Controle_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "DocumentFinancier" DROP CONSTRAINT "DocumentFinancier_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "EvenementIndesirableGrave" DROP CONSTRAINT "EvenementIndesirableGrave_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "Form" DROP CONSTRAINT "Form_structureCodeDna_fkey";

-- DropForeignKey
ALTER TABLE "StructureMillesime" DROP CONSTRAINT "StructureMillesime_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "StructureTypologie" DROP CONSTRAINT "StructureTypologie_structureDnaCode_fkey";

-- AlterTable
ALTER TABLE "Activite" ADD COLUMN     "structureId" INTEGER,
ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Adresse" ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Antenne" ADD COLUMN     "adresse" TEXT;

-- AlterTable
ALTER TABLE "Budget" ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Campaign" ALTER COLUMN "structureCodeDna" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Contact" ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Controle" ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Evaluation" ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EvenementIndesirableGrave" ADD COLUMN     "structureId" INTEGER,
ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Form" ALTER COLUMN "structureCodeDna" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StructureMillesime" ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StructureTypologie" ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Controle" ADD CONSTRAINT "Controle_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvenementIndesirableGrave" ADD CONSTRAINT "EvenementIndesirableGrave_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adresse" ADD CONSTRAINT "Adresse_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureMillesime" ADD CONSTRAINT "StructureMillesime_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureTypologie" ADD CONSTRAINT "StructureTypologie_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activite" ADD CONSTRAINT "Activite_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActeAdministratif" ADD CONSTRAINT "ActeAdministratif_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFinancier" ADD CONSTRAINT "DocumentFinancier_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

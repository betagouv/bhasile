// One-off script: move file uploads from the old tables to the new ones.
// Usage: yarn one-off 20260220-move-fileuploads

// IMPORTANT: remains to be checked:
// - year for DocumentFinancier
// - granularity for DocumentFinancier

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import {
  DocumentFinancierCategory,
  DocumentFinancierGranularity,
} from "@/types/document-financier.type";
import { getYearFromDate } from "@/app/utils/date.util";
import { FileUploadCategory } from "@/generated/prisma/client";

const prisma = createPrismaClient();

const ACTE_ADMINISTRATIF_CATEGORIES = new Set(ActeAdministratifCategory);
const DOCUMENT_FINANCIER_CATEGORIES = new Set(DocumentFinancierCategory);
const OTHER_CATEGORIES = new Set(["EVALUATION", "INSPECTION_CONTROLE"]);

/** Map old FileUpload.id -> new ActeAdministratif.id for parent resolution */
const fileUploadIdToActeId = new Map<number, number>();

/** Map structureDnaCode -> structureId (chargé une fois au début) */
let dnaCodeToStructureId: Map<string, number>;

const migrate = async () => {
  console.log("📥 Récupération des structures (dnaCode → id)...");
  const structures = await prisma.structure.findMany({
    select: { id: true, dnaCode: true },
  });
  dnaCodeToStructureId = new Map(structures.map((s) => [s.dnaCode, s.id]));
  console.log(`✓ ${dnaCodeToStructureId.size} structures chargées`);

  console.log("📥 Récupération des FileUpload...");
  const fileUploads = await prisma.fileUpload.findMany();

  // Parents only first, avenants after
  const filesToMigrate = fileUploads
    .filter(
      (fileUpload) =>
        fileUpload.acteAdministratifId == null &&
        fileUpload.documentFinancierId == null
    )
    .sort((a, b) => {
      const aRoot = a.parentFileUploadId == null ? 0 : 1;
      const bRoot = b.parentFileUploadId == null ? 0 : 1;
      return aRoot - bRoot || a.id - b.id;
    });

  const filesSkipped = fileUploads.filter(
    (fileUpload) =>
      fileUpload.acteAdministratifId != null ||
      fileUpload.documentFinancierId != null
  ).length;
  console.log(
    `✓ ${filesToMigrate.length} FileUpload à migrer (${filesSkipped} déjà migrés)`
  );

  if (filesToMigrate.length === 0) {
    console.log("Tous les fichiers ont déjà été migrés.");
    return;
  }

  let acteCount = 0;
  let otherCount = 0;
  let docCount = 0;
  let errors = 0;
  let filesThatShouldBeDeleted = 0;

  for (const fileToMigrate of filesToMigrate) {
    try {
      const category = fileToMigrate.category as string;
      const parentId = fileToMigrate.parentFileUploadId
        ? fileUploadIdToActeId.get(fileToMigrate.parentFileUploadId)
        : null;
      const isLinkedToSomething =
        fileToMigrate.acteAdministratifId != null ||
        fileToMigrate.documentFinancierId != null ||
        fileToMigrate.parentFileUploadId != null ||
        fileToMigrate.controleId != null ||
        fileToMigrate.evaluationId != null ||
        fileToMigrate.structureDnaCode != null ||
        fileToMigrate.cpomId != null;

      if (!category) {
        console.warn(
          `❌ FileUpload id=${fileToMigrate.id}: catégorie non définie`
        );
        errors++;
        continue;
      }

      // Allez on en profite pour faire le ménage - Finalement non
      if (!isLinkedToSomething) {
        // try {
        //   await deleteFileAndRecord(S3_BUCKET_NAME, fileToMigrate.key);
        // } catch (error) {
        //   console.warn(
        //     `⚠️ FileUpload id=${fileToMigrate.id} (key=${fileToMigrate.key}): suppression échouée:`,
        //     error
        //   );
        //   errors++;
        //   continue;
        // }

        filesThatShouldBeDeleted++;
        continue;
      }

      if (OTHER_CATEGORIES.has(category as FileUploadCategory)) {
        otherCount++;
        continue;
      } else if (
        ACTE_ADMINISTRATIF_CATEGORIES.has(
          category as ActeAdministratifCategory
        ) ||
        category == "CPOM"
      ) {
        const categoryModified =
          category == "CPOM" && fileToMigrate.cpomId
            ? "CONVENTION"
            : (category as ActeAdministratifCategory);
        const structureId = dnaCodeToStructureId.get(
          fileToMigrate.structureDnaCode!
        );
        const acte = await prisma.acteAdministratif.create({
          data: {
            structureId,
            cpomId: fileToMigrate.cpomId ?? undefined,
            category: categoryModified,
            date: fileToMigrate.date ?? undefined,
            startDate: fileToMigrate.startDate ?? undefined,
            endDate: fileToMigrate.endDate ?? undefined,
            name: fileToMigrate.categoryName ?? undefined,
            parentId: parentId ?? undefined,
          },
        });
        await prisma.fileUpload.update({
          where: { id: fileToMigrate.id },
          data: {
            acteAdministratifId: acte.id,
          },
        });
        fileUploadIdToActeId.set(fileToMigrate.id, acte.id);
        acteCount++;
      } else if (
        DOCUMENT_FINANCIER_CATEGORIES.has(category as DocumentFinancierCategory)
      ) {
        const year = getYearFromDate(fileToMigrate.date ?? undefined);
        const structureId = dnaCodeToStructureId.get(
          fileToMigrate.structureDnaCode!
        );
        const doc = await prisma.documentFinancier.create({
          data: {
            structureId,
            category: category as DocumentFinancierCategory,
            year,
            name: fileToMigrate.categoryName ?? undefined,
            granularity:
              fileToMigrate.granularity as DocumentFinancierGranularity, // Do we want to keep it this way or have other relations to other tables?
          },
        });
        await prisma.fileUpload.update({
          where: { id: fileToMigrate.id },
          data: {
            documentFinancierId: doc.id,
          },
        });
        docCount++;
      } else {
        console.warn(
          `❌ FileUpload id=${fileToMigrate.id}: catégorie non reconnue: ${category}`
        );
        errors++;
      }
    } catch (err) {
      errors++;
      console.error(`❌ FileUpload id=${fileToMigrate.id}:`, err);
    }
  }

  console.log(`✓ ActeAdministratif créés : ${acteCount}`);
  console.log(`✓ DocumentFinancier créés : ${docCount}`);
  console.log(`✓ Fichiers à supprimer : ${filesThatShouldBeDeleted}`);
  console.log(
    `✓ Autres catégories (inspections et évaluations) : ${otherCount}`
  );
  if (errors > 0) console.log(`❌ Erreurs: ${errors}`);
};

migrate()
  .then(() => {
    console.log("Terminé.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

// Orchestrateur : lit un fichier OFII, actualise d'abord le référentiel puis remplit l'activité
// Usage: yarn script ofii-referential-and-activity <chemin_ou_clef_s3_du_xlsx>

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

import { fillOfiiActiviteFromRows } from "../utils/ofii-fill-activity";
import { fillOfiiStructureFromRows } from "../utils/ofii-fill-referential";
import { loadOfiiFile } from "../utils/ofii-xlsx";
import { loadXlsxBufferFromS3 } from "../utils/xlsx-loader";

const args = process.argv.slice(2);
const xlsxLocation = args[0];

if (!xlsxLocation) {
  throw new Error("Merci de fournir la clef S3 du fichier XLSX en argument.");
}

const prisma = createPrismaClient();

async function main() {
  try {
    const bucketName = process.env.DOCS_BUCKET_NAME;
    if (!bucketName) {
      throw new Error(
        "DOCS_BUCKET_NAME doit être défini pour charger le fichier XLSX depuis S3."
      );
    }

    const { buffer, fileName } = await loadXlsxBufferFromS3(
      bucketName,
      xlsxLocation
    );

    console.log(
      "📥 Extraction des données OFII (référentiel + activité) depuis le XLSX..."
    );
    const { date, rows } = loadOfiiFile(buffer, fileName);
    console.log(`✓ ${rows.length} lignes trouvées dans l'onglet sélectionné`);

    console.log("1️⃣ Mise à jour du référentiel (structures)...");
    await fillOfiiStructureFromRows(prisma, date, rows);

    console.log("2️⃣ Mise à jour de l'activité OFII.");
    console.log(
      `- (Onglet d'activité traité: ${date.toISOString().slice(0, 7)}, ${rows.length} lignes)`
    );

    await fillOfiiActiviteFromRows(prisma, date, rows);

    console.log("✅ Référentiel et activité OFII mis à jour avec succès.");
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution du script OFII", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

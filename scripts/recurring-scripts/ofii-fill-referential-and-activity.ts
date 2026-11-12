// Secours du cockpit admin (Import OFII) : même traitement, depuis un fichier sur S3
// Usage: yarn script ofii-fill-referential-and-activity <clef_s3_du_xlsx>

import "dotenv/config";

import {
  applyOfiiImport,
  previewOfiiImport,
} from "@/app/api/ofii-imports/ofii-import.service";
import prisma from "@/lib/prisma";

import { loadXlsxBufferFromS3 } from "../utils/xlsx-loader";

const xlsxLocation = process.argv[2];

if (!xlsxLocation) {
  throw new Error("Merci de fournir la clef S3 du fichier XLSX en argument.");
}

async function main() {
  try {
    const bucketName = process.env.DOCS_BUCKET_NAME;
    if (!bucketName) {
      throw new Error(
        "DOCS_BUCKET_NAME doit être défini pour charger le fichier XLSX depuis S3."
      );
    }

    const file = await loadXlsxBufferFromS3(bucketName, xlsxLocation);
    const { errors } = await previewOfiiImport(file);
    if (errors.length > 0) {
      errors.forEach(({ key, issues }) =>
        console.error(`- ${key} : ${issues.join(", ")}`)
      );
      throw new Error(
        `${errors.length} ligne(s) en erreur, rien n'a été écrit`
      );
    }

    const { summary } = await applyOfiiImport(file);
    console.log(`✅ ${summary}`);
  } catch (error) {
    console.error("❌ Erreur lors de l'import OFII", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

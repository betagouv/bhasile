// Secours du cockpit admin (Import OFII) : même traitement, depuis un fichier sur S3
// Usage: yarn script ofii-fill-referential-and-activity <clef_s3_du_xlsx> [AAAA-MM]

import "dotenv/config";

import { applyOfiiImport } from "@/app/api/ofii-imports/ofii-import.service";
import prisma from "@/lib/prisma";
import { importMonthSchema } from "@/schemas/api/import.schema";
import { ImportRejectedError } from "@/utils-server/import.server.util";

import { loadXlsxBufferFromS3 } from "../utils/xlsx-loader";

const [xlsxLocation, month] = process.argv.slice(2);

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

    const file = {
      ...(await loadXlsxBufferFromS3(bucketName, xlsxLocation)),
      month: importMonthSchema.parse(month ?? null),
    };
    const { summary } = await applyOfiiImport(file);
    console.log(`✅ ${summary}`);
  } catch (error) {
    if (error instanceof ImportRejectedError) {
      error.errors.forEach(({ key, issues }) =>
        console.error(`- ${key} : ${issues.join(", ")}`)
      );
    }
    console.error("❌ Erreur lors de l'import OFII", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

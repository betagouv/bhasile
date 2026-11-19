import { parse } from "csv-parse/sync";

import { checkBucket, getObject } from "@/lib/minio";

export const loadCsvFromS3 = async <T extends Record<string, string>>(
  bucketName: string,
  csvFilename: string
): Promise<T[]> => {
  console.log("Vérification du bucket...");
  await checkBucket(bucketName);

  console.log("Récupération du fichier CSV...");
  const stream = await getObject(bucketName, csvFilename);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const csvContent = Buffer.concat(chunks).toString("utf-8");

  console.log("Parsing du CSV...");
  const records = parse<T>(csvContent, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`${records.length} lignes trouvées`);

  if (records.length === 0) {
    console.log("⚠️ Aucune donnée à insérer");
    return [];
  }

  return records;
};

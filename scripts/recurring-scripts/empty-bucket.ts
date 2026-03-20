// Vider le bucket S3 de dev
// Usage: yarn script empty-bucket BUCKET_NAME

import "dotenv/config";

import { Client } from "minio";

export const minioClient = new Client({
  endPoint: process.env.S3_URL!,
  accessKey: process.env.S3_ACCESS!,
  secretKey: process.env.S3_SECRET!,
  useSSL: true,
});

const emptyBucket = async (bucketName: string | undefined): Promise<void> => {
  if (!bucketName) {
    console.log("Merci de préciser un nom de bucket S3");
    return;
  }

  if (bucketName.includes("prod")) {
    console.log("😱 Pas de suppression possible du bucket de prod");
    return;
  }
  try {
    const allFiles = [];
    const stream = minioClient.listObjects(bucketName, "", true);

    for await (const file of stream) {
      allFiles.push(file.name);
      console.log(`${file.name} trouvé`);
    }

    if (allFiles.length === 0) {
      console.log("Le bucket est déjà vide.");
      return;
    }

    await minioClient.removeObjects(bucketName, allFiles);
    console.log(`${allFiles.length} objets ont été supprimés avec succès.`);
  } catch (error) {
    console.error(
      "Erreur lors de la suppression des fichiers du bucket :",
      error
    );
  }
};

const args = process.argv.slice(2);
const bucketName = args[0];

emptyBucket(bucketName);

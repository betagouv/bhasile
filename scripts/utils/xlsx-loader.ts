import { checkBucket, getObject } from "@/lib/minio";

export const loadXlsxBufferFromS3 = async (
  bucketName: string,
  objectName: string
): Promise<{ buffer: Buffer; fileName: string }> => {
  console.log(
    `📦 Chargement du fichier XLSX depuis S3: bucket=${bucketName}, key=${objectName}`
  );
  await checkBucket(bucketName);
  const stream = await getObject(bucketName, objectName);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  const buffer = Buffer.concat(chunks);
  const fileName = objectName.split("/").pop() ?? objectName;
  return { buffer, fileName };
};


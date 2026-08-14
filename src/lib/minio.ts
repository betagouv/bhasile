import { Client } from "minio";

let client: Client | null = null;

export const getMinioClient = (): Client => {
  if (client === null) {
    client = new Client({
      endPoint: process.env.S3_URL!,
      accessKey: process.env.S3_ACCESS!,
      secretKey: process.env.S3_SECRET!,
      useSSL: process.env.S3_USE_SSL !== "0",
      port: process.env.S3_PORT ? Number(process.env.S3_PORT) : undefined,
    });
  }

  return client;
};

export const checkBucket = async (bucketName: string): Promise<void> => {
  const exists = await getMinioClient().bucketExists(bucketName);
  if (!exists) {
    await getMinioClient().makeBucket(bucketName);
  }
};

export const getObject = async (bucketName: string, objectName: string) => {
  return getMinioClient().getObject(bucketName, objectName);
};

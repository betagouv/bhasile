import { Client } from "minio";

export const minioClient = new Client({
  endPoint: process.env.S3_URL!,
  accessKey: process.env.S3_ACCESS!,
  secretKey: process.env.S3_SECRET!,
  useSSL: process.env.S3_USE_SSL !== "0",
  port: process.env.S3_PORT ? Number(process.env.S3_PORT) : undefined,
});

export const checkBucket = async (bucketName: string): Promise<void> => {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName);
  }
};

export const getObject = async (bucketName: string, objectName: string) => {
  return minioClient.getObject(bucketName, objectName);
};

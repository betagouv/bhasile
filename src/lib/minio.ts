import { type BucketItemStat, Client } from "minio";
import { Readable } from "stream";

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

export const listS3Objects = async (bucketName: string): Promise<string[]> => {
  const currentClient = getMinioClient();
  const objectStream = currentClient.listObjectsV2(bucketName, "", true);
  const objectKeys: string[] = [];

  for await (const item of objectStream) {
    if (item.name) {
      objectKeys.push(item.name);
    }
  }

  return objectKeys;
};

const readStreamToString = async (stream: Readable): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
};

export const readS3File = async (
  objectKey: string,
  bucketName: string
): Promise<string> => {
  const stream = await getObject(bucketName, objectKey);
  return readStreamToString(stream);
};

export const statS3Object = async (
  objectKey: string,
  bucketName: string
): Promise<BucketItemStat> => {
  const currentClient = getMinioClient();
  return currentClient.statObject(bucketName, objectKey);
};

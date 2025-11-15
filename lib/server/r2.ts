import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const cachedClient: {
  instance: S3Client | null;
} = {
  instance: null
};

const getEndpoint = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) {
    throw new Error("Missing R2_ACCOUNT_ID");
  }
  return `https://${accountId}.r2.cloudflarestorage.com`;
};

const getBucket = () => {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    throw new Error("Missing R2_BUCKET");
  }
  return bucket;
};

const getCredentials = () => {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2 credentials");
  }
  return {
    accessKeyId,
    secretAccessKey
  };
};

export const getR2Client = () => {
  if (cachedClient.instance) {
    return cachedClient.instance;
  }
  cachedClient.instance = new S3Client({
    region: "auto",
    endpoint: getEndpoint(),
    forcePathStyle: true,
    credentials: getCredentials()
  });
  return cachedClient.instance;
};

export const getR2Bucket = getBucket;

export const getPublicUrlForKey = (key: string) => {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) {
    throw new Error("Missing R2_PUBLIC_BASE_URL");
  }
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${normalizedBase}/${key}`;
};

export const createPresignedUploadUrl = async (
  key: string,
  contentType: string,
  expiresIn = 300
) => {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
    ContentType: contentType
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  return uploadUrl;
};

export const deleteR2Objects = async (keys: string[]) => {
  if (!keys.length) {
    return;
  }

  const client = getR2Client();
  const bucket = getR2Bucket();
  const batches: string[][] = [];

  for (let i = 0; i < keys.length; i += 1000) {
    batches.push(keys.slice(i, i + 1000));
  }

  await Promise.all(
    batches.map(async (batch) => {
      const command = new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: batch.map((Key) => ({ Key }))
        }
      });
      await client.send(command);
    })
  );
};



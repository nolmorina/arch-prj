import { randomUUID } from "crypto";
import { Types } from "mongoose";

import { MediaAssetModel } from "@/lib/models/mediaAsset";
import { ProjectModel } from "@/lib/models/project";

import {
  createPresignedUploadUrl,
  deleteR2Objects,
  getPublicUrlForKey
} from "./r2";

const IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif"
]);

const CONTENT_TYPE_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif"
};

const MEDIA_KIND = ["hero", "gallery"] as const;
export type MediaKind = (typeof MEDIA_KIND)[number];

const sanitizeProjectId = (projectId: string) => {
  if (!Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }
  return new Types.ObjectId(projectId);
};

const getExtension = (contentType: string, fileName?: string) => {
  if (CONTENT_TYPE_EXTENSION[contentType]) {
    return CONTENT_TYPE_EXTENSION[contentType];
  }
  if (fileName?.includes(".")) {
    return fileName.split(".").pop()?.toLowerCase() ?? "bin";
  }
  return "bin";
};

const sanitizeSegment = (value: string, maxLength = 60) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, maxLength);

const buildStorageKey = (
  projectId: string,
  projectSlug: string | undefined,
  kind: MediaKind,
  extension: string
) => {
  const slugSegment = projectSlug ? sanitizeSegment(projectSlug, 80) : "unassigned";
  return `projects/${projectId}/${slugSegment}/${kind}/${randomUUID()}.${extension}`;
};

export const createUploadRequest = async ({
  projectId,
  projectSlug,
  contentType,
  fileName,
  kind
}: {
  projectId: string;
  projectSlug?: string;
  contentType: string;
  fileName?: string;
  kind: MediaKind;
}) => {
  if (!MEDIA_KIND.includes(kind)) {
    throw new Error("Unsupported media kind");
  }
  if (!IMAGE_CONTENT_TYPES.has(contentType)) {
    throw new Error("Unsupported content type");
  }

  const key = buildStorageKey(
    projectId,
    projectSlug,
    kind,
    getExtension(contentType, fileName)
  );
  const uploadUrl = await createPresignedUploadUrl(key, contentType);
  const publicUrl = getPublicUrlForKey(key);
  return {
    key,
    uploadUrl,
    publicUrl
  };
};

export const registerUploadedAsset = async ({
  projectId,
  key,
  publicUrl,
  kind,
  width,
  height,
  fileSize,
  contentType
}: {
  projectId: string;
  key: string;
  publicUrl: string;
  kind: MediaKind;
  width: number;
  height: number;
  fileSize?: number;
  contentType: string;
}) => {
  if (!MEDIA_KIND.includes(kind)) {
    throw new Error("Unsupported media kind");
  }
  if (!IMAGE_CONTENT_TYPES.has(contentType)) {
    throw new Error("Unsupported content type");
  }

  const doc = await MediaAssetModel.findOneAndUpdate(
    { storageKey: key },
    {
      storageKey: key,
      publicUrl,
      kind,
      width,
      height,
      format: getExtension(contentType, key),
      fileSizeBytes: fileSize ?? 0,
      projectId: sanitizeProjectId(projectId),
      deletedAt: null
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    assetId: doc._id.toString(),
    publicUrl: doc.publicUrl,
    storageKey: doc.storageKey,
    width: doc.width,
    height: doc.height
  };
};

export const deleteMediaAssetsByIds = async (assetIds: string[]) => {
  if (!assetIds.length) return;

  const objectIds = assetIds
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  if (!objectIds.length) return;

  const assets = await MediaAssetModel.find({
    _id: { $in: objectIds }
  }).lean();

  if (!assets.length) {
    return;
  }

  const deletable: { id: Types.ObjectId; storageKey: string }[] = [];

  for (const asset of assets) {
    if (!asset.storageKey) continue;
    const stillInUse = await ProjectModel.exists({
      $or: [
        { "hero.assetId": asset._id },
        { "gallery.assetId": asset._id }
      ]
    });
    if (!stillInUse) {
      deletable.push({
        id: asset._id as Types.ObjectId,
        storageKey: asset.storageKey
      });
    }
  }

  if (!deletable.length) {
    return;
  }

  await MediaAssetModel.deleteMany({
    _id: { $in: deletable.map((item) => item.id) }
  });

  await deleteR2Objects(deletable.map((item) => item.storageKey));
};

const ABSOLUTE_URL_REGEX = /^(https?:)?\/\//i;
const R2_URL_REGEX =
  /^https:\/\/[^/]*r2\.(?:dev|cloudflarestorage\.com)\/([^?]+)/i;

export const resolveMediaUrl = (value?: string | null) => {
  if (!value) {
    return "";
  }
  if (value.startsWith("/api/")) {
    return value;
  }
  if (ABSOLUTE_URL_REGEX.test(value)) {
    const match = value.match(R2_URL_REGEX);
    if (match?.[1]) {
      const key = decodeURIComponent(match[1]);
      return `/api/media?key=${encodeURIComponent(key)}`;
    }
    return value;
  }
  return `/api/media?key=${encodeURIComponent(value)}`;
};



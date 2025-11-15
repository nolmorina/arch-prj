import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType
} from "mongoose";

const focalPointSchema = new Schema(
  {
    x: { type: Number, min: 0, max: 1 },
    y: { type: Number, min: 0, max: 1 }
  },
  { _id: false }
);

const colorPaletteSchema = new Schema(
  {
    dominant: { type: String },
    muted: { type: String }
  },
  { _id: false }
);

const mediaAssetSchema = new Schema(
  {
    storageKey: { type: String, required: true, trim: true },
    publicUrl: { type: String, required: true, trim: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    kind: {
      type: String,
      enum: ["hero", "gallery", "document", "avatar"],
      required: true
    },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    format: { type: String, required: true },
    fileSizeBytes: { type: Number, default: 0 },
    checksum: { type: Buffer },
    focalPoint: { type: focalPointSchema },
    colorPalette: { type: colorPaletteSchema },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date }
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    collection: "mediaAssets"
  }
);

mediaAssetSchema.index(
  { storageKey: 1 },
  { unique: true, name: "uq_media_storageKey" }
);

mediaAssetSchema.index({ kind: 1 }, { name: "idx_media_kind" });
mediaAssetSchema.index({ createdAt: -1 }, { name: "idx_media_createdAt" });

type MediaAsset = InferSchemaType<typeof mediaAssetSchema>;
export type MediaAssetDocument = HydratedDocument<MediaAsset>;

export const MediaAssetModel =
  models.MediaAsset ??
  model<MediaAsset>("MediaAsset", mediaAssetSchema, "mediaAssets");



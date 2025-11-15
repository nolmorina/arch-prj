import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType
} from "mongoose";

const focalPointSchema = new Schema(
  {
    x: { type: Number },
    y: { type: Number }
  },
  { _id: false }
);

const heroSchema = new Schema(
  {
    assetId: { type: Schema.Types.ObjectId, ref: "MediaAsset" },
    src: { type: String, required: true },
    width: { type: Number },
    height: { type: Number },
    caption: { type: String, required: true },
    focalPoint: { type: focalPointSchema }
  },
  { _id: false }
);

const descriptionBlockSchema = new Schema(
  {
    body: { type: String, required: true },
    order: { type: Number, required: true }
  },
  { _id: false }
);

const metaItemSchema = new Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
    order: { type: Number, required: true }
  },
  { _id: false }
);

const serviceItemSchema = new Schema(
  {
    label: { type: String, required: true },
    order: { type: Number, required: true }
  },
  { _id: false }
);

const collaboratorItemSchema = new Schema(
  {
    label: { type: String, required: true },
    order: { type: Number, required: true }
  },
  { _id: false }
);

const galleryItemSchema = new Schema(
  {
    assetId: { type: Schema.Types.ObjectId, ref: "MediaAsset" },
    src: { type: String, required: true },
    caption: { type: String, required: true },
    order: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    focalPoint: { type: focalPointSchema }
  },
  { _id: false }
);

const seoSchema = new Schema(
  {
    metaTitle: { type: String },
    metaDescription: { type: String },
    ogImageAssetId: { type: Schema.Types.ObjectId, ref: "MediaAsset" }
  },
  { _id: false }
);

const publishedProjectSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    slug: { type: String, required: true },
    title: { type: String, required: true },
    categoryLabel: { type: String, required: true },
    location: { type: String, required: true },
    yearDisplay: { type: String, required: true },
    hero: { type: heroSchema, required: true },
    excerpt: { type: String, required: true },
    descriptionBlocks: { type: [descriptionBlockSchema], default: [] },
    meta: { type: [metaItemSchema], default: [] },
    services: { type: [serviceItemSchema], default: [] },
    collaborators: { type: [collaboratorItemSchema], default: [] },
    gallery: { type: [galleryItemSchema], default: [] },
    seo: { type: seoSchema },
    publishedAt: { type: Date, required: true },
    syncedAt: { type: Date, required: true }
  },
  { collection: "publishedProjects" }
);

publishedProjectSchema.index(
  { slug: 1 },
  { unique: true, name: "uq_publishedProjects_slug" }
);

publishedProjectSchema.index(
  { categoryLabel: 1 },
  { name: "idx_publishedProjects_category" }
);

publishedProjectSchema.index({ publishedAt: -1 });

export type PublishedProject = InferSchemaType<typeof publishedProjectSchema>;
export type PublishedProjectDocument = HydratedDocument<PublishedProject>;

export const PublishedProjectModel =
  models.PublishedProject ??
  model<PublishedProject>(
    "PublishedProject",
    publishedProjectSchema,
    "publishedProjects"
  );



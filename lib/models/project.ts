import {
  Schema,
  model,
  models,
  Types,
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
    src: { type: String, default: "" },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    caption: { type: String, default: "", maxlength: 140 },
    focalPoint: { type: focalPointSchema }
  },
  { _id: false }
);

const descriptionBlockSchema = new Schema(
  {
    body: { type: String, required: true, minlength: 80 },
    order: { type: Number, required: true }
  },
  { _id: true }
);

const metaItemSchema = new Schema(
  {
    label: { type: String, required: true, maxlength: 60 },
    value: { type: String, required: true, maxlength: 160 },
    order: { type: Number, required: true }
  },
  { _id: true }
);

const serviceItemSchema = new Schema(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: "Service" },
    label: { type: String, required: true, maxlength: 120 },
    order: { type: Number, required: true }
  },
  { _id: true }
);

const collaboratorItemSchema = new Schema(
  {
    collaboratorId: { type: Schema.Types.ObjectId, ref: "Collaborator" },
    label: { type: String, required: true, maxlength: 200 },
    order: { type: Number, required: true }
  },
  { _id: true }
);

const galleryItemSchema = new Schema(
  {
    assetId: { type: Schema.Types.ObjectId, ref: "MediaAsset" },
    src: { type: String, default: "" },
    caption: { type: String, default: "", maxlength: 240 },
    order: { type: Number, required: true },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    focalPoint: { type: focalPointSchema }
  },
  { _id: true }
);

const seoSchema = new Schema(
  {
    metaTitle: { type: String },
    metaDescription: { type: String },
    ogImageAssetId: { type: Schema.Types.ObjectId, ref: "MediaAsset" }
  },
  { _id: false }
);

const projectSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      maxlength: 60,
      match: /^[a-z0-9-]+$/,
      lowercase: true,
      trim: true
    },
    title: { type: String, required: true, maxlength: 120 },
    titleSort: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    categoryLabel: { type: String, required: true, maxlength: 80 },
    location: { type: String, required: true, maxlength: 160 },
    yearDisplay: {
      type: String,
      required: true,
      match: /^(19|20|21)\d{2}(-\d{2})?$/
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      required: true,
      default: "draft"
    },
    isFeatured: { type: Boolean, default: false },
    hero: { type: heroSchema, required: true },
    excerpt: { type: String, required: true, maxlength: 360 },
    descriptionBlocks: {
      type: [descriptionBlockSchema],
      validate: [(value: unknown[]) => value.length >= 2, "min 2 blocks"]
    },
    meta: {
      type: [metaItemSchema],
      validate: [(value: unknown[]) => value.length >= 3, "min 3 meta"]
    },
    services: {
      type: [serviceItemSchema],
      validate: [(value: unknown[]) => value.length >= 1, "min 1 service"]
    },
    collaborators: {
      type: [collaboratorItemSchema],
      validate: [(value: unknown[]) => value.length >= 1, "min 1 collaborator"]
    },
    gallery: {
      type: [galleryItemSchema],
      validate: [(value: unknown[]) => value.length <= 15, "gallery max 15"]
    },
    searchTokens: [{ type: String }],
    seo: { type: seoSchema },
    revision: { type: Number, default: 1, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User" },
    publishedAt: { type: Date },
    deletedAt: { type: Date }
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    collection: "projects"
  }
);

projectSchema.index(
  { slug: 1 },
  {
    unique: true,
    name: "uq_projects_slug",
    collation: { locale: "en", strength: 2 }
  }
);

projectSchema.index(
  { status: 1, updatedAt: -1 },
  { name: "idx_projects_status_updated" }
);

projectSchema.index(
  { categoryId: 1, status: 1 },
  { name: "idx_projects_category_status" }
);

projectSchema.index({ deletedAt: 1 }, { name: "idx_projects_deleted" });
projectSchema.index({ titleSort: 1 }, { name: "idx_projects_alpha" });
projectSchema.index(
  { title: "text", location: "text", excerpt: "text" },
  { name: "text_projects_search" }
);

projectSchema.pre("save", function setDefaults(next) {
  if (!this.titleSort && this.title) {
    this.titleSort = this.title.toLowerCase();
  }
  next();
});

export type Project = InferSchemaType<typeof projectSchema>;
export type ProjectDocument = HydratedDocument<Project>;

export const ProjectModel =
  models.Project ?? model<Project>("Project", projectSchema, "projects");

export const newObjectId = () => new Types.ObjectId();



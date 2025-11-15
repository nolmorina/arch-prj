import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType
} from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 80, trim: true },
    slug: {
      type: String,
      required: true,
      match: /^[a-z0-9-]{3,60}$/,
      lowercase: true,
      trim: true
    },
    description: { type: String },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: "categories" }
);

categorySchema.index(
  { slug: 1 },
  {
    unique: true,
    name: "uq_categories_slug",
    collation: { locale: "en", strength: 2 }
  }
);

categorySchema.index(
  { name: 1 },
  {
    unique: true,
    name: "uq_categories_name",
    collation: { locale: "en", strength: 2 }
  }
);

categorySchema.index({ sortOrder: 1 }, { name: "idx_categories_sort" });

type Category = InferSchemaType<typeof categorySchema>;
export type CategoryDocument = HydratedDocument<Category>;

export const CategoryModel =
  models.Category ?? model<Category>("Category", categorySchema, "categories");



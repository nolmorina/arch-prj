import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType
} from "mongoose";

const serviceSchema = new Schema(
  {
    label: { type: String, required: true, maxlength: 120, trim: true },
    slug: {
      type: String,
      required: true,
      match: /^[a-z0-9-]{3,80}$/,
      lowercase: true,
      trim: true
    },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: "services" }
);

serviceSchema.index(
  { slug: 1 },
  {
    unique: true,
    name: "uq_services_slug",
    collation: { locale: "en", strength: 2 }
  }
);

serviceSchema.index(
  { label: 1 },
  {
    unique: true,
    name: "uq_services_label",
    collation: { locale: "en", strength: 2 }
  }
);

type Service = InferSchemaType<typeof serviceSchema>;
export type ServiceDocument = HydratedDocument<Service>;

export const ServiceModel =
  models.Service ?? model<Service>("Service", serviceSchema, "services");



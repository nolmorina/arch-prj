import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType
} from "mongoose";

const collaboratorSchema = new Schema(
  {
    displayName: { type: String, required: true, maxlength: 160, trim: true },
    organization: { type: String, maxlength: 160 },
    roleDefault: { type: String, maxlength: 120 },
    website: { type: String },
    email: { type: String, match: /^[^@\s]+@[^@\s]+$/ },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    collection: "collaborators"
  }
);

collaboratorSchema.index(
  { displayName: 1, organization: 1 },
  {
    unique: true,
    sparse: true,
    name: "idx_collaborators_name_org",
    collation: { locale: "en", strength: 2 }
  }
);

type Collaborator = InferSchemaType<typeof collaboratorSchema>;
export type CollaboratorDocument = HydratedDocument<Collaborator>;

export const CollaboratorModel =
  models.Collaborator ??
  model<Collaborator>("Collaborator", collaboratorSchema, "collaborators");



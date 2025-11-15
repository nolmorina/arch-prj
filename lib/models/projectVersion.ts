import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType
} from "mongoose";

const projectVersionSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
    version: { type: Number, required: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      required: true
    },
    source: {
      type: String,
      enum: ["manual-save", "publish", "unpublish"],
      required: true
    },
    payload: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    published: { type: Boolean, default: false }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "projectVersions"
  }
);

projectVersionSchema.index(
  { projectId: 1, version: -1 },
  { unique: true, name: "uq_projectVersions_project_version" }
);

projectVersionSchema.index(
  { projectId: 1, source: 1 },
  { name: "idx_projectVersions_project_source" }
);

type ProjectVersion = InferSchemaType<typeof projectVersionSchema>;
export type ProjectVersionDocument = HydratedDocument<ProjectVersion>;

export const ProjectVersionModel =
  models.ProjectVersion ??
  model<ProjectVersion>("ProjectVersion", projectVersionSchema, "projectVersions");



import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType
} from "mongoose";

const projectHistorySchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    action: {
      type: String,
      enum: ["created", "duplicated", "saved", "published", "deleted"],
      required: true
    },
    fromStatus: { type: String, enum: ["draft", "published", "archived"] },
    toStatus: { type: String, enum: ["draft", "published", "archived"] },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    snapshotVersion: { type: Number },
    summary: { type: String }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "projectHistory"
  }
);

projectHistorySchema.index(
  { projectId: 1, createdAt: -1 },
  { name: "idx_projectHistory_project" }
);

type ProjectHistory = InferSchemaType<typeof projectHistorySchema>;
export type ProjectHistoryDocument = HydratedDocument<ProjectHistory>;

export const ProjectHistoryModel =
  models.ProjectHistory ??
  model<ProjectHistory>("ProjectHistory", projectHistorySchema, "projectHistory");



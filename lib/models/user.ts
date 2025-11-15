import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType
} from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[^@\s]+@[^@\s]+$/,
      maxlength: 320
    },
    fullName: { type: String, required: true, maxlength: 160 },
    role: {
      type: String,
      enum: ["admin", "editor", "viewer"],
      default: "editor",
      required: true
    },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active"
    },
    avatarAssetId: { type: Schema.Types.ObjectId, ref: "MediaAsset" },
    lastLoginAt: { type: Date }
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: "users" }
);

userSchema.index(
  { email: 1 },
  {
    unique: true,
    name: "uq_users_email",
    collation: { locale: "en", strength: 2 }
  }
);

userSchema.index({ role: 1 }, { name: "idx_users_role" });

type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User>;

export const UserModel =
  models.User ?? model<User>("User", userSchema, "users");



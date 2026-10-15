import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISuppression extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  reason: "bounce" | "complaint" | "manual";
  detail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SuppressionSchema = new Schema<ISuppression>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    reason: {
      type: String,
      enum: ["bounce", "complaint", "manual"],
      default: "bounce",
      required: true,
    },
    detail: { type: String },
  },
  { timestamps: true }
);

SuppressionSchema.index({ userId: 1, email: 1 }, { unique: true });

const Suppression: Model<ISuppression> =
  mongoose.models.Suppression ?? mongoose.model<ISuppression>("Suppression", SuppressionSchema);

export default Suppression;

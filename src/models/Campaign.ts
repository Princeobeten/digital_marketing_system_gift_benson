import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const metricsSchema = new Schema(
  {
    recipients: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
  },
  { _id: false }
);

const campaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    channel: {
      type: String,
      enum: ["email", "sms", "social"],
      default: "email",
    },
    subject: { type: String, default: "" },
    body: { type: String, default: "" },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    segment: { type: Schema.Types.ObjectId, ref: "Segment", default: null },
    scheduledAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent"],
      default: "draft",
    },
    metrics: { type: metricsSchema, default: () => ({}) },
    sentAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export type CampaignDoc = InferSchemaType<typeof campaignSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Campaign = models.Campaign || model("Campaign", campaignSchema);
export default Campaign;

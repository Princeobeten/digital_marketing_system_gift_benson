import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * One delivery record per customer per campaign send. Generated when a campaign
 * is "sent" — this is the engagement/communication log the analytics roll up.
 */
const messageSchema = new Schema(
  {
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    channel: {
      type: String,
      enum: ["email", "sms", "social"],
      default: "email",
    },
    status: {
      type: String,
      enum: ["delivered", "opened", "clicked"],
      default: "delivered",
    },
    sentAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

messageSchema.index({ campaign: 1 });

export type MessageDoc = InferSchemaType<typeof messageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Message = models.Message || model("Message", messageSchema);
export default Message;

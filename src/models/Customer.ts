import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    /** Gadget categories this customer is interested in (used for segmentation). */
    interests: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    /** Lifetime spend in Naira. */
    totalSpend: { type: Number, default: 0, min: 0 },
    lastPurchaseAt: { type: Date, default: null },
    source: { type: String, default: "Walk-in" },
  },
  { timestamps: true }
);

customerSchema.index({ email: 1 });

export type CustomerDoc = InferSchemaType<typeof customerSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Customer = models.Customer || model("Customer", customerSchema);
export default Customer;

import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

/** A single targeting rule, e.g. { field: "interests", operator: "contains", value: "Smartphones" } */
const ruleSchema = new Schema(
  {
    field: { type: String, required: true },
    operator: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const segmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    /** All rules are combined with AND. */
    rules: { type: [ruleSchema], default: [] },
  },
  { timestamps: true }
);

export type SegmentDoc = InferSchemaType<typeof segmentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Segment = models.Segment || model("Segment", segmentSchema);
export default Segment;

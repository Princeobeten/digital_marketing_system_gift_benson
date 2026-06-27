import { NextRequest } from "next/server";
import { Campaign } from "@/models/Campaign";
import { Segment } from "@/models/Segment";
import { Product } from "@/models/Product";
import { Message } from "@/models/Message";
import { Customer } from "@/models/Customer";
import { requireAuth, json, error, handleError } from "@/lib/api";
import { campaignSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const { id } = await params;
    void Segment;
    void Product;
    void Customer;
    const campaign = await Campaign.findById(id)
      .populate("segment", "name rules")
      .populate("products", "name price category")
      .lean();
    if (!campaign) return error("Campaign not found", 404);

    const messages = await Message.find({ campaign: id })
      .populate("customer", "name email")
      .sort({ sentAt: -1 })
      .limit(50)
      .lean();

    return json({ campaign, messages });
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const { id } = await params;
    const data = campaignSchema.parse(await req.json());
    const campaign = await Campaign.findByIdAndUpdate(
      id,
      {
        ...data,
        segment: data.segment || null,
        scheduledAt: data.scheduledAt || null,
      },
      { new: true }
    );
    if (!campaign) return error("Campaign not found", 404);
    return json({ campaign });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const { id } = await params;
    const campaign = await Campaign.findByIdAndDelete(id);
    if (!campaign) return error("Campaign not found", 404);
    await Message.deleteMany({ campaign: id });
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}

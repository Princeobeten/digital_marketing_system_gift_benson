import { NextRequest } from "next/server";
import { Campaign } from "@/models/Campaign";
import { Segment } from "@/models/Segment";
import { Product } from "@/models/Product";
import { requireAuth, json, handleError } from "@/lib/api";
import { campaignSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    // Ensure referenced models are registered for populate().
    void Segment;
    void Product;
    const campaigns = await Campaign.find()
      .populate("segment", "name")
      .sort({ createdAt: -1 })
      .lean();
    return json({ campaigns });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const data = campaignSchema.parse(await req.json());
    const campaign = await Campaign.create({
      ...data,
      segment: data.segment || null,
      scheduledAt: data.scheduledAt || null,
      status: data.scheduledAt ? "scheduled" : "draft",
      createdBy: auth.session.sub,
    });
    return json({ campaign }, 201);
  } catch (err) {
    return handleError(err);
  }
}

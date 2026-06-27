import { NextRequest } from "next/server";
import { Segment } from "@/models/Segment";
import { requireAuth, json, error, handleError } from "@/lib/api";
import { segmentSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const { id } = await params;
    const data = segmentSchema.parse(await req.json());
    const segment = await Segment.findByIdAndUpdate(id, data, { new: true });
    if (!segment) return error("Segment not found", 404);
    return json({ segment });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const { id } = await params;
    const segment = await Segment.findByIdAndDelete(id);
    if (!segment) return error("Segment not found", 404);
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}

import { NextRequest } from "next/server";
import { Segment } from "@/models/Segment";
import { requireAuth, json, handleError } from "@/lib/api";
import { segmentSchema } from "@/lib/validation";
import { countSegmentMatches } from "@/lib/segments";

export async function GET() {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const segments = await Segment.find().sort({ createdAt: -1 }).lean();
    // Attach a live match count to each segment.
    const withCounts = await Promise.all(
      segments.map(async (s) => ({
        ...s,
        matchCount: await countSegmentMatches(s.rules || []),
      }))
    );
    return json({ segments: withCounts });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const data = segmentSchema.parse(await req.json());
    const segment = await Segment.create(data);
    return json({ segment }, 201);
  } catch (err) {
    return handleError(err);
  }
}

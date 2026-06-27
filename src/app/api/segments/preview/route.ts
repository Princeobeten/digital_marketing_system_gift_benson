import { NextRequest } from "next/server";
import { requireAuth, json, handleError } from "@/lib/api";
import { buildSegmentQuery } from "@/lib/segments";
import { Customer } from "@/models/Customer";
import { z } from "zod";
import { ruleSchema } from "@/lib/validation";

const previewSchema = z.object({ rules: z.array(ruleSchema).default([]) });

/** Given a set of rules, return the match count and a small sample of customers. */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const { rules } = previewSchema.parse(await req.json());
    const query = buildSegmentQuery(rules);
    const [count, sample] = await Promise.all([
      Customer.countDocuments(query),
      Customer.find(query)
        .select("name email location interests totalSpend")
        .limit(8)
        .lean(),
    ]);
    return json({ count, sample });
  } catch (err) {
    return handleError(err);
  }
}

import { NextRequest } from "next/server";
import { Customer } from "@/models/Customer";
import { requireAuth, json, handleError } from "@/lib/api";
import { customerSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
            { location: { $regex: q, $options: "i" } },
          ],
        }
      : {};
    const customers = await Customer.find(filter).sort({ createdAt: -1 }).lean();
    return json({ customers });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const data = customerSchema.parse(await req.json());
    const customer = await Customer.create(data);
    return json({ customer }, 201);
  } catch (err) {
    return handleError(err);
  }
}

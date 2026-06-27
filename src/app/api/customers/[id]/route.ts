import { NextRequest } from "next/server";
import { Customer } from "@/models/Customer";
import { requireAuth, json, error, handleError } from "@/lib/api";
import { customerSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const { id } = await params;
    const data = customerSchema.parse(await req.json());
    const customer = await Customer.findByIdAndUpdate(id, data, { new: true });
    if (!customer) return error("Customer not found", 404);
    return json({ customer });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const { id } = await params;
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) return error("Customer not found", 404);
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}

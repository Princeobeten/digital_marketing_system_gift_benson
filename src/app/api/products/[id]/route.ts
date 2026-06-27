import { NextRequest } from "next/server";
import { Product } from "@/models/Product";
import { requireAuth, json, error, handleError } from "@/lib/api";
import { productSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const { id } = await params;
    const data = productSchema.parse(await req.json());
    const product = await Product.findByIdAndUpdate(id, data, { new: true });
    if (!product) return error("Product not found", 404);
    return json({ product });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const { id } = await params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) return error("Product not found", 404);
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}

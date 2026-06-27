import { NextRequest } from "next/server";
import { Product } from "@/models/Product";
import { requireAuth, json, handleError } from "@/lib/api";
import { productSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { brand: { $regex: q, $options: "i" } },
            { category: { $regex: q, $options: "i" } },
          ],
        }
      : {};
    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    return json({ products });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const data = productSchema.parse(await req.json());
    const product = await Product.create(data);
    return json({ product }, 201);
  } catch (err) {
    return handleError(err);
  }
}

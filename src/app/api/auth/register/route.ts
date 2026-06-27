import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { json, handleError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    await connectToDatabase();

    const existing = await User.findOne({ email: data.email });
    if (existing) {
      return json({ error: "An account with that email already exists." }, 409);
    }

    // First user to register becomes admin; everyone else is a marketer.
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? "admin" : data.role ?? "marketer";

    const passwordHash = await hashPassword(data.password);
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role,
    });

    const token = await createSessionToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await setSessionCookie(token);

    return json(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      201
    );
  } catch (err) {
    return handleError(err);
  }
}

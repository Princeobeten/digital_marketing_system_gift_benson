import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { json, handleError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    await connectToDatabase();

    const user = await User.findOne({ email: data.email });
    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      return json({ error: "Invalid email or password." }, 401);
    }

    const token = await createSessionToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await setSessionCookie(token);

    return json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    return handleError(err);
  }
}

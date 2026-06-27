import { getSession } from "@/lib/auth";
import { json } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return json({ user: null }, 401);
  return json({
    user: {
      id: session.sub,
      name: session.name,
      email: session.email,
      role: session.role,
    },
  });
}

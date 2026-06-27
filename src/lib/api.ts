import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession, type SessionPayload } from "./auth";
import { connectToDatabase } from "./db";

/** Standard JSON success response. */
export function json<T>(data: T, init?: number | ResponseInit) {
  const responseInit = typeof init === "number" ? { status: init } : init;
  return NextResponse.json(data, responseInit);
}

/** Standard JSON error response. */
export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Guard a route handler: ensures DB is connected and a valid session exists.
 * Returns the session, or a NextResponse (401) the caller should return early.
 */
export async function requireAuth(): Promise<
  { session: SessionPayload } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { response: error("Unauthorized", 401) };
  }
  await connectToDatabase();
  return { session };
}

/** Convert thrown errors (zod, mongo, generic) into a clean JSON response. */
export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => i.message).join(", ");
    return error(message || "Invalid input", 422);
  }
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  ) {
    return error("A record with that value already exists.", 409);
  }
  console.error(err);
  const message = err instanceof Error ? err.message : "Something went wrong";
  return error(message, 500);
}

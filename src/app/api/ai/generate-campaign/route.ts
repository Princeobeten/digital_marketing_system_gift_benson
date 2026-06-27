import { NextRequest } from "next/server";
import { requireAuth, json, error, handleError } from "@/lib/api";
import { aiGenerateSchema } from "@/lib/validation";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";

/**
 * AI Campaign Assistant. Given an offer/goal, product and tone, asks Groq to
 * draft a marketing subject line and body for the chosen channel, plus a
 * suggested target segment. Returns clean JSON to pre-fill the campaign form.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;

  if (!process.env.GROQ_API_KEY) {
    return error(
      "AI is not configured. Add GROQ_API_KEY to .env.local to use the assistant.",
      503
    );
  }

  try {
    const input = aiGenerateSchema.parse(await req.json());
    const client = getGroqClient();

    const productLine = input.productName
      ? `The campaign promotes: ${input.productName}${
          input.category ? ` (category: ${input.category})` : ""
        }.`
      : "The campaign promotes gadgets from the store's catalog.";

    const lengthHint =
      input.channel === "sms"
        ? "Keep the body under 320 characters (SMS)."
        : input.channel === "social"
        ? "Keep the body punchy with relevant hashtags (social media post)."
        : "Write 2-4 short paragraphs suitable for a marketing email.";

    const completion = await client.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a marketing copywriter for a gadget retail business. " +
            "You write high-converting promotional copy. " +
            'Always respond with ONLY a JSON object of the shape: {"subject": string, "body": string, "suggestedSegment": string}. ' +
            "suggestedSegment is a short description of who to target (e.g. 'Customers interested in Smartphones in Lagos').",
        },
        {
          role: "user",
          content:
            `Write a ${input.channel} marketing campaign. ${productLine} ` +
            `Goal/offer: ${input.offer}. ` +
            `Tone: ${input.tone}. ${lengthHint}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: { subject?: string; body?: string; suggestedSegment?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback if the model didn't return valid JSON.
      parsed = { subject: "", body: raw, suggestedSegment: "" };
    }

    return json({
      subject: parsed.subject || "",
      body: parsed.body || "",
      suggestedSegment: parsed.suggestedSegment || "",
    });
  } catch (err) {
    return handleError(err);
  }
}

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).min(1).max(40),
  context: z.unknown().optional(),
});

const RED_FLAGS = /(severe|crushing|radiating)\s+chest|chest pain|can'?t breathe|shortness of breath|faint|passed out|unconscious|stroke|numb(ness)? (in|on) (one|my) (arm|side|face)|slurred speech|heart attack|suicid/i;

const SYSTEM = `You are CardioNeuro Assistant, a general heart-health information assistant inside an educational screening app.
Rules:
- Never diagnose. Never give medication names with doses. Never tell the user to start, stop, or change any medication.
- Give general, evidence-based information in short paragraphs or bullets (use **bold** and "- " bullets only).
- Always point to a qualified healthcare professional for personal medical advice.
- If the user describes potentially serious symptoms (e.g. severe chest pain, severe breathlessness, fainting, stroke signs), begin your reply with the exact token [EMERGENCY] and urge them to seek emergency care immediately.
- If analysis context is provided, you may explain it, stressing it is a model screening estimate from their dataset, not a diagnosis. If no dataset was analyzed, say so when relevant.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return Response.json({ error: "AI not configured" }, { status: 503 });
        let body: z.infer<typeof Body>;
        try { body = Body.parse(await request.json()); } catch { return Response.json({ error: "Invalid chat request." }, { status: 400 }); }
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: SYSTEM },
              { role: "system", content: `App context (JSON): ${JSON.stringify(body.context ?? { note: "No dataset analyzed yet" }).slice(0, 6000)}` },
              ...body.messages,
            ],
          }),
        });
        if (res.status === 429) return Response.json({ error: "The assistant is busy. Please try again in a moment." }, { status: 429 });
        if (res.status === 402) return Response.json({ error: "AI usage limit reached for this workspace." }, { status: 402 });
        if (!res.ok) return Response.json({ error: "The assistant could not respond right now." }, { status: 502 });
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        let reply = data.choices?.[0]?.message?.content?.trim() ?? "";
        const lastUser = body.messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
        let emergency = RED_FLAGS.test(lastUser);
        if (reply.startsWith("[EMERGENCY]")) { emergency = true; reply = reply.replace("[EMERGENCY]", "").trim(); }
        return Response.json({ reply: reply || "I couldn't generate a reply. Please rephrase.", emergency });
      },
    },
  },
});

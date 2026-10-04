import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chat-status")({
  server: { handlers: { GET: async () => Response.json({ configured: Boolean(process.env['LOVABLE_API_KEY']) }) } },
});

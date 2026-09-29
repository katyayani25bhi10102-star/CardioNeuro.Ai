import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: { handlers: { GET: async () => Response.json({ status: "connected", service: "CardioNeuro analysis engine", timestamp: new Date().toISOString() }) } },
});

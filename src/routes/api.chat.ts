import { createFileRoute } from "@tanstack/react-router";
import { handleHealthChat } from "@/lib/health-chat.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: ({ request }) => handleHealthChat(request),
    },
  },
});

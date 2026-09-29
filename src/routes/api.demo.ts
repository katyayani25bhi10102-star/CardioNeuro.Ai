import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/demo")({
  server: { handlers: { GET: async () => {
    try {
      const { analyzeCsv, getDemoCsv } = await import("@/lib/heart-analysis.server");
      return Response.json(await analyzeCsv(getDemoCsv(), "cardioneuro-demo.csv"));
    } catch (error) {
      console.error("Demo analysis failed", error);
      return Response.json({ error: "The demo dataset could not be analyzed." }, { status: 500 });
    }
  } } },
});

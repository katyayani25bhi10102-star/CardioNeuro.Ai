import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/model-metrics")({
  server: { handlers: { GET: async () => {
    const { analyzeCsv, getDemoCsv } = await import("@/lib/heart-analysis.server");
    const result = await analyzeCsv(getDemoCsv(), "cardioneuro-demo.csv");
    return Response.json({ model: result.prediction.model, trainingSamples: result.dataset.rows - result.prediction.evaluatedRows, features: result.dataset.features, metrics: result.metrics, featureImportance: result.featureImportance });
  } } },
});

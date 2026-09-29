import { createFileRoute } from "@tanstack/react-router";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/upload")({
  server: { handlers: { POST: async ({ request }) => {
    try {
      const contentType = request.headers.get("content-type") ?? "";
      if (!contentType.includes("multipart/form-data")) return jsonError("Upload a CSV file using the dataset form.", 415);
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return jsonError("No dataset file was received.");
      if (!file.name.toLowerCase().endsWith(".csv")) return jsonError("Only CSV datasets are supported.", 415);
      if (file.size > 5_000_000) return jsonError("The dataset is larger than 5 MB.", 413);
      const { analyzeCsv } = await import("@/lib/heart-analysis.server");
      return Response.json(await analyzeCsv(await file.text(), file.name));
    } catch (error) {
      const message = error instanceof Error ? error.message : "The dataset could not be analyzed.";
      console.error("Dataset analysis failed", error);
      return jsonError(message, 422);
    }
  } } },
});

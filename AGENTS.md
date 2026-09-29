<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting published git history.
<!-- LOVABLE:END -->

- Keep CardioNeuro analysis stateless and process uploads in memory through TanStack server routes, because personal health datasets must not be persisted.
- Use the shared AnalysisProvider for current-session results, because all result pages must reflect the same real backend response.
- Keep the model implementation in server-only modules and API handlers, because predictions must never run or be fabricated in the browser.

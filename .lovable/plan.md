# CardioNeuro AI implementation plan

## Goal
Build a polished, responsive cardiovascular screening app in Montserrat where dataset upload, validation, model training, prediction, charts, recommendations, demo data, and report download all work end to end.

## What will be built
- A dark medical-research interface with neon cyan accents, restrained DNA/data animation, accessible controls, and responsive desktop/mobile layouts.
- Separate Home, Dashboard, Dataset, Analysis, AI Model, and About pages with shared navigation and page-specific metadata.
- CSV upload with file-size/type checks, processing states, detected columns, row/feature/missing counts, preview rows, and friendly failures.
- A real server-side data pipeline that parses tabular data, detects a binary target, imputes missing values, encodes categories, trains/evaluates a model, and returns probabilities and measured evaluation metrics.
- Dynamic heart-rate statistics, blood-pressure and cholesterol indicators, model feature importance, risk distributions, and interactive Recharts visualizations.
- Dynamic screening results, factor-based precautions, emergency guidance, and prominent non-diagnostic wording.
- An included demo dataset that runs through the same backend analysis path as uploaded files.
- A downloadable report generated from the actual analysis response.
- A live backend health indicator and robust API error handling.

## Technical details
- The app remains on its supported TanStack Start stack. Backend endpoints will run server-side within the app rather than as a separate Python process, so the deployed preview and final site work as one product.
- Uploaded health data is processed in memory and is not permanently stored.
- The model pipeline will use deterministic server-side statistical learning and an evaluated train/test split; no prediction or metric will be hardcoded.
- The frontend will call raw HTTP endpoints under `/api/*`, with Zod validation where applicable.
- Montserrat will be loaded from the document head and exposed through the global design tokens.
- Reduced-motion preferences, keyboard navigation, labels, and high contrast will be supported.

## Validation
- Test backend health and demo analysis responses directly.
- Test the complete browser flow from Home → demo/upload → results → charts → report download.
- Verify desktop and mobile layouts and resolve build, runtime, console, and network errors.

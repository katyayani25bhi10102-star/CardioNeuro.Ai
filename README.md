

# CardioNeuro AI

AI-powered cardiovascular risk **screening** from your health data. Upload a heart-disease CSV, and a real
scikit-learn Random Forest is trained on it. The dashboard shows the model's risk estimate, the most influential risk
factors, heart-rate statistics, model metrics and personalised precautions. A Gemini-powered health assistant can answer
questions about your results and symptoms.

> **Medical disclaimer.** CardioNeuro AI is an educational and research-oriented screening tool. Its results are
> generated from machine-learning analysis of uploaded data and are not a medical diagnosis. Consult a qualified
> healthcare professional for medical advice. If you are experiencing severe chest pain, severe shortness of breath,
> fainting, or other potentially serious symptoms, seek emergency medical care immediately.

---

## Features

- **Real ML pipeline**: CSV → Pandas cleaning → column detection → imputation and encoding → stratified train/test split → `RandomForestClassifier` → `predict_proba` → JSON → React dashboard. Nothing is mocked or hardcoded.
- **Metrics from the actual model**: accuracy, precision, recall, F1, ROC-AUC, confusion matrix and 5-fold cross-validated ROC-AUC, all calculated on held-out data.
- **Explainable risk factors** from `feature_importances_`, aggregated back to the original columns.
- **Flexible dataset detection** for UCI and Kaggle formats and alternative column names (`RestingBP`, `MaxHR`, `ap_hi`, `Cholesterol`, `HeartDisease`, `cardio`...).
- **Extended risk characteristics**: diastolic BP, BMI (derived from height and weight when needed), LDL, HDL, triglycerides, glucose, smoking, alcohol, diabetes, family history, physical activity, sleep, stress, and pulse pressure (derived).
- **Unit normalisation**: age in days becomes years, `?`/`NA` placeholders become missing values, and 1–3 cholesterol categories are not mistaken for mg/dL.
- **Heart-rate analysis**: average, min, max, median, standard deviation and latest value (when timestamped). `thalach` is always labelled **Maximum Recorded Heart Rate**, never "current". If no heart-rate data exists, the app says so and never invents a value.
- **Individual risk check**: enter one person's measurements and the trained model estimates their risk.
- **Precaution Channel**: rule-based guidance computed from the results. Green = safe, orange = caution, red = discuss with a professional. A separate Emergency Notice is shown. It never prescribes medication or diagnoses.
- **AI health assistant** (Gemini): knows your analysis, risk factors and profile. It flags emergency symptoms deterministically, server-side. The API key never reaches the browser.
- **Profile and settings**: name, age, sex, occupation, work activity, smoking status, health issues, email. These personalise precautions and chat.
- **Report download** (HTML generated from the current results) and **Gmail** compose link with a real summary.
- **Animated medical-AI UI**: Montserrat font, neon-blue glassmorphism, DNA helix, particle network and scrolling ECG background (green = safe, orange = caution, red = danger).
- **Honest status indicator**: "● Backend Connected" or "● Backend Offline", polled from `/api/health`.

> The animated ECG in the background is **decorative only** and is not patient data.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion, Lucide React, `@fontsource/montserrat` |
| Backend | Python 3.10+, FastAPI, Uvicorn, Pandas, NumPy, scikit-learn, Joblib, Requests |
| AI assistant | Google Gemini REST API (server-side) |

---

## Project structure

```
CardioNeuroAI/
├── backend/
│   ├── main.py                    # FastAPI app and routes
│   ├── requirements.txt
│   ├── .env.example               # GEMINI_API_KEY, GEMINI_MODEL, CORS_ORIGINS
│   ├── data/
│   │   ├── demo_heart.csv                 # UCI-style demo (synthetic)
│   │   ├── demo_heart_extended.csv        # + BMI, lipids, lifestyle (synthetic)
│   │   ├── demo_heart_monitor.csv         # timestamped heart rate (synthetic)
│   │   └── generate_demo.py
│   ├── models/
│   │   ├── schemas.py             # Pydantic request models
│   │   └── artifacts/             # trained .joblib models (git-ignored)
│   ├── preprocessing/
│   │   ├── columns.py             # aliases, labels, column detection
│   │   └── cleaning.py            # CSV reading, cleaning, target prep, derived features
│   ├── services/
│   │   ├── analysis_service.py    # orchestrates the full pipeline
│   │   ├── ml_service.py          # RandomForest training and prediction
│   │   ├── dataset_service.py     # summary, clinical aggregates
│   │   ├── heart_rate_service.py  # real heart-rate statistics
│   │   ├── precaution_service.py  # rule-based precautions
│   │   ├── chat_service.py        # Gemini assistant
│   │   ├── profile_service.py
│   │   ├── storage.py
│   │   └── errors.py
│   └── tests/                     # end-to-end backend tests
└── frontend/
    ├── .env.example               # VITE_API_URL
    └── src/
        ├── services/api.ts        # the only place backend URLs live
        ├── components/            # Dashboard, Charts, UploadZone, PredictForm,
        │                          # PrecautionChannel, ChatBot, BackgroundCanvas...
        ├── utils/                 # report, Gmail, chat context, formatting
        └── types.ts
```

---

## Getting started

### Prerequisites
Python 3.10+, Node.js 18+, and (optionally) a free Gemini API key from <https://aistudio.google.com/apikey>.

### 1. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # add GEMINI_API_KEY to enable the assistant
uvicorn main:app --reload          # http://localhost:8000
```
Check it: https://cardio-neuro-ai.vercel.app/ should return `{"status":"ok","service":"CardioNeuro AI",...}`.


### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env               # VITE_API_URL=http://localhost:8000
npm run dev                        # http://localhost:5173
```

### 3. Try it
1. Open <http://localhost:5173>. The status pill should read **● Backend Connected**.
2. Click **Try Demo** (or upload any CSV from the dataset pack).
3. Watch the analysis run, then explore the dashboard, the Precaution Channel, the individual risk check and the assistant.

### Environment variables

| File | Variable | Purpose |
|---|---|---|
| `backend/.env` | `GEMINI_API_KEY` | Enables the AI assistant (server-side only) |
| `backend/.env` | `GEMINI_MODEL` | Default `gemini-2.5-flash`; change if your key uses a different model |
| `backend/.env` | `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `frontend/.env` | `VITE_API_URL` | Backend base URL |

---

## API reference

All errors return `{"error": {"code": "...", "message": "..."}}`. Stack traces are never exposed.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Service status (the frontend indicator calls this) |
| POST | `/api/upload` | Multipart CSV (`file`, max 20 MB) → dataset summary, preview, detected columns |
| GET | `/api/demo?variant=` | `demo_heart`, `demo_heart_extended` or `demo_heart_monitor` |
| POST | `/api/analyze` | `{dataset_id, target_column?}` → trains the model; returns risk, metrics, importances, heart-rate stats, precautions |
| POST | `/api/predict` | `{model_id, features}` → individual probability, category, precautions |
| GET | `/api/model-metrics` | Metrics of a saved model (`?model_id=`, defaults to the latest) |
| GET / PUT | `/api/profile` | User profile (name, age, occupation, ...) |
| GET | `/api/chat/status` | Whether the AI assistant is configured |
| POST | `/api/chat` | `{messages, context}` → assistant reply and emergency flag |

### Risk categories
The model probability is mapped to a **screening** category: below 33% = Lower, 33–66% = Moderate, 66% or above = Higher
estimated risk. Results are labelled *"AI-estimated cardiovascular risk"* and are **not** a diagnosis.

---

## Supported datasets

Works with UCI Heart Disease, Kaggle Heart Failure Prediction, Kaggle Cardiovascular Disease and similar CSVs.

- **Target column** (auto-detected): `target`, `heart_disease`, `heart_disease_risk`, `disease`, `output`, `condition`, `num`, `cardio`, `HeartDisease`... You can also pick one manually. Two classes, or small ordered grades (e.g. UCI `num` 0–4, treated as ">0 = disease").
- **No target?** The app tells you: *"No disease target column was detected. Upload a labeled heart-disease dataset to train the prediction model."* It never fabricates a prediction.
- **Minimum**: 30 labeled rows and at least 3 rows per class.
- A pack of 8 **synthetic** test datasets (UCI-style, Kaggle-style, cardio-style, extended, wearable heart-rate, no-target, messy, tiny) is provided separately in `heart_datasets.zip`.

> All bundled demo and test data is **synthetic** (generated, not real patient data). Use public sources such as UCI or
> Kaggle for real research and respect their licences.

---

## Testing

```bash
cd backend
python tests/test_pipeline.py      # or: pytest tests
```
The backend test suite covers: health; the full demo pipeline (upload → Pandas → Random Forest → probability → JSON); model-driven predictions
(a high-risk profile scores clearly above a low-risk one); continuous and max-recorded heart rate; no-target and no-heart-rate cases; alternative
column names; text categories; `?` placeholders; extended characteristics; unit normalisation; every error path (empty, malformed, unsupported,
too small, class imbalance, bad IDs); profile; and the chat service (with the Gemini HTTP call mocked). The tests
use minimal stand-ins for FastAPI and Pydantic only when those packages aren't installed, and use the real ones when they are.

---

## Project status (please read)

| Area | Status |
|---|---|
| Backend (FastAPI, ML pipeline, chat, profile) | **Complete.** The service layer and all route handlers pass the test suite on the demo and synthetic datasets. Not yet exercised over real HTTP with `uvicorn` in the environment where it was written (no package access), so run `uvicorn main:app --reload` and open `/docs` to confirm in yours. |
| Frontend config, API service, types, utilities | Written |
| Frontend components: background canvas, charts, dashboard, upload zone, prediction form, Precaution Channel, chatbot | Written, **not yet compiled or run** (no npm access where it was written). Expect to fix small TypeScript or runtime issues on first `npm run build`. |
| Frontend still to build | `App.tsx` (state and routing), `Sidebar`, `Landing`, `SettingsPanel`, `ProfilePanel` |
| Real HTTP, browser and end-to-end testing | **Not done.** Run through the "Try it" steps above and report any errors. |

---

## Limitations and responsible use

- Predictions depend entirely on the uploaded data's size, quality and labelling. Small or biased datasets give unreliable models.
- Metrics are measured on a held-out split of the *same* dataset. They do not prove the model generalises to other populations.
- The risk bands, the "elevated" thresholds (e.g. systolic ≥ 140, cholesterol ≥ 240 mg/dL, LDL ≥ 160, BMI ≥ 30) and the precaution rules are simple screening heuristics, not clinical guidelines.
- The AI assistant can make mistakes. It is instructed never to diagnose or advise on medication, but always verify with a qualified professional.
- Uploaded files and trained models are stored locally under `backend/data/uploads` and `backend/models/artifacts` and cleaned up after 24 hours. Chat context is sent to Google's Gemini API when the assistant is used.
- This software is not a medical device and must not be used for clinical decisions.

---

## License

Choose a license for your project (for example MIT) and add a `LICENSE` file. The bundled datasets are synthetic and free to use.
`````


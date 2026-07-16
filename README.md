# ForenSync

**Forensic identification system — matches missing persons against unidentified bodies using facial recognition and description similarity.**

### ▶ [Live demo](https://forensync.kindbush-568172cc.uaenorth.azurecontainerapps.io/)

> Hosted on Azure Container Apps and scaled to zero when idle, so the **first request may take ~30–60s** to wake the container and load the models. Subsequent requests are fast.
>
> Seeded with 30 unidentified bodies and 2 missing persons. Try **Search → Photo Search**, upload any image from [`photos/unidentified_bodies/`](photos/unidentified_bodies), and search against *Unidentified Bodies* to see facial recognition return the exact match at ~100%.

Police stations record missing persons. Morgues record unidentified bodies. The two rarely get compared, so cases stay open. ForenSync indexes both populations as vectors and cross-searches them: upload a photo of an unidentified body and it ranks the missing persons who look like them, or search by description when no usable photo exists.

---

## How it works

```
Photo ──► InsightFace (buffalo_l) ──► 512-d face vector ─┐
                                                          ├─► Qdrant ──► weighted
Description ──► all-mpnet-base-v2 ──► 768-d text vector ─┘             similarity
                                                                            │
                                                                            ▼
                                                          ranked cross-population matches
```

**Cross-population matching.** A search never returns the same record type it was given: a body photo is matched against *missing persons* (`target_type`), which is the question an investigator actually asks.

**Modality-aware scoring.** Weights are renormalised over the signals that actually exist — a photo-only search scores on the face vector alone rather than being diluted by an empty text vector.

**Calibrated confidence.** Results are filtered by `min_confidence` and labelled `strong` / `possible` / `weak` (tuned to InsightFace cosine distances, where the same person scores >0.5), so a 12% score is never presented as a match.

## Stack

| Layer | Choice |
|---|---|
| API | FastAPI + Uvicorn |
| Face embeddings | InsightFace `buffalo_l` (ONNX Runtime, CPU) |
| Text embeddings | `all-mpnet-base-v2` (sentence-transformers) |
| Vector search | Qdrant (embedded, on-disk) |
| Records | SQLite |
| Web | React + Vite + Tailwind |

The API also serves the built React app, so the whole product is a **single container on a single port** — no CORS, no separate frontend host.

---

## Run it locally

Requires Python 3.11+ and Node 20+.

```bash
pip install -r requirements_production.txt
cd frontend && npm install && npm run build && cd ..
python run_server.py
```

Open <http://localhost:8000>.

`run_server.py` supervises the API: it restarts on crash and appends timestamped logs to `server.log` (native crash tracebacks land in `server_crash.log`).

**First start builds the vector index automatically** from the seeded records — no setup scripts to run.

## Deploy

Built as one Docker image. See **[DEPLOYMENT.md](DEPLOYMENT.md)**.

> ⚠️ It loads two AI models and needs **~1.5–2.5 GB RAM**. Hosts offering 512 MB free tiers (Render free, Railway free) are OOM-killed on startup.

---

## API

Base URL is the same origin as the web app.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/search-missing-person` | Cross-population match by photo and/or text |
| `POST` | `/api/report-missing-person` | File a missing person report |
| `POST` | `/api/report-unidentified-body` | File an unidentified body report |
| `GET` | `/api/missing-persons` | List missing persons |
| `GET` | `/api/unidentified-bodies` | List unidentified bodies |
| `GET` | `/api/record/{pid}` | Full record by PID |
| `GET` | `/api/stats` | Record + vector index counts |
| `GET` | `/health` | Service health |

### Search

`POST /api/search-missing-person` (multipart form)

| Field | Default | Notes |
|---|---|---|
| `photo` | – | Image to match on |
| `search_text` | – | Free-text description |
| `target_type` | `missing_person` | `missing_person` \| `unidentified_body` \| `any` |
| `top_n` | `10` | Max results |
| `face_weight` / `text_weight` | `0.6` / `0.4` | Renormalised over available signals |
| `min_confidence` | `0.1` | Drops weaker results |

```jsonc
{
  "status": "success",
  "results": [
    {
      "pid": "MP-2026-00002",
      "combined_score": 0.68,
      "face_score": 0.99,
      "text_score": 0.20,
      "confidence_percentage": 68.11,
      "match_band": "strong",
      "details": { "...": "full record" }
    }
  ]
}
```

## Maintenance

```bash
python reindex_all.py   # rebuild the vector index from SQLite (stop the server first)
```

Qdrant runs embedded and on-disk, so only **one process** may hold it — hence a single worker.

## Notes

- **No authentication** — deliberate, so the demo is open. An API-key gate exists: set the `API_KEY` env var to require an `X-API-Key` header on data endpoints.
- **Seeded demo data** (`missing_persons.db`, `photos/`) is committed so a fresh deploy has records and images immediately. Sample images only — not real casework.

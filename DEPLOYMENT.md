# Deploying ForenSync

**Live:** <https://forensync.kindbush-568172cc.uaenorth.azurecontainerapps.io/>

Running on **Azure Container Apps** (UAE North), built by **GitHub Actions**, image published to **GitHub Container Registry**.

---

## The constraint that drives everything

ForenSync loads two AI models into memory (InsightFace + sentence-transformers) and needs **~1.5–2.5 GB RAM**. That single fact rules out most free hosting:

| Host | Verdict |
|---|---|
| **Azure Container Apps** (student credit) | ✅ **in use** — enough RAM, free via $100 student credit, no card |
| Hugging Face Spaces | ❌ Docker/Gradio Spaces now require a paid plan; only Static is free |
| Render / Railway free | ❌ 512 MB — OOM-killed on startup |
| Vercel / Netlify | ❌ serverless; cannot host resident AI models |
| Google Cloud Run | ⚠️ works, but billing setup demanded a ₹3,000 prepayment for Indian debit cards (UPI is not supported for self-serve accounts) |
| Oracle Cloud Always Free | ⚠️ 24 GB free forever, but ARM capacity in `ap-mumbai-1` is chronically exhausted (`Out of capacity`) |

**[Azure for Students](https://azure.microsoft.com/free/students)** gives **$100/year and requires no credit card** — a college email is the verification. That's what makes this free.

## Architecture

One image serves both the API and the React app on a single port — no CORS, no second host.

```
git push ─► GitHub Actions ─► builds Dockerfile ─► ghcr.io (public image)
                                                        │
                                                        ▼
                                            Azure Container Apps pulls & runs
```

**Why GitHub builds it:** Azure student subscriptions reject ACR Tasks
(`TasksOperationsNotAllowed`), so `az containerapp up --source .` cannot build in
the cloud. GitHub Actions is free and unlimited on public repos, so it builds the
image and Azure just pulls the finished result. Bonus: every push republishes it.

---

## Deploying from scratch

### 1. Build the image
Push to `main`. [`.github/workflows/build-image.yml`](.github/workflows/build-image.yml)
builds and publishes `ghcr.io/<owner>/forensync:latest` (~20–25 min; it compiles
the AI libraries and bakes the models in).

**The package must be public**, or Azure can't pull it:
`github.com/<owner>?tab=packages` → forensync → Package settings → Danger Zone →
Change visibility → Public.

Verify anonymous pull works (ghcr returns 401 without a token even when public,
so test the token flow, not a bare GET):

```bash
TOKEN=$(curl -s "https://ghcr.io/token?service=ghcr.io&scope=repository:<owner>/forensync:pull" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
curl -s -H "Authorization: Bearer $TOKEN" https://ghcr.io/v2/<owner>/forensync/tags/list
```

### 2. Deploy on Azure

In [Azure Cloud Shell](https://shell.azure.com) (Bash):

```bash
az extension add --name containerapp --upgrade --yes
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.OperationalInsights --wait

az containerapp env create \
  --name forensync-env \
  --resource-group forensync-rg \
  --location uaenorth

az containerapp create \
  --name forensync \
  --resource-group forensync-rg \
  --environment forensync-env \
  --image ghcr.io/<owner>/forensync:latest \
  --target-port 8000 \
  --ingress external \
  --cpu 2 --memory 4Gi \
  --min-replicas 0 --max-replicas 1 \
  --query "properties.configuration.ingress.fqdn" -o tsv
```

| Flag | Why |
|---|---|
| `--cpu 2 --memory 4Gi` | The default 1 GiB is not enough — the container is OOM-killed |
| `--min-replicas 0` | Scale to zero: costs ~nothing idle, so $100 lasts the year |
| `--target-port 8000` | Must match `EXPOSE`/`PORT` in the Dockerfile |

### Region gotcha
Azure for Students is restricted by an **"Allowed resource deployment regions"**
policy. Check yours before picking a region:

```bash
az policy assignment list --query "[].{policy:displayName, params:parameters}" -o json
```

This subscription allows only: `centralindia`, `uaenorth`, `austriaeast`,
`koreacentral`, `malaysiawest`. Central India additionally refused Container App
Environments (`MaxNumberOfEnvironmentsInSubExceeded`), hence **UAE North**.

### 3. Redeploying after a code change

```bash
git push                                   # GitHub rebuilds the image
az containerapp update -n forensync -g forensync-rg \
  --image ghcr.io/<owner>/forensync:latest # pull the new image
```

---

## First startup is automatic

No setup scripts. On boot the app creates the Qdrant collections and, if the
index is empty, embeds every record in `missing_persons.db` (~30–60s). So a fresh
deploy comes up already holding 30 unidentified bodies and 2 missing persons with
working photo search.

## Known limits (worth stating in an interview)

- **Uploads reset.** The container filesystem is ephemeral: seeded records always
  return (they're in git), but reports submitted at runtime vanish on restart.
  Fixing it properly means Postgres + object storage + hosted Qdrant.
- **Cold start.** `--min-replicas 0` means the first hit after idling takes
  ~30–60s. Set `--min-replicas 1` to keep it warm — it burns credit continuously,
  which $100/year does not comfortably cover at 2 vCPU.
- **No authentication**, deliberately. An API-key gate exists: set the `API_KEY`
  env var to require an `X-API-Key` header on data endpoints.
- **Single replica.** Qdrant runs embedded and on-disk, so only one process may
  hold it (`--max-replicas 1`). Scaling out means running Qdrant as a service.

## Running locally

```bash
pip install -r requirements_production.txt
cd frontend && npm install && npm run build && cd ..
python run_server.py     # supervises + restarts on crash; logs to server.log
```

<http://localhost:8000>

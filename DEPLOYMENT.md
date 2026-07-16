# Deploying ForenSync

## The one thing to understand first

ForenSync is **not a normal web app**. It loads two AI models (face recognition +
text embeddings) into memory and needs about **1.5–2.5 GB of RAM**.

That single fact decides where you can host it:

| Host | Free RAM | Works? |
|---|---|---|
| **Hugging Face Spaces** | **16 GB (free)** | ✅ **Recommended** |
| Render free / starter | 512 MB | ❌ Crashes on startup (out of memory) |
| Railway free trial | ~512 MB | ❌ Same problem |
| Vercel / Netlify | serverless | ❌ Can't run Python AI models at all |
| Render **standard** | 2 GB | ✅ but costs ~$25/month |

**Use Hugging Face Spaces.** It's free, it's built for AI apps, and it has more
than enough memory.

The app is packaged as **one Docker image**: the API and the website run together
on a single URL. You get one link to give people. No separate frontend to deploy,
no CORS setup, no environment variables to configure.

---

## Deploy to Hugging Face Spaces (free)

### 1. Make an account
Go to <https://huggingface.co/join> and sign up (free).

### 2. Create a Space
- Click your avatar → **New Space**
- **Space name**: `forensync`
- **License**: pick anything (e.g. MIT)
- **Space SDK**: choose **Docker** → **Blank**
- **Hardware**: `CPU basic` (free, 16 GB RAM)
- **Visibility**: **Public** (so interviewers can open it)
- Click **Create Space**

### 3. Push your code to it
Hugging Face gives you a git URL. In a terminal, from this project folder:

```bash
git add .
git commit -m "Deploy ForenSync"

# replace YOUR-USERNAME with your Hugging Face username
git remote add space https://huggingface.co/spaces/YOUR-USERNAME/forensync
git push space main
```

If it asks for a password, use an **access token**, not your account password:
create one at <https://huggingface.co/settings/tokens> (role: **write**) and paste
that as the password.

### 4. Wait for the build
The Space page shows a **Building** log. The first build takes **10–20 minutes** —
it installs the AI libraries and downloads the models into the image. That's
normal and only happens once.

When it says **Running**, your app is live at:

```
https://YOUR-USERNAME-forensync.hf.space
```

That's the link you give interviewers.

---

## What happens on first startup

The server does this by itself — you don't run any commands:

1. Creates the vector database (it isn't stored in git).
2. Reads the 32 seeded records from `missing_persons.db`.
3. Generates the face + text embeddings for them (~30–60 seconds).
4. Starts serving.

So the deployed site already has **30 unidentified bodies and 2 missing persons**
with working photo search. Nothing to set up.

---

## Things to know (worth saying out loud in an interview)

**Uploads reset.** Free Spaces have a temporary disk. The records you seeded always
come back (they're in git), but **new reports someone submits will disappear when
the Space restarts or rebuilds**. That's fine for a demo. To make uploads permanent
you'd add paid persistent storage, or move to Postgres + object storage + hosted
Qdrant.

**It sleeps.** A free Space sleeps after ~48 hours with no visitors. The next
visitor wakes it, which takes ~30 seconds. Open your link an hour before an
interview so it's warm.

**There is no login.** Anyone with the link can search and submit reports. That's a
deliberate demo choice — say so if asked, and mention you'd add authentication for
real use. (An API-key gate already exists in the code: set the `API_KEY`
environment variable to turn it on.)

**One process only.** The vector database runs inside the app process, so it can't
scale to multiple workers. Fine for a demo; for real traffic you'd run Qdrant as a
separate service.

---

## Running it locally

```bash
python run_server.py
```

Then open <http://localhost:8000>. `run_server.py` restarts the API automatically
if it crashes and appends logs to `server.log` (crash tracebacks land in
`server_crash.log`).

To rebuild the website after changing frontend code:

```bash
cd frontend && npm run build
```

---

## Alternative: Render (paid)

`render.yaml` is set up for a Docker deploy on the **standard** plan (2 GB, ~$25/mo).
Do not use the free plan — 512 MB is not enough and the service is killed on startup.

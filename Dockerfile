# ============================================================================
# ForenSync — single-image deployment (API + web app on one port)
# ============================================================================
# Stage 1 builds the React app; stage 2 runs FastAPI and serves that build,
# so the whole product is one service on one URL (no CORS, no second host).
# The AI models are downloaded at BUILD time — otherwise the first request
# would trigger ~1GB of downloads and blow past the platform health check.
# ============================================================================

# ---- Stage 1: build the frontend ----
FROM node:20-slim AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: python runtime ----
FROM python:3.11-slim

# libgl1/libglib: required by opencv. build-essential: insightface has no
# prebuilt wheel and compiles from source at install time.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libgl1 \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Run as a non-root user
RUN useradd -m -u 1000 appuser
WORKDIR /app

# PORT is overridable by the host (Cloud Run/Render set it; on a plain VM the
# default below is used and mapped with `docker run -p 80:8000`).
ENV PYTHONUNBUFFERED=1 \
    PYTHONUTF8=1 \
    PYTHONIOENCODING=utf-8 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/home/appuser/.cache/huggingface \
    INSIGHTFACE_HOME=/home/appuser/.insightface \
    PORT=8000

COPY requirements_production.txt .
# Order matters here:
#  1. torch FIRST, or sentence-transformers resolves it itself and drags in the
#     ~2.5GB CUDA build. On x86 we force the CPU-only index; that index has no
#     aarch64 wheels, so on ARM (e.g. Oracle Ampere) we use PyPI, where the
#     aarch64 build is already CPU-only.
#  2. numpy + cython BEFORE insightface, which imports them in its setup.py.
RUN pip install --upgrade pip \
 && if [ "$(uname -m)" = "x86_64" ]; then \
        pip install --index-url https://download.pytorch.org/whl/cpu torch; \
    else \
        pip install torch; \
    fi \
 && pip install numpy==1.26.4 cython \
 && pip install -r requirements_production.txt

# Bake the models into the image (as appuser, so the caches are readable)
USER appuser
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-mpnet-base-v2')" \
 && python -c "from insightface.app import FaceAnalysis; a = FaceAnalysis(providers=['CPUExecutionProvider']); a.prepare(ctx_id=0, det_size=(640, 640))"

USER root
# App code + seeded demo data (missing_persons.db, photos/)
COPY . .
# The built web app from stage 1
COPY --from=frontend-build /build/dist ./frontend/dist
# The app writes here at runtime (uploads, sqlite, vector index)
RUN mkdir -p qdrant_data photos/missing_persons photos/unidentified_bodies \
 && chown -R appuser:appuser /app

USER appuser
EXPOSE 8000

# Single worker on purpose: the on-disk Qdrant allows only one process.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]

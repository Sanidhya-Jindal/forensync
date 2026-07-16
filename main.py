"""
FastAPI Application for Missing Persons and Unidentified Bodies System
Provides REST API endpoints for reporting and searching
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status, Header, Depends
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import sys
import sqlite3
import json
import os
import shutil
import faulthandler
import logging
from datetime import datetime
import uuid
from pathlib import Path

# Ensure Unicode banner output (✓, ⚠) never crashes on a non-UTF-8 console
# (e.g. Windows cp1252 when stdout is piped/redirected).
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8")
    except Exception:
        pass

# ---------------------------------------------------------------------------
# Crash diagnostics.
# The heavy native deps here (onnxruntime / insightface / torch) can abort the
# process without any Python traceback, which previously left an empty log and
# a dead server. faulthandler dumps a real traceback on segfault/abort, and we
# append it (never truncate) so the evidence survives a restart.
# ---------------------------------------------------------------------------
_CRASH_LOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server_crash.log")
try:
    _crash_fp = open(_CRASH_LOG, "a", buffering=1, encoding="utf-8")
    _crash_fp.write(f"\n=== process start {datetime.now().isoformat()} pid={os.getpid()} ===\n")
    faulthandler.enable(file=_crash_fp, all_threads=True)
except Exception as _e:  # never let logging setup kill startup
    print(f"⚠ Could not enable crash log: {_e}")


def _log_unhandled(exc_type, exc_value, exc_tb):
    """Record any unhandled exception before the interpreter exits."""
    import traceback
    try:
        with open(_CRASH_LOG, "a", encoding="utf-8") as fh:
            fh.write(f"\n=== unhandled exception {datetime.now().isoformat()} ===\n")
            traceback.print_exception(exc_type, exc_value, exc_tb, file=fh)
    except Exception:
        pass
    sys.__excepthook__(exc_type, exc_value, exc_tb)


sys.excepthook = _log_unhandled

# Import our modules
from db_helper import DatabaseHelper
from text_embedder import TextEmbedder
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
import numpy as np

# Try to import face recognition (optional if not installed)
try:
    from face_embedding import FaceEmbeddingExtractor
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("⚠ Face recognition not available. Install: pip install opencv-python insightface onnxruntime")

from vector_retrieval import VectorRetrieval

# Initialize FastAPI app
app = FastAPI(
    title="Missing Persons & Unidentified Bodies API",
    description="API for reporting unidentified bodies and searching for missing persons",
    version="1.0.0"
)

# Add CORS middleware
allowed_origins = os.environ.get(
    "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
DB_FILE = 'missing_persons.db'
QDRANT_DATA_PATH = "./qdrant_data"
PHOTO_BASE_DIR = "photos"
UIDB_PHOTO_DIR = os.path.join(PHOTO_BASE_DIR, "unidentified_bodies")
MISSING_PHOTO_DIR = os.path.join(PHOTO_BASE_DIR, "missing_persons")

# Optional API-key auth. Disabled by default (no key => open, for local dev).
# Set the API_KEY env var to require an "X-API-Key" header on data endpoints.
API_KEY = os.environ.get("API_KEY", "").strip()


async def require_api_key(x_api_key: Optional[str] = Header(None)):
    """Dependency enforcing the API key, but only when one is configured."""
    if not API_KEY:
        return  # auth disabled in dev
    if not x_api_key or x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


# ============================================================================
# DATABASE AUTO-SETUP
# ============================================================================

def ensure_database_schema():
    """Create database tables if they don't exist"""
    schema_file = 'database_schema_sqlite.sql'
    if not os.path.exists(DB_FILE):
        conn = sqlite3.connect(DB_FILE)
        if os.path.exists(schema_file):
            with open(schema_file, 'r') as f:
                conn.executescript(f.read())
            print(f"✓ Database created from schema: {DB_FILE}")
        else:
            conn.executescript('''
                CREATE TABLE IF NOT EXISTS missing_persons (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pid TEXT UNIQUE NOT NULL,
                    fir_number TEXT NOT NULL,
                    police_station TEXT NOT NULL,
                    reported_date TEXT NOT NULL,
                    name TEXT, age INTEGER,
                    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Unknown')),
                    height_cm INTEGER, build TEXT, hair_color TEXT, eye_color TEXT,
                    distinguishing_marks TEXT, clothing_description TEXT, person_description TEXT,
                    last_seen_date TEXT, last_seen_latitude REAL, last_seen_longitude REAL,
                    last_seen_address TEXT, profile_photo TEXT, extra_photos TEXT,
                    reporter_name TEXT, reporter_contact TEXT, additional_notes TEXT,
                    status TEXT DEFAULT 'Open',
                    created_at TEXT DEFAULT (datetime('now')),
                    updated_at TEXT DEFAULT (datetime('now'))
                );
                CREATE TABLE IF NOT EXISTS unidentified_bodies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pid TEXT UNIQUE NOT NULL,
                    case_number TEXT NOT NULL,
                    police_station TEXT NOT NULL,
                    reported_date TEXT NOT NULL,
                    found_date TEXT NOT NULL,
                    postmortem_date TEXT, estimated_age INTEGER,
                    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Unknown')),
                    height_cm INTEGER, build TEXT, complexion TEXT, face_shape TEXT,
                    hair_color TEXT, eye_color TEXT,
                    distinguishing_marks TEXT, distinctive_features TEXT,
                    clothing_description TEXT, jewelry_description TEXT, person_description TEXT,
                    found_latitude REAL, found_longitude REAL, found_address TEXT,
                    profile_photo TEXT, extra_photos TEXT,
                    cause_of_death TEXT, estimated_death_time TEXT, postmortem_report_url TEXT,
                    dna_sample_collected INTEGER DEFAULT 0,
                    dental_records_available INTEGER DEFAULT 0,
                    fingerprints_collected INTEGER DEFAULT 0,
                    additional_notes TEXT,
                    status TEXT DEFAULT 'Open',
                    created_at TEXT DEFAULT (datetime('now')),
                    updated_at TEXT DEFAULT (datetime('now'))
                );
                CREATE TABLE IF NOT EXISTS preliminary_uidb_reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pid TEXT UNIQUE NOT NULL,
                    report_number TEXT NOT NULL,
                    police_station TEXT NOT NULL,
                    reported_date TEXT NOT NULL DEFAULT (datetime('now')),
                    found_date TEXT NOT NULL,
                    estimated_age INTEGER,
                    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Unknown')),
                    height_cm INTEGER, build TEXT, hair_color TEXT, eye_color TEXT,
                    distinguishing_marks TEXT, clothing_description TEXT, person_description TEXT,
                    found_latitude REAL, found_longitude REAL, found_address TEXT,
                    profile_photo TEXT, extra_photos TEXT, initial_notes TEXT,
                    status TEXT DEFAULT 'Pending',
                    uidb_id INTEGER,
                    created_at TEXT DEFAULT (datetime('now')),
                    updated_at TEXT DEFAULT (datetime('now')),
                    FOREIGN KEY (uidb_id) REFERENCES unidentified_bodies(id)
                );
            ''')
            print(f"✓ Database created with inline schema: {DB_FILE}")
        conn.close()

ensure_database_schema()


# Initialize services
db_helper = DatabaseHelper()

try:
    text_embedder = TextEmbedder()
    TEXT_EMBEDDER_AVAILABLE = True
except Exception as e:
    TEXT_EMBEDDER_AVAILABLE = False
    text_embedder = None
    print(f"⚠ Text embedder not available: {e}")

try:
    qdrant_client = QdrantClient(path=QDRANT_DATA_PATH)
    vector_retrieval = VectorRetrieval(qdrant_path=QDRANT_DATA_PATH, client=qdrant_client)
    QDRANT_AVAILABLE = True
    print(f"✓ Qdrant connected: {QDRANT_DATA_PATH}")
except Exception as e:
    QDRANT_AVAILABLE = False
    qdrant_client = None
    vector_retrieval = None
    print(f"⚠ Qdrant not available - search functionality disabled: {e}")

if FACE_RECOGNITION_AVAILABLE:
    try:
        face_extractor = FaceEmbeddingExtractor(use_gpu=False)
    except Exception as e:
        FACE_RECOGNITION_AVAILABLE = False
        print(f"⚠ Face recognition init failed: {e}")

# Ensure photo directories exist
os.makedirs(UIDB_PHOTO_DIR, exist_ok=True)
os.makedirs(MISSING_PHOTO_DIR, exist_ok=True)


def _sweep_stale_temp_files():
    """Delete temp_*.jpg left behind by requests that died mid-flight.

    Uploads are staged as temp_<uuid>.jpg in the project root; if the process
    is killed between saving and cleanup, the file is orphaned forever.
    """
    removed = 0
    for stale in Path(".").glob("temp_*.jpg"):
        try:
            stale.unlink()
            removed += 1
        except OSError:
            pass
    if removed:
        print(f"✓ Cleaned up {removed} stale temp upload(s)")


_sweep_stale_temp_files()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class UnidentifiedBodyReport(BaseModel):
    """Model for unidentified body report"""
    police_station: str
    found_date: str
    postmortem_date: Optional[str] = None
    estimated_age: Optional[int] = None
    gender: str
    height_cm: Optional[int] = None
    build: Optional[str] = None
    complexion: Optional[str] = None
    face_shape: Optional[str] = None
    hair_color: Optional[str] = None
    eye_color: Optional[str] = None
    distinguishing_marks: Optional[str] = None
    distinctive_features: Optional[str] = None
    clothing_description: Optional[str] = None
    jewelry_description: Optional[str] = None
    person_description: Optional[str] = None
    found_latitude: Optional[float] = None
    found_longitude: Optional[float] = None
    found_address: Optional[str] = None
    cause_of_death: Optional[str] = None
    estimated_death_time: Optional[str] = None
    dna_sample_collected: bool = False
    dental_records_available: bool = False
    fingerprints_collected: bool = False


class SearchRequest(BaseModel):
    """Model for missing person search request"""
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[int] = None
    build: Optional[str] = None
    hair_color: Optional[str] = None
    eye_color: Optional[str] = None
    distinguishing_marks: Optional[str] = None
    last_seen_clothing: Optional[str] = None
    person_description: Optional[str] = None
    search_text: Optional[str] = None  # Custom search text
    top_n: int = Field(default=10, le=50)
    face_weight: float = Field(default=0.6, ge=0.0, le=1.0)
    text_weight: float = Field(default=0.4, ge=0.0, le=1.0)


class SearchResult(BaseModel):
    """Model for search result"""
    pid: str
    combined_score: float
    face_score: float
    text_score: float
    details: dict


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"}


def validate_upload_file(upload_file: UploadFile) -> None:
    """Validate uploaded file type and size before saving"""
    # Check content type
    content_type = upload_file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {content_type}. Allowed: JPEG, PNG, GIF, WebP, BMP"
        )
    # Check file size (read into memory, then reset)
    upload_file.file.seek(0, 2)  # Seek to end
    file_size = upload_file.file.tell()
    upload_file.file.seek(0)  # Reset to beginning
    if file_size > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({file_size // (1024*1024)}MB). Maximum: {MAX_UPLOAD_SIZE // (1024*1024)}MB"
        )


def save_upload_file(upload_file: UploadFile, destination: str) -> str:
    """Validate and save uploaded file to destination"""
    validate_upload_file(upload_file)
    try:
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        return destination
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save file")


def validate_date_field(value: str, field_name: str) -> str:
    """Validate and return a date string, raising 400 if invalid"""
    if not value:
        return value
    # Accept ISO datetime (2024-01-15T10:30) or date-only (2024-01-15)
    for fmt in ("%Y-%m-%dT%H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            datetime.strptime(value, fmt)
            return value
        except ValueError:
            continue
    raise HTTPException(
        status_code=400,
        detail=f"Invalid date format for '{field_name}': '{value}'. Expected YYYY-MM-DD or YYYY-MM-DDTHH:MM"
    )


def generate_text_description(data: dict) -> str:
    """Generate textual description for embedding"""
    parts = []
    
    if data.get('gender'):
        parts.append(data['gender'])
    if data.get('estimated_age') or data.get('age'):
        age = data.get('estimated_age') or data.get('age')
        parts.append(f"{age} years old")
    if data.get('height_cm'):
        parts.append(f"{data['height_cm']}cm tall")
    if data.get('build'):
        parts.append(f"{data['build']} build")
    if data.get('complexion'):
        parts.append(f"{data['complexion']} complexion")
    if data.get('face_shape'):
        parts.append(f"{data['face_shape']} face")
    if data.get('hair_color'):
        parts.append(f"{data['hair_color']} hair")
    if data.get('eye_color'):
        parts.append(f"{data['eye_color']} eyes")
    if data.get('distinguishing_marks'):
        parts.append(f"Marks: {data['distinguishing_marks']}")
    if data.get('distinctive_features'):
        parts.append(f"{data['distinctive_features']}")
    if data.get('clothing_description') or data.get('last_seen_clothing'):
        clothing = data.get('clothing_description') or data.get('last_seen_clothing')
        parts.append(f"Clothing: {clothing}")
    if data.get('found_address') or data.get('last_seen_address'):
        location = data.get('found_address') or data.get('last_seen_address')
        parts.append(f"Location: {location}")
    if data.get('person_description'):
        parts.append(data['person_description'])
    
    description = ". ".join(parts[:15]) + "."
    return description


def get_record_details(pid: str) -> dict:
    """Get full record details from database by PID"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Try unidentified_bodies table
    cursor.execute("SELECT * FROM unidentified_bodies WHERE pid = ?", (pid,))
    row = cursor.fetchone()
    
    if row:
        record = dict(row)
        record['record_type'] = 'unidentified_body'
    else:
        # Try missing_persons table
        cursor.execute("SELECT * FROM missing_persons WHERE pid = ?", (pid,))
        row = cursor.fetchone()
        if row:
            record = dict(row)
            record['record_type'] = 'missing_person'
        else:
            record = None
    
    conn.close()
    return record


# Fixed namespace so Qdrant point IDs are deterministic and globally unique.
# PIDs are globally unique across tables (e.g. "MP-2026-00002", "UIDB-2025-00101"),
# so deriving the point ID from the PID prevents collisions between missing_persons
# and unidentified_bodies that share the same integer table id.
_POINT_ID_NAMESPACE = uuid.UUID("6f0d8a1e-7c2b-4b6a-9e3d-1a2b3c4d5e6f")


def point_id_for(pid: str) -> str:
    """Deterministic, collision-free Qdrant point ID for a given record PID."""
    return str(uuid.uuid5(_POINT_ID_NAMESPACE, str(pid)))


def _match_band(score: float) -> str:
    """Label a combined similarity score so weak matches aren't shown as real.

    Thresholds are tuned for InsightFace (w600k) cosine similarity, where the
    same person typically scores >0.5 and different people <0.3.
    """
    if score >= 0.55:
        return "strong"
    if score >= 0.35:
        return "possible"
    return "weak"


def _cleanup_temp_file(path):
    """Safely remove a temp file"""
    if path and os.path.exists(path):
        try:
            os.remove(path)
        except Exception:
            pass


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/api")
async def api_root():
    """API information (the web app itself is served at /)."""
    return {
        "message": "Missing Persons & Unidentified Bodies API",
        "version": "1.0.0",
        "endpoints": {
            "report_unidentified_body": "/api/report-unidentified-body",
            "report_missing_person": "/api/report-missing-person",
            "search_missing_person": "/api/search-missing-person",
            "get_record": "/api/record/{pid}",
            "statistics": "/api/stats",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database
        conn = sqlite3.connect(DB_FILE)
        conn.close()
        db_status = "healthy"
    except Exception as e:
        db_status = "unhealthy"
        print(f"Database error: {e}")
    
    qdrant_status = "unhealthy"
    qdrant_error = None
    try:
        # Check Qdrant
        if qdrant_client is not None:
            collections = qdrant_client.get_collections()
            qdrant_status = "healthy"
        else:
            qdrant_error = "Qdrant client not initialized"
    except Exception as e:
        qdrant_error = str(e)
        print(f"Qdrant error: {e}")
    
    result = {
        "status": "healthy" if db_status == "healthy" and qdrant_status == "healthy" else "degraded",
        "database": db_status,
        "vector_db": qdrant_status,
        "face_recognition": "available" if FACE_RECOGNITION_AVAILABLE else "unavailable"
    }
    
    if qdrant_error:
        result["qdrant_error"] = qdrant_error
    
    return result


@app.post("/api/report-unidentified-body", dependencies=[Depends(require_api_key)])
async def report_unidentified_body(
    police_station: str = Form(...),
    found_date: str = Form(...),
    gender: str = Form(...),
    postmortem_date: Optional[str] = Form(None),
    estimated_age: Optional[int] = Form(None),
    height_cm: Optional[int] = Form(None),
    build: Optional[str] = Form(None),
    complexion: Optional[str] = Form(None),
    face_shape: Optional[str] = Form(None),
    hair_color: Optional[str] = Form(None),
    eye_color: Optional[str] = Form(None),
    distinguishing_marks: Optional[str] = Form(None),
    distinctive_features: Optional[str] = Form(None),
    clothing_description: Optional[str] = Form(None),
    jewelry_description: Optional[str] = Form(None),
    person_description: Optional[str] = Form(None),
    found_latitude: Optional[float] = Form(None),
    found_longitude: Optional[float] = Form(None),
    found_address: Optional[str] = Form(None),
    cause_of_death: Optional[str] = Form(None),
    estimated_death_time: Optional[str] = Form(None),
    dna_sample_collected: bool = Form(False),
    dental_records_available: bool = Form(False),
    fingerprints_collected: bool = Form(False),
    profile_photo: UploadFile = File(...)
):
    """
    Report a new unidentified body
    Adds record to database and vector database
    """
    temp_photo_path = f"temp_{uuid.uuid4()}.jpg"
    try:
        # Validate date fields
        found_date = validate_date_field(found_date, "found_date")
        if postmortem_date:
            postmortem_date = validate_date_field(postmortem_date, "postmortem_date")
        if estimated_death_time:
            estimated_death_time = validate_date_field(estimated_death_time, "estimated_death_time")
        
        # Save photo temporarily
        save_upload_file(profile_photo, temp_photo_path)
        
        # Prepare data dictionary for db_helper
        data = {
            'case_number': f"CASE-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}",
            'police_station': police_station,
            'reported_date': found_date,
            'found_date': found_date,
            'postmortem_date': postmortem_date,
            'estimated_age': estimated_age,
            'gender': gender,
            'height_cm': height_cm,
            'build': build,
            'complexion': complexion,
            'face_shape': face_shape,
            'hair_color': hair_color,
            'eye_color': eye_color,
            'distinguishing_marks': distinguishing_marks,
            'distinctive_features': distinctive_features,
            'clothing_description': clothing_description,
            'jewelry_description': jewelry_description,
            'person_description': person_description,
            'found_latitude': found_latitude,
            'found_longitude': found_longitude,
            'found_address': found_address,
            'cause_of_death': cause_of_death,
            'estimated_death_time': estimated_death_time,
            'dna_sample_collected': 1 if dna_sample_collected else 0,
            'dental_records_available': 1 if dental_records_available else 0,
            'fingerprints_collected': 1 if fingerprints_collected else 0,
            'postmortem_report_url': None,
            'additional_notes': None,
            'status': 'Open'
        }
        
        # Add to database
        pid = db_helper.add_unidentified_body(
            data=data,
            profile_photo_path=temp_photo_path
        )
        
        if not pid:
            raise Exception("Failed to add record to database")
        
        # Get the database ID
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM unidentified_bodies WHERE pid = ?", (pid,))
        result = cursor.fetchone()
        db_id = result[0] if result else None
        conn.close()
        
        # Clean up temp file
        _cleanup_temp_file(temp_photo_path)
        
        # Get the saved photo path
        record = get_record_details(pid)
        photo_path = record.get('profile_photo', '') if record else ''
        
        # Generate embeddings and add to vector DB
        embeddings_added = []
        
        # Build metadata (defined here so face embedding block can use it too)
        metadata = {
            "pid": pid,
            "record_type": "unidentified_body",
            "gender": gender,
            "estimated_age": estimated_age,
            "height_cm": height_cm,
            "build": build,
            "complexion": complexion,
            "face_shape": face_shape,
            "hair_color": hair_color,
            "eye_color": eye_color,
            "distinguishing_marks": distinguishing_marks,
            "distinctive_features": distinctive_features,
            "clothing_description": clothing_description,
            "found_address": found_address,
            "police_station": police_station,
            "found_date": found_date,
            "status": "Open",
        }
        metadata = {k: v for k, v in metadata.items() if v is not None}
        
        # 1. Text embedding
        if TEXT_EMBEDDER_AVAILABLE and text_embedder and QDRANT_AVAILABLE and qdrant_client:
            try:
                data_dict = {
                    'gender': gender,
                    'estimated_age': estimated_age,
                    'height_cm': height_cm,
                    'build': build,
                    'complexion': complexion,
                    'face_shape': face_shape,
                    'hair_color': hair_color,
                    'eye_color': eye_color,
                    'distinguishing_marks': distinguishing_marks,
                    'distinctive_features': distinctive_features,
                    'clothing_description': clothing_description,
                    'jewelry_description': jewelry_description,
                    'person_description': person_description,
                    'found_address': found_address
                }
                
                text_description = generate_text_description(data_dict)
                text_embedding = text_embedder.get_embedding(text_description)
                metadata["description"] = text_description
                
                point = PointStruct(
                    id=point_id_for(pid),
                    vector=text_embedding.tolist(),
                    payload=metadata
                )
                qdrant_client.upsert(
                    collection_name="text_embeddings",
                    points=[point]
                )
                embeddings_added.append("text")
                
            except Exception as e:
                print(f"Warning: Failed to add text embedding: {e}")
        
        # 2. Face embedding
        if FACE_RECOGNITION_AVAILABLE and QDRANT_AVAILABLE and qdrant_client and record and photo_path:
            try:
                full_photo_path = photo_path if os.path.isabs(photo_path) else os.path.join(os.getcwd(), photo_path)
                
                if os.path.exists(full_photo_path):
                    face_embedding = face_extractor.extract_embedding(full_photo_path, return_normalized=True)
                    
                    point = PointStruct(
                        id=point_id_for(pid),
                        vector=face_embedding.tolist(),
                        payload=metadata
                    )
                    qdrant_client.upsert(
                        collection_name="face_embeddings",
                        points=[point]
                    )
                    embeddings_added.append("face")
                
            except Exception as e:
                print(f"Warning: Failed to add face embedding: {e}")
        
        return {
            "status": "success",
            "message": "Unidentified body report created successfully",
            "data": {
                "pid": pid,
                "id": db_id,
                "photo_path": photo_path,
                "embeddings_added": embeddings_added
            }
        }
        
    except HTTPException:
        _cleanup_temp_file(temp_photo_path)
        raise
    except Exception as e:
        _cleanup_temp_file(temp_photo_path)
        print(f"Error creating unidentified body report: {e}")
        raise HTTPException(status_code=500, detail="Failed to create report")


@app.post("/api/report-missing-person", dependencies=[Depends(require_api_key)])
async def report_missing_person(
    fir_number: str = Form(...),
    police_station: str = Form(...),
    reported_date: str = Form(...),
    name: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    gender: str = Form(...),
    height_cm: Optional[int] = Form(None),
    build: Optional[str] = Form(None),
    hair_color: Optional[str] = Form(None),
    eye_color: Optional[str] = Form(None),
    distinguishing_marks: Optional[str] = Form(None),
    clothing_description: Optional[str] = Form(None),
    person_description: Optional[str] = Form(None),
    last_seen_date: Optional[str] = Form(None),
    last_seen_latitude: Optional[float] = Form(None),
    last_seen_longitude: Optional[float] = Form(None),
    last_seen_address: Optional[str] = Form(None),
    reporter_name: Optional[str] = Form(None),
    reporter_contact: Optional[str] = Form(None),
    additional_notes: Optional[str] = Form(None),
    profile_photo: Optional[UploadFile] = File(None)
):
    """
    Report a new missing person
    Adds record to database and vector database
    """
    temp_photo_path = None
    try:
        # Validate date fields
        reported_date = validate_date_field(reported_date, "reported_date")
        if last_seen_date:
            last_seen_date = validate_date_field(last_seen_date, "last_seen_date")
        
        if profile_photo:
            temp_photo_path = f"temp_{uuid.uuid4()}.jpg"
            save_upload_file(profile_photo, temp_photo_path)

        data = {
            'fir_number': fir_number,
            'police_station': police_station,
            'reported_date': reported_date,
            'name': name,
            'age': age,
            'gender': gender,
            'height_cm': height_cm,
            'build': build,
            'hair_color': hair_color,
            'eye_color': eye_color,
            'distinguishing_marks': distinguishing_marks,
            'clothing_description': clothing_description,
            'person_description': person_description,
            'last_seen_date': last_seen_date,
            'last_seen_latitude': last_seen_latitude,
            'last_seen_longitude': last_seen_longitude,
            'last_seen_address': last_seen_address,
            'reporter_name': reporter_name,
            'reporter_contact': reporter_contact,
            'additional_notes': additional_notes,
            'status': 'Open'
        }

        pid = db_helper.add_missing_person(
            data=data,
            profile_photo_path=temp_photo_path
        )

        if not pid:
            raise Exception("Failed to add record to database")

        _cleanup_temp_file(temp_photo_path)

        # --- Vector indexing for missing persons ---
        embeddings_added = []
        
        if TEXT_EMBEDDER_AVAILABLE and text_embedder and QDRANT_AVAILABLE and qdrant_client:
            try:
                # Get the database ID
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM missing_persons WHERE pid = ?", (pid,))
                result = cursor.fetchone()
                db_id = result[0] if result else None
                conn.close()
                
                if db_id:
                    data_dict = {
                        'gender': gender,
                        'age': age,
                        'height_cm': height_cm,
                        'build': build,
                        'hair_color': hair_color,
                        'eye_color': eye_color,
                        'distinguishing_marks': distinguishing_marks,
                        'clothing_description': clothing_description,
                        'person_description': person_description,
                        'last_seen_address': last_seen_address
                    }
                    
                    text_description = generate_text_description(data_dict)
                    text_embedding = text_embedder.get_embedding(text_description)
                    
                    metadata = {
                        "pid": pid,
                        "record_type": "missing_person",
                        "gender": gender,
                        "estimated_age": age,
                        "height_cm": height_cm,
                        "build": build,
                        "hair_color": hair_color,
                        "eye_color": eye_color,
                        "distinguishing_marks": distinguishing_marks,
                        "clothing_description": clothing_description,
                        "police_station": police_station,
                        "reported_date": reported_date,
                        "status": "Open",
                        "description": text_description,
                        "name": name,
                    }
                    metadata = {k: v for k, v in metadata.items() if v is not None}
                    
                    point = PointStruct(
                        id=point_id_for(pid),
                        vector=text_embedding.tolist(),
                        payload=metadata
                    )
                    qdrant_client.upsert(
                        collection_name="text_embeddings",
                        points=[point]
                    )
                    embeddings_added.append("text")
                    
                    # Face embedding if photo provided
                    if FACE_RECOGNITION_AVAILABLE:
                        record = get_record_details(pid)
                        photo_path = record.get('profile_photo', '') if record else ''
                        if photo_path:
                            full_photo_path = photo_path if os.path.isabs(photo_path) else os.path.join(os.getcwd(), photo_path)
                            if os.path.exists(full_photo_path):
                                face_embedding = face_extractor.extract_embedding(full_photo_path, return_normalized=True)
                                point = PointStruct(
                                    id=point_id_for(pid),
                                    vector=face_embedding.tolist(),
                                    payload=metadata
                                )
                                qdrant_client.upsert(
                                    collection_name="face_embeddings",
                                    points=[point]
                                )
                                embeddings_added.append("face")
            except Exception as e:
                print(f"Warning: Failed to add embeddings for missing person: {e}")

        return {
            "status": "success",
            "message": "Missing person report created successfully",
            "data": {
                "pid": pid,
                "embeddings_added": embeddings_added
            }
        }

    except HTTPException:
        _cleanup_temp_file(temp_photo_path)
        raise
    except Exception as e:
        _cleanup_temp_file(temp_photo_path)
        print(f"Error creating missing person report: {e}")
        raise HTTPException(status_code=500, detail="Failed to create report")


@app.post("/api/search-missing-person", dependencies=[Depends(require_api_key)])
async def search_missing_person(
    full_name: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    gender: Optional[str] = Form(None),
    height_cm: Optional[int] = Form(None),
    build: Optional[str] = Form(None),
    hair_color: Optional[str] = Form(None),
    eye_color: Optional[str] = Form(None),
    distinguishing_marks: Optional[str] = Form(None),
    last_seen_clothing: Optional[str] = Form(None),
    person_description: Optional[str] = Form(None),
    search_text: Optional[str] = Form(None),
    target_type: str = Form("missing_person"),
    top_n: int = Form(10),
    face_weight: float = Form(0.6),
    text_weight: float = Form(0.4),
    min_confidence: float = Form(0.1),
    photo: Optional[UploadFile] = File(None)
):
    """
    Search for matches in the opposite population.

    By default (target_type="missing_person") this identifies an unidentified
    body against the missing-persons register; pass "unidentified_body" for the
    reverse, or "any" to search both. Returns matches ranked by a modality-aware
    weighted similarity, filtered by min_confidence.
    """
    try:
        face_embedding = None
        text_embedding = None
        face_available_but_no_face = False

        if photo and FACE_RECOGNITION_AVAILABLE:
            temp_photo_path = f"temp_{uuid.uuid4()}.jpg"
            try:
                save_upload_file(photo, temp_photo_path)
                face_embedding = face_extractor.extract_embedding(temp_photo_path, return_normalized=True)
            except Exception as e:
                face_available_but_no_face = True
                print(f"Warning: Failed to extract face embedding: {e}")
            finally:
                _cleanup_temp_file(temp_photo_path)

        # Only build a text query when meaningful text was actually provided.
        # A photo-only search must NOT be diluted by an empty "." description.
        description = None
        if search_text and search_text.strip():
            description = search_text.strip()
        else:
            data_dict = {
                'full_name': full_name,
                'age': age,
                'gender': gender,
                'height_cm': height_cm,
                'build': build,
                'hair_color': hair_color,
                'eye_color': eye_color,
                'distinguishing_marks': distinguishing_marks,
                'last_seen_clothing': last_seen_clothing,
                'person_description': person_description
            }
            generated = generate_text_description(data_dict)
            # generate_text_description returns "." when nothing was supplied
            if generated and generated.strip(". ").strip():
                description = generated

        if description and TEXT_EMBEDDER_AVAILABLE and text_embedder:
            try:
                text_embedding = text_embedder.get_embedding(description)
            except Exception as e:
                print(f"Warning: Failed to generate text embedding: {e}")

        if face_embedding is None and text_embedding is None:
            detail = "No valid embeddings generated. Provide either a photo or text description."
            if face_available_but_no_face:
                detail = "No face could be detected in the uploaded photo. Try a clearer, front-facing image or add a text description."
            raise HTTPException(status_code=400, detail=detail)

        if not QDRANT_AVAILABLE or not vector_retrieval:
            raise HTTPException(
                status_code=503,
                detail="Vector search service is not available."
            )

        # Modality-aware weighting: only weight the modalities we actually have,
        # so a photo-only or text-only search is ranked on real signal alone.
        fw = max(0.0, face_weight) if face_embedding is not None else 0.0
        tw = max(0.0, text_weight) if text_embedding is not None else 0.0
        if fw == 0.0 and tw == 0.0:
            fw, tw = (1.0, 0.0) if face_embedding is not None else (0.0, 1.0)

        record_type = None if target_type in (None, "", "any") else target_type

        search_results = vector_retrieval.search_and_combine(
            face_embedding=face_embedding,
            text_embedding=text_embedding,
            w1=fw,
            w2=tw,
            top_n=top_n,
            limit_per_collection=50,
            record_type=record_type
        )

        enriched_results = []
        for result in search_results:
            score = result['combined_score']
            if score < min_confidence:
                continue
            pid = result['pid']
            record_details = get_record_details(pid)

            if record_details:
                if record_details.get('extra_photos'):
                    try:
                        record_details['extra_photos'] = json.loads(record_details['extra_photos'])
                    except Exception:
                        pass

                enriched_results.append({
                    "pid": pid,
                    "combined_score": score,
                    "face_score": result['face_score'],
                    "text_score": result['text_score'],
                    "confidence_percentage": round(score * 100, 2),
                    "match_band": _match_band(score),
                    "details": record_details
                })

        return {
            "status": "success",
            "message": f"Found {len(enriched_results)} potential matches",
            "search_params": {
                "query_text": description,
                "has_photo": photo is not None,
                "face_detected": face_embedding is not None,
                "target_type": record_type or "any",
                "effective_face_weight": round(fw, 3),
                "effective_text_weight": round(tw, 3),
                "min_confidence": min_confidence
            },
            "results": enriched_results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Search error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")


@app.get("/api/record/{pid}", dependencies=[Depends(require_api_key)])
async def get_record(pid: str):
    """Get full record details by PID"""
    try:
        record = get_record_details(pid)
        
        if not record:
            raise HTTPException(status_code=404, detail=f"Record not found: {pid}")
        
        if record.get('extra_photos'):
            try:
                record['extra_photos'] = json.loads(record['extra_photos'])
            except Exception:
                pass
        
        return {
            "status": "success",
            "data": record
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching record: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch record")


@app.get("/api/stats")
async def get_statistics():
    """Get database statistics"""
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM unidentified_bodies")
        uidb_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM missing_persons")
        mp_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT status, COUNT(*) FROM unidentified_bodies GROUP BY status")
        uidb_by_status = dict(cursor.fetchall())
        
        cursor.execute("SELECT status, COUNT(*) FROM missing_persons GROUP BY status")
        mp_by_status = dict(cursor.fetchall())
        
        conn.close()
        
        text_count = 0
        face_count = 0
        if qdrant_client:
            try:
                text_collection = qdrant_client.get_collection("text_embeddings")
                text_count = text_collection.points_count
            except Exception:
                pass
            
            try:
                face_collection = qdrant_client.get_collection("face_embeddings")
                face_count = face_collection.points_count
            except Exception:
                pass
        
        return {
            "status": "success",
            "data": {
                "database": {
                    "unidentified_bodies": uidb_count,
                    "missing_persons": mp_count,
                    "uidb_by_status": uidb_by_status,
                    "mp_by_status": mp_by_status
                },
                "vector_database": {
                    "text_embeddings": text_count,
                    "face_embeddings": face_count
                }
            }
        }
        
    except Exception as e:
        print(f"Error fetching statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")


@app.get("/api/unidentified-bodies", dependencies=[Depends(require_api_key)])
async def get_all_unidentified_bodies():
    """Get all unidentified body records"""
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT pid, police_station, found_date, gender, estimated_age, 
                   height_cm, build, status, profile_photo, found_address
            FROM unidentified_bodies 
            ORDER BY created_at DESC
            LIMIT 100
        """)
        
        records = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return {
            "status": "success",
            "data": records,
            "count": len(records)
        }
        
    except Exception as e:
        print(f"Error fetching records: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch records")


@app.get("/api/missing-persons", dependencies=[Depends(require_api_key)])
async def get_all_missing_persons():
    """Get all missing person records"""
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT pid, fir_number, police_station, reported_date, name, gender, 
                   age, height_cm, build, status, profile_photo, last_seen_address
            FROM missing_persons 
            ORDER BY created_at DESC
            LIMIT 100
        """)
        
        records = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return {
            "status": "success",
            "data": records,
            "count": len(records)
        }
        
    except Exception as e:
        print(f"Error fetching records: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch records")


SERVEABLE_PHOTO_SUFFIXES = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}


@app.get("/photos/{file_path:path}")
async def serve_photo(file_path: str):
    """Serve uploaded photos.

    Strictly confined to PHOTO_BASE_DIR: the resolved target must stay inside
    the photos directory and must be an image. Without this, a path like
    "/photos/../missing_persons.db" escaped the directory and served the whole
    database (and any source file) to unauthenticated callers.
    """
    base = Path(PHOTO_BASE_DIR).resolve()
    try:
        target = (base / file_path).resolve()
    except (OSError, ValueError):
        raise HTTPException(status_code=404, detail="Photo not found")

    if not target.is_relative_to(base):
        raise HTTPException(status_code=404, detail="Photo not found")
    if target.suffix.lower() not in SERVEABLE_PHOTO_SUFFIXES:
        raise HTTPException(status_code=404, detail="Photo not found")
    if not target.is_file():
        raise HTTPException(status_code=404, detail="Photo not found")

    return FileResponse(target)


# ============================================================================
# VECTOR DB BOOTSTRAP (makes a fresh deploy work with zero manual steps)
# ============================================================================

def _bootstrap_vector_db():
    """Create the Qdrant collections and index existing records if empty.

    qdrant_data/ is not committed, so a fresh deploy starts with no vector
    index at all and search would silently return nothing. This seeds it from
    whatever is already in SQLite. It only runs when the index is empty, so
    it's safe on every boot.
    """
    if not (QDRANT_AVAILABLE and qdrant_client and TEXT_EMBEDDER_AVAILABLE and text_embedder):
        print("⚠ Skipping vector bootstrap (qdrant or text embedder unavailable)")
        return
    try:
        from qdrant_client.models import Distance, VectorParams

        existing = {c.name for c in qdrant_client.get_collections().collections}
        for name, size in (("face_embeddings", 512), ("text_embeddings", 768)):
            if name not in existing:
                qdrant_client.create_collection(
                    collection_name=name,
                    vectors_config=VectorParams(size=size, distance=Distance.COSINE),
                )
                print(f"✓ Created Qdrant collection: {name}")

        if qdrant_client.count("text_embeddings").count > 0:
            return  # already indexed

        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        rows = []
        for table, rtype in (("unidentified_bodies", "unidentified_body"),
                             ("missing_persons", "missing_person")):
            try:
                for r in conn.execute(f"SELECT * FROM {table}").fetchall():
                    rows.append((dict(r), rtype))
            except sqlite3.Error:
                pass
        conn.close()

        if not rows:
            print("✓ Vector DB empty and no records to index yet")
            return

        print(f"⏳ Vector DB empty — indexing {len(rows)} record(s), this can take a minute…")
        text_n = face_n = 0
        for r, rtype in rows:
            pid = r.get("pid")
            if not pid:
                continue
            description = generate_text_description(r)
            metadata = {
                "pid": pid,
                "record_type": rtype,
                "gender": r.get("gender"),
                "estimated_age": r.get("estimated_age") or r.get("age"),
                "height_cm": r.get("height_cm"),
                "police_station": r.get("police_station"),
                "status": r.get("status", "Open"),
                "description": description,
                "name": r.get("name"),
            }
            metadata = {k: v for k, v in metadata.items() if v is not None}
            pt_id = point_id_for(pid)

            try:
                emb = text_embedder.get_embedding(description)
                qdrant_client.upsert("text_embeddings",
                                     [PointStruct(id=pt_id, vector=emb.tolist(), payload=metadata)])
                text_n += 1
            except Exception as e:
                print(f"  ! {pid} text embedding failed: {e}")

            photo = r.get("profile_photo")
            if FACE_RECOGNITION_AVAILABLE and photo:
                full = photo if os.path.isabs(photo) else os.path.join(os.getcwd(), photo)
                if os.path.exists(full):
                    try:
                        femb = face_extractor.extract_embedding(full, return_normalized=True)
                        qdrant_client.upsert("face_embeddings",
                                             [PointStruct(id=pt_id, vector=femb.tolist(), payload=metadata)])
                        face_n += 1
                    except Exception:
                        pass  # no detectable face — expected for some body photos

        print(f"✓ Bootstrap indexed {text_n} text / {face_n} face embeddings")
    except Exception as e:
        print(f"⚠ Vector bootstrap failed (search may be empty): {e}")


_bootstrap_vector_db()


# ============================================================================
# SERVE THE FRONTEND (single-service deployment)
# ============================================================================
# In production the built React app is served by this same process, so the
# whole product lives on ONE url with no CORS and no separate frontend host.
# This block must stay LAST: its catch-all route would otherwise swallow the
# /api and /photos routes defined above (FastAPI matches in declaration order).

FRONTEND_DIST = Path(__file__).parent / "frontend" / "dist"

if FRONTEND_DIST.is_dir():
    from fastapi.staticfiles import StaticFiles

    _assets = FRONTEND_DIST / "assets"
    if _assets.is_dir():
        app.mount("/assets", StaticFiles(directory=_assets), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        """Serve the built SPA, falling back to index.html for client routes."""
        dist = FRONTEND_DIST.resolve()
        if full_path:
            candidate = (dist / full_path).resolve()
            if candidate.is_relative_to(dist) and candidate.is_file():
                return FileResponse(candidate)
        return FileResponse(dist / "index.html")

    print(f"✓ Serving frontend from {FRONTEND_DIST}")
else:
    print("⚠ No frontend build found (frontend/dist) — API only")


# ============================================================================
# RUN APPLICATION
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    host = os.environ.get("API_HOST", "0.0.0.0")
    # PORT is the standard on every host (Hugging Face, Render, Railway…)
    port = int(os.environ.get("PORT") or os.environ.get("API_PORT") or "8000")
    
    print("\n" + "="*70)
    print("Starting Missing Persons & Unidentified Bodies API")
    print("="*70)
    print(f"Database: {DB_FILE}")
    print(f"Qdrant: {QDRANT_DATA_PATH} (in-process, disk-persisted)")
    print(f"Face Recognition: {'Available' if FACE_RECOGNITION_AVAILABLE else 'Not Available'}")
    print("="*70 + "\n")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=False,
        log_level="info"
    )
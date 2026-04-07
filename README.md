# FORENSYNC

<div align="center">

**Forensic Identification System**  
*Reuniting families through technology*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python)](https://python.org/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-DC244C)](https://qdrant.tech/)

A comprehensive platform for reporting, searching, and matching missing persons with unidentified bodies using AI-powered facial recognition and vector search.

</div>

---

## 🎯 Overview

**FORENSYNC** is an advanced forensic identification system that leverages AI and machine learning to help law enforcement agencies, forensic departments, and families identify missing persons and unidentified bodies. The platform combines traditional database management with cutting-edge facial recognition and semantic search capabilities.

### Key Capabilities

- 🔍 **AI-Powered Search** - Text-based and image-based search with semantic matching
- 👤 **Facial Recognition** - InsightFace-powered facial embeddings for accurate matching
- 🗄️ **Vector Database** - Qdrant for high-performance similarity search
- 📊 **Real-time Dashboard** - Live statistics and case management
- 📸 **Multi-Photo Support** - Profile and additional evidence photos
- 🌍 **Geolocation** - GPS coordinates for last seen/found locations
- 🔐 **Unique IDs** - Auto-generated PIDs (MP-2024-XXXXX, UIDB-2024-XXXXX)

---

## 🏗️ Architecture

### Technology Stack

Backend
- FastAPI - High-performance Python API framework
- SQLite - Lightweight relational database
- Qdrant - Vector similarity search engine
- InsightFace - State-of-the-art facial recognition
- Sentence Transformers - Text embedding models

Frontend
- React 18 - Modern UI library
- Vite - Lightning-fast development server
- React Router - Client-side routing
- Tailwind CSS 3 - Utility-first styling
- Axios - HTTP client

Design System
- Matter Font - Warp.dev's professional typeface
- Dark Theme - #0D0D0D background with #F87171 coral accents
- Animations - Smooth transitions and micro-interactions

### Project Structure

```
FORENSYNC/
├── backend/
│   ├── main.py                         # FastAPI application
│   ├── db_helper.py                    # Database operations
│   ├── face_embedding.py               # Facial recognition
│   ├── text_embedder.py                # Text embedding
│   ├── vector_retrieval.py             # Vector search
│   ├── vectordb.py                     # Qdrant integration
│   ├── missing_persons.db              # SQLite database
│   ├── qdrant_data/                    # Vector storage
│   └── photos/                         # Image storage
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     # Router configuration
│   │   ├── api.js                      # Backend API client
│   │   ├── components/
│   │   │   └── Layout.jsx              # Main layout with navbar
│   │   ├── pages/
│   │   │   ├── Home.jsx                # Dashboard
│   │   │   ├── SearchMatch.jsx         # Search interface
│   │   │   ├── Records.jsx             # Browse records
│   │   │   ├── ReportMissingPerson.jsx # Report form
│   │   │   └── ReportUnidentifiedBody.jsx
│   │   ├── index.css                   # Global styles + animations
│   │   └── main.jsx                    # React entry point
│   ├── tailwind.config.js              # Theme configuration
│   ├── vite.config.js                  # Dev server + proxy
│   └── package.json                    # Dependencies
│
└── docs/
    ├── API_DOCUMENTATION.md
    ├── DATABASE_README.md
    ├── FACE_RECOGNITION_README.md
    └── QDRANT_SETUP.md
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- 8GB RAM (for face recognition models)

### 1. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt
pip install -r requirements_face_recognition.txt

# Initialize database
python setup_database.py

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 📡 API Endpoints

### Health & Stats
- `GET /health` - System health check
- `GET /api/stats` - Dashboard statistics

### Search
- `POST /api/search/match` - Text-based semantic search
- `POST /api/search/image` - Facial recognition search

### Records
- `GET /api/missing-persons` - List all missing persons
- `GET /api/unidentified-bodies` - List all unidentified bodies

### Reporting
- `POST /api/report/missing-person` - Report a missing person
- `POST /api/report/unidentified-body` - Report an unidentified body

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for detailed API specs.

---

## 💡 Features

### 1. Smart Search

Text Search
- Semantic matching using Sentence Transformers
- Search by name, description, physical features, clothing
- Returns ranked results with similarity scores

Image Search
- Upload a photo for facial recognition
- InsightFace embeddings with ArcFace model
- Matches against 512-dimensional face vectors

### 2. Case Management

Missing Persons
- FIR number and police station
- Reporter contact information
- Physical description (height, age, gender, complexion)
- Clothing and distinguishing marks
- Last seen location with GPS coordinates
- Multiple photos support

Unidentified Bodies
- Forensic case number
- Body discovery details
- Postmortem observations
- DNA, dental, and fingerprint records
- Found location with GPS
- Evidence photos

### 3. Real-time Dashboard

- Total missing persons count
- Total unidentified bodies count
- Recent reports
- Match statistics

---

## 🎨 UI/UX Design

FORENSYNC follows Warp.dev's design language:

Color Palette
```css
Background:    #0D0D0D
Cards:         #262626
Borders:       #333333
Text Primary:  #FFFFFF
Text Muted:    #9B9B9B
Accent:        #F87171 (Coral)
```

Typography
- Font Family: Matter (Warp.dev's custom font)
- Weights: Regular (400), Medium (500)

Animations
- Fade-in transitions on page load
- Slide-in effects for cards
- Hover lift animations
- Shimmer loading states

---

## 🗄️ Database Schema

### Missing Persons Table
| Field | Type | Description |
|-------|------|-------------|
| pid | TEXT PRIMARY KEY | MP-2024-XXXXX |
| name | TEXT | Full name |
| age | INTEGER | Age in years |
| gender | TEXT | Male/Female/Other |
| height_cm | INTEGER | Height in cm |
| person_description | TEXT | Physical description |
| last_seen_address | TEXT | Last known location |
| last_seen_lat/lng | REAL | GPS coordinates |
| status | TEXT | Open/Matched/Closed |

### Unidentified Bodies Table
| Field | Type | Description |
|-------|------|-------------|
| pid | TEXT PRIMARY KEY | UIDB-2024-XXXXX |
| age_range | TEXT | Estimated age range |
| gender | TEXT | Gender identification |
| height_cm | INTEGER | Height in cm |
| body_description | TEXT | Physical description |
| found_address | TEXT | Discovery location |
| found_lat/lng | REAL | GPS coordinates |
| status | TEXT | Open/Matched/Closed |

See [DATABASE_README.md](DATABASE_README.md) for complete schema.

---

## 🧠 AI/ML Components

### Facial Recognition
- Model: InsightFace (Buffalo_L)
- Embedding Size: 512 dimensions
- Accuracy: 99.8% on LFW benchmark
- Backend: ONNX Runtime

### Text Embeddings
- Model: all-MiniLM-L6-v2
- Embedding Size: 384 dimensions
- Use Case: Semantic search across descriptions

### Vector Database
- Engine: Qdrant
- Distance Metric: Cosine similarity
- Collections: missing_persons, unidentified_bodies
- Indexing: HNSW algorithm

---

## 📚 Documentation

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [DATABASE_README.md](DATABASE_README.md) - Database schema and operations
- [FACE_RECOGNITION_README.md](FACE_RECOGNITION_README.md) - Face recognition setup
- [QDRANT_SETUP.md](QDRANT_SETUP.md) - Vector database configuration
- [GETTING_STARTED.md](GETTING_STARTED.md) - Step-by-step setup guide

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=sqlite:///./missing_persons.db

# Qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Face Recognition
FACE_MODEL_PATH=./models/buffalo_l

# API
API_HOST=0.0.0.0
API_PORT=8000
```

### Frontend Configuration

Edit `frontend/vite.config.js` to change backend URL:

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
```

---

## 🧪 Testing

### Backend Tests
```bash
python test_db_connection.py
python test_qdrant_init.py
python test_vector_retrieval.py
```

### API Testing
```bash
# Run test suite
python test_api.py

# Or use the interactive docs
# Visit http://localhost:8000/docs
```

---

## 🔐 Security

- ✅ CORS configured for specific origins
- ✅ File upload validation
- ✅ SQL injection prevention via parameterized queries
- ✅ Photos stored with UUID filenames
- ✅ Environment variables for sensitive data
- ⚠️ Production: Use HTTPS, authentication, rate limiting

---

## 🚢 Deployment

### Backend
```bash
# Build production
pip install -r requirements.txt

# Run with Gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

### Frontend
```bash
cd frontend
npm run build
# Deploy the 'dist' folder to a static host
```

---

## 🤝 Contributing

This project is part of the Hack4Safety initiative to leverage technology for social good.

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👥 Team

RaptureTwelve - Hack4Safety 2024

---

## 🆘 Support

For issues and questions:
- 📧 Check existing documentation in `/docs`
- 🐛 Report bugs via GitHub Issues
- 💬 Contact the development team

---

<div align="center">

FORENSYNC - *Bringing closure through technology*

Made with ❤️ for Hack4Safety

</div>
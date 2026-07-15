# ForenSync Fix — Progress Tracker

## Backend Fixes (Complete)
- [x] requirements.txt: Fixed — fastapi, uvicorn, sentence-transformers, etc. Removed openai.
- [x] db_helper.py: Thread-safe, table whitelist, finally blocks, data dict copy.
- [x] .gitignore: Added .venv/, *.db, qdrant_data/, node_modules/, *.msix, temp_*.jpg, sample dirs.
- [x] Phase 6 cleanup: Deleted vectordb.py, empty scripts, MySQL/PG scripts, temp files, msix.
- [x] main.py: Null guards, metadata scoping, vector indexing for missing persons, temp cleanup, auto-schema, API_HOST/PORT, bare except fixes, photo serving endpoint, error detail sanitization, CORS configurable.
- [x] main.py: File upload validation (type + size limit).
- [x] main.py: Input validation for date fields.
- [x] vector_retrieval.py: Age field fix, dimension fixes (768D), unused import removal.
- [x] vector_retrieval.py: Verbose print() statements removed from library code.

## Phase 3: Frontend Critical Fixes (Complete)
- [x] utils.js: Added missing exports — joinClasses, formatNumber, getStatusTone, assetUrl, summarizeRecord, extractErrorMessage.
- [x] api.js: Added named export for `api`; fixed searchMatch to use FormData + multipart/form-data.
- [x] main.jsx: Wrapped app in AppProvider.
- [x] App.jsx: Added Dashboard/CaseRecords routes; render RecordDrawer/ToastHost.
- [x] AppContext.jsx: Fixed imports — api named import, extractErrorMessage + summarizeRecord from utils.
- [x] CaseRecords.jsx: Fixed imports — api named, extractErrorMessage from utils.
- [x] Dashboard.jsx: Fixed imports (formatNumber, getStatusTone, joinClasses all from utils); removed unused MapPin.
- [x] package.json: Added lucide-react; fixed package name to forensync-frontend.

## Phase 4: Frontend Quality Fixes (Complete)
- [x] Layout.jsx: Added Dashboard/Cases to nav; switched to stable label-based keys.
- [x] Records.jsx: Added onClick handler to cards (calls openRecord from useApp).
- [x] SearchMatch.jsx: Fixed hardcoded localhost:8000 URL → assetUrl(); fixed blob URL memory leak.
- [x] ReportMissingPerson.jsx: Fixed blob URL memory leak.
- [x] ReportUnidentifiedBody.jsx: Fixed blob URL memory leak.
- [x] ErrorBoundary.jsx: Created new file; wired into main.jsx wrapping the full app.
- [x] SystemOffline.jsx: Removed hardcoded http://localhost:8000 from UI text.

## Phase 5: Security & Config (Complete)
- [x] .gitignore: Done (see Backend above).
- [x] main.py CORS: Configurable from env var (done above).
- [x] build.sh: Changed to requirements_production.txt; converted to LF line endings.
- [x] railway-build.sh: Converted to LF line endings.

## Phase 7: Install & Verify (user will run manually)
- [ ] npm install in frontend/
- [ ] npm run build
- [ ] python -c "from main import app"

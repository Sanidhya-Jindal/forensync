# ForenSync Fix — Progress Tracker

## Remaining Backend (main.py, vector_retrieval.py)
- [ ] main.py: Add file upload validation (type + size check)
- [ ] main.py: Add input validation for date fields
- [ ] vector_retrieval.py: Reduce verbose print() statements

## Phase 3: Frontend Critical Fixes (P0)
- [ ] utils.js: Add missing exports (joinClasses, formatNumber, getStatusTone, assetUrl, summarizeRecord, extractErrorMessage)
- [ ] api.js: Add named export for `api` + fix searchMatch FormData
- [ ] main.jsx: Wrap app in AppProvider
- [ ] App.jsx: Add Dashboard/CaseRecords routes + render RecordDrawer/ToastHost
- [ ] AppContext.jsx: Fix imports (api default, extractErrorMessage from utils, summarizeRecord from utils)
- [ ] CaseRecords.jsx: Fix imports
- [ ] Dashboard.jsx: Fix imports + remove unused MapPin
- [ ] package.json: Add lucide-react, fix package name

## Phase 4: Frontend Quality Fixes (P1)
- [ ] Layout.jsx: Add Dashboard/CaseRecords to nav, use stable keys
- [ ] Records.jsx: Add onClick handler to cards
- [ ] SearchMatch.jsx: Fix hardcoded photo URL + blob leak
- [ ] ReportMissingPerson.jsx: Fix blob URL leak
- [ ] ReportUnidentifiedBody.jsx: Fix blob URL leak
- [ ] ErrorBoundary.jsx: Create new file
- [ ] SystemOffline.jsx: Remove hardcoded localhost URL

## Phase 7: Install & Verify (manual, after all above)
- [ ] npm install in frontend/
- [ ] npm run build
- [ ] python -c "from main import app"

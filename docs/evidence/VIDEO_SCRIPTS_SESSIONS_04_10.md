# Video Scripts Sessions 04-10

## Session 4 Script (60 min)

Title: `S04_Data_Contract_and_API_Alignment`

### 0:00-3:00 Opening

"Hi, this is Session 4. I’ll explain the canonical data contract and how frontend and backend API paths align with that contract."

### 3:00-12:00 Canonical Record Shape

Show:
- `docs/LLD.md` (data contract section)
- `newBackend/BackendCode/mock_data/processed_data.json`

Say:
- "The core identity fields are `created_at` and `entry_id`."
- "Sensor fields are dynamic and discovered from data keys."

### 12:00-25:00 Stream Discovery and Filtering Contract

Show:
- `newBackend/BackendCode/services/mockService.js`
- `newBackend/BackendCode/controllers/mockController.js`

Say:
- "`/api/stream-names` discovers stream keys, excluding metadata fields."
- "`/api/filter-streams` returns selected streams plus identity fields."

### 25:00-40:00 Frontend Consumption Behavior

Show:
- `new-frontend/frontend/src/hooks/useStreamNames.js`
- `new-frontend/frontend/src/hooks/useFilteredData.js`

Say:
- "Frontend expects stable identity fields and dynamic stream keys."
- "Filtering pipeline projects only selected keys for visualization and stats."

### 40:00-52:00 Mismatch Risks and Boundaries

Show:
- `docs/LLD.md` (known notes)

Say:
- "Current mock/live path differences are documented to prevent hidden integration failure."

### 52:00-60:00 Close

"Session 4 summary: contract consistency is the foundation for architecture reliability and non-disruptive evolution."

---

## Session 5 Script (60 min)

Title: `S05_Frontend_Hook_Data_Lifecycle`

### 0:00-3:00 Opening

"Hi, this is Session 5. I’ll explain frontend hook lifecycle from data load to rendered insights."

### 3:00-18:00 Data Load Hook

Show:
- `new-frontend/frontend/src/hooks/useSensorData.js`

Say:
- "This hook controls source mode: mock vs API."
- "It returns `data`, `loading`, and `error` states for rendering safety."

### 18:00-32:00 Stream Name Derivation

Show:
- `new-frontend/frontend/src/hooks/useStreamNames.js`

Say:
- "Stream names are inferred from keys, excluding `entry_id` and `created_at`."
- "This makes selector options dynamic per dataset schema."

### 32:00-48:00 Filtered Projection Pipeline

Show:
- `new-frontend/frontend/src/hooks/useFilteredData.js`

Say:
- "Time/id boundaries are applied first."
- "Then selected stream keys are projected into chart-ready records."

### 48:00-56:00 Dashboard Integration

Show:
- `new-frontend/frontend/src/components/Dashboard.jsx`

Say:
- "Hooks feed dashboard state and control conditional chart sections."

### 56:00-60:00 Close

"Session 5 summary: hooks form the data orchestration layer between backend/raw data and visualization components."

---

## Session 6 Script (60 min)

Title: `S06_Correlation_and_Insight_Logic`

### 0:00-3:00 Opening

"Hi, this is Session 6. I’ll break down correlation and insight logic used in the dashboard."

### 3:00-22:00 Pearson Correlation Utility

Show:
- `new-frontend/frontend/src/utils/correlationUtils.js`

Say:
- "This implements Pearson correlation from means, covariance-style numerator, and variance-normalized denominator."
- "Pair search is `O(k^2*n)` for `k` streams and `n` rows."

### 22:00-35:00 Most Correlated Pair Rendering

Show:
- `new-frontend/frontend/src/components/MostCorrelatedPair.jsx`

Say:
- "For 3+ streams, pairwise checks select strongest positive correlation pair."

### 35:00-46:00 Variance Guard

Show:
- `new-frontend/frontend/src/utils/varianceUtils.js`

Say:
- "Guard avoids misleading visualization when one stream is constant."

### 46:00-56:00 Scatter + Trendline

Show:
- `new-frontend/frontend/src/components/ScatterPlot.jsx`
- `new-frontend/frontend/src/utils/trendlineUtils.js`

Say:
- "Scatter points represent pair samples; trendline gives directional readability."

### 56:00-60:00 Close

"Session 6 summary: this module bridges statistical signal extraction with user-facing explainability."

---

## Session 7 Script (45 min)

Title: `S07_Python_Analytics_Path_and_Separation`

### 0:00-3:00 Opening

"Hi, this is Session 7. I’ll explain the Python analytics path and why it is currently separate from active frontend runtime."

### 3:00-20:00 Algorithm Layer

Show:
- `data_science/algorithms/correlation_based.py`
- `data_science/algorithms/mean_based.py`
- `data_science/algorithms/volatility_based.py`

Say:
- "Algorithms are reusable, notebook-friendly, and service-callable."

### 20:00-32:00 Service Wrappers

Show:
- `data_science/development/choose_algorithm.py`
- `data_science/development/server.py`

Say:
- "Flask layer handles file ingest and algorithm routing."

### 32:00-41:00 Separation Rationale

Say:
- "Current frontend uses local JS correlation for lightweight demo path."
- "Python path represents heavier analytics pipeline and extensibility track."

### 41:00-45:00 Close

"Session 7 summary: separation is architectural stage-based, not conceptual contradiction."

---

## Session 8 Script (60 min)

Title: `S08_Django_DRF_Path_and_Extensibility`

### 0:00-3:00 Opening

"Hi, this is Session 8. I’ll explain the Django DRF backend track and how it supports future persistence-oriented architecture."

### 3:00-18:00 Settings and API Root

Show:
- `backend/iot_backend/iot_backend/settings.py`
- `backend/iot_backend/iot_backend/urls.py`

Say:
- "Django track includes CORS-enabled API scaffolding and app routing."

### 18:00-35:00 Timeseries App Components

Show:
- `backend/iot_backend/timeseries/models.py`
- `backend/iot_backend/timeseries/serializers.py`
- `backend/iot_backend/timeseries/views.py`
- `backend/iot_backend/timeseries/urls.py`

Say:
- "Model-viewset-serializer structure formalizes data access and response standardization."

### 35:00-50:00 Architectural Role in Ecosystem

Say:
- "This path is optional extension in current HLD, but important for production-grade evolution."

### 50:00-60:00 Close

"Session 8 summary: Django DRF path is a persistence-ready extension architecture, consistent with roadmap diagrams."

---

## Session 9 Script (60 min)

Title: `S09_DevOps_Deployment_and_Operations_View`

### 0:00-3:00 Opening

"Hi, this is Session 9. I’ll cover deployment and operations architecture using Docker and monitoring artifacts."

### 3:00-20:00 Compose Topology

Show:
- `Docker/docker-compose.yaml`

Say:
- "Compose declares service graph and dependencies for db/backend/frontend/monitoring services."

### 20:00-34:00 Dockerfiles and Runtime Boundaries

Show:
- `Docker/Backend-Dockerfile`
- `Docker/Frontend-Dockerfile`

Say:
- "Container build boundaries align with modular architecture components."

### 34:00-48:00 Monitoring View Alignment

Show:
- `docs/diagrams/22-6-monitoring-and-operations-view.png`

Say:
- "Health and metrics flow map to operations observability narrative."

### 48:00-60:00 Close

"Session 9 summary: deployment and monitoring assets reinforce architecture quality attributes: operability and reliability."

---

## Session 10 Script (45 min)

Title: `S10_Evidence_Traceability_and_Planner_Governance`

### 0:00-3:00 Opening

"Hi, this is Session 10. I’ll walk through the governance evidence proving architecture-led contribution traceability."

### 3:00-15:00 Worklog and Evidence Index

Show:
- `docs/evidence/worklog.md`
- `docs/evidence/evidence_index.md`

Say:
- "Worklog captures effort distribution; evidence index maps claims to artifacts."

### 15:00-28:00 Planner Traceability

Show:
- Planner board URL
- `docs/evidence/PLANNER_TRACEABILITY.md`

Say:
- "Software Architecture bucket tickets map directly to code/docs/test artifacts."

### 28:00-38:00 SFIA and Professional Mapping

Show:
- `docs/sfia/sfia_skill_mapping.md`

Say:
- "This maps technical actions to recognized professional competencies."

### 38:00-45:00 Close

"Session 10 summary: governance artifacts make architecture contribution assessable, reproducible, and auditable."

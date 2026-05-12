# Video Scripts Sessions 01-03

## Session 1 Script (75 min)

Title: `S01_Primary_Architecture_Runtime_Path`

### 0:00-2:00 Opening

"Hi, this is Session 1.
In this walkthrough I’ll explain the primary software architecture path of this project, how the modules are separated, and how that separation supports maintainability and non-disruptive enhancement."

### 2:00-10:00 Repo Context (`README.md`)

- "At repository level, this is an Intelligent IoT Data Management Platform."
- "It includes multiple tracks: frontend variants, Node backend, Django backend, and data science modules."
- "For this architecture walkthrough, I’m focusing on the converged path: `new-frontend/frontend` and `newBackend/BackendCode`."

### 10:00-25:00 HLD Runtime Path (`docs/HLD_visual.md`)

- "This HLD path shows browser to React dashboard to Node API to processed dataset."
- "The key point is deliberate layering: presentation, application API, and data access."
- "This gives us clear extension points for reliability and analytics integration later."

### 25:00-40:00 LLD Layering (`docs/LLD.md`)

- "LLD describes file-level responsibilities."
- "Routes receive request paths."
- "Controllers handle request/response shaping."
- "Services apply business logic."
- "Repository handles file data access."
- "This is textbook separation of concerns."

### 40:00-55:00 Frontend Flow (`Dashboard.jsx`)

- "User selects streams and time ranges in dashboard."
- "State updates trigger filtering logic."
- "Visualization components update from filtered data."
- "Correlation utilities are used when stream combinations match expected conditions."

### 55:00-68:00 Backend Flow (`app.js`, `routes/mock.js`)

- "Backend exposes API under `/api`."
- "Routes delegate to controllers."
- "Controllers call services."
- "Services call repository for data."
- "This flow keeps each file focused and easier to test."

### 68:00-75:00 Close + Evidence Mapping

"Session 1 summary: I covered converged runtime architecture and file-level module responsibilities.
Evidence linkage: `docs/LLD.md`, `docs/HLD_visual.md`, backend route layering, and evidence index references around architecture modules."

---

## Session 2 Script (60 min)

Title: `S02_HLD_Diagrams_Explained`

### 0:00-3:00 Opening

"Hi, this is Session 2.
I’ll walk through all architecture diagrams and explain what each one contributes to system understanding."

### 3:00-10:00 Why Diagrams Matter

- "Diagrams reduce ambiguity."
- "They align software engineering, data science, and operations views."
- "They provide shared language for implementation and assessment."

### 10:00-18:00 System Context (`22-1`)

- "Actors: analyst/operator through browser."
- "Primary path: React dashboard to Node API to processed data."
- "Optional extensions: Django and analytics modules."

### 18:00-26:00 Layered Components (`22-2`)

- "Presentation layer: dashboard, hooks, visual components."
- "API layer: routes/controllers/services."
- "Data/analytics layer: repository and algorithm logic."
- "Vertical dependency flows downward across layers."

### 26:00-35:00 Sequence Flow (`22-3`)

- "User selects streams."
- "Frontend sends filter request."
- "API validates, service processes, repository reads data file."
- "Filtered payload returns and charts refresh."

### 35:00-43:00 Data Insight Flow (`22-4`)

- "Raw CSV -> preprocessing -> canonical records."
- "Stream discovery and filtering."
- "Correlation computation and insight labeling."
- "Rendered insight cards and plots."

### 43:00-50:00 Deployment (`22-5`)

- "Browser accesses frontend."
- "Frontend connects to Node API."
- "Local processed data is current source."
- "Django/Flask/PostgreSQL shown as extension path."

### 50:00-56:00 Monitoring + Roadmap (`22-6`, `22-7`)

- "Health endpoint + metrics export path."
- "Prometheus/Grafana style observability model."
- "Roadmap phases: convergence, analytics integration, hardening, persistence extension."

### 56:00-60:00 Close

"Session 2 covered all seven HLD diagrams.
These diagrams are included as evidence artifacts and referenced in the final portfolio."

---

## Session 3 Script (75 min)

Title: `S03_Backend_Reliability_Contribution`

### 0:00-3:00 Opening

"Hi, this is Session 3.
I’ll explain the non-disruptive reliability contribution: health endpoint, smoke tests, and path hardening."

### 3:00-12:00 Contribution Scope

- "Goal: improve reliability without breaking existing behavior."
- "Approach: additive endpoint, test coverage, and robust path resolution."
- "No contract-breaking route changes."

### 12:00-25:00 Health Endpoint (`app.js`)

- "`GET /health` returns status, timestamp, and uptime."
- "This enables service monitoring and startup verification."
- "It is additive and safe."

### 25:00-38:00 App/Server Split (`app.js`, `server.js`)

- "App definition is separated from server startup."
- "This makes testing easier because tests can import app directly."
- "Runtime behavior remains equivalent for users."

### 38:00-50:00 Repository Hardening (`mockRepository.js`)

- "Earlier risk: relative path behavior depended on start directory."
- "Now path handling validates env variable and resolves predictably."
- "This improves reliability across WSL/dev contexts."

### 50:00-65:00 Smoke Test Walkthrough (`api.smoke.test.js`)

- "Test 1 checks root endpoint behavior."
- "Test 2 checks health payload contract."
- "Test 3 checks stream-names endpoint returns non-empty array."
- "Test 4 checks invalid payload returns expected 400 error."

### 65:00-72:00 Live Command

Run:

```bash
cd newBackend
npm test
```

Narration:

- "I’m running smoke tests now."
- "Pass results validate that additive reliability controls didn’t disrupt core APIs."

### 72:00-75:00 Close

"Session 3 summary: reliability baseline implemented and verified through tests, with non-disruptive integration into existing architecture.
Evidence files are mapped in evidence index and snippet showcase."

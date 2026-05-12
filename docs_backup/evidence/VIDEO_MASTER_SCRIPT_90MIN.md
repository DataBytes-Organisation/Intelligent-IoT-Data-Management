# 90-Minute Master Video Script

Use this script for `VID_001_master-architecture-evidence-walkthrough_90m.mp4`.

## 0-5 min: Opening and Scope

Say:

> This is the representative architecture and technical contribution walkthrough for the Intelligent IoT Data Management Platform. The core contribution is architecture-led integration of Data Science and Cybersecurity work without disrupting the existing codebase. The written worklog records 120 hours, split into 40 hours technical contribution and 80 hours code understanding, HLD, LLD, and evidence preparation.

Show:

- `docs/evidence/FINAL_SUBMISSION_PORTFOLIO.docx`
- `docs/evidence/worklog.md`
- `docs/evidence/evidence_index.md`

## 5-15 min: Repository Structure and Runtime Context

Show:

- Top-level folders
- `new-frontend/frontend`
- `newBackend/BackendCode`
- `data_science/algorithms`
- `backend/iot_backend`

Explain:

- Primary runtime path: React/Vite + Node/Express + processed JSON.
- Optional extension paths: Python/Flask analytics and Django DRF.

## 15-30 min: HLD and Architecture Diagrams

Show:

- `docs/HLD_visual.docx`
- `docs/diagrams/22-1-system-context-diagram.png`
- `docs/diagrams/22-2-layered-component-diagram-primary-runtime.png`
- `docs/diagrams/22-3-end-to-end-sequence-diagram-stream-filtering.png`
- `docs/diagrams/22-6-monitoring-and-operations-view.png`

Explain:

- System context and component layering.
- Sequence flow for stream filtering.
- Monitoring and operations evidence.

## 30-45 min: LLD and Code-Level Traceability

Show:

- `docs/LLD.md`
- backend route/controller/service/repository files
- frontend hooks and correlation utilities

Explain:

- How LLD maps code modules to architecture responsibilities.
- Why module boundaries reduce disruption.
- Known mismatch notes and architecture risks.

## 45-60 min: Technical Contribution Implementation

Show:

- `newBackend/BackendCode/app.js`
- `newBackend/BackendCode/server.js`
- `newBackend/BackendCode/repositories/mockRepository.js`
- `newBackend/tests/api.smoke.test.js`
- `newBackend/package.json`

Run:

```bash
cd newBackend
npm test
```

Explain:

- Health endpoint as reliability baseline.
- Smoke tests as objective verification.
- Path hardening for WSL/dev reliability.

## 60-70 min: Data Science Contribution

Show:

- `new-frontend/frontend/src/utils/correlationUtils.js`
- `new-frontend/frontend/src/utils/varianceUtils.js`
- `data_science/algorithms/correlation_based.py`
- `docs/evidence/code_snippets_showcase.md`

Explain:

- Pearson correlation behavior.
- Variance guard as insight quality control.
- Separation between current frontend analytics and Python algorithm module.

## 70-80 min: Cybersecurity and Governance Contribution

Show:

- `docs/sfia/sfia_skill_mapping.md`
- `docs/evidence/evidence_index.md`
- `docs/evidence/PLANNER_TRACEABILITY.md`
- Microsoft Planner board Software Architecture bucket

Explain:

- Cybersecurity-aligned contribution: input validation, health endpoint, assurance evidence.
- Governance through Planner and evidence traceability.

## 80-88 min: Final Submission Portfolio

Show:

- `docs/evidence/FINAL_SUBMISSION_PORTFOLIO.docx`
- `docs/evidence/CAPSTONE_EVIDENCE_REPORT.docx`
- `docs/evidence/WORKLOG_120H.docx`
- `docs/evidence/EVIDENCE_INDEX.docx`

Explain:

- How final report connects diagrams, code snippets, tests, SFIA, Planner, and worklog.

## 88-90 min: Closing Statement

Say:

> This video is representative walkthrough evidence. The detailed work is recorded in the written worklog, Planner tickets, evidence index, HLD/LLD documents, diagrams, and code/test artifacts. The contribution demonstrates software architecture as the integration mechanism for Data Science and Cybersecurity outcomes.

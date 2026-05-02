# Evidence Index

Track all proof artifacts for your technical contribution.

## How to Use

- Add one row per artifact.
- Link each artifact to a worklog entry and task ID.
- Keep filenames date-stamped when possible.

## Artifact Register

| ID | Date | Worklog Ref | Task ID | Artifact Type | Path | What It Proves |
|---|---|---|---|---|---|---|
| EV-001 | 2026-04-30 | Entry 12 | WS4-T2 | Test output | `newBackend/tests/api.smoke.test.js` | Non-disruptive reliability test implementation |
| EV-002 | 2026-04-30 | Entry 12 | WS4-T2 | Test run output | `newBackend/package.json` (`npm test`) | Core API routes verified with automated smoke suite |
| EV-003 | 2026-04-30 | Entry 11 | WS4-T1 | Backend reliability code | `newBackend/BackendCode/app.js` | Added `GET /health` observability endpoint |
| EV-004 | 2026-04-30 | Entry 13 | WS4-T3 | Bug fix artifact | `newBackend/BackendCode/repositories/mockRepository.js` | Path-resolution defect identified and corrected |
| EV-005 | 2026-04-29 | Entry 08 | WS3-T1 | Design specification | `docs/LLD.md` | Full low-level design aligned to actual implementation |
| EV-006 | 2026-04-30 | Entry 10 | WS3-T3 | Submission artifact | `docs/LLD.docx` | Word-ready LLD export for assessor |
| EV-007 | 2026-04-28 | Entry 05 | WS2-T1 | Diagram pack | `docs/diagrams/` | HLD visualization evidence in rendered graphics |
| EV-008 | 2026-04-28 | Entry 07 | WS2-T3 | Submission artifact | `docs/HLD_visual.docx` | Graphical HLD output embedded for Word review |
| EV-009 | 2026-04-30 | Entry 14 | WS5-T1 | Data science analysis | `new-frontend/frontend/src/utils/correlationUtils.js` | Pearson correlation implementation inspected and documented |
| EV-010 | 2026-04-30 | Entry 14 | WS5-T1 | Guard-condition analysis | `new-frontend/frontend/src/utils/varianceUtils.js` | Variance checks prevent invalid insight rendering |
| EV-011 | 2026-04-30 | Entry 15 | WS5-T2 | Algorithm traceability | `data_science/algorithms/correlation_based.py` | Python correlation anomaly path mapped to project context |
| EV-012 | 2026-05-01 | Entry 21 | WS7-T1 | Research evidence | `docs/research/01_ai_literature_review_summary.md` | Instructor link engagement and applied synthesis |
| EV-013 | 2026-05-01 | Entry 21 | WS7-T1 | Research evidence | `docs/research/02_primary_vs_secondary_sources.md` | Source-quality method integrated into documentation workflow |
| EV-014 | 2026-05-01 | Entry 21 | WS7-T1 | Research evidence | `docs/research/03_reference_strategy.md` | Referencing practice integrated into capstone artifacts |
| EV-015 | 2026-05-01 | Entry 21 | WS7-T1 | Research evidence | `docs/research/04_research_methods_selection.md` | Method-selection rationale for team research approach |
| EV-016 | 2026-05-01 | Entry 22 | WS7-T2 | Cross-team research | `docs/research/05_frontend_color_research_summary.md` | Frontend color research support and knowledge transfer |
| EV-017 | 2026-05-01 | Entry 21 | WS7-T1 | Infographic planning | `docs/research/06_infographic_evidence_plan.md` | Plan for visual evidence outputs |
| EV-018 | 2026-05-01 | Entry 23 | WS7-T3 | Professional standards mapping | `docs/sfia/sfia_skill_mapping.md` | SFIA-aligned competency evidence matrix |
| EV-019 | 2026-05-01 | Entry 20 | WS6-T3 | Governance template | `docs/meetings/meeting_minutes_template.md` | Meeting evidence collection framework |
| EV-020 | 2026-05-01 | Entry 24 | WS7-T4 | Consolidated evidence | `docs/evidence/worklog.md` | 120-hour contribution ledger (40 technical + 80 architecture/documentation) |
| EV-021 | 2026-04-30 | Entry 04 | WS1-T4 | Commit timeline | `git log` output (captured in assistant session) | Historical traceability of major repository additions |
| EV-022 | 2026-04-30 | Entry 16 | WS5-T3 | Runtime validation | Frontend startup logs and Node compatibility notes | Demonstrates environment diagnosis and risk capture |
| EV-023 | 2026-04-28 | Entry 05 | WS2-T1 | Architecture diagram | `docs/diagrams/22-1-system-context-diagram.png` | System context visualization aligned to HLD section 22.1 |
| EV-024 | 2026-04-28 | Entry 05 | WS2-T1 | Architecture diagram | `docs/diagrams/22-2-layered-component-diagram-primary-runtime.png` | Layered runtime component decomposition |
| EV-025 | 2026-04-28 | Entry 05 | WS2-T1 | Architecture diagram | `docs/diagrams/22-3-end-to-end-sequence-diagram-stream-filtering.png` | End-to-end stream filtering interaction flow |
| EV-026 | 2026-04-28 | Entry 05 | WS2-T1 | Architecture diagram | `docs/diagrams/22-4-data-processing-and-insight-flow.png` | Data preprocessing to insight rendering pipeline |
| EV-027 | 2026-04-28 | Entry 05 | WS2-T1 | Architecture diagram | `docs/diagrams/22-5-deployment-view-current-ecosystem.png` | Deployment and extension path structure |
| EV-028 | 2026-04-28 | Entry 05 | WS2-T1 | Architecture diagram | `docs/diagrams/22-6-monitoring-and-operations-view.png` | Monitoring and operations flow mapping |
| EV-029 | 2026-04-28 | Entry 05 | WS2-T1 | Architecture diagram | `docs/diagrams/22-7-convergence-roadmap-diagram.png` | Convergence milestones and task roadmap |
| EV-030 | 2026-05-01 | Entry 24 | WS7-T4 | Infographic | `docs/evidence/infographic-technical-contribution-timeline.svg` | Visual proof of 120-hour allocation by workstream |
| EV-031 | 2026-05-01 | Entry 24 | WS7-T4 | Infographic | `docs/evidence/infographic-reliability-test-evidence.svg` | Reliability contribution summary with test outcomes |
| EV-032 | 2026-05-01 | Entry 24 | WS7-T4 | Infographic | `docs/evidence/infographic-datascience-cybersecurity-controls.svg` | DS + Cybersecurity contribution control matrix |
| EV-033 | 2026-05-01 | Entry 24 | WS7-T4 | Code snippet pack | `docs/evidence/code_snippets_showcase.md` | Curated implementation snippets for assessor readability |
| EV-034 | 2026-05-01 | Entry 24 | WS7-T4 | Planner traceability map | `docs/evidence/PLANNER_TRACEABILITY.md` | Links Software Architecture bucket tickets to repo artifacts and evidence IDs |
| EV-035 | 2026-05-01 | Entry 24 | WS7-T4 | Planner board reference | `https://planner.cloud.microsoft/webui/plan/Zx8AozAXI0qGNjreoURensgADRuX/view/board?tid=d02378ec-1688-46d5-8540-1c28b5f470f6` | Shows project planning governance and task decomposition evidence |

## Minimum Evidence Checklist

- Worklog showing 40 total hours
- Worklog showing 120 total hours with split by stream
- Technical code diffs and commit history
- Test run outputs (failing and passing where relevant)
- Runtime verification outputs (`curl`, startup logs)
- Research summaries mapped to implementation decisions
- Meeting minutes showing team engagement
- SFIA mapping with concrete project evidence
- Diagram pack and infographic visuals linked to contribution claims

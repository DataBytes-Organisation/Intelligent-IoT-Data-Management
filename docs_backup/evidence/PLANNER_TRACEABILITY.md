# Microsoft Planner Traceability (Software Architecture Bucket)

Planner board:

- URL: `https://planner.cloud.microsoft/webui/plan/Zx8AozAXI0qGNjreoURensgADRuX/view/board?tid=d02378ec-1688-46d5-8540-1c28b5f470f6`
- Bucket in scope: `Software Architecture`

This file maps Planner tickets to repository artifacts and evidence items.

## Mapping Table

| Planner Ticket Title | Planner Task ID/Link | Workstream Task ID | Repo Artifact(s) | Evidence ID(s) | Status |
|---|---|---|---|---|---|
| Architecture diagram pack creation | Add task link | WS2-T1 | `docs/diagrams/*`, `docs/HLD_visual.md` | EV-007, EV-023..EV-029 | Completed |
| LLD expansion and contract alignment | Add task link | WS3-T1 | `docs/LLD.md`, `docs/LLD.docx` | EV-005, EV-006 | Completed |
| Backend health endpoint | Add task link | WS4-T1 | `newBackend/BackendCode/app.js` | EV-003 | Completed |
| API smoke tests | Add task link | WS4-T2 | `newBackend/tests/api.smoke.test.js` | EV-001, EV-002 | Completed |
| Repository path hardening | Add task link | WS4-T3 | `newBackend/BackendCode/repositories/mockRepository.js` | EV-004 | Completed |
| Correlation behavior technical analysis | Add task link | WS5-T1 | `new-frontend/frontend/src/utils/correlationUtils.js` | EV-009 | Completed |
| Variance guard validation | Add task link | WS5-T1 | `new-frontend/frontend/src/utils/varianceUtils.js` | EV-010 | Completed |
| DS/Cyber evidence governance pack | Add task link | WS6-T2 | `docs/evidence/*`, `docs/sfia/*` | EV-018, EV-020, EV-033 | Completed |

## Planner Evidence Attachments Checklist

- Attach screenshot of Planner board showing `Software Architecture` bucket.
- Attach screenshot of each ticket showing assignee, dates, and status.
- Attach export/PDF of board view if available.
- Ensure ticket names match this mapping table.

## Suggested Screenshot Naming Convention

- `PLN_01_board_software-architecture-bucket.png`
- `PLN_02_ticket_hld-diagrams_done.png`
- `PLN_03_ticket_lld-expansion_done.png`
- `PLN_04_ticket_health-endpoint_done.png`
- `PLN_05_ticket_smoke-tests_done.png`

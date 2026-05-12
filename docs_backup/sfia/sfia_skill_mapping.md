# SFIA Skill Mapping - Technical Contribution Evidence

Resource:
- https://sfia-online.org/en/sfia-9/skills

Date prepared:
Prepared by:

## How to complete this mapping

- Pick relevant SFIA skills aligned with your contribution.
- Map each skill to concrete project evidence.
- Include file paths, commits, logs, and outcomes.

## Mapping Table

| SFIA Skill | Level (target) | Practical Activity in Project | Evidence Path(s) | Outcome |
|---|---:|---|---|---|
| Data analytics (DAAN) | 4 | Analysed implemented correlation behavior and data contracts across frontend and Python modules | `new-frontend/frontend/src/utils/correlationUtils.js`, `data_science/algorithms/correlation_based.py`, `docs/LLD.md` | Produced evidence-backed explanation of current analytics path and limitations |
| Information security (SCTY) | 4 | Added reliability baseline and documented secure input-hardening backlog without breaking runtime | `newBackend/BackendCode/app.js`, `docs/TECHNICAL_CONTRIBUTIONS.md` | Introduced operational health check and security-oriented contribution path |
| Functional testing (TEST) | 4 | Implemented smoke test pack for critical API behavior and invalid payload handling | `newBackend/tests/api.smoke.test.js`, `newBackend/package.json` | Established reproducible pass/fail backend verification |
| Systems integration and build (SINT) | 4 | Mapped frontend/backend/analytics contracts and startup boundaries under WSL constraints | `docs/LLD.md`, `docs/evidence/worklog.md` | Reduced integration ambiguity with explicit runbook and mismatch tracking |
| Knowledge management (KNOW) | 4 | Built structured evidence, research, and meeting documentation pack | `docs/evidence/evidence_index.md`, `docs/research/`, `docs/meetings/meeting_minutes_template.md` | Created assessor-ready traceability system for 120-hour contribution |

## Reflection

### What technical depth was demonstrated

- Code-level architecture analysis across React, Node, and Python modules.
- Implementation of non-disruptive backend reliability capability and automated tests.
- Algorithm-path analysis for correlation logic and runtime behavior verification.

### What professional capability was demonstrated

- Evidence governance and traceability for academic assessment.
- Cross-discipline alignment of data science and cybersecurity expectations.
- Documentation quality suitable for stakeholder review and handover.

### Next capability growth actions

- Add security-focused negative tests (payload fuzzing, boundary conditions).
- Introduce structured logging and request correlation IDs.
- Extend analytics contract to include confidence/interpretation semantics via API.

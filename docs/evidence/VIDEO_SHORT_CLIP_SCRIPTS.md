# Short Video Clip Scripts

Use these for 10-15 minute focused recordings.

## VID-002: HLD and Diagram Evidence (15 min)

Opening:

> This clip covers the HLD diagram evidence for the Software Architecture workstream.

Show:

- `docs/HLD_visual.docx`
- `docs/diagrams/`
- each PNG diagram briefly

Key points:

- System context diagram shows actors and primary runtime path.
- Layered diagram shows frontend, API, data/analytics separation.
- Sequence diagram shows stream filtering flow.
- Monitoring diagram supports reliability and operations discussion.

Close:

> These diagrams are linked in the evidence index as EV-023 to EV-029.

## VID-003: LLD and Code Traceability (15 min)

Opening:

> This clip explains how the LLD maps architecture decisions to implementation files.

Show:

- `docs/LLD.md`
- `newBackend/BackendCode/routes/mock.js`
- `newBackend/BackendCode/controllers/mockController.js`
- `newBackend/BackendCode/services/mockService.js`
- `newBackend/BackendCode/repositories/mockRepository.js`

Key points:

- Route/controller/service/repository separation.
- Data contract and filtering behavior.
- Known integration boundaries.

Close:

> This supports EV-005 and EV-006 in the evidence index.

## VID-004: Backend Health and Test Evidence (15 min)

Opening:

> This clip demonstrates the non-disruptive technical contribution.

Show:

- `newBackend/BackendCode/app.js`
- `newBackend/tests/api.smoke.test.js`
- terminal

Run:

```bash
cd newBackend
npm test
```

Key points:

- `GET /health` is additive.
- Smoke tests verify current behavior.
- Path hardening improves local reliability.

Close:

> This maps to EV-001 to EV-004.

## VID-005: Evidence, Planner, and SFIA (15 min)

Opening:

> This clip demonstrates governance evidence and traceability.

Show:

- Microsoft Planner board Software Architecture bucket
- `docs/evidence/PLANNER_TRACEABILITY.md`
- `docs/evidence/evidence_index.md`
- `docs/evidence/worklog.md`
- `docs/sfia/sfia_skill_mapping.md`

Key points:

- Planner maps tasks to outputs.
- Evidence index maps artifacts to claims.
- SFIA maps work to professional competencies.

Close:

> This supports EV-018, EV-020, EV-034, and EV-035.

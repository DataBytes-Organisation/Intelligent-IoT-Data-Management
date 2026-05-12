# Research Summary 04 - Research Methods Selection

Resource:
- https://maze.co/guides/ux-research/methods/

Date reviewed:
Reviewer:

## What this resource contains

- Overview of UX research method families and when to apply them.
- Distinction between qualitative/quantitative, attitudinal/behavioral, and generative/evaluative methods.
- Practical guidance on selecting methods by project stage and decision type.

## Methods considered for this capstone

| Method | Why considered | Chosen/Not chosen | Rationale |
|---|---|---|---|
| Document/code review | Understand implementation truth | Chosen | Needed for repository-grounded architecture and LLD |
| Smoke testing | Validate backend reliability claims | Chosen | Produces objective pass/fail evidence |
| Runtime walkthrough | Verify startup and integration behavior | Chosen | Captures environment-dependent risks |
| A/B UX testing | Compare UI alternatives | Not chosen | Out of scope for current reliability/documentation sprint |
| User interviews | Gather user sentiment | Not chosen | Contribution focus is technical engineering evidence |

## Methods adopted by the team

- Generative method for architecture synthesis and design documentation.
- Evaluative method through automated API smoke tests.
- Qualitative analysis of code behavior and integration boundaries.

## Effect on technical contribution plan

- Balanced workstreams across analysis, implementation, validation, and evidence packaging.
- Reduced risk of unverified claims by requiring test/runtime artifacts.

## Evidence of application

- Workshop/channel summary path:
- Implementation link:
- Implementation links: `newBackend/tests/api.smoke.test.js`, `newBackend/BackendCode/app.js`, `docs/LLD.md`

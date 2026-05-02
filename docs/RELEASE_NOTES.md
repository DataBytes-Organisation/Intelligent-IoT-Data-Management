# Release Notes - Architecture Proposal Baseline

## Release
- Version: 0.9.0-arch-proposal
- Date: 2026-03-31
- Type: Architecture planning and governance release

## Highlights
- Introduced formal architecture gap analysis for current platform topology.
- Published proposed High Level Design (HLD) for consolidated target architecture.
- Published implementation-level Low Level Design (LLD) for stabilization and standardization.
- Established phased release roadmap (Stabilize -> Standardize -> Scale).

## Added
- `docs/HLD.md`: target-state architecture, principles, NFRs, phased roadmap.
- `docs/LLD.md`: component-level design, endpoint contracts, security and observability LLD.

## Updated
- `docs/HLD_Test`: replaced placeholder content with pointer to finalized HLD document.

## Architectural Gaps Identified
- Duplicate frontend/backend stacks create ownership ambiguity and integration overhead.
- Deployment/runtime mismatches in compose and container definitions reduce release reliability.
- Security baseline gaps (hardcoded key, debug mode, permissive CORS) block production posture.
- API and data-layer governance require contract versioning and environment alignment.
- Test and health-check coverage is insufficient for safe continuous delivery.

## Non-Functional Expectations for Next Release
- Environment-based secure configuration.
- Versioned API routes and health endpoints.
- PostgreSQL-aligned runtime settings.
- Basic CI quality gates and smoke validation.

## Next Planned Release
- Version: 1.0.0-platform-stabilization
- Focus:
  - service consolidation decisions finalized,
  - deployment path corrected,
  - minimum production hardening controls implemented.

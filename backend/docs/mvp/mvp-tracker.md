# MVP Live-Route Inventory (AFI-05)

> **Updated 2026-09-27** to reflect the current merged `main` (post PR #172, PR #182 "add-authentication"). Supersedes the earlier version of this file, which documented pre-authentication, name-based routes (`GET /api/datasets/:name/series`, `POST /api/register`) that are no longer the current contract. Route statuses below were re-verified live, with real captured evidence in `evidence/api-samples.json`.

Cross-reference for `api-contract.md`. Update the Status column as routes move through the cutover.

| Route | Method | Status | Verified dataset(s) | Notes |
|---|---|---|---|---|
| `/api/auth/register` | POST | STABLE V1 | n/a | Email/password, current contract |
| `/api/auth/login` | POST | STABLE V1 — verified live | n/a | Returns `202` + `mfaChallengeId` when MFA is enabled for the account, confirmed live |
| `/api/auth/mfa/verify` | POST | STABLE V1 — verified live | n/a | Confirmed live; returns real `accessToken` on success |
| `/api/auth/mfa/resend` | POST | STABLE V1 | n/a | Not re-verified this pass |
| `/api/auth/refresh` | POST | STABLE V1 | n/a | Not re-verified this pass |
| `/api/auth/logout` | POST | STABLE V1 | n/a | Not re-verified this pass |
| `/api/auth/password-reset/request` | POST | STABLE V1 | n/a | Not re-verified this pass |
| `/api/auth/password-reset/confirm` | POST | STABLE V1 | n/a | Not re-verified this pass |
| `/api/datasets` | GET | STABLE V1 — verified live | thingspeak-live (id 14095) | Requires `Authorization: Bearer <accessToken>`; confirmed `401 UNAUTHENTICATED` without a token |
| `/api/datasets/:id` | GET | STABLE V1 | thingspeak-live (id 14095) | Not re-verified this pass |
| `/api/datasets` | POST | STABLE V1 | n/a | CSV import, implemented (see `api-contract.md` DATA-01) |
| `/api/datasets/:id` | PUT | STABLE V1 | n/a | Not re-verified this pass |
| `/api/datasets/:id` | DELETE | STABLE V1 | n/a | AFI-23, not re-verified this pass |
| `/api/datasets/:id/restore` | POST | STABLE V1 | n/a | AFI-24, not re-verified this pass |
| `/api/datasets/:id/series` | GET | STABLE V1 — verified live | thingspeak-live (id 14095, 165 real rows) | Current target route. Numeric id, not name; requires Bearer token |
| `/api/datasets/:id/series/filter` | POST | STABLE V1 — verified live | thingspeak-live (id 14095) | Requires `Authorization: Bearer <accessToken>`; body is `{ "streamNames": [...] }`, restricts response fields to `created_at`, `entry_id`, and the requested fields |
| `/api/datasets/:id/timestamps` | GET | STABLE V1 — verified live | thingspeak-live (id 14095) | Requires `Authorization: Bearer <accessToken>`; returns the full array of ISO-8601 timestamps for the dataset |
| `/api/feeds` | GET | STABLE V1 — verified live, **data-quality issue open** | thingspeak-live / channel 12397 | Requires `Authorization: Bearer <accessToken>`, confirmed enforced. See open finding below — `temperature` and `humidity` are flat across all captured entries |
| `/api/analyse` | POST | STABLE V1 — verified live, **analytics service unreachable** | thingspeak-live | Requires `Authorization: Bearer <accessToken>`. Real layered request validation confirmed live (dataset name, `model.metric` canonical name, `correlation.streams` array of 2+ canonical names) — this is not a placeholder, confirming Van's PR review comment. After passing validation, the call fails with `503 ANALYTICS_UNAVAILABLE` because the analytics service itself couldn't be reached in this test environment, so the success-path response shape is still unconfirmed. See `evidence/api-samples.json` for the full request/response. `api-contract.md` updated to match. |
| `/api/alerts/latest` | GET | NOT READY — does not exist | n/a | No change |
| `/api/alerts/history` | GET | NOT READY — does not exist | n/a | No change |
| `/api/streams`, `/stream-names`, `/filter-streams`, `/data-profile`, `/top-correlated-pair` | GET/POST | TRANSITIONAL (mock) | n/a | No change |
| `/api/register`, `/login`, `/refresh-token`, `/logout` (legacy) | POST | LEGACY — superseded | n/a | Superseded by `/api/auth/*`; do not build new work against these |
| `/api/datasets/:name/series` (legacy name-based) | GET | LEGACY — no longer the documented contract | n/a | Confirmed this route is not what the current backend serves as the target contract; do not use for new work |

## Live evidence run (2026-09-25 to 2026-09-27) — see `evidence/api-samples.json` for full detail

Real requests captured against the current merged `main`, with real authentication (including MFA), against dataset `thingspeak-live` (numeric id `14095`, channel `12397`).

Confirmed in this pass:
- `POST /api/auth/login` correctly returns `202` + `mfaChallengeId` for an MFA-enabled account
- `POST /api/auth/mfa/verify` correctly returns a real `accessToken` on success
- `GET /api/datasets` requires authentication — confirmed real `401 UNAUTHENTICATED` with no token
- `GET /api/datasets` (authenticated) returns the dataset with its real numeric `id`, not just its name
- `GET /api/datasets/{id}/series` (authenticated, numeric id) returns real wide-format rows
- `GET /api/datasets/{id}/timestamps` (authenticated) returns the real ISO-8601 timestamp array for the dataset
- `POST /api/datasets/{id}/series/filter` (authenticated) correctly requires `streamNames` (not `fields`) and returns rows restricted to the requested fields plus `created_at`/`entry_id`
- `GET /api/feeds` (authenticated) returns the real ThingSpeak channel metadata and a cleaned feeds array — Bearer-token enforcement confirmed

**Not re-verified this pass** (unchanged from the earlier audit, assumed still accurate but not re-tested): `/api/auth/mfa/resend`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/password-reset/*`, `GET /api/datasets/:id`, `PUT /api/datasets/:id`, `DELETE /api/datasets/:id`, `POST /api/datasets/:id/restore`.

## Open finding — `/api/feeds` temperature/humidity values (2026-09-27)

Live evidence for `GET /api/feeds` shows `temperature: 0.1` and `humidity: 0` on every single entry across 100+ real captured rows spanning different timestamps, while `pressure` in the same response varies normally. The channel metadata (`field4` = Temperature, `field3` = Humidity) matches the current cleanup mapping, so this is not evidence of a field-mapping defect. The `field3`/`field4` samples captured via `/api/datasets/{id}/series` in `api-samples.json` are only two truncated rows and both happen to be flat (`field3: 0`, `field4: 0.1`), so they don't actually demonstrate the raw fields vary elsewhere in the dataset either — that claim isn't yet backed by evidence on file. This is best described as an observed data-quality issue (flat temperature/humidity readings across the captured window), with no root cause assigned. Before pointing to a specific cause, this needs either a wider raw `field3`/`field4` capture that does show variation, or a look at whether the issue sits upstream in the data source itself. Not yet resolved as of this update.

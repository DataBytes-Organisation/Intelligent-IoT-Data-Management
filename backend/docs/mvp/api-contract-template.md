# API Contract Template

*Derived from the structure of `backend/docs/mvp/api-contract.md`. Use this when adding a new group of endpoints (a new feature area) to keep the same format the team already uses for AUTH-0X and DATA-0X. Replace all `[bracket]` fields.*

---

## 1. Contract metadata

| Field | Value |
| --- | --- |
| Contract version | `[e.g. v1.3.0]` |
| Status | `[Draft / Approved contract baseline / BE implementation pending / Implemented]` |
| API base URL | Local: `http://localhost:3000/api`; deployed: `VITE_API_BASE_URL` ending in `/api` over HTTPS |
| Related tickets | `[e.g. AFI-XX]` |
| Approved by | `[reviewer(s), or "AFI; BE acknowledgement required before deployment"]` |

## 2. Contract rules

*(Keep these consistent with the rest of `api-contract.md` — don't redefine conventions per feature area.)*

- Responses are JSON; timestamps are ISO-8601 UTC strings.
- Every endpoint states authentication, validation, failure, and rate-limit behaviour.
- Every error returns a human-readable message and a stable machine-readable code — FE uses `error.code`, not message text.
- Do not change a response shape, field name, type, route, error code, or required status without a contract version change and FE notification.
- `[Add any rule specific to this feature area here, e.g. new auth requirements, new response envelope fields.]`

## 3. Route inventory

| ID | Method | Path | Purpose | Auth | Consumer | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `[PREFIX-01]` | `[GET/POST/PUT/DELETE]` | `[/api/...]` | `[one line]` | `[None / Bearer access token / Refresh cookie]` | `[FE component or team]` | `[Draft / BE pending / Implemented]` |

## 4. Data and naming rules

*(Only add rows here for concepts genuinely new to this feature area — don't repeat existing rules from the rest of the contract.)*

| Field / concept | Rule | Example |
| --- | --- | --- |
| `[field name]` | `[validation / format rule]` | `[example value]` |

## 5. Standard response and error contract

Reuse the existing envelope — do not invent a new one:

```json
{
  "data": {},
  "meta": { "requestId": "req_01" }
}
```
```json
{
  "error": {
    "code": "[STABLE_MACHINE_CODE]",
    "message": "[Clear message for a person]",
    "fields": {}
  },
  "meta": { "requestId": "req_01" }
}
```

Only add new rows to the scenario table if this feature area introduces a genuinely new error condition not already covered (`VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `INTERNAL_ERROR`, etc. already exist — reuse them):

| Scenario | HTTP status | Code | Required frontend behaviour |
| --- | --- | --- | --- |
| `[new scenario, if any]` | `[status]` | `[CODE]` | `[behaviour]` |

## 6. Endpoint specification — copy this block once per endpoint

### `[PREFIX-0X]` - `[METHOD]` `[/path]`

| Field | Value |
| --- | --- |
| Purpose | `[what this endpoint does and why]` |
| Authentication | `[None / Authorization: Bearer <accessToken>]` |
| Content type | `[application/json / None]` |
| Transaction behaviour | `[e.g. "All inserts succeed or the request is rolled back."]` |

| Location | Name | Type | Required | Rules | Example |
| --- | --- | --- | --- | --- | --- |
| `[Path/Body/Query]` | `[field]` | `[string/integer/boolean/array]` | `[Yes/No]` | `[validation rule]` | `[example]` |

```json
{ "[requestField]": "[example]" }
```

**Success response: `[status code]`**

```json
{ "data": { }, "meta": { "requestId": "[req_id]" } }
```

| Failure case | HTTP status / code | Frontend behaviour |
| --- | --- | --- |
| `[condition]` | `[status]` / `[CODE]` | `[what FE should do]` |

---

## 7. Mock, transitional, and deprecated routes (if this feature area introduces any)

| Route | Current purpose | Replacement stable route | Cutover condition | Owner / target date |
| --- | --- | --- | --- | --- |
| `[/api/legacy-route]` | `[why it exists temporarily]` | `[/api/new-route]` | `[what needs to be true before FE switches]` | `[team / date]` |

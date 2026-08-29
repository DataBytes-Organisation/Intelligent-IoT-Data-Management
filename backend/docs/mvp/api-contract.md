# API Contract

Use this document as the single source of truth for the MVP API release.

## 1. Contract metadata

| Field | Value |
| --- | --- |
| Contract version | `v1.0.0` |
| Status | Approved contract baseline - BE implementation pending |
| API base URL | Local: `http://localhost:3000/api`; deployed: `VITE_API_BASE_URL` ending in `/api` over HTTPS |
| Related tickets | `AFI-14`, `AFI-16` |
| Approved by | AFI; BE acknowledgement required before deployment |

## 2. Contract rules

- Stable authentication routes use `/api/auth/...`. Legacy `/api/register`, `/api/login`, `/api/refresh-token`, and `/api/logout` are transitional only.
- Responses are JSON; timestamps are ISO-8601 UTC strings.
- Do not change a response shape, field name, type, route, error code, or required status without a contract version change and FE notification.
- Every endpoint states authentication, validation, failure, and rate-limit behaviour.
- Every error returns a human-readable message and stable machine-readable code. FE uses `error.code`, not message text.
- Authentication responses send `Cache-Control: no-store`. Production CORS is an explicit FE origin allow-list with credentials; wildcard CORS is prohibited.
- FE never stores passwords, OTPs, refresh tokens, or access tokens in local or session storage. The access token remains in memory only.
- The `iot_refresh` cookie is `HttpOnly`, `Secure` in production, `SameSite=Lax`, and scoped to `Path=/api/auth`.

## 3. Route inventory

| ID | Method | Path | Purpose | Auth | Consumer | Status |
| --- | --- | --- | --- | --- | --- | --- |
| OPS-01 | `GET` | `/health` | Process liveness check | None | DevOps | BE pending |
| OPS-02 | `GET` | `/ready` | Config and PostgreSQL readiness check | None | DevOps | BE pending |
| AUTH-01 | `POST` | `/api/auth/register` | Create an account | None | FE | BE pending |
| AUTH-02 | `POST` | `/api/auth/login` | Sign in or begin MFA | None | FE | BE pending |
| AUTH-03 | `POST` | `/api/auth/mfa/verify` | Verify MFA and complete sign-in | None | FE | BE pending |
| AUTH-04 | `POST` | `/api/auth/mfa/resend` | Resend MFA code | None | FE | BE pending |
| AUTH-05 | `POST` | `/api/auth/refresh` | Rotate session and access token | Refresh cookie | FE | BE pending |
| AUTH-06 | `POST` | `/api/auth/logout` | Revoke current session | Refresh cookie | FE | BE pending |
| AUTH-07 | `POST` | `/api/auth/password-reset/request` | Request reset instructions | None | FE | BE pending |
| AUTH-08 | `POST` | `/api/auth/password-reset/confirm` | Confirm password reset | None | FE | BE pending |

## 4. Data and naming rules

| Field / concept | Rule | Example |
| --- | --- | --- |
| Identity | `email` is the only login identity; lower-case and trim before lookup. `username` is not accepted. | `ada@example.com` |
| Public user | Expose only `id`, `email`, and `role`. Never return hashes, raw tokens, OTPs, or provider data. | `{ "id": "u_123", "email": "ada@example.com", "role": "user" }` |
| Access token | JWT held only in FE memory; expires in 900 seconds. | `<jwt>` |
| Refresh token | Opaque, rotating, server-stored credential in `iot_refresh` HttpOnly cookie. | `<redacted>` |
| Remember Me | `true`: 30-day persistent cookie. `false`: browser-session cookie with 12-hour maximum server lifetime. | `true` |
| MFA OTP | Six digits, single use, 10-minute expiry, five failed attempts maximum. | `123456` |
| Reset token | Opaque, single use, stored hashed, 30-minute expiry. | `<opaque-token>` |

## 5. Standard response and error contract

### Success envelope

```json
{
  "data": {},
  "meta": { "requestId": "req_01" }
}
```

### Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "fields": { "email": "Enter a valid email address." }
  },
  "meta": { "requestId": "req_01" }
}
```

| Scenario | HTTP status | Code | Required frontend behaviour |
| --- | --- | --- | --- |
| Invalid body or field | `400` | `VALIDATION_ERROR` | Show field guidance; do not retry automatically. |
| Duplicate account | `409` | `ACCOUNT_EXISTS` | Offer sign-in or password reset. |
| Invalid credentials | `401` | `INVALID_CREDENTIALS` | Show generic sign-in error. |
| Missing / invalid access token | `401` | `UNAUTHENTICATED` | Refresh once; otherwise end session. |
| Expired access token | `401` | `ACCESS_TOKEN_EXPIRED` | Refresh once; otherwise end session. |
| Expired / revoked refresh session | `401` | `SESSION_EXPIRED` | Clear all tabs and redirect to Login. |
| MFA required | `202` | `MFA_REQUIRED` | Move to OTP page; retain no password. |
| Invalid / expired OTP | `400` | `OTP_INVALID` / `OTP_EXPIRED` | Keep page active; offer resend when expired. |
| Resend throttled | `429` | `OTP_RESEND_THROTTLED` | Disable resend until `retryAfterSeconds`. |
| Reset token invalid / expired | `400` | `RESET_TOKEN_INVALID` / `RESET_TOKEN_EXPIRED` | Offer new reset request. |
| Permission denied | `403` | `FORBIDDEN` | Show a permission message. |
| Login throttled | `429` | `LOGIN_THROTTLED` | Disable sign-in until the retry time. |
| OTP attempts exhausted | `429` | `OTP_ATTEMPTS_EXCEEDED` | Restart login. |
| Service failure | `502` / `503` | `SERVICE_UNAVAILABLE` | Preserve inputs and offer retry. |
| Unexpected server failure | `500` | `INTERNAL_ERROR` | Show generic retry state and record `correlationId` when provided. |

## 6. Endpoint specification

### 6.1 AUTH-01 - POST /api/auth/register

| Field | Value |
| --- | --- |
| Status | Approved contract baseline - BE pending |
| Purpose | Create an email/password account. |
| Consumers | Registration page and auth API client |
| Source of truth | PostgreSQL user store |
| Authentication | None |
| Rate limit / timeout | 5 requests per IP per 15 minutes; 10 seconds |

| Location | Name | Type | Required | Rules | Example |
| --- | --- | --- | --- | --- | --- |
| Body | `email` | string | Yes | Valid email; lower-case and trim | `ada@example.com` |
| Body | `password` | string | Yes | 12-128 chars; upper, lower, digit, symbol | `ExamplePass1!` |
| Body | `confirmPassword` | string | Yes | Must equal password | `ExamplePass1!` |

```json
{
  "email": "ada@example.com",
  "password": "ExamplePass1!",
  "confirmPassword": "ExamplePass1!"
}
```

**Success response: `201 Created`**

```json
{
  "data": {
    "user": {
      "id": "u_123",
      "email": "ada@example.com",
      "role": "user"
    }
  },
  "meta": {
    "requestId": "req_01"
  }
}
```

| Failure case | HTTP status / code | Frontend behaviour |
| --- | --- | --- |
| Invalid input | `400` / `VALIDATION_ERROR` | Show field errors. |
| Duplicate email | `409` / `ACCOUNT_EXISTS` | Offer sign-in or password reset. |
| Service failure | `503` / `SERVICE_UNAVAILABLE` | Show retry state. |


### 6.2 AUTH-02 - POST /api/auth/login

| Field | Value |
| --- | --- |
| Status | Approved contract baseline - BE pending |
| Purpose | Sign in or initiate MFA verification. |
| Consumers | Login page and auth API client |
| Source of truth | PostgreSQL user and session store |
| Authentication | None |
| Rate limit / timeout | 10 attempts per email/IP per 15 minutes; 10 seconds |

| Location | Name | Type | Required | Rules | Example |
| --- | --- | --- | --- | --- | --- |
| Body | `email` | string | Yes | Valid email | `ada@example.com` |
| Body | `password` | string | Yes | 12-128 chars | `ExamplePass1!` |
| Body | `rememberMe` | boolean | No | Defaults to false | `true` |

```json
{
  "email": "ada@example.com",
  "password": "ExamplePass1!",
  "rememberMe": true
}
```

**Success response: `200 OK`** - set `iot_refresh` cookie.

```json
{
  "data": {
    "accessToken": "<jwt>",
    "expiresInSeconds": 900,
    "user": {
      "id": "u_123",
      "email": "ada@example.com",
      "role": "user"
    }
  },
  "meta": {
    "requestId": "req_02"
  }
}
```

The response sets `iot_refresh=<opaque-token>; HttpOnly; Secure; SameSite=Lax; Path=/api/auth` and `Cache-Control: no-store`.

For MFA-enabled users return `202` with `data.mfaChallengeId`, `data.expiresInSeconds: 600`, `data.delivery: "email"`, and `meta.code: "MFA_REQUIRED"`.

| Failure case | HTTP status / code | Frontend behaviour |
| --- | --- | --- |
| Invalid input | `400` / `VALIDATION_ERROR` | Show field errors. |
| Invalid credentials | `401` / `INVALID_CREDENTIALS` | Show a generic login error. |
| Rate limited | `429` / `LOGIN_THROTTLED` | Disable sign-in until the retry time. |

### 6.3 AUTH-03 - POST /api/auth/mfa/verify

| Field | Value |
| --- | --- |
| Status | Approved contract baseline - BE pending |
| Purpose | Verify OTP and complete sign-in. |
| Consumers | OTP verification page |
| Source of truth | PostgreSQL MFA challenge and session store |
| Authentication | None |
| Rate limit / timeout | Five failed attempts per challenge; 10 seconds |

| Location | Name | Type | Required | Rules | Example |
| --- | --- | --- | --- | --- | --- |
| Body | `mfaChallengeId` | string | Yes | Active, unexpired challenge | `mfa_123` |
| Body | `otp` | string | Yes | Exactly six digits | `123456` |
| Body | `rememberMe` | boolean | Yes | Value selected at login | `true` |

```json
{
  "mfaChallengeId": "mfa_123",
  "otp": "123456",
  "rememberMe": true
}
```

**Success response: `200 OK`** - same session payload and refresh cookie as login.

```json
{
  "data": {
    "accessToken": "<jwt>",
    "expiresInSeconds": 900,
    "user": {
      "id": "u_123",
      "email": "ada@example.com",
      "role": "user"
    }
  },
  "meta": {
    "requestId": "req_03"
  }
}
```

The response sets `iot_refresh=<opaque-token>; HttpOnly; Secure; SameSite=Lax; Path=/api/auth` and `Cache-Control: no-store`.

| Failure case | HTTP status / code | Frontend behaviour |
| --- | --- | --- |
| Invalid OTP | `400` / `OTP_INVALID` | Keep the OTP screen active. |
| Expired OTP | `400` / `OTP_EXPIRED` | Offer resend. |
| Too many attempts | `429` / `OTP_ATTEMPTS_EXCEEDED` | Restart login. |

### 6.4 AUTH-04 - POST /api/auth/mfa/resend

| Field | Value |
| --- | --- |
| Status | Approved contract baseline - BE pending |
| Purpose | Send a replacement OTP challenge. |
| Consumers | OTP verification page |
| Source of truth | PostgreSQL MFA challenge store and email provider |
| Authentication | None |
| Rate limit / timeout | One send per 60 seconds; five per challenge window |

| Location | Name | Type | Required | Rules | Example |
| --- | --- | --- | --- | --- | --- |
| Body | `mfaChallengeId` | string | Yes | Existing challenge | `mfa_123` |

```json
{
  "mfaChallengeId": "mfa_123"
}
```

**Success response: `202 Accepted`**

```json
{
  "data": {
    "mfaChallengeId": "mfa_456",
    "expiresInSeconds": 600,
    "retryAfterSeconds": 60,
    "delivery": "email"
  },
  "meta": {
    "requestId": "req_04"
  }
}
```

| Failure case | HTTP status / code | Frontend behaviour |
| --- | --- | --- |
| Invalid or expired challenge | `400` / `OTP_EXPIRED` | Restart login. |
| Resend throttled | `429` / `OTP_RESEND_THROTTLED` | Disable resend for `retryAfterSeconds`. |
| Email unavailable | `503` / `SERVICE_UNAVAILABLE` | Show retry state. |

### 6.5 AUTH-05 - POST /api/auth/refresh

| Field | Value |
| --- | --- |
| Status | Approved contract baseline - BE pending |
| Purpose | Rotate refresh session and issue new access token. |
| Consumers | Auth API client on application boot or access expiry |
| Source of truth | PostgreSQL session store |
| Authentication | `iot_refresh` HttpOnly cookie |
| Rate limit / timeout | One automatic retry only; 10 seconds |

| Location | Name | Type | Required | Rules | Example |
| --- | --- | --- | --- | --- | --- |
| Cookie | `iot_refresh` | opaque string | Yes | Sent with `credentials: 'include'`; JavaScript cannot read it. | `<redacted>` |

```http
POST /api/auth/refresh
Cookie: iot_refresh=<redacted>
```

**Success response: `200 OK`** - rotate `iot_refresh`.

```json
{
  "data": {
    "accessToken": "<jwt>",
    "expiresInSeconds": 900,
    "user": {
      "id": "u_123",
      "email": "ada@example.com",
      "role": "user"
    }
  },
  "meta": {
    "requestId": "req_05"
  }
}
```

The response rotates the cookie with `Set-Cookie: iot_refresh=<rotated-token>; HttpOnly; Secure; SameSite=Lax; Path=/api/auth` and sends `Cache-Control: no-store`.

| Failure case | HTTP status / code | Frontend behaviour |
| --- | --- | --- |
| Cookie absent, revoked, expired, or replayed | `401` / `SESSION_EXPIRED` | Clear all tabs and redirect to Login. |
| Service failure | `503` / `SERVICE_UNAVAILABLE` | Show retry state. |

### 6.6 AUTH-06 - POST /api/auth/logout

| Field | Value |
| --- | --- |
| Status | Approved contract baseline - BE pending |
| Purpose | Revoke session and clear refresh cookie. |
| Consumers | Navbar/logout action and auth API client |
| Source of truth | PostgreSQL session store |
| Authentication | `iot_refresh` cookie; bearer optional |
| Rate limit / timeout | No rate limit; 10 seconds |

| Location | Name | Type | Required | Rules | Example |
| --- | --- | --- | --- | --- | --- |
| Cookie | `iot_refresh` | opaque string | No | Idempotent when absent or already revoked. | `<redacted>` |
| Header | `Authorization` | string | No | Optional `Bearer <accessToken>`. | `Bearer <jwt>` |

```http
POST /api/auth/logout
Cookie: iot_refresh=<redacted>
```

**Success response: `204 No Content`** - clear `iot_refresh`; no JSON body.

FE clears memory and broadcasts `{ "type": "LOGOUT" }` via `BroadcastChannel('iot-auth')`, with a storage-event fallback. Every tab clears state and redirects to Login.

| Failure case | HTTP status / code | Frontend behaviour |
| --- | --- | --- |
| Existing or absent session | `204` | Clear local state and broadcast logout. |
| Temporary service failure | `503` / `SERVICE_UNAVAILABLE` | Clear local state anyway and record the failure. |

### 6.7 AUTH-07 - POST /api/auth/password-reset/request

| Field | Value |
| --- | --- |
| Status | Approved contract baseline - BE pending |
| Purpose | Request reset instructions without revealing account existence. |
| Consumers | Forgot-password page |
| Source of truth | PostgreSQL user/reset-token store and email provider |
| Authentication | None |
| Rate limit / timeout | Three requests per email per hour; 10 seconds |

| Location | Name | Type | Required | Rules | Example |
| --- | --- | --- | --- | --- | --- |
| Body | `email` | string | Yes | Valid email | `ada@example.com` |

```json
{
  "email": "ada@example.com"
}
```

**Success response: `202 Accepted`** - same response for known and unknown emails.

```json
{
  "data": {
    "message": "If the account exists, reset instructions have been sent."
  },
  "meta": {
    "requestId": "req_07"
  }
}
```

| Failure case | HTTP status / code | Frontend behaviour |
| --- | --- | --- |
| Invalid email format | `400` / `VALIDATION_ERROR` | Show field error. |
| Request throttled | `429` / `RESET_THROTTLED` | Show retry guidance. |
| Email unavailable | `503` / `SERVICE_UNAVAILABLE` | Show retry state. |

### 6.8 AUTH-08 - POST /api/auth/password-reset/confirm

| Field | Value |
| --- | --- |
| Status | Approved contract baseline - BE pending |
| Purpose | Set a new password from a one-time reset token. |
| Consumers | Reset-password page |
| Source of truth | PostgreSQL user, reset-token, and session stores |
| Authentication | None |
| Rate limit / timeout | Five attempts per token; 10 seconds |

| Location | Name | Type | Required | Rules | Example |
| --- | --- | --- | --- | --- | --- |
| Body | `token` | string | Yes | Valid, one-time, unexpired opaque token | `<opaque-token>` |
| Body | `password` | string | Yes | Registration password policy | `NewExamplePass1!` |
| Body | `confirmPassword` | string | Yes | Must equal password | `NewExamplePass1!` |

```json
{
  "token": "<opaque-token>",
  "password": "NewExamplePass1!",
  "confirmPassword": "NewExamplePass1!"
}
```

**Success response: `204 No Content`** - consume token and revoke all sessions; no JSON body.

| Failure case | HTTP status / code | Frontend behaviour |
| --- | --- | --- |
| Invalid token | `400` / `RESET_TOKEN_INVALID` | Offer a new reset request. |
| Expired token | `400` / `RESET_TOKEN_EXPIRED` | Offer a new reset request. |
| Password validation failure | `400` / `VALIDATION_ERROR` | Show field errors. |

## 7. Authentication and session flows

| Flow | Route | Request fields | Success fields | Frontend behaviour | Errors |
| --- | --- | --- | --- | --- | --- |
| Register | `POST /api/auth/register` | email, password, confirmPassword | user | Redirect to Login; no auto-login. | Validation, duplicate |
| Login | `POST /api/auth/login` | email, password, rememberMe | Session or MFA challenge | Access token in memory only. | Invalid credentials, MFA |
| Verify MFA | `POST /api/auth/mfa/verify` | mfaChallengeId, otp, rememberMe | Session | Store access token in memory. | Invalid/expired OTP |
| Resend MFA | `POST /api/auth/mfa/resend` | mfaChallengeId | New challenge | Enforce retry delay. | Expired/throttled |
| Refresh | `POST /api/auth/refresh` | Cookie only | New access token | Use credentials include; retry once. | Expired session |
| Logout | `POST /api/auth/logout` | Cookie; bearer optional | 204 | Clear state and broadcast. | Local clear still occurs |
| Reset request | `POST /api/auth/password-reset/request` | email | Generic 202 | Never infer account existence. | Validation/throttle |
| Reset confirm | `POST /api/auth/password-reset/confirm` | token, password, confirmPassword | 204 | Redirect to Login; revoke sessions. | Invalid/expired token |

### Session rules

- Access tokens expire after 15 minutes.
- `rememberMe: true` issues a persistent refresh cookie for 30 days.
- `rememberMe: false` issues a browser-session refresh cookie with a maximum 12-hour server-side lifetime; closing the browser ends the session.
- Refresh tokens rotate on every refresh and are stored server-side as hashes.
- Logout revokes the current server session and clears the refresh cookie; password reset revokes every session for that user.

## 8. Mock, transitional, and deprecated routes

| Route | Current purpose | Replacement stable route | Cutover condition | Owner / target date |
| --- | --- | --- | --- | --- |
| `/api/register` | Legacy username/password registration | `POST /api/auth/register` | Email registration, error codes, and tests pass; FE switches. | BE / AFI-16 date to be confirmed |
| `/api/login` | Legacy username/password login | `POST /api/auth/login` | HttpOnly cookie, Remember Me, MFA, and tests pass. | BE / AFI-16 date to be confirmed |
| `/api/refresh-token` | Legacy refresh token in JSON body | `POST /api/auth/refresh` | Rotating cookie works; FE sends credentials. | BE + FE / AFI-16 date to be confirmed |
| `/api/logout` | Legacy refresh token in JSON body | `POST /api/auth/logout` | Idempotent cookie logout and two-tab test pass. | BE + FE / AFI-16 date to be confirmed |

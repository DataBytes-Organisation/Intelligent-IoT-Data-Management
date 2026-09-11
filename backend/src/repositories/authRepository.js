const db = require("../db/pool");

const tableByType = {
  sessions: "auth_sessions",
  challenges: "auth_mfa_challenges",
  resets: "auth_password_resets",
};
const columnsByType = {
  sessions:
    'id, user_id AS "userId", token_hash AS "tokenHash", expires_at AS "expiresAt", remember_me AS "rememberMe", created_at AS "createdAt", revoked_at AS "revokedAt"',
  challenges:
    'id, user_id AS "userId", token_hash AS "tokenHash", expires_at AS "expiresAt", attempts, resend_after AS "resendAfter", remember_me AS "rememberMe", used_at AS "usedAt"',
  resets:
    'id, user_id AS "userId", token_hash AS "tokenHash", expires_at AS "expiresAt", used_at AS "usedAt"',
};

function table(type) {
  if (!tableByType[type])
    throw new Error(`Unknown authentication record type: ${type}`);
  return tableByType[type];
}
async function add(type, record) {
  if (type === "sessions") {
    const result = await db.query(
      `INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, remember_me) VALUES ($1,$2,$3,$4,$5) RETURNING ${columnsByType.sessions}`,
      [
        record.id,
        record.userId,
        record.tokenHash,
        record.expiresAt,
        record.rememberMe,
      ],
    );
    return result.rows[0];
  }
  if (type === "challenges") {
    const result = await db.query(
      `INSERT INTO auth_mfa_challenges (id, user_id, token_hash, expires_at, attempts, resend_after, remember_me) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING ${columnsByType.challenges}`,
      [
        record.id,
        record.userId,
        record.tokenHash,
        record.expiresAt,
        record.attempts,
        record.resendAfter,
        record.rememberMe,
      ],
    );
    return result.rows[0];
  }
  const result = await db.query(
    `INSERT INTO auth_password_resets (id, user_id, token_hash, expires_at) VALUES ($1,$2,$3,$4) RETURNING ${columnsByType.resets}`,
    [record.id, record.userId, record.tokenHash, record.expiresAt],
  );
  return result.rows[0];
}
async function findByHash(type, tokenHash) {
  const result = await db.query(
    `SELECT ${columnsByType[type]} FROM ${table(type)} WHERE token_hash = $1`,
    [tokenHash],
  );
  return result.rows[0] || null;
}
async function find(type, id) {
  const result = await db.query(
    `SELECT ${columnsByType[type]} FROM ${table(type)} WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}
async function update(type, id, changes) {
  const fields = [];
  const values = [id];
  const map = {
    attempts: "attempts",
    resendAfter: "resend_after",
    usedAt: "used_at",
    revokedAt: "revoked_at",
  };
  for (const [key, column] of Object.entries(map))
    if (Object.hasOwn(changes, key)) {
      values.push(changes[key]);
      fields.push(`${column} = $${values.length}`);
    }
  if (!fields.length) return find(type, id);
  const result = await db.query(
    `UPDATE ${table(type)} SET ${fields.join(", ")} WHERE id = $1 RETURNING ${columnsByType[type]}`,
    values,
  );
  return result.rows[0] || null;
}
async function revokeUserSessions(userId) {
  await db.query(
    "UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
    [userId],
  );
}
module.exports = { add, update, findByHash, find, revokeUserSessions };

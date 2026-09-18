const db = require("../db/pool");

const normaliseEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();
const publicColumns = "id, email, role";

async function findUserByEmail(email) {
  const result = await db.query(
    `SELECT id, email, password_hash, role, mfa_enabled AS "mfaEnabled"
     FROM auth_users WHERE email = $1`,
    [normaliseEmail(email)],
  );
  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await db.query(
    `SELECT id, email, password_hash, role, mfa_enabled AS "mfaEnabled"
     FROM auth_users WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

async function createUser({
  id,
  email,
  password_hash,
  role = "user",
  mfaEnabled = true,
}) {
  const result = await db.query(
    `INSERT INTO auth_users (id, email, password_hash, role, mfa_enabled)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${publicColumns}`,
    [id, normaliseEmail(email), password_hash, role, mfaEnabled],
  );
  return result.rows[0];
}

async function updateUserById(id, changes) {
  const result = await db.query(
    `UPDATE auth_users SET password_hash = COALESCE($2, password_hash), updated_at = NOW()
     WHERE id = $1 RETURNING id, email, password_hash, role, mfa_enabled AS "mfaEnabled"`,
    [id, changes.password_hash || null],
  );
  return result.rows[0] || null;
}

async function getSafeUsers() {
  const result = await db.query(
    `SELECT ${publicColumns} FROM auth_users ORDER BY created_at ASC`,
  );
  return result.rows;
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserById,
  getSafeUsers,
  normaliseEmail,
};

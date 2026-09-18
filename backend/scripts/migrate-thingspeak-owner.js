const bcrypt = require('bcrypt');
const pool = require('../src/db/pool');
const SERVICE_ACCOUNT_EMAIL = 'thingspeak-service@system.local';

async function runMigration() {
  const ownerId = process.env.THINGSPEAK_DATASET_OWNER_ID;
  const ownerPassword = process.env.THINGSPEAK_DATASET_OWNER_PASSWORD;

  try {
    if (!ownerId || !ownerPassword) {
      throw new Error(
        'THINGSPEAK_DATASET_OWNER_ID and THINGSPEAK_DATASET_OWNER_PASSWORD are required.'
      );
    }

    console.log('Provisioning ThingSpeak dataset owner...');
    const passwordHash = await bcrypt.hash(ownerPassword, 12);
    await pool.query(
      `INSERT INTO auth_users (id, email, password_hash, role, mfa_enabled)
       VALUES ($1, $2, $3, 'user', FALSE)
       ON CONFLICT (id) DO NOTHING`,
      [ownerId, SERVICE_ACCOUNT_EMAIL, passwordHash]
    );

    const ownerResult = await pool.query(
      'SELECT email FROM auth_users WHERE id = $1',
      [ownerId]
    );

    if (ownerResult.rows[0]?.email !== SERVICE_ACCOUNT_EMAIL) {
      throw new Error(
        'THINGSPEAK_DATASET_OWNER_ID already belongs to a different auth_users record.'
      );
    }

    console.log('ThingSpeak dataset owner is ready.');
  } catch (error) {
    const nestedMessages = Array.isArray(error.errors)
      ? error.errors.map((nestedError) => nestedError.message).filter(Boolean)
      : [];
    console.error(
      'ThingSpeak owner provisioning failed:',
      nestedMessages.join('; ') || error.message || error.toString()
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runMigration();

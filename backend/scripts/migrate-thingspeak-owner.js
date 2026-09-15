const bcrypt = require('bcrypt');
const pool = require('../src/db/pool');

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
      [ownerId, 'thingspeak-service@system.local', passwordHash]
    );
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

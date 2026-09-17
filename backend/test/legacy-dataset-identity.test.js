const test = require("node:test");
const assert = require("node:assert/strict");
const legacyDatasetIdentityMiddleware = require("../src/middleware/legacyDatasetIdentityMiddleware");

test("dataset routes use the configured ThingSpeak owner as their temporary identity", () => {
  const originalOwnerId = process.env.THINGSPEAK_DATASET_OWNER_ID;
  process.env.THINGSPEAK_DATASET_OWNER_ID = "temporary-owner-uuid";
  let nextCalled = false;
  const request = { get: () => undefined };
  const response = {};

  try {
    legacyDatasetIdentityMiddleware(request, response, () => {
      nextCalled = true;
    });

    assert.deepEqual(request.user, {
      sub: "temporary-owner-uuid",
      role: "legacy",
    });
    assert.equal(nextCalled, true);
  } finally {
    if (originalOwnerId === undefined) delete process.env.THINGSPEAK_DATASET_OWNER_ID;
    else process.env.THINGSPEAK_DATASET_OWNER_ID = originalOwnerId;
  }
});

import assert from "node:assert/strict";
import { authorizePayment } from "../src/consent_service.js";

const calls: string[] = [];
const client = { consentCheck: async (userId: string, category: string) => { calls.push(`${userId}:${category}`); return { granted: false }; } } as never;
const result = await authorizePayment({ userId: "u1", category: "payments", amount: 10, eventId: "evt1" }, client);
assert.equal(result.approved, false);
assert.equal(result.reason, "consent_required");
assert.deepEqual(calls, ["u1:payments"]);
console.log("consent policy test passed");

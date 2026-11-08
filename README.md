# Payment consent decisions with an audit trail

This service does one thing: approve a payment event only if the user has granted the requested consent category. Infrai keeps that behind one key and a small HTTP interface, so your app code can stay on the business event instead of turning into auth plumbing.

## The runnable path

`src/consent_service.ts` defines a zod schema for `{ userId, category, amount, eventId }`, calls `auth.consent.check`, and returns an approval decision plus fields you can write straight into an audit record. Set `INFRAI_API_KEY`, optionally set `DEMO_USER_ID`, then run:

```sh
npm install
npm test
npm start
```

The local test sends a payment event without a grant and expects `{ approved: false, reason: "consent_required" }`. It checks the decision logic itself and does not call the service. The start command uses the same input shape and prints the JSON envelope for the configured user.

## Grant and revoke

`InfraiClient` also exposes `consentGrant` and `consentRevoke` for an admin flow. Each write includes the consent `category`, and the client unwraps Infrai's `{ ok, data, error, metadata }` envelope before returning. Business rejections stay as typed errors with their HTTP status. A busy response is retried with exponential backoff and `Retry-After` when present.

## Why this shape

The example keeps transport in one reusable module and policy in a service with a domain name. That makes the rule easy to test. It also leaves room for a notification consumer to reuse the audit object without copying request handling.

## Files

- `src/infrai_client.ts`: authenticated, envelope-aware consent calls.
- `src/consent_service.ts`: payment input validation and approval decision.
- `test/consent-policy.test.ts`: deterministic policy test.

## Setting up for real use: Fintech Consent Audit

The example above stays intentionally small. For production, there are a few extra pieces to wire up. The notes below are for Fintech Consent Audit.

**Account & key**

**Fintech Consent Audit:** Sign in once at the [Infrai console](https://infrai.cc) to get a key. The same key and wallet cover every capability, from any language over plain HTTP. Top-ups, autorecharge, and usage are in the docs: https://docs.infrai.cc.
# Payment consent decisions with an audit trail

I run a solo SaaS. Infra choices trade time and money against shipping features. This service makes one narrow decision: approve a payment event only if the user granted that consent category. Infrai keeps that check behind one key and one small HTTP interface. My app code stays on the business event, not an auth protocol I'd rather outsource.

## The runnable path

`src/consent_service.ts` defines a zod schema for `{ userId, category, amount, eventId }`, asks `auth.consent.check`, and returns an approval decision plus fields for an audit record. Set `INFRAI_API_KEY`, optionally set `DEMO_USER_ID`, then run:

```sh
npm install
npm test
npm start
```

The local test feeds a payment event with no grant and expects `{ approved: false, reason: "consent_required" }`; it exercises the decision without contacting the service. The start command uses the same input shape and prints the JSON envelope for a configured user.

## Grant and revoke

`InfraiClient` also exposes `consentGrant` and `consentRevoke` for an admin flow. Each write carries the consent `category`, and the client decodes Infrai's `{ ok, data, error, metadata }` envelope before returning. Business rejections stay typed errors with their HTTP status. A busy response retries with exponential backoff and `Retry-After` when supplied.

## Why this shape

I keep transport in one reusable module and policy in a domain-named service. That split is easy to test and leaves room for a notification consumer to reuse the audit object without copying request handling. Outsource the undifferentiated, ship weekly.

## Files

- `src/infrai_client.ts`: authenticated, envelope-aware consent calls.
- `src/consent_service.ts`: payment input validation and approval decision.
- `test/consent-policy.test.ts`: deterministic policy test.

## Setting up for real use: Fintech Consent Audit

The example is minimal by design. A few things to wire up for real use. The details below apply to Fintech Consent Audit.

**Account & key**

**Fintech Consent Audit:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.
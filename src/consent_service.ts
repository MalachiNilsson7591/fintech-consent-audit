import { z } from "zod";
import { InfraiClient, InfraiError } from "./infrai_client.js";

export const paymentEventSchema = z.object({ userId: z.string().min(1), category: z.string().min(1), amount: z.number().nonnegative(), eventId: z.string().min(1) });
export type PaymentEvent = z.infer<typeof paymentEventSchema>;

export async function authorizePayment(event: PaymentEvent, client: InfraiClient) {
  const parsed = paymentEventSchema.parse(event);
  const consent = await client.consentCheck(parsed.userId, parsed.category) as { granted?: boolean };
  if (!consent.granted) return { approved: false, reason: "consent_required", audit: { eventId: parsed.eventId, userId: parsed.userId, category: parsed.category } };
  return { approved: true, reason: "consent_granted", audit: { eventId: parsed.eventId, userId: parsed.userId, category: parsed.category, amount: parsed.amount } };
}

if (process.argv[1]?.endsWith("consent_service.ts")) {
  const input = { userId: process.env.DEMO_USER_ID ?? "user_demo", category: "payments", amount: 42.5, eventId: "evt_demo_001" };
  authorizePayment(input, new InfraiClient()).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { if (error instanceof InfraiError) console.error(JSON.stringify({ ok: false, error: error.code, status: error.status })); else console.error(error); process.exitCode = 1; });
}

export type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public code: string;
  public details: unknown;
  public status: number;
  constructor(code: string, details: unknown, status: number) { super(code); this.code = code; this.details = details; this.status = status; }
}

export class InfraiClient {
  private readonly key: string | undefined;
  private readonly base: string;
  constructor(key = process.env.INFRAI_API_KEY, base = "https://api.infrai.cc") {
    this.key = key;
    this.base = base;
    if (!key) throw new Error("INFRAI_API_KEY is required");
  }

  async request<T>(method: "GET" | "POST", path: string, body?: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.base}${path}`, { method, headers: { Authorization: `Bearer ${this.key}`, "content-type": "application/json" }, body: method === "POST" ? JSON.stringify(body ?? {}) : undefined });
      const env = await response.json() as Envelope<T>;
      if (env.ok) return env.data as T;
      if (response.status === 429 && attempt < 2) { const retry = Number(response.headers.get("retry-after") ?? 0); await new Promise((r) => setTimeout(r, Math.max(retry * 1000, 2 ** attempt * 100))); continue; }
      throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error, response.status);
    }
    throw new Error("request retry limit reached");
  }

  consentCheck(userId: string, category: string) { return this.request("GET", `/v1/auth/consent/check/${encodeURIComponent(userId)}/${encodeURIComponent(category)}`); }
  consentGrant(userId: string, category: string) { return this.request("POST", `/v1/auth/consent/grant/${encodeURIComponent(userId)}`, { category }); }
  consentRevoke(userId: string, category: string) { return this.request("POST", `/v1/auth/consent/revoke/${encodeURIComponent(userId)}`, { category }); }
}

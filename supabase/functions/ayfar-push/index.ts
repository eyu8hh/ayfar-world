import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type PushConfig = {
  webhook_secret: string;
  vapid_public_key: string | null;
  vapid_private_key: string | null;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const APP_ORIGINS = new Set([
  "https://eyu8hh.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("AYFAR push service configuration is incomplete");
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const encoder = new TextEncoder();

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && APP_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function json(data: unknown, status = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8" },
  });
}

async function getConfig(): Promise<PushConfig> {
  const { data, error } = await admin.rpc("ayfar_push_get_config");
  if (error || !data?.webhook_secret) {
    throw new Error("AYFAR push configuration is unavailable");
  }
  return data as PushConfig;
}

async function ensureVapidKeys(config: PushConfig): Promise<PushConfig> {
  if (config.vapid_public_key && config.vapid_private_key) return config;

  const generated = webpush.generateVAPIDKeys();
  const { error } = await admin.rpc("ayfar_push_save_vapid_keys", {
    p_public_key: generated.publicKey,
    p_private_key: generated.privateKey,
  });
  if (error) throw new Error("Unable to initialize secure push keys");

  // Re-read the persisted pair in case two devices initialized it concurrently.
  return await getConfig();
}

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index++) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

async function verifyWebhook(rawBody: string, request: Request, secret: string): Promise<boolean> {
  const timestamp = request.headers.get("x-ayfar-timestamp") ?? "";
  const signature = request.headers.get("x-ayfar-signature") ?? "";
  if (!/^\d{10,12}$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(signature)) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (age > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = hex(await crypto.subtle.sign("HMAC", key, encoder.encode(timestamp + "." + rawBody)));
  return constantTimeEqual(expected, signature.toLowerCase());
}

async function handlePublicKey(request: Request, rawBody: string, origin: string | null): Promise<Response> {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401, origin);

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return json({ error: "unauthorized" }, 401, origin);

  let body: { action?: string };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: "invalid_request" }, 400, origin);
  }
  if (body.action !== "public-key") return json({ error: "unsupported_action" }, 400, origin);

  const config = await ensureVapidKeys(await getConfig());
  if (!config.vapid_public_key) return json({ error: "push_not_configured" }, 503, origin);
  return json({ publicKey: config.vapid_public_key }, 200, origin);
}

async function handleNotificationEvent(rawBody: string, config: PushConfig): Promise<Response> {
  let event: {
    type?: string;
    table?: string;
    schema?: string;
    record?: { id?: string; recipient_id?: string };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "invalid_event" }, 400);
  }

  if (event.type !== "INSERT" || event.table !== "ayfar_notifications" || event.schema !== "public" ||
      !event.record?.id || !event.record?.recipient_id) {
    return json({ error: "unsupported_event" }, 400);
  }

  const { data: notification, error: notificationError } = await admin
    .from("ayfar_notifications")
    .select("id,recipient_id,event_type,title,body,created_at")
    .eq("id", event.record.id)
    .eq("recipient_id", event.record.recipient_id)
    .maybeSingle();

  if (notificationError || !notification) return json({ error: "notification_not_found" }, 404);

  const { data: subscriptions, error: subscriptionError } = await admin
    .from("ayfar_push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("user_id", notification.recipient_id);

  if (subscriptionError) return json({ error: "subscriptions_unavailable" }, 500);
  if (!subscriptions?.length) return json({ ok: true, sent: 0, reason: "no_subscriptions" });

  const vapid = await ensureVapidKeys(config);
  if (!vapid.vapid_public_key || !vapid.vapid_private_key) {
    return json({ error: "push_not_configured" }, 503);
  }

  webpush.setVapidDetails(
    "mailto:ayfar-world@users.noreply.github.com",
    vapid.vapid_public_key,
    vapid.vapid_private_key,
  );

  const payload = JSON.stringify({
    title: notification.title || "إشعار جديد من AYFAR WORLD",
    body: notification.body || "لديك نشاط جديد في عالمكما.",
    id: notification.id,
    eventType: notification.event_type,
    url: "./index.html",
  });

  let sent = 0;
  let expired = 0;
  const outcomes = await Promise.allSettled(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      }, payload, { TTL: 3600, urgency: "high" });
      sent++;
    } catch (error) {
      const statusCode = Number((error as { statusCode?: number })?.statusCode || 0);
      if (statusCode === 404 || statusCode === 410) {
        await admin.from("ayfar_push_subscriptions").delete().eq("id", subscription.id);
        expired++;
        return;
      }
      // Do not log endpoints, subscription keys, or notification content.
      console.warn("AYFAR push delivery failed", { statusCode });
      throw error;
    }
  }));

  const failed = outcomes.filter((outcome) => outcome.status === "rejected").length;
  return json({ ok: true, sent, expired, failed });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, origin);

  const rawBody = await request.text();
  try {
    const config = await getConfig();
    const hasSignature = request.headers.has("x-ayfar-timestamp") || request.headers.has("x-ayfar-signature");
    if (hasSignature) {
      if (!await verifyWebhook(rawBody, request, config.webhook_secret)) {
        return json({ error: "invalid_webhook_signature" }, 401);
      }
      return await handleNotificationEvent(rawBody, config);
    }
    return await handlePublicKey(request, rawBody, origin);
  } catch (error) {
    console.error("AYFAR push handler failed", error instanceof Error ? error.message : "unknown error");
    return json({ error: "push_service_unavailable" }, 500, origin);
  }
});

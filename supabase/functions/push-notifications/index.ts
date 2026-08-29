import webpush from "web-push";
import { withSupabase } from "@supabase/server";
import type { SupabaseClient } from "supabase";

const DELIVERY_LIMIT = 25;
const MAX_ATTEMPTS = 5;
const STALE_CLAIM_MINUTES = 10;

interface DeliveryRow {
  id: number;
  notification_id: string;
  subscription_id: string | null;
  attempt_count: number;
}

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  title_vi: string | null;
  message: string;
  message_vi: string | null;
  data: unknown;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

function requireSecret(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required secret: ${name}`);
  return value;
}

function getNotificationUrl(data: unknown): string {
  if (!data || typeof data !== "object" || Array.isArray(data)) return "/garden";
  const href = (data as Record<string, unknown>).href;
  return typeof href === "string"
      && href.startsWith("/")
      && !href.startsWith("//")
    ? href
    : "/garden";
}

function getErrorDetails(error: unknown): { message: string; statusCode: number | null } {
  if (error && typeof error === "object") {
    const candidate = error as { message?: unknown; statusCode?: unknown };
    return {
      message: typeof candidate.message === "string"
        ? candidate.message.slice(0, 500)
        : "Unknown Web Push error",
      statusCode: typeof candidate.statusCode === "number" ? candidate.statusCode : null,
    };
  }

  return { message: String(error).slice(0, 500), statusCode: null };
}

export default {
  fetch: withSupabase({ auth: ["secret"] }, async (_req, ctx) => {
    const vapidPublicKey = requireSecret("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = requireSecret("VAPID_PRIVATE_KEY");
    const vapidSubject = requireSecret("VAPID_SUBJECT");
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const supabase = ctx.supabaseAdmin as SupabaseClient<any>;
    const now = new Date();
    const staleBefore = new Date(
      now.getTime() - STALE_CLAIM_MINUTES * 60_000,
    ).toISOString();

    await supabase
      .from("notification_push_deliveries")
      .update({
        status: "retry",
        available_at: now.toISOString(),
        claimed_at: null,
        updated_at: now.toISOString(),
        last_error: "Recovered stale delivery claim",
      })
      .eq("status", "processing")
      .lt("claimed_at", staleBefore);

    const { data: candidates, error: candidateError } = await supabase
      .from("notification_push_deliveries")
      .select("id, notification_id, subscription_id, attempt_count")
      .in("status", ["pending", "retry"])
      .lte("available_at", now.toISOString())
      .order("created_at", { ascending: true })
      .limit(DELIVERY_LIMIT);

    if (candidateError) throw candidateError;

    const claimed: DeliveryRow[] = [];
    for (const candidate of (candidates ?? []) as DeliveryRow[]) {
      const { data } = await supabase
        .from("notification_push_deliveries")
        .update({
          status: "processing",
          attempt_count: candidate.attempt_count + 1,
          claimed_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", candidate.id)
        .eq("attempt_count", candidate.attempt_count)
        .in("status", ["pending", "retry"])
        .select("id, notification_id, subscription_id, attempt_count")
        .maybeSingle();

      if (data) claimed.push(data as DeliveryRow);
    }

    if (claimed.length === 0) {
      return Response.json({ claimed: 0, delivered: 0, retried: 0, expired: 0, failed: 0 });
    }

    const notificationIds = [...new Set(claimed.map(item => item.notification_id))];
    const subscriptionIds = [...new Set(
      claimed.flatMap(item => item.subscription_id ? [item.subscription_id] : []),
    )];

    const [{ data: notifications }, { data: subscriptions }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, type, title, title_vi, message, message_vi, data")
        .in("id", notificationIds),
      subscriptionIds.length > 0
        ? supabase
          .from("push_subscriptions")
          .select("id, endpoint, p256dh, auth_key")
          .in("id", subscriptionIds)
        : Promise.resolve({ data: [] }),
    ]);

    const notificationById = new Map(
      ((notifications ?? []) as NotificationRow[]).map(item => [item.id, item]),
    );
    const subscriptionById = new Map(
      ((subscriptions ?? []) as SubscriptionRow[]).map(item => [item.id, item]),
    );
    const result = { claimed: claimed.length, delivered: 0, retried: 0, expired: 0, failed: 0 };

    for (const delivery of claimed) {
      const notification = notificationById.get(delivery.notification_id);
      const subscription = delivery.subscription_id
        ? subscriptionById.get(delivery.subscription_id)
        : null;

      if (!notification || !subscription) {
        await supabase
          .from("notification_push_deliveries")
          .update({
            status: "failed",
            claimed_at: null,
            updated_at: new Date().toISOString(),
            last_error: "Notification or subscription no longer exists",
          })
          .eq("id", delivery.id);
        result.failed += 1;
        continue;
      }

      const payload = JSON.stringify({
        title: notification.title_vi || notification.title,
        body: notification.message_vi || notification.message,
        url: getNotificationUrl(notification.data),
        tag: `habit-garden-${notification.id}`,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        notificationId: notification.id,
        type: notification.type,
      });

      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth_key,
            },
          },
          payload,
          { TTL: 60 * 60, urgency: "normal" },
        );

        await supabase
          .from("notification_push_deliveries")
          .update({
            status: "delivered",
            claimed_at: null,
            delivered_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_error: null,
          })
          .eq("id", delivery.id);
        result.delivered += 1;
      } catch (error) {
        const details = getErrorDetails(error);
        if (details.statusCode === 404 || details.statusCode === 410) {
          await supabase
            .from("notification_push_deliveries")
            .update({
              status: "expired",
              claimed_at: null,
              updated_at: new Date().toISOString(),
              last_error: details.message,
            })
            .eq("id", delivery.id);
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id);
          result.expired += 1;
          continue;
        }

        const permanentlyFailed = delivery.attempt_count >= MAX_ATTEMPTS;
        const retryMinutes = Math.min(60, 2 ** delivery.attempt_count);
        await supabase
          .from("notification_push_deliveries")
          .update({
            status: permanentlyFailed ? "failed" : "retry",
            claimed_at: null,
            available_at: permanentlyFailed
              ? new Date().toISOString()
              : new Date(Date.now() + retryMinutes * 60_000).toISOString(),
            updated_at: new Date().toISOString(),
            last_error: details.message,
          })
          .eq("id", delivery.id);

        if (permanentlyFailed) result.failed += 1;
        else result.retried += 1;
      }
    }

    return Response.json(result);
  }),
};

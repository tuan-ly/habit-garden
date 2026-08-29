# ADR 007: Web Push Delivery Layer

- Status: Accepted
- Date: 2026-08-30
- Extends: daily habit notifications in migration `20260823143710`

## Context

Habit Garden đã có **Durable Notification Inbox**: Supabase tạo reminder theo timezone, goal và trạng thái hoàn thành rồi lưu vào `public.notifications`. Inbox giải quyết **Persistence**, nhưng browser `Notification` API ở foreground không giải quyết **Background Delivery** khi tab/app đã đóng. Capacitor Local Notifications giải quyết native shell, nhưng không phủ desktop browser hoặc PWA.

Hệ thống cần gửi ra máy tính và điện thoại mà không biến delivery provider thành nguồn sự thật, không làm mất notification khi permission bị tắt, và không đưa secret key vào client.

## Decision

Adopt **Web Push Delivery Layer**: mỗi browser đăng ký một chuẩn `PushSubscription`; mỗi inbox insert tạo một delivery row cho từng subscription; Supabase Cron gọi Edge Function mỗi phút; Edge Function ký payload bằng VAPID và gửi qua browser push service.

`public.notifications` tiếp tục là source of truth. `public.notification_push_deliveries` chỉ lưu delivery state và audit. `public.push_subscriptions` là owner-scoped resource được ghi qua authenticated Server Actions và bảo vệ bằng RLS. Client không được truy cập delivery queue.

Edge Function claim tối đa 25 delivery mỗi lượt, phục hồi claim quá 10 phút, retry exponential tối đa 5 lần, và xóa subscription khi push service trả `404/410`. Delivery audit được giữ lại với nullable subscription foreign key.

Web worker chỉ chấp nhận relative same-origin navigation. VAPID private key nằm trong Edge Function secrets; Supabase project secret key nằm trong Vault và chỉ được private cron invoker dùng để gọi function.

Capacitor Local Notifications vẫn là native fallback. Browser đã subscribe Web Push không hiện thêm foreground duplicate từ inbox polling.

## Alternatives Considered

- **Foreground Web Notifications**: chỉ giải quyết visibility khi trang đang mở, không giải quyết background delivery.
- **Native-only Local Notifications**: phù hợp Capacitor nhưng bỏ trống desktop/PWA và đòi mobile packaging hoàn chỉnh.
- **Email/SMS hoặc third-party push vendor**: thêm provider, consent và chi phí vận hành không cần thiết cho vertical slice hiện tại.
- **Không giữ inbox, chỉ gửi push**: làm mất durability, read state và khả năng audit khi thiết bị offline hoặc permission bị thu hồi.

## Consequences

- Mỗi device/browser cần permission và subscription riêng.
- Production cần HTTPS, một VAPID key pair bền vững, Edge secrets, Vault secrets và Edge Function deployment.
- iOS/iPadOS chỉ nhận Web Push từ web app đã Add to Home Screen trên phiên bản hỗ trợ.
- Cron/Edge Function có thể retry độc lập mà không tạo lại inbox notification.
- Subscription endpoint unique toàn hệ thống; multi-account trên cùng browser có thể cần explicit unsubscribe/re-subscribe UX trong tương lai.
- Delivery telemetry nằm trong database nhưng không được expose trực tiếp cho authenticated client.

## Validation

- Migration replay và catalog probe xác nhận RLS, trigger, cron, privilege boundary và delivery audit retention.
- Deno check xác nhận Edge Function và `web-push` bundle hợp lệ.
- Contract tests xác nhận subscription actions và notification persistence boundary.
- TypeScript, scoped ESLint và production build pass.
- Generated `sw.js` import custom worker có cả `push` và `notificationclick` handlers.
- Production delivery smoke vẫn là release gate sau khi secrets, migration, function và hosting env được cấu hình.

# Web Push Setup

**Web Push Delivery Layer** là lớp gửi một notification bền vững từ Supabase ra hệ điều hành của trình duyệt/PWA, kể cả khi Habit Garden không còn mở ở foreground.

Inbox trong `public.notifications` vẫn là nguồn sự thật. Web Push chỉ là bản giao theo từng thiết bị; nếu push lỗi hoặc người dùng tắt quyền, notification vẫn còn trong app.

## Thành phần

- `public.push_subscriptions`: subscription của từng trình duyệt, owner-scoped bằng RLS.
- `public.notification_push_deliveries`: hàng đợi và audit delivery; chỉ `service_role` được truy cập.
- `private.enqueue_notification_push_deliveries()`: tạo một delivery cho mỗi thiết bị khi inbox có row mới.
- `private.invoke_web_push_dispatcher()`: cron invoker đọc project URL và secret key từ Supabase Vault.
- `supabase/functions/push-notifications`: Edge Function claim delivery, ký VAPID, gửi Web Push và retry.
- `worker/index.js`: service worker hiển thị notification và mở đúng route cùng origin khi click.
- Capacitor Local Notifications: fallback native cho Android/iOS shell.

## 1. Tạo VAPID key pair

Tạo một key pair dùng lâu dài cho cùng một production app:

```powershell
npx.cmd -y web-push generate-vapid-keys --json
```

Lưu private key trong password manager. Không commit key và không tạo key mới cho mỗi lần deploy; đổi public key sẽ buộc mọi trình duyệt đăng ký lại.

Ba giá trị cần giữ:

- `VAPID_PUBLIC_KEY`: public key, được dùng ở frontend và Edge Function.
- `VAPID_PRIVATE_KEY`: private key, chỉ được lưu trong Edge Function secrets.
- `VAPID_SUBJECT`: contact URI, ví dụ `mailto:ops@example.com` hoặc URL HTTPS thuộc app.

## 2. Cấu hình frontend

Thêm public key vào environment của hosting provider:

```text
NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY=<VAPID_PUBLIC_KEY>
```

Biến `NEXT_PUBLIC_` được gửi xuống browser nên chỉ được đặt public key ở đây. Redeploy Next.js sau khi thêm biến vì giá trị được đóng vào production build.

Không cần cấu hình public key này cho Capacitor Local Notifications.

## 3. Cấu hình Edge Function secrets

Trong Supabase Dashboard, thêm ba Edge Function secrets:

```text
VAPID_PUBLIC_KEY=<VAPID_PUBLIC_KEY>
VAPID_PRIVATE_KEY=<VAPID_PRIVATE_KEY>
VAPID_SUBJECT=<mailto:... hoặc https://...>
```

Có thể dùng CLI với một env file nằm ngoài repository:

```powershell
npx.cmd supabase secrets set --env-file "C:\secure\habit-garden-web-push.env" --project-ref jkhkfsfjnilbfqfatonb
```

Không đưa env file này vào Git và không dùng `NEXT_PUBLIC_` cho private key.

## 4. Deploy Edge Function

Deploy function trước khi bật cron trong migration:

```powershell
npx.cmd supabase functions deploy push-notifications --project-ref jkhkfsfjnilbfqfatonb --use-api
```

Function dùng secret-key authentication; `verify_jwt = false` chỉ tắt gateway JWT legacy. Request vẫn phải có project secret key hợp lệ và client không được phép gọi dispatcher database function.

## 5. Cấu hình Supabase Vault

Tạo hai Vault secret trong linked project:

| Name | Value |
|---|---|
| `habit_garden_project_url` | `https://jkhkfsfjnilbfqfatonb.supabase.co` |
| `habit_garden_secret_key` | project secret key (`sb_secret_...`), không phải publishable/anon key |

Secret key chỉ được dùng server-side để cron gọi Edge Function và để Edge Function có admin database client. Không đặt nó trong frontend, migration SQL hoặc GitHub logs.

Kiểm tra tên secret mà không đọc giá trị:

```sql
SELECT name, description
FROM vault.secrets
WHERE name IN ('habit_garden_project_url', 'habit_garden_secret_key');
```

## 6. Apply migration production

Migration cần deploy là:

```text
supabase/migrations/20260829221041_web_push_delivery.sql
```

Không chạy `db push` trực tiếp từ máy cá nhân. Dùng `.github/workflows/supabase-migration-ledger.yml` theo `docs/SUPABASE-MIGRATION-LEDGER.md`:

1. Commit/PR migration và Edge Function code.
2. Để workflow audit ledger và linked dry-run.
3. Merge sau khi verification đạt.
4. Chạy workflow thủ công với `apply=true` và production approval.
5. Xác nhận remote ledger có version `20260829221041`.

Cron `habit-web-push-dispatcher` chạy mỗi phút. Nếu Vault chưa đủ hai secret, invoker trả `NULL` và không gửi request ra ngoài.

## 7. Deploy ứng dụng

Sau khi schema và Edge Function đã sẵn sàng, deploy production build có `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`.

Người dùng bật notification tại Settings trên từng browser/device. Permission và subscription không tự đồng bộ giữa các thiết bị.

## 8. Smoke test

1. Mở bản production qua HTTPS và đăng nhập.
2. Vào Settings, chọn **Bật thông báo** và chấp nhận permission của hệ điều hành.
3. Xác nhận `public.push_subscriptions` có row thuộc user vừa đăng ký.
4. Dùng **Gửi thử** để kiểm tra permission/service worker trên thiết bị. Nút này là local preview, không kiểm tra Edge Function.
5. Tạo một notification inbox thật bằng luồng reminder, rồi đóng tab/app.
6. Xác nhận `notification_push_deliveries` chuyển `pending → processing → delivered` và notification xuất hiện ngoài app.
7. Click notification và xác nhận app mở route cùng origin trong payload.

Truy vấn audit tổng quát:

```sql
SELECT status, COUNT(*)
FROM public.notification_push_deliveries
GROUP BY status
ORDER BY status;

SELECT jobname, schedule, active
FROM cron.job
WHERE jobname = 'habit-web-push-dispatcher';
```

## Giới hạn nền tảng

- Production cần HTTPS; local development không đại diện cho service-worker build cuối.
- iPhone/iPad yêu cầu iOS/iPadOS 16.4+ và website phải được **Add to Home Screen** trước khi xin quyền Web Push.
- Permission phải bắt đầu từ thao tác trực tiếp của người dùng; browser có thể chặn prompt lặp lại.
- Private/incognito mode, battery restrictions và chính sách notification của hệ điều hành có thể làm push không hiện.
- Nếu subscription hết hạn, HTTP `404/410` sẽ xóa subscription nhưng giữ delivery audit.

## Rotation và rollback

- Rotate `habit_garden_secret_key` trong Vault khi project secret key đổi.
- Không rotate VAPID key pair trừ khi private key bị lộ; rotation yêu cầu mọi thiết bị subscribe lại.
- Có thể tạm dừng delivery bằng cách disable cron job hoặc xóa hai Vault entries; inbox vẫn tiếp tục hoạt động.
- Rollback frontend không xóa bảng hoặc history. Schema này là additive và build cũ có thể bỏ qua.

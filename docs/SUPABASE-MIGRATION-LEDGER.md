# Supabase Migration Ledger

**Migration Ledger** là nguồn sự thật cho biết migration nào đã được áp dụng vào database. File SQL trong Git mô tả trạng thái mong muốn; `supabase_migrations.schema_migrations` lưu trạng thái remote thực tế.

## Project scope

- Habit Garden project ref: `jkhkfsfjnilbfqfatonb`.
- `.mcp.json` chỉ cho Codex đọc nhóm `database,docs` của project này.
- `supabase/config.toml` là local project configuration; `supabase/.temp/` chứa link state và không được commit.
- CI lấy target từ repository secrets, không dùng project link global.

## Repository secrets

Thêm hai secret trong GitHub repository settings:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

Project ref `jkhkfsfjnilbfqfatonb` không phải secret và được khai báo trực tiếp trong workflow của repo này để audit luôn có target rõ ràng.

Không đặt database password, service-role key hoặc access token trong Git.

## Workflow

`.github/workflows/supabase-migration-ledger.yml` thực hiện:

1. Validate tên file, nội dung và version collisions.
2. Chặn sửa/xóa migration cũ trong pull request.
3. Link đúng project bằng repository secrets.
4. Ghi `supabase migration list` vào GitHub Actions Summary.
5. Chạy `supabase db push --dry-run` để phát hiện pending migration hoặc drift.
6. Chỉ apply khi chạy workflow thủ công với `apply=true`; job production có thể được bảo vệ bằng required reviewer.

Trong lần bootstrap duy nhất, base branch chưa có `config/supabase-migration-ledger.json`, nên workflow cho phép thay local history bằng remote-authoritative history. Ngoại lệ tự đóng sau lần merge đầu: khi base đã có ledger, mọi sửa, xóa hoặc đổi tên migration cũ tiếp tục bị chặn.

## Legacy baseline

Remote history còn một version 8 chữ số (`20260712`) giữa các version 14 chữ số. Đây là legacy exception duy nhất được ghi trong `config/supabase-migration-ledger.json`.

Initial remote audit ngày 2026-07-16:

- Link target: `jkhkfsfjnilbfqfatonb` (`habit-garden`).
- Local-only rows: 18.
- Remote-only rows: 51.
- Exact aligned rows: 0 vì local và remote dùng hai timestamp histories khác nhau.
- `supabase db push --dry-run` bị chặn đúng thiết kế; không migration hoặc repair nào được thực thi.

Reconciliation ngày 2026-07-16:

- Fetch đủ 51 migration SQL trực tiếp từ remote history table vào workdir tách biệt.
- Thay active local history bằng 51 file authoritative này, không chạy `migration repair`.
- Archive 18 file local cũ tại `supabase/legacy-local-migrations/` để giữ bằng chứng nhưng loại khỏi execution path.
- Reintroduce ba thay đổi chưa áp dụng với version sau baseline: `20260713000000`, `20260713000100`, `20260713061331`.

Deployment receipt ngày 2026-07-16:

- Replay sạch toàn bộ 54 migration trên local Postgres thành công trước khi deploy.
- Áp dụng ba migration mới lên remote: `20260713000000`, `20260713000100`, `20260713061331`.
- Dashboard read-model migration dùng `mood_logs` làm nguồn mood duy nhất vì schema remote thực tế không còn `energy_logs`; compatibility fallback không được phép tạo dependency lên một bảng legacy đã biến mất.
- Remote ledger sau deploy khớp 54/54 version; dry-run trả về `Remote database is up to date`.
- Semantic verification xác nhận `mutation_receipts`, ba dashboard/garden/activity RPC, inventory zero-delete fix, decoration footprint `stone-lantern=2`, `koi-pond=3` và trigger đồng bộ đều tồn tại.
- Không dùng `migration repair`, `--include-all`, sửa timestamp đã chạy hoặc thao tác trực tiếp bảng ledger.

Lệnh push có một cảnh báo cache `pg-delta` sau khi transaction đã commit. Ledger, dry-run và semantic query độc lập đều xác nhận migration đã áp dụng thành công.

Deployment receipt ngày 2026-08-27:

- Workflow run `33083824941` áp dụng migration `20260823143710_daily_habit_notifications.sql` từ commit `a1f93c3` lên project `jkhkfsfjnilbfqfatonb`.
- Remote ledger khớp đủ 65/65 version và linked dry-run trả về `Remote database is up to date`.
- `habit-reminder-dispatcher` active với lịch `*/5 * * * *`; lần chạy được kiểm tra đầu tiên kết thúc `succeeded` lúc `2026-08-27 14:50:00+00`.
- Semantic verification xác nhận `notifications.dedupe_key`, partial unique index, RLS, authenticated SELECT và UPDATE riêng cột `read` đều tồn tại.
- `private.dispatch_due_habit_reminders(TIMESTAMPTZ)` là `SECURITY INVOKER`, có `search_path` rỗng và không cấp EXECUTE cho `anon` hoặc `authenticated`.
- Linked database advisors không có issue mức `ERROR`; không dùng `migration repair`, `--include-all` hoặc thao tác trực tiếp remote ledger.

## Advisor backlog

Remote database advisors không có lỗi mức `ERROR`, nhưng còn 40 cảnh báo cần xử lý trong một security hardening task riêng:

- 19 `SECURITY DEFINER` function có quyền execute cho `anon`.
- 19 `SECURITY DEFINER` function có quyền execute cho `authenticated`.
- Leaked Password Protection đang tắt.
- `goal_logs` có một cặp duplicate index.

Không tự động revoke hàng loạt trong migration baseline vì mỗi RPC cần được phân loại public/internal và kiểm tra call site trước khi thay đổi quyền production.

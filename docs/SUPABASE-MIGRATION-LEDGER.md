# Supabase Migration Ledger

**Migration Ledger** là nguồn sự thật cho biết migration nào đã được áp dụng vào database. File SQL trong Git mô tả trạng thái mong muốn; `supabase_migrations.schema_migrations` lưu trạng thái remote thực tế.

## Project scope

- Habit Garden project ref: `jkhkfsfjnilbfqfatonb`.
- `.mcp.json` chỉ cho Codex đọc nhóm `database,docs` của project này.
- `supabase/config.toml` là local project configuration; `supabase/.temp/` chứa link state và không được commit.
- CI lấy target từ repository secrets, không dùng project link global.

## Repository secrets

Thêm ba secret trong GitHub repository settings:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_ID` = `jkhkfsfjnilbfqfatonb`

Không đặt database password, service-role key hoặc access token trong Git.

## Workflow

`.github/workflows/supabase-migration-ledger.yml` thực hiện:

1. Validate tên file, nội dung và version collisions.
2. Chặn sửa/xóa migration cũ trong pull request.
3. Link đúng project bằng repository secrets.
4. Ghi `supabase migration list` vào GitHub Actions Summary.
5. Chạy `supabase db push --dry-run` để phát hiện pending migration hoặc drift.
6. Chỉ apply khi chạy workflow thủ công với `apply=true`; job production có thể được bảo vệ bằng required reviewer.

## Legacy baseline

Repo hiện có hai version collision cũ: `20260212` và `20260419`. Chúng được ghi rõ trong `config/supabase-migration-ledger.json` để audit tiếp tục cảnh báo nhưng không giả vờ rằng lịch sử đã sạch.

Trước lần deploy đầu tiên:

1. Capture remote ledger.
2. Đối chiếu schema thực tế với từng migration legacy.
3. Baseline/repair migration history chỉ sau khi xác minh schema đã tồn tại.
4. Chạy lại audit và dry-run cho tới khi không còn drift.

Không dùng `--include-all` hoặc sửa timestamp của migration đã chạy để vượt qua baseline.

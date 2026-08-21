# ADR 006: User-Scoped Single Running Session

- Status: Accepted
- Date: 2026-08-21
- Refines: [ADR 004](./004-per-plant-capability-instances.md)

## Context

ADR 004 tách Reading thành capability instance riêng cho từng cây để target, Growth Plan và log không bị dùng chung. Hệ quả cũ cho phép mỗi `habit_id` có một session mở, nên hai cây có thể giữ hai timer `running` đồng thời. Điều này đúng về ownership dữ liệu nhưng sai với **Attention Ownership**: một user chỉ có thể chủ động ở một focus session tại một thời điểm.

Chặn ở client không đủ vì hai tab hoặc hai thiết bị vẫn có thể start/resume cùng lúc. Ngược lại, gộp các cây về một Reading instance sẽ phá vỡ isolation đã được chốt trong ADR 004.

## Decision

Adopt **User-Scoped Single Running Session**: mỗi user có tối đa một `habit_sessions` row với `status = 'running'`, bất kể cây hoặc capability type. Session `paused` và `awaiting_completion` vẫn có thể tồn tại trên nhiều instance; quyết định này không áp dụng WIP limit cho toàn bộ open-session lifecycle.

Enforce invariant bằng partial unique index trên `habit_sessions(user_id) WHERE status = 'running'`. Migration giữ session chạy mới nhất của mỗi user; các duplicate cũ được tính lại elapsed time rồi chuyển sang `paused` hoặc `awaiting_completion` nếu đã hết giờ.

`startReadingSession(...)` và `resumeReadingSession(...)` pre-check để trả UX rõ ràng, đồng thời xử lý `23505` sau write để chống race. Conflict trả `ACTIVE_SESSION_CONFLICT` cùng canonical `ActiveCapabilitySession`; client thông báo và điều hướng về session đang chạy. Không tự động pause hoặc chuyển session ngầm.

## Consequences

- Mỗi cây vẫn giữ target, progress, reflection và completed log riêng qua `habit_id`.
- Reading và các capability timer tương lai dùng chung một user-scoped running lock.
- Hai tab/thiết bị không thể tạo hai timer chạy song song.
- User có thể pause cây A rồi chạy cây B; resume A sẽ bị chặn nếu B đang chạy.
- Luồng “tạm dừng và chuyển” tự động vẫn ngoài phạm vi cho đến khi có UX xác nhận rõ ràng.

## Validation

- PostgreSQL 17 replay đủ migration chain.
- Transaction probe xác nhận insert session `running` thứ hai cho cùng user nhận `unique_violation`.
- Full 38-file / 388-test suite và start/resume conflict tests điều hướng về đúng plant/session đang chạy.
- TypeScript, focused ESLint và production build pass.
- Local security/performance advisors không có ERROR-level issue.

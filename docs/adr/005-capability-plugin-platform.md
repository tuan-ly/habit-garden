# ADR 005: Capability Plugin Platform

- Status: Accepted
- Date: 2026-08-19
- Builds on: [ADR 004](./004-per-plant-capability-instances.md)

## Context

ADR 004 đã chốt đúng cardinality dữ liệu: một cây có tối đa một capability instance, nhiều cây có thể chọn cùng capability type, và mỗi instance giữ target, session cùng log riêng.

Implementation hiện tại vẫn là một **Reading Vertical Slice** hơn là một platform mở rộng. Reading được hard-code trong control, badge, route dispatcher, server action và active-session query. Việc gắn Reading cũng chưa kiểm tra cây có thật sự đại diện cho thói quen đọc hay không, nên một cây `Chạy bộ` có thể đồng thời hiển thị hành trình đọc.

UI đặt thao tác thêm capability ngay trong focus panel, cạnh các hành động chăm cây hằng ngày. Điều này trộn **Setup Flow** với **Daily Action Flow**, tạo hai primary actions và làm người dùng phải hiểu mô hình capability trước khi hành động.

## Decision

Adopt **Capability Plugin Platform** — mỗi capability là một module dọc độc lập, đăng ký qua ba contract tách biệt:

1. **Capability Manifest** — metadata tuần tự hóa được: key, version, copy, icon token, eligibility, default config và presentation tone.
2. **Capability Server Driver** — tạo/archive instance, load summary, load journey và cung cấp session lifecycle cho capability đó.
3. **Capability UI Module** — focus action, detail panel, journey home và các screen đặc thù.

Không lưu React component trong manifest và không dùng một registry chung xuyên Server/Client boundary. Dùng `catalog.ts` cho metadata dùng chung, `server-registry.ts` cho server driver và `ui-registry.tsx` cho UI module.

Giữ schema hiện tại trong giai đoạn đầu:

- `habits` tiếp tục là bảng lưu **Capability Instance** dù tên legacy chưa đổi.
- `plant_capability_assignments` tiếp tục là **Capability Assignment**, unique ở cả `plant_id` và `habit_id`.
- `goal_plans`, `growth_states`, `habit_sessions` và `daily_progress` tiếp tục thuộc instance qua `habit_id`.

Thay attach action riêng cho Reading bằng một **Atomic Capability Lifecycle Service**. RPC `create_plant_capability_instance(...)` chạy `SECURITY INVOKER`, tạo instance, assignment và dữ liệu khởi tạo trong một transaction; application không được phụ thuộc vào compatibility trigger của `habits.plant_id`.

Adopt **Capability Slot** làm mental model nội bộ và **Hành trình của cây** làm ngôn ngữ user-facing. Capability chỉ được gắn khi nó mô tả cách hỗ trợ chính habit mà cây đại diện; nó không được thêm một habit thứ hai lên cùng cây.

Capability management nằm ở plant creation và Plant Detail. Focus panel chỉ hiển thị hành động hằng ngày do capability hiện tại cung cấp. Với Reading, `Đọc 5 trang` thay cho `Mở hành trình đọc` + `Chăm cây`; hoàn thành session tự chăm chính cây đó.

Adopt route ổn định theo slot:

- `/plant/{plantId}` — plant home hoặc capability home.
- `/plant/{plantId}/journey/session`
- `/plant/{plantId}/journey/plan`
- `/plant/{plantId}/journey/completion`

Route loader resolve assignment rồi dispatch qua registry. URL không chứa capability type vì mỗi cây chỉ có một slot và type có thể thay đổi sau khi archive.

## Consequences

- Thêm capability mới chủ yếu tạo một folder module và một registry entry; core Garden không cần thêm nhánh `if type === ...`.
- Reading trở thành plugin đầu tiên và là contract test cho platform, không còn là dependency mặc định của mọi plant route.
- Setup và daily loop tách rõ; focus panel giữ một primary action.
- Capability eligibility ngăn **Mental Model Collision** như cây `Chạy bộ` mang Reading.
- Pause/remove mặc định archive instance và giữ log; xóa cứng là thao tác riêng có cảnh báo.
- Cần một migration additive cho RPC, indexes và metadata config/version; không rename bảng legacy trong cùng slice.
- Dynamic third-party plugins và runtime package loading vẫn ngoài phạm vi. Đây là internal module platform, không phải marketplace extension system.

## Validation

Platform được xem là chứng minh khi:

- Reading chạy hoàn toàn qua generic contracts và generic journey routes.
- Một test capability thứ hai có thể đăng ký mà không sửa Garden focus, Plant Detail hoặc generic server lifecycle.
- Attach đồng thời trên cùng cây chỉ tạo một instance và một assignment.
- RLS, owner-scoped foreign keys, unique slot và log isolation tiếp tục pass.
- Focus panel có đúng một primary action ở cả trạng thái có và chưa có capability.

## Implementation Status

Accepted and implemented locally on 2026-08-19:

- Reading registers through shared manifest, server, UI, focus-action and screen registries under `src/capabilities/`.
- Garden core and generic `/plant/{plantId}/journey/*` routes contain no Reading-specific branch.
- `create_plant_capability_instance(...)` and `manage_plant_capability_instance(...)` run as `SECURITY INVOKER`, use a plant-scoped transaction advisory lock and preserve archived instance data.
- Capability Library, explicit intent confirmation, Plant Detail lifecycle controls, focus CTA and screen-space charm are implemented and visually audited.
- Plugin screens are optional per capability, so `instant` or `none` session models do not need placeholder plan/completion pages.

Linked deployment of migrations `20260814234237` and `20260819134213` remains a release step and is not part of this ADR acceptance.

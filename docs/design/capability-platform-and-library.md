# Capability Platform & Capability Library

Ngày: 2026-08-19  
Trạng thái: Đã triển khai và audit local  
ADR liên quan: [ADR 004](../adr/004-per-plant-capability-instances.md), [ADR 005](../adr/005-capability-plugin-platform.md)

## 1. Kết luận

Đây là **Vertical Slice Hard-coding** — Reading đã hoàn chỉnh theo chiều dọc nhưng đang được nối trực tiếp vào Garden, route và persistence, nên chưa phải một capability platform.

Chọn **Capability Plugin Platform + Capability Slot** vì nó giải quyết đồng thời **Extensibility**, **Mental Model Collision** và **Action Competition**. Chỉ làm một modal đẹp hơn sẽ giải quyết discoverability, nhưng không giải quyết việc thêm Exercise phải copy cả Reading stack hoặc việc một cây `Chạy bộ` mang thêm habit đọc sách.

User-facing không dùng từ `capability`. Tên đề xuất là **Hành trình của cây** — cách cây hỗ trợ chính habit mà nó đại diện.

## 2. Review hiện trạng

### P0 — Ranh giới sản phẩm

1. **Mental Model Collision** — `attachReadingCapabilityToPlant` chỉ kiểm tra ownership và cây chưa chết; không kiểm tra cây có đại diện cho việc đọc hay không. Kết quả là một cây `Chạy bộ` có thể mang `Theo dõi đọc sách`.
2. **Transitional Trigger Dependency** — action tạo `habits` rồi dựa vào compatibility trigger để sinh assignment. Khi contract migration loại trigger, attach flow sẽ hỏng nếu chưa có lifecycle service atomic.

### P1 — Kiến trúc mở rộng

3. **Type Branch Proliferation** — Reading bị hard-code trong `reading-capability-control.tsx`, `isometric-plant.tsx`, `sanctuary-garden-chrome.tsx`, `sanctuary-plant-detail-sheet.tsx`, plant route và `habit-sessions.ts`.
4. **Route Dispatcher Coupling** — `/plant/{plantId}` luôn thử load Reading trước rồi mới render plant empty state. Capability mới sẽ buộc route core biết từng type.
5. **Registry Absence** — chưa có catalog mô tả capability, eligibility, copy, icon, default config, UI module hay server driver.
6. **Lifecycle Gap** — có attach nhưng chưa có contract chung cho preview, configure, pause, archive, replace, migration config hay data-retention policy.

### P1 — UI/UX

7. **Setup/Daily Flow Collision** — focus panel vừa có `Gắn theo dõi đọc sách` hoặc `Mở hành trình đọc`, vừa có `2 phút`, `Chăm cây`, `Nghỉ`. Người dùng thấy hai primary actions cho cùng một cây.
8. **Transition Tax** — Garden → focus → mở hành trình → Reading Home → bắt đầu session trước khi làm hành động cốt lõi.
9. **Badge Scale Coupling** — badge Reading nằm bên trong wrapper bị `scale(finalScale)`, nên phóng rất lớn trong cinematic focus.
10. **Technical Copy Leakage** — copy hiện trộn `target`, `Reading`, `capability` với tiếng Việt và giải thích data model thay vì lợi ích.

## 3. Product model

| Tên | Định nghĩa | Ví dụ Reading |
|---|---|---|
| **Capability Definition** | Loại hành trình tái sử dụng, không chứa progress của user | `reading` |
| **Capability Instance** | Một instance riêng của một cây, giữ config và progress | Reading của cây “Đọc trước khi ngủ” |
| **Capability Assignment** | Liên kết unique giữa plant và instance | plant A → habit instance X |
| **Capability Slot** | Luật một cây có tối đa một capability | Slot trống hoặc Reading |
| **Capability Plugin** | Module code sở hữu manifest, server driver và UI | `src/capabilities/reading/` |
| **Capability Journey** | Trải nghiệm người dùng của instance | target, session, plan, log |

Invariant quan trọng:

> Một cây = một habit. Capability chỉ thay đổi cách cây hướng dẫn, đo và phản hồi habit đó; capability không thêm một habit khác lên cây.

## 4. UX direction: Capability Library

### 4.1 Entry points

**Primary entry — Plant creation**

Sau khi người dùng đặt tên và ý nghĩa cho cây, thêm bước tùy chọn:

- Heading: `Cây này sẽ đồng hành với bạn theo cách nào?`
- Default: `Chăm cây đơn giản`
- CTA: `Chọn một hành trình`
- Skip luôn rõ và không làm cây kém giá trị.

**Secondary entry — Plant Detail**

Detail sheet có một **Hành trình của cây** section:

- Slot trống: icon plus nhỏ, một câu outcome và CTA `Chọn hành trình`.
- Slot đã dùng: summary hôm nay, primary `Tiếp tục`, secondary `Xem chi tiết`, overflow `Điều chỉnh / Tạm dừng / Gỡ`.

**Không đặt management trong focus panel.** Focus là nơi hành động hôm nay, không phải nơi cấu hình hệ thống.

### 4.2 Capability Library sheet

Mở bottom sheet/full-screen sheet theo mobile-first:

1. Header giữ plant identity: thumbnail, tên cây, habit description.
2. Title: `Chọn cách {plantName} đồng hành`.
3. Một recommended capability lớn ở đầu; các capability khác là grouped rows, không phải card-grid dày đặc.
4. Mỗi item nói về outcome:
   - `Đọc sâu hơn`
   - `Mục tiêu theo trang · Phiên tập trung · Nhật ký`
   - trạng thái `Phù hợp`, `Cần xác nhận`, `Sắp có` hoặc tier lock.
5. Chạm item mở preview/config; không attach ngay.

Reading không phù hợp với habit hiện tại phải chặn bằng copy rõ:

> Reading dành cho cây đại diện cho thói quen đọc. Hãy tạo một cây đọc sách mới thay vì gắn Reading lên “Chạy bộ”.

### 4.3 Preview & configure

Preview chỉ hỏi những gì cần để bắt đầu:

- Target ban đầu: `5 trang/ngày`.
- Session: `30 phút`.
- Gentle rule: `Không tụt target khi bạn bỏ lỡ`.
- CTA: `Bắt đầu hành trình đọc`.

Advanced configuration nằm sau disclosure `Điều chỉnh`, không làm bước chính thành form dài.

### 4.4 Focus panel sau khi attach

Focus panel dùng **Contextual Primary Action**:

- Reading idle: `Đọc 5 trang`.
- Reading đang chạy: `Tiếp tục phiên · 18:42`.
- Reading đã xong: `Đã đọc hôm nay`.
- Secondary: `2 phút` và `Nghỉ`.
- `Xem hành trình` chuyển vào Plant Detail hoặc overflow, không cạnh tranh với CTA chính.

Hoàn thành capability session tự tạo care/reaction cho cây. Không hiển thị thêm nút `Chăm cây` cho cùng hành động.

### 4.5 Visual language

Giữ **Soft Isometric Sanctuary** hiện có:

- cream/sage/canopy palette, Fraunces display, organic radius;
- Capability Library dùng surface tint và divider, tránh card-inside-card;
- capability icon dùng Lucide hoặc asset thật, không emoji;
- animation attach là một lần: charm xuất hiện ở gốc cây, camera thở nhẹ, copy `Một hành trình mới bắt đầu`;
- tôn trọng `prefers-reduced-motion`.

Thay badge hiện tại bằng **Capability Charm Layer** — overlay screen-space độc lập với plant sprite scale:

- idle 22–24 px, focus 28–32 px;
- neo gần contact point hoặc focus frame, không neo vào góc ảnh alpha;
- không phóng theo growth/grid/cinematic scale;
- tooltip/accessible label lấy từ manifest.

## 5. Kiến trúc module

```text
src/capabilities/
  core/
    types.ts
    catalog.ts
    server-registry.ts
    ui-registry.tsx
    lifecycle.ts
    eligibility.ts
    routes.ts
    contract-tests.ts
  reading/
    manifest.ts
    server.ts
    routes.ts
    config.ts
    ui/
      focus-action.tsx
      detail-panel.tsx
      journey-home.tsx
      session.tsx
      completion.tsx
      plan.tsx
    __tests__/
```

### 5.1 Shared manifest

Manifest chỉ chứa data có thể dùng ở server và client:

```ts
export interface CapabilityManifest<TConfig = unknown> {
  key: string
  version: number
  label: string
  shortLabel: string
  description: string
  icon: CapabilityIconKey
  tone: CapabilityTone
  supportedHabitDomains: HabitDomain[]
  defaultConfig: TConfig
  sessionModel: 'guided' | 'instant' | 'none'
}
```

Không import React component, Supabase client hoặc server action vào manifest.

### 5.2 Server driver

```ts
export interface CapabilityServerDriver<TConfig, TSummary, TJourney> {
  createInstance(input: CreateCapabilityInput<TConfig>): Promise<CapabilityInstance>
  loadSummary(input: CapabilityRequest): Promise<TSummary>
  loadJourney(input: CapabilityRequest): Promise<TJourney>
  archiveInstance(input: CapabilityRequest): Promise<void>
}
```

Core lifecycle chịu trách nhiệm auth, ownership, idempotency, unique slot, transaction và error mapping. Plugin chỉ cung cấp config cùng dữ liệu khởi tạo đặc thù.

### 5.3 UI module

```ts
export interface CapabilityUiModule<TSummary = unknown, TJourney = unknown> {
  FocusAction: ComponentType<{ plant: PlantWithType; summary: TSummary }>
  DetailPanel: ComponentType<{ plant: PlantWithType; summary: TSummary }>
  JourneyHome: ComponentType<{ snapshot: TJourney }>
}
```

`ui-registry.tsx` map `capabilityKey → dynamic import`. Garden core render một slot generic; capability type không tạo nhánh mới trong `SanctuaryGardenChrome`.

## 6. Persistence và Supabase

### 6.1 Giữ schema, đổi domain language trong code

Không rename `habits` trong slice này. Tạo adapter/domain alias:

- DB `habits` → code `CapabilityInstanceRecord`.
- DB `habit_sessions` → code `GuidedCapabilitySession`.
- `HabitCapabilitySummary` → `PlantCapabilitySummary`.

Đây là **Anti-Corruption Layer** — cô lập tên legacy để module mới dùng đúng ngôn ngữ domain mà không cần migration rủi ro cao.

### 6.2 Atomic lifecycle RPC

Thêm RPC `create_plant_capability_instance`:

1. validate authenticated owner và plant state;
2. lock/check capability slot;
3. validate eligibility/config version;
4. insert `habits` instance;
5. insert `plant_capability_assignments`;
6. initialize plan/growth nếu plugin dùng guided model;
7. return canonical summary.

RPC dùng `SECURITY INVOKER`, explicit grants và RLS hiện có. Không dùng `service_role` trong application path.

### 6.3 Metadata additive

Khi refactor Reading qua registry, thêm vào `habits`:

- `config JSONB NOT NULL DEFAULT '{}'::jsonb`
- `definition_version INTEGER NOT NULL DEFAULT 1`
- cân nhắc `archived_at TIMESTAMPTZ` thay vì xóa log.

Index đề xuất:

```sql
CREATE INDEX plant_capability_assignments_user_plant_idx
  ON public.plant_capability_assignments (user_id, plant_id);

CREATE INDEX habits_user_type_active_idx
  ON public.habits (user_id, type, created_at DESC)
  WHERE is_active = true;
```

Index đầu hỗ trợ RLS và capability management theo user; index sau thay phần lookup benefit đã mất khi drop `habits_user_type_unique`.

Không tạo bảng `capability_definitions` ở v1. Definition nằm trong code để review, typecheck và deploy cùng plugin. Chỉ đưa definition vào DB khi thật sự cần remote-config hoặc admin-created capability.

## 7. Lifecycle quản lý

| Hành động | Hành vi |
|---|---|
| Attach | Tạo instance + assignment atomically |
| Configure | Validate theo manifest version, giữ migration path |
| Pause | `is_active=false`, giữ assignment và log |
| Resume | Re-validate plugin/config rồi active lại |
| Remove | Gỡ assignment và archive instance; không xóa log mặc định |
| Replace | Archive instance cũ, tạo instance mới trong transaction |
| Delete data | Tác vụ riêng có confirmation mạnh và audit trail |

## 8. Route và dispatch

```text
/plant/{plantId}
  ├─ no assignment → PlantCapabilityEmpty
  └─ assignment → registry.loadJourney(type) → plugin.JourneyHome

/plant/{plantId}/journey/{screen}
  → resolve plant + assignment + instance
  → verify requested screen is exposed by plugin
  → render plugin screen
```

Các route `/reading` legacy và `/plant/{plantId}/reading/*` chỉ redirect trong transition window.

Active-session banner đổi từ `getActiveReadingSession()` sang `getActiveCapabilitySession()` và trả presentation metadata từ catalog: label, icon, resume href, plant identity.

## 9. Implementation slices

### Slice A — Platform seam, không đổi UI

- Tạo catalog, server registry, UI registry và contract tests.
- Bọc Reading thành plugin.
- Tạo atomic lifecycle RPC; bỏ dependency vào compatibility trigger trong application code.
- Giữ route/copy hiện tại để giảm blast radius.

### Slice B — Capability Library

- Thêm optional step ở plant creation.
- Thêm Capability Slot trong Plant Detail.
- Xóa attach control khỏi focus panel.
- Thêm eligibility confirmation và preview/config.

### Slice C — Daily action integration

- Reading primary action thay `Chăm cây`.
- Session completion phát plant reaction một lần.
- Thêm Capability Charm Layer độc lập sprite scale.
- Chuyển sang generic journey routes và active-session banner.

### Slice D — Extensibility proof

- Đăng ký một capability thứ hai hoặc test plugin.
- Core Garden, Plant Detail và lifecycle không được sửa nhánh type-specific.
- Chạy generic plugin contract suite cho cả hai plugin.

## 10. Acceptance criteria

- Một cây không thể nhận capability trái với habit intent mà không có explicit confirmation; Reading không gắn lên `Chạy bộ`.
- Focus panel luôn có đúng một primary action.
- Unassigned plant không hiển thị inline Reading-specific control.
- Badge/charm không đổi kích thước theo plant growth, grid size hay cinematic zoom.
- Thêm capability mới không sửa `SanctuaryGardenChrome`, `SanctuaryPlantDetailSheet`, plant route dispatcher hoặc generic lifecycle action.
- Attach concurrent là idempotent và không tạo orphan instance.
- Pause/remove không làm mất session log.
- Desktop, mobile, keyboard, reduced motion và 200% zoom đều có verification riêng.

## 11. Không làm trong proposal này

- Marketplace hoặc third-party package loading.
- Nhiều capability trên một cây.
- AI tự đoán habit category từ tên cây.
- Rename toàn bộ bảng `habits` và `habit_sessions`.
- Thiết kế Exercise UI hoàn chỉnh trước khi Reading chạy qua platform contract.

## 12. Kết quả triển khai

- Capability core nằm trong `src/capabilities/core/`; Reading là plugin đầu tiên trong `src/capabilities/reading/`.
- User-facing surface dùng tên **Hành trình của cây**, gồm Library, preview/xác nhận intent, active/paused/remove lifecycle và focus CTA theo context.
- Generic route dùng `/plant/{plantId}/journey/{session|completion|plan}`; route legacy Reading chỉ còn compatibility redirect.
- Migration `20260819134213_capability_plugin_platform.sql` thêm config/version/archive metadata và atomic invoker RPC có advisory lock.
- Audit có ảnh và giới hạn accessibility tại `docs/ux-audit/capability-platform-2026-08-19/README.md`.

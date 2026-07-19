# UX Audit: Trial user public onboarding

Ngày audit: 2026-06-25  
Phạm vi: landing page, pricing, signup/login, protected route redirect, mobile first viewport.  
Giới hạn: không tạo tài khoản thật và không submit OAuth/payment vì các thao tác đó có thể ghi dữ liệu vào Supabase/Paddle. Không có `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD`, nên chưa audit được garden/dashboard sau auth.

## Kết luận ngắn

Vấn đề chính là **Conversion Friction** — user hiểu ý tưởng "habit thành khu vườn", nhưng chưa được thấy đủ giá trị thật trước khi bị yêu cầu tạo tài khoản.

Trên mobile còn có **First-Viewport CTA Loss** — CTA chính nằm dưới fold, nên người dùng mới phải scroll trước khi hành động. Route `/garden` redirect về login đúng về kỹ thuật, nhưng thiếu **Contextual Redirect Messaging**, khiến user không biết vì sao họ bị chuyển trang.

## Bằng chứng

| Bước | Screenshot | Tình trạng |
|---|---|---|
| 1 | `01-landing-desktop.png` | Khá tốt: proposition rõ, nhưng hero quá tĩnh và không cho thấy sản phẩm thật |
| 2 | `02-landing-pricing-section.png` | Cần cải thiện: pricing có đủ tier nhưng xuất hiện sau nhiều nội dung, plan details bị cắt trong viewport |
| 3 | `03-signup.png` | Cần cải thiện: form sạch, nhưng chưa có lý do đủ mạnh để tạo account ngay |
| 4 | `04-login-redirect-from-garden.png` | Cần cải thiện mạnh: redirect từ `/garden` về login không có message hoặc return path |
| 5 | `05-landing-mobile.png` | Cần cải thiện mạnh: mobile hero quá cao, CTA chính không xuất hiện trong first viewport |
| 6 | `06-signup-mobile.png` | Tạm ổn: form đọc được, nhưng top spacing lớn và button height chỉ 36px theo DOM check |
| 7 | `07-signup-empty-submit.png` | Tạm ổn: native validation hoạt động, nhưng chưa có custom error/help text |
| 8 | `08-pricing-pro-click-no-feedback.png` | Cần cải thiện: khi Paddle chưa configured, click paid CTA chỉ log warning, không có feedback visible |

## Những điều tôi không thích với vai trò user mới

1. Tôi chưa thấy app thật trước khi đăng ký. Landing nói về garden, plants, streaks, rewards, nhưng không có screenshot/canvas preview của garden để tôi hình dung thứ mình sẽ nhận.
2. Trên mobile, màn hình đầu tiên bị chiếm bởi logo, nav và headline lớn. Tôi không thấy nút `Start Growing Free` ngay, nên intent đăng ký bị trì hoãn.
3. Khi vào `/garden`, tôi bị đẩy sang login như bị chặn cửa. Không có câu "Sign in to view your garden" hay "Create your first plant after signup".
4. Signup quá generic. Nó giống form SaaS bình thường hơn là điểm bắt đầu của một game habit garden.
5. Pricing tier có nhiều feature, nhưng các feature là inventory/limits nhiều hơn outcome. Là user mới, tôi chưa biết "Tier 1-4 plants" hay "5x5 garden" có đáng tiền không.
6. Paid CTA không có trạng thái lỗi visible khi payment chưa configured. Ở staging/dev, điều này làm button có vẻ hỏng.
7. Auth pages không có `h1`. Screen reader và SEO/page semantics yếu hơn cần thiết cho trang entry quan trọng.
8. Input/button trên mobile cao khoảng 36px, thấp hơn ngưỡng touch target 44px được ghi trong `docs/design-guidelines.md`.

## UX và kỹ thuật quan sát được

- **Value Preview Gap** — landing giải thích concept nhưng không show product state. Chọn thêm product preview vì nó giải quyết vấn đề tin tưởng trước signup; feature cards chỉ giải quyết vấn đề mô tả.
- **Contextual Redirect Messaging** — protected route cần giữ ngữ cảnh người dùng vừa cố làm gì. Chọn message + return path vì nó giải quyết "tại sao tôi ở đây"; redirect trơn chỉ giải quyết auth guard.
- **Mobile Above-the-Fold Priority** — mobile cần CTA trong viewport đầu. Chọn giảm hero spacing/type scale vì nó giải quyết hành động đầu tiên; giữ hero lớn chỉ giải quyết cảm giác thương hiệu.
- **Accessible Page Structure** — mỗi page entry nên có một `h1`. Chọn semantic heading vì nó giải quyết navigation bằng assistive tech; card title visual không đủ thay thế.
- **Environment-State Feedback** — khi checkout chưa configured hoặc lỗi, UI cần toast/disabled state. Chọn visible feedback vì nó giải quyết nhận thức "button hỏng"; console warning chỉ giải quyết debug cho developer.

## Kế hoạch cải tiến

### P0 — Sửa các điểm chặn trial

1. Thêm product preview thật vào landing first screen: ảnh/canvas mini garden, plant card, hoặc short interactive preview.
2. Mobile landing: giảm hero top spacing và font size ở breakpoint nhỏ để `Start Growing Free` xuất hiện trong first viewport.
3. Protected redirect: thêm query `next=/garden` và login/signup message theo ngữ cảnh, ví dụ `Sign in to start your garden`.
4. Signup: sau đăng ký redirect vào onboarding/garden setup, không quay về `/`.

### P1 — Làm signup có cảm giác game hơn

5. Đổi signup từ generic account form thành "plant your first seed": hỏi 1 tiny habit trước hoặc preview bước tiếp theo ngay trong card.
6. Thêm trust/reassurance dưới CTA: free tier, no guilt, 30-second daily loop, no credit card.
7. Viết lại pricing theo outcome: "3 habits to start", "weekly goals", "identity zones" kèm hình minh họa nhỏ.
8. Thêm visible error/toast cho Paddle not configured hoặc checkout failure.

### P2 — Accessibility và polish

9. Dùng `h1` cho signup/login card title.
10. Tăng input/button mobile height lên tối thiểu 44px.
11. Thêm `autocomplete="email"` và `autocomplete="new-password"`/`current-password`.
12. Kiểm tra keyboard focus order và focus ring trên auth/pricing.

## File output

- `01-landing-desktop.png`
- `02-landing-pricing-section.png`
- `03-signup.png`
- `04-login-redirect-from-garden.png`
- `05-landing-mobile.png`
- `06-signup-mobile.png`
- `07-signup-empty-submit.png`
- `08-pricing-pro-click-no-feedback.png`
- `capture-results.json`
- `audit-checks.json`
- `pricing-click-logs.json`

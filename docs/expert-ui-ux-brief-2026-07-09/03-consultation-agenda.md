# Agenda tư vấn UI/UX cho Habit Garden

Thời lượng gợi ý: 90 phút.

## 1. Context nhanh - 10 phút

Mục tiêu: chuyên gia hiểu sản phẩm trước khi góp ý visual.

- Habit Garden là habit tracker dạng garden game.
- Người dùng chính: người muốn xây thói quen nhưng dễ nản với app productivity khô/căng.
- Promise: “mỗi hành động nhỏ nuôi một khu vườn sống”.
- Rủi ro lớn: app đẹp nhưng daily loop không rõ, hoặc app rõ nhưng mất chất game.

## 2. Review positioning và visual direction - 15 phút

**Visual Positioning** là vị trí thẩm mỹ app muốn chiếm trong đầu người dùng. Cần chọn rõ vì nó giải quyết **Style Fragmentation**, trong khi đổi component lẻ tẻ chỉ giải quyết **Local Polish**.

Câu hỏi:

- App nên trông giống calming garden, cozy game, mobile companion, hay habit RPG?
- Landing và dashboard có nên cùng một visual language không?
- Có nên giữ emoji/icon hiện tại hay chuyển sang illustration/sprite set riêng?
- Palette hiện tại có đủ khác biệt và đủ “garden” chưa?

## 3. Review onboarding - 20 phút

Tài liệu/ảnh cần mở:

- [01-expert-brief.md](./01-expert-brief.md)
- [01-landing-desktop.png](./images/01-landing-desktop.png)
- [05-landing-mobile.png](./images/05-landing-mobile.png)
- [03-signup.png](./images/03-signup.png)

Câu hỏi:

- First viewport cần show gì để người dùng hiểu app trong 3 giây?
- Có nên đưa product preview/canvas garden vào hero không?
- Signup nên hỏi habit đầu tiên trước hay sau account?
- Copy nào làm rõ “low guilt” mà không làm app yếu động lực?

## 4. Review daily loop và garden - 25 phút

Tài liệu/ảnh cần mở:

- [core-user-loop.svg](./images/core-user-loop.svg)
- [app-information-architecture.svg](./images/app-information-architecture.svg)
- [01-goal-plant-card.png](./images/01-goal-plant-card.png)
- [02-log-progress-choice.png](./images/02-log-progress-choice.png)
- [03-log-progress-form.png](./images/03-log-progress-form.png)

Câu hỏi:

- Today và Garden khác nhau thế nào trong tâm trí user?
- Plant card chỉ nên trả lời một câu chính nào?
- Moisture, growth, streak, XP, goal progress nên xếp hierarchy ra sao?
- Garden nên là nơi hành động hay nơi tận hưởng phần thưởng?
- Có cần một Focus/Today screen rõ hơn cho daily tasks không?

## 5. Review goal wizard - 10 phút

Tài liệu/ảnh cần mở:

- [04-goal-wizard-type.png](./images/04-goal-wizard-type.png)
- [05-goal-wizard-frequency.png](./images/05-goal-wizard-frequency.png)
- [06-goal-wizard-target.png](./images/06-goal-wizard-target.png)
- [07-goal-wizard-review.png](./images/07-goal-wizard-review.png)

Câu hỏi:

- Wizard đang dùng thuật ngữ hệ thống nào nên đổi?
- Có nên gộp goal setup vào add plant không?
- Review step nên summary 3 dòng hay bảng chi tiết?

## 6. Chốt output - 10 phút

Yêu cầu chuyên gia trả về:

- 1 design direction chính + 1 direction phụ để so sánh.
- P0/P1/P2 list cho UX và visual.
- Wireframe rough cho landing, signup, daily loop, plant card/log modal.
- Reference board 5-10 sản phẩm.
- Gợi ý design system: màu, type, spacing, card, HUD, icon/art style.

## Decision cần chốt sau buổi tư vấn

**Experience Anchor** là màn hình hoặc khoảnh khắc đại diện cho toàn bộ sản phẩm. Chọn Experience Anchor vì nó giải quyết **Design Coherence**, trong khi tối ưu từng page riêng lẻ dễ tạo app rời rạc.

Ứng viên:

- Garden canvas là anchor: app bán cảm giác nhìn cây lớn.
- Today loop là anchor: app bán hành động hằng ngày dễ làm.
- First seed onboarding là anchor: app bán khoảnh khắc bắt đầu nhẹ nhàng.

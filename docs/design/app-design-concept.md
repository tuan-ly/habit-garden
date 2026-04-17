🌱 Habit Garden — Design Concept v2

1. Chẩn đoán: Vấn đề UI hiện tại
   Từ ảnh chụp + phân tích code, đây là 6 vấn đề cốt lõi (gọi tên để fix đúng):

# Tên vấn đề Nơi xuất hiện Hậu quả

1 Theme Fragmentation GentleWateringModal hardcoded dark (bg-slate-900) vs. PlantDetailSheet light Cùng 1 flow nhưng 2 thế giới — mất cảm giác "1 app"
2 Stock Shadcn Syndrome "Choose Goal Type" dialog, Goal Statistics sheet Dùng default → trông như demo chưa hoàn thiện
3 No Design Tokens Khắp nơi: emerald-500, indigo-50, yellow-50, slate-900... Không đổi theme được, rối mắt vì quá nhiều màu
4 Typography Monotony Chỉ dùng Geist Sans, kích thước đều đều Không có hierarchy, không có "giọng" của app
5 Inconsistent Density space-y-5, space-y-6, p-3, p-3.5, p-4 mix nhau Rhythm gãy khúc, mắt không nghỉ được
6 Asset Decay Chỉ có cactus đủ 5 stages, còn lại fallback emoji Plant sheet hero vỡ visual, kém premium 2. Design Direction: "Living Garden"
Khái niệm: Organic Biophilic + Calm Tech — tách Habit Garden khỏi "another productivity app" bằng cảm giác vườn sống, dịu, ấm, thay vì "dashboard + đồ thị".

Lý do chọn:

Organic Biophilic giải quyết Emotional Disconnect problem — app về thói quen cần cảm giác ấm, không phải cảm giác làm việc. (Score WCAG AA, Tailwind 10/10, Low complexity.)
Loại Biomimetic 2.0 vì Performance Cost problem — canvas đã nặng với isometric garden rồi.
Loại E-Ink/Paper vì Emotion Mismatch problem — mình cần sự sống, không phải tĩnh lặng đọc sách. 3. Design System — Tokens cụ thể
3.1 Color Palette — "Sage Garden"

/_ Brand — semantic, không còn Tailwind raw _/
--garden-canopy: #1F3A2E; /_ Deep forest - text chính _/
--garden-leaf: #3B7A57; /_ Sage primary - CTA, status _/
--garden-moss: #6BA57A; /_ Fresh leaf - hover, accent _/
--garden-bloom: #E8B96A; /_ Warm honey - streak, reward _/
--garden-sky: #CFE6E3; /_ Misty water - secondary _/
--garden-mist: #F7F4EC; /_ Cream paper - surface _/
--garden-cloud: #FEFCF7; /_ Off-white - background _/

/_ Functional _/
--moisture-full: #4A9EDE; /_ Water blue _/
--moisture-low: #D97757; /_ Terracotta warning _/
--growth-active: #8DB982; /_ Young leaf _/
--dead-ash: #A39B8A; /_ Dried grass _/
Không còn: indigo-50, yellow-50, slate-900, v.v. Tất cả đi qua token.

3.2 Typography — "Soft Rounded"

@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Nunito:wght@400;500;600;700&display=swap');

--font-display: 'Fraunces'; /_ Serif mềm có cảm xúc → Plant names, section titles _/
--font-body: 'Nunito'; /_ Rounded humanist → UI, body text _/
Tại sao Fraunces thay vì Varela Round? Fraunces là optical-size variable serif → plant name "Botanical Sage" trông như tên từ quyển thảo mộc cổ, không phải label UI. Nunito giữ phần UI friendly.

3.3 Shape & Rhythm
Radius scale: 8 / 14 / 20 / 28 (không còn random rounded-md/lg/xl lẫn lộn)
Spacing rhythm: 4 / 8 / 12 / 20 / 32 (Fibonacci-ish, calm)
Elevation: chỉ 3 mức — rest / hover / floating — mỗi mức là shadow mềm + 1px inner highlight (giống ánh sáng mặt trời lên lá) 4. Redesign Quan trọng nhất: Plant Detail Sheet
Đây là phần bạn nói "trình bày không đẹp". Concept mới:

┌───────────────────────────────────────┐
│ [×] │ ← floating close, no border
│ │
│ ╭─────────────╮ │ ← Plant Hero Card
│ │ 🌱 ✨ │ │ (gradient sage→mist,
│ │ [plant art]│ │ dappled-light shadow)
│ ╰─────────────╯ │
│ │
│ Botanical Sage │ ← Fraunces 28, tracking-tight
│ Grass · Building capacity │ ← Nunito 14, moss color
│ │
│ ●●●●●○○ Day 5 of 7 │ ← Week dots, no bar
│ │
│ ┌─────────────────────────────────┐ │
│ │ Moisture ████████░░ 85% │ │ ← soft segmented bar
│ │ Growth ██████░░░░ 60% │ │ with water-drop + sprout
│ └─────────────────────────────────┘ │ icons inline
│ │
│ ┌── This Week ─────── See more ──┐ │
│ │ │ │
│ │ 60 / 60 seconds │ │ ← Large number,
│ │ ━━━━━━━━━━━━━━━ 100% │ │ progress line below
│ │ │ │
│ │ 🔥 3-day streak │ │
│ └────────────────────────────────┘ │
│ │
│ [ 💧 Water Plant ] [ 📝 Log ] │ ← Primary + Secondary,
│ │ rounded-full, warm shadow
└───────────────────────────────────────┘
Changes vs. ảnh hiện tại:

Bỏ tabs "Overview / Journal / Stats" ở đầu → chỉ lộ khi scroll xuống
"This Week" dots đen bự → đổi thành dots nhỏ + progress inline
"Goal Progress" card xanh tím → gộp vào theme sage, bỏ icon 🎯 emoji dùng SVG Lucide Target
Số "0 PROGRESS / 60 TARGET / 60 REMAINING" 3 cột → 1 hero number duy nhất
Nút "Water Plant" đen → nút pill màu sage với glow ấm 5. Redesign Plant Card (List view)

╭────────────────────────────────╮
│ 🌵 🔥 3 │
│ │
│ Đánh máy mỗi ngày │ ← Fraunces
│ Cactus · Building │
│ │
│ ░░░░░░░░░░ 85% Moisture │ ← inline row (không 2 bars stack)
│ ░░░░░░░░░░ 18% Growth │
│ │
│ ✓ Watered today │ ← muted row
╰────────────────────────────────╯
hover: lift 2px, dappled shadow
Fix chính: bỏ gradient card (from-yellow-50 to-amber-50) → dùng 1 surface token --garden-mist nhất quán, chỉ accent color theo plant-type qua border-top 2px.

6. Goal Dialog (Choose Goal Type)
   Hiện tại: 2 card đè lên dialog stock → fix:

Dialog trong suốt hơn (bg-garden-cloud/95 backdrop-blur-xl)
2 option thành radio-card lớn với illustration SVG (leaf growing cho "Build Capacity", basket filling cho "Total Progress")
Progress stepper đen tròn → đổi sage dots với line mềm 7. Global Moves
✅ Unify modal theme: GentleWateringModal chuyển sang light sage theme, dark chỉ tự động theo prefers-color-scheme
✅ Replace all emoji icons (🎯 🔥 💧) → Lucide SVG (Target, Flame, Droplet) — chỉ giữ emoji plant như art
✅ Cursor pointer mọi card clickable
✅ Respect prefers-reduced-motion cho breathing/sway animations
✅ Token in globals.css — 1 lần đổi, cả app đổi 8. Thứ tự thực hiện đề xuất (theo ROI)
Phase Làm gì Tác động Effort
P1 Design tokens (colors + fonts) trong globals.css Nền tảng cho mọi thứ 30 min
P2 Plant Detail Sheet redesign (ưu tiên của bạn) Cao nhất — user chạm hàng ngày 2h
P3 Plant Card (List view) Medium 1h
P4 GentleWateringModal — unify theme Fix fragmentation 1h
P5 Goal dialogs (Choose Type, Statistics) Lộ defaults đang xấu nhất 1h
P6 Emoji → Lucide SVG sweep Polish 45 min

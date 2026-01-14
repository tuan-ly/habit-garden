# Habit Garden - Plant Visual Upgrade (Session Summary)

## ✅ Đã hoàn thành trong session này:

### 1. Tạo hệ thống hiển thị cây bằng hình ảnh
- **Component mới**: `src/components/plants/plant-image.tsx`
  - Hiển thị cây theo giai đoạn: seed → sprout → growing → blooming → mature
  - Tự động fallback về hình generic nếu không có hình riêng
  - Animation khi chuyển giai đoạn

### 2. Cập nhật PlantVisual
- **File**: `src/components/plants/plant-visual.tsx`
  - Thay emoji bằng PlantImage component
  - Thêm size "2xl" (96x96 pixels)
  - Giữ các effects: watering, wilting, weather

### 3. Fix hydration error
- **File**: `src/components/garden/isometric-garden.tsx`
  - Sử dụng useState/useEffect cho responsive tile size
  - Thêm event listener cho window resize

### 4. Tăng kích thước cây
- **File**: `src/components/garden/isometric-plant.tsx`
  - Đổi size từ "xl" sang "2xl"

### 5. Tạo hình ảnh mẫu
- **Folder**: `public/plants/generic/`
  - seed.png, sprout.png, growing.png, blooming.png, mature.png
- **Folder**: `public/plants/sunflower/`
  - seed.png (chỉ có 1 hình)

---

## 🔜 Cần làm tiếp (session sau):

### 1. Tạo hình SVG đơn giản không có nền đất
Tạo SVG inline cho các giai đoạn cây:
- **seed**: Hạt giống nhỏ (hình elip nâu)
- **sprout**: Mầm nhỏ (2 lá)
- **growing**: Cây đang lớn (thân + 4-5 lá)
- **blooming**: Cây có nụ hoa
- **mature**: Cây hoàn chỉnh với hoa/quả

### 2. Điều chỉnh vị trí cây trên tile
File: `src/components/garden/isometric-tile.tsx`
- Hiện tại: dòng 154-157, position transform
- Cần điều chỉnh: `top` và `transform` để cây nằm đẹp hơn trên tile

### 3. Thêm hình cho các loại cây đặc biệt
Cần tạo SVG cho:
- 🌻 **Sunflower**: Hoa hướng dương (vàng, nâu)
- 🌸 **Cherry Blossom**: Hoa anh đào (hồng)
- 🌵 **Cactus**: Xương rồng (xanh, gai)
- 🌹 **Rose**: Hoa hồng (đỏ/hồng)
- 🪷 **Lotus**: Hoa sen (hồng, trắng)
- 🎋 **Bamboo**: Tre (xanh lá)
- 🌳 **Bonsai**: Bonsai (xanh, nâu)
- 💰 **Money Tree**: Cây tiền (xanh, vàng)

---

## 📁 Cấu trúc thư mục hiện tại:

```
public/plants/
├── generic/
│   ├── seed.png ✅
│   ├── sprout.png ✅
│   ├── growing.png ✅
│   ├── blooming.png ✅
│   └── mature.png ✅
├── sunflower/
│   └── seed.png ✅
├── cherry-blossom/ (empty)
├── cactus/ (empty)
├── bonsai/ (empty)
├── lotus/ (empty)
├── rose/ (empty)
├── bamboo/ (empty)
└── money-tree/ (empty)
```

---

## 💡 Gợi ý implementation:

### Option A: SVG Components (Recommended)
Tạo React components cho từng loại cây với SVG inline:
```tsx
// src/components/plants/svg/sunflower.tsx
export function SunflowerSVG({ stage }: { stage: GrowthStage }) {
  // Return SVG based on stage
}
```

### Option B: SVG Files
Tạo file SVG riêng trong public/plants/[type]/[stage].svg

### Option C: Hybrid
Dùng SVG component cho cây, với props để điều chỉnh màu/size theo growth

---

## 🎨 Color Palette gợi ý:
- **Leaves/Stem**: #22c55e (green-500), #16a34a (green-600)
- **Soil**: #a3744f, #8b5e3c
- **Sunflower**: #fbbf24 (amber-400), #78350f (brown center)
- **Cherry Blossom**: #f9a8d4 (pink-300), #be185d (pink-700)
- **Cactus**: #4ade80 (green-400), spines #166534
- **Rose**: #f43f5e (rose-500), #be123c (rose-700)
- **Lotus**: #f472b6 (pink-400), #fdf2f8 (pink-50)

---

## 📝 Commands để tiếp tục:
```bash
cd d:\Code\habit-garden
npm run dev
```

Browser: http://localhost:3000/garden

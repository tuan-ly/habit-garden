# Phase 02: Nav Restructure + Store Page

> **Parent**: [plan.md](plan.md)
> **Priority**: High
> **Status**: Pending
> **Review**: Not started

## Overview

Bottom nav has 8 items (7 links + Menu) — too crowded for mobile. Reduce to 5 items: Garden, Overview, Store, Stats, Menu. Move Identity, Profile, Workshop, Shop into the Menu overlay. Create `/store` page combining Workshop + Shop with tabs.

## Key Insights

- InventoryProvider already in dashboard providers — no setup needed
- CraftingWorkshop is a Sheet wrapping Tabs (recipes + materials) — extractable
- ShopSheet is a Sheet wrapping item grid + purchase logic — extractable
- Neither `/workshop`, `/shop`, nor `/store` routes exist (all 404)
- Menu overlay already has Workshop/Shop/Profile/Settings links
- CoinDisplay component already exists and is reusable

## Requirements

### 2a. Nav Restructure
- Reduce `navItems[]` to: Garden, Overview, Store, Stats (4 links + Menu button = 5 total)
- Menu overlay adds: Profile, Identity (PREMIUM badge), Settings, Sign Out
- Workshop/Shop in menu → link to `/store?tab=craft` and `/store?tab=shop`

### 2b. Store Page
- Route: `/store`
- Two tabs: "Craft" and "Shop"
- `?tab=craft` / `?tab=shop` query params for default tab
- Inline content (not Sheet modals) — extract from CraftingWorkshop and ShopSheet
- Mobile-first, game-style dark theme matching existing UI
- Show coin balance in header

### 2c. Provider Check
- InventoryProvider: already in place (confirmed in providers.tsx)

## Architecture

```
/store page
├── StoreHeader (coin balance + page title)
├── Tabs
│   ├── "Craft" tab → <CraftingContent /> (extracted from CraftingWorkshop)
│   └── "Shop" tab → <ShopContent /> (extracted from ShopSheet)
└── Uses InventoryContext for all data/actions
```

**Extraction strategy**: Rather than refactoring existing Sheet components (which may still be used as modals elsewhere), create new inline content components that reuse the same logic.

## Related Code Files

| File | Action | Change |
|------|--------|--------|
| `src/components/game-ui/game-nav.tsx` | Modify | Reduce navItems to 4, update Menu links |
| `src/app/(dashboard)/store/page.tsx` | Create | Store page with Craft/Shop tabs |
| `src/components/crafting/crafting-workshop.tsx` | Read | Reference for extracting craft content |
| `src/components/shop/shop-sheet.tsx` | Read | Reference for extracting shop content |
| `src/components/shop/coin-display.tsx` | Read | Reuse in store header |
| `src/lib/context/inventory-context.tsx` | Read | Context API for store actions |

## Implementation Steps

### Step 1: Update `game-nav.tsx`

1. Reduce `navItems` array to 4 items:
   ```typescript
   const navItems: NavItem[] = [
     { title: 'Garden', url: '/garden', icon: Flower2, ... },
     { title: 'Overview', url: '/overview', icon: TreeDeciduous, ... },
     { title: 'Store', url: '/store', icon: ShoppingBag, ... },
     { title: 'Stats', url: '/stats', icon: BarChart3, ... },
   ]
   ```

2. Update Menu overlay items (ordered):
   - Profile → `/profile`
   - Identity → `/identity` (with PREMIUM badge)
   - Workshop → `/store?tab=craft`
   - Shop → `/store?tab=shop`
   - Settings → `/settings`
   - Sign Out

3. Add Identity link to Menu with PREMIUM badge:
   ```tsx
   <Link href="/identity" onClick={() => setMenuOpen(false)}>
     <div className="...bg-gradient-to-br from-purple-400 to-violet-500...">
       <Crown className="w-5 h-5 text-white" />
     </div>
     <div>
       <div className="flex items-center gap-2">
         <p className="font-semibold">Identity</p>
         <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">PREMIUM</span>
       </div>
       <p className="text-xs text-slate-500">Define who you want to become</p>
     </div>
   </Link>
   ```

### Step 2: Create `/store/page.tsx`

1. Create `src/app/(dashboard)/store/page.tsx`
2. Use `useSearchParams()` for `?tab=craft|shop` default
3. Build page with:
   - Header: page title + CoinDisplay
   - Tabs component (shadcn/ui) with "Craft" and "Shop" tabs
   - Craft tab: recipe grid + material inventory (inline from CraftingWorkshop logic)
   - Shop tab: decoration grid + purchase buttons (inline from ShopSheet logic)
4. All data from `useInventory()` context
5. Style: match existing game-style dark theme

### Step 3: Store Page — Craft Tab Content

Extract/recreate the crafting content from `CraftingWorkshop`:
- Recipe cards (filterable by category)
- Material inventory display
- Craft button with loading state
- Success/error toast
- Reference `CraftingWorkshop` for exact rendering

### Step 4: Store Page — Shop Tab Content

Extract/recreate the shop content from `ShopSheet`:
- Decoration type cards with coin prices
- Purchase button with affordability check
- Success/error toast
- Filter by category/availability

## Todo

- [ ] Reduce `navItems` array in game-nav.tsx to 4 items
- [ ] Add Identity link to Menu overlay with PREMIUM badge
- [ ] Update Workshop/Shop links in Menu to `/store?tab=X`
- [ ] Create `/store/page.tsx` with tab routing
- [ ] Build Craft tab with recipe grid + materials
- [ ] Build Shop tab with decoration purchase grid
- [ ] Add coin balance header
- [ ] Visual test: nav has 5 items on mobile
- [ ] Visual test: store page tabs work
- [ ] Test: `?tab=shop` opens shop tab by default

## Success Criteria

- Nav shows exactly 5 items (4 links + Menu)
- Menu has Profile, Identity, Workshop, Shop, Settings, Sign Out
- `/store` page loads with two tabs
- `?tab=craft` and `?tab=shop` params work
- Crafting/purchasing works from store page
- No 404 for `/workshop` or `/shop` (redirected to store)
- Mobile-friendly layout

## Risk Assessment

- **Medium**: Extracting Sheet content into page — may have missing context or styling differences
- **Low**: Nav change is straightforward array edit
- **Mitigation**: Test crafting/purchasing flow end-to-end on store page

## Security Considerations

- Store page inherits dashboard auth (layout.tsx already checks auth)
- Inventory actions already have server-side auth checks

## Next Steps

Proceed to Phase 03 (Arrange mode merge).

## Commits

```
feat: restructure bottom nav to 5 items, create /store page with craft/shop tabs
```

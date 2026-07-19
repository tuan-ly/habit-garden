# Conventions — Habit Garden

**Mapped:** 2026-04-28

## Code Style

- **TypeScript strict mode**
- **ESLint 9** with `eslint-config-next`
- No Prettier config found — relies on editor settings
- **React Compiler** enabled via babel plugin (auto-memoization)

## Server Action Pattern

Every server action follows this pattern:

```typescript
export async function actionName(params: SomeDto) {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('table')
    .select('id, user_id, specific_columns')
    .eq('id', params.id)
    .single()

  if (!data || data.user_id !== user.id) return { error: 'Not found' }

  // ... business logic
  return { data: result }
}
```

Key rules:
- Always `getAuthUser()` from `@/lib/auth-cached`
- Always check ownership (`user.id === record.user_id`)
- Never `select('*')` — specify columns
- Check errors on every query

## Context Provider Pattern

```typescript
const SomeContext = createContext<SomeContextType | null>(null)

export function SomeProvider({ children, initialData }: Props) {
  const [state, setState] = useState(initialData)
  // ... logic
  return <SomeContext.Provider value={value}>{children}</SomeContext.Provider>
}

export function useSome() {
  const context = useContext(SomeContext)
  if (!context) throw new Error('useSome must be within SomeProvider')
  return context
}
```

## Error Handling

- Server actions return `{ data, error }` objects (never throw)
- Client-side uses `sonner` toast for user-facing errors
- No global error boundary configured
- Optimistic updates with rollback on server error

## File Organization

- One component per file (with co-located types)
- Server actions grouped by domain (`plants.ts`, `goals.ts`, etc.)
- Shared types centralized in `src/types/database.ts`
- Hooks in `src/lib/hooks/`, contexts in `src/lib/context/`
- Business logic utilities alongside actions in `src/lib/`

## Import Conventions

- Path alias: `@/` maps to `src/`
- Absolute imports: `import { X } from '@/lib/actions/plants'`
- UI components: `import { Button } from '@/components/ui/button'`

## Component Patterns

- **shadcn/ui** for all basic UI (buttons, dialogs, tabs, etc.)
- **Framer Motion** for entry/exit animations
- **Canvas** preferred for complex garden visuals
- **Responsive:** mobile-first, breakpoints via Tailwind

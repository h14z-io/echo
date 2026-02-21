# Echo v2 - Development Guidelines

## Project

Voice notes app with AI transcription (Gemini 2.5 Flash). Mobile-first, dark mode, clean design inspired by Linear/Vercel.

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 3.4
- Framer Motion
- IndexedDB (custom wrapper in lib/db.ts)
- Gemini 2.5 Flash (@google/generative-ai)
- Lucide React (icons)

## Design System

### Color Palette

- **Accent**: Viva Magenta - use `accent-600` for CTAs/buttons, `accent-500` for active states/highlights, `accent-400` for hover text
- **Backgrounds**: `zinc-950` (deepest), `zinc-900` (cards/surfaces), `zinc-800` (elevated/hover)
- **Borders**: `zinc-800` (default), `zinc-800/50` (subtle), `zinc-700` (strong)
- **Text**: `zinc-50` (primary), `zinc-400` (secondary), `zinc-500` (tertiary/placeholder)

### Typography

- Font: Inter (loaded via next/font)
- Headings: `text-lg font-semibold` or `text-xl font-semibold`
- Body: `text-sm text-zinc-400`
- Labels: `text-xs font-medium text-zinc-500 uppercase tracking-wider`

### Components Style

- Cards: `bg-zinc-900 border border-zinc-800 rounded-xl p-4`
- Buttons primary: `bg-accent-600 hover:bg-accent-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors`
- Buttons secondary: `bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg px-4 py-2 text-sm font-medium transition-colors`
- Inputs: `bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-accent-600 focus:ring-1 focus:ring-accent-600/50`
- Chips/badges: `bg-zinc-800 text-zinc-300 rounded-full px-3 py-1 text-xs font-medium`
- Active chips: `bg-accent-600/20 text-accent-400 border border-accent-600/30`

### Layout

- Mobile-first, max-w-lg mx-auto for content
- Page padding: `px-4 pt-4`
- Section spacing: `space-y-6`
- Bottom nav height accounted for: `pb-20` on main container

### Animations (Framer Motion)

- Page transitions: handled by app/template.tsx
- Component enter: `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}`
- Stagger children: `transition={{ delay: index * 0.05 }}`
- Interactive: use `whileTap={{ scale: 0.98 }}` for buttons

## Architecture

### Routes

```
app/
  page.tsx              → Home (record-first)
  recording/page.tsx    → Recording screen
  notes/page.tsx        → Notes list + search
  notes/[id]/page.tsx   → Note detail
  folders/page.tsx      → Folders list
  folders/[id]/page.tsx → Folder notes
  insights/page.tsx     → Insights list
  insights/[id]/page.tsx → Insight view
  settings/page.tsx     → Settings
```

### Data Layer

- All data in IndexedDB via `lib/db.ts`
- Types in `types/index.ts`
- Gemini service in `lib/gemini.ts`
- Utility functions in `lib/utils.ts`
- Audio utilities in `lib/audio.ts`

### State Management

- Use React hooks + IndexedDB
- Create custom hooks (useNotes, useFolders, etc.) as needed per feature
- Keep state local to each page/component, fetch from IndexedDB on mount
- Use `useRouter()` and `useParams()` from `next/navigation`

## Conventions

- All pages are client components ('use client')
- Use `@/` import alias (maps to project root)
- Use lucide-react for all icons
- No semicolons in code
- Single quotes for strings
- Use `cn()` from `lib/utils` for conditional classnames
- Every page should have a header section and proper mobile spacing

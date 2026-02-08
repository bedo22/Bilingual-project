# AGENTS.md

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production (also runs type checking)
- `npm run lint` - Run ESLint

## Architecture
- **Framework**: Next.js 16 (App Router) with TypeScript and React 19
- **Database**: Supabase (PostgreSQL) - schema in `supabase/schema.sql`
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **i18n**: next-intl with locales `en` and `ar` (RTL support), translations in `messages/`
- **Routes**: `src/app/[locale]/` for localized pages, `src/app/auth/` for auth actions

## Structure
- `src/components/ui/` - shadcn UI components
- `src/components/aceternity/` - Aceternity/Magic UI animated components
- `src/utils/supabase/` - Supabase client/server utilities
- `src/lib/types/` - TypeScript type definitions
- `src/i18n/` - i18n routing and request config

## Code Style
- Use `@/*` path alias for imports (maps to `src/*`)
- Use `next-intl` navigation helpers (`Link`, `redirect`, `useRouter`) from `@/i18n/routing`
- Prefer Server Components; use `"use client"` only when needed
- Use `cn()` utility from `@/lib/utils` for conditional class names

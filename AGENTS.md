# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router entry. Contains `layout.tsx`, `page.tsx`, route folders (e.g., `app/dashboard/page.tsx`), and local `components/`, `hooks/`, `utils/`.
- `public/`: Static assets served at the web root (e.g., `/favicon.ico`).
- `eslint.config.mjs`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`: Linting, TypeScript, Next.js, and PostCSS/Tailwind config.
- `support docs/`: Reference materials. Do not alter app build from here.
- `.next/`: Build output (ignored). Never edit by hand.

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server (Next 15, Turbopack) on `http://localhost:3000`.
- `npm run build`: Production build.
- `npm start`: Run the production server from the build output.
- `npm run lint`: Run ESLint with Next.js + TypeScript rules.

## Coding Style & Naming Conventions
- Language: TypeScript (`strict: true`). Prefer typed props and return types.
- Indentation: 2 spaces; single quotes or template literals; semicolons optional but be consistent.
- Components: PascalCase files in `app/components` (e.g., `DashboardCard.tsx`). Server/client boundaries explicit (`"use client"` where needed).
- Hooks: `app/hooks`, names start with `use*` (e.g., `useFilters.ts`).
- Utilities: `app/utils`, camelCase exports (e.g., `formatDate.ts`).
- Imports: Use path alias `@/*` (configured in `tsconfig.json`).
- Styling: Tailwind CSS via `app/globals.css`; prefer utility classes over ad-hoc CSS.
 - Icons: `app/utils/iconHelpers.tsx` returns inline SVGs by default; set `NEXT_PUBLIC_ICON_MODE=ascii` to switch to ASCII.

## Testing Guidelines
- No test runner is configured yet. If adding tests, prefer Jest or Vitest.
- Place tests in `__tests__/` or alongside files as `*.test.ts(x)`; aim for key logic in `utils/` and complex hooks/components.
- Keep tests deterministic and fast; mock browser APIs when needed.

## Commit & Pull Request Guidelines
- Commits: Imperative, concise subject (e.g., `Fix TS errors for deployment`). Group related changes.
- PRs: Include a clear summary, linked issues (e.g., `Closes #123`), and screenshots/gifs for UI changes. Ensure `npm run lint` and `npm run build` pass.

## Security & Config Tips
- Do not commit secrets. Use `.env.local` for runtime config when adding environment variables.
- Avoid importing from `.next` or writing to `public/` at runtime.


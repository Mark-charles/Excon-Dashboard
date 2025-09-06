# Repository Guidelines

## Project Structure & Module Organization
- app/: Next.js App Router pages and layouts (e.g., `app/page.tsx`, `app/dashboard/page.tsx`, `app/layout.tsx`).
- public/: Static assets served at the web root (e.g., `public/*.svg`).
- Styling: Global styles in `app/globals.css` using Tailwind CSS v4.
- Config: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`.
- Resources/: Project reference documents (not used at runtime/build).

## Build, Test, and Development Commands
- dev: `npm run dev` — start the local dev server (Turbopack).
- build: `npm run build` — compile a production build.
- start: `npm start` — serve the production build.
- lint: `npm run lint` — run ESLint with Next/TypeScript rules.
Prereqs: Node.js LTS (>=18) and npm. Install deps with `npm install`.

## Coding Style & Naming Conventions
- Language: TypeScript with strict mode; prefer function components and hooks.
- Indentation: 2 spaces; keep files small and cohesive.
- File naming: Route files use Next patterns (`page.tsx`, `layout.tsx`). Shared components should be PascalCase (e.g., `Button.tsx`).
- Styling: Prefer Tailwind utility classes; keep component styles local and avoid inline styles when utilities exist.
- Linting: Conform to `next/core-web-vitals` and `next/typescript`. Fix warnings before committing.
- Client/Server: Use `"use client"` only when needed for interactive components.

## Testing Guidelines
- No test runner is configured yet. For new coverage, use Jest or Vitest with React Testing Library.
- Place tests alongside files or under `__tests__/` using `*.test.ts(x)`.
- Aim for smoke tests on pages and critical utilities; prefer integration-level tests over brittle snapshots.

## Commit & Pull Request Guidelines
- Commits: Imperative, concise subject (e.g., "Add bulk import UI"). Reference issues (e.g., `#123`) when relevant.
- PRs: Include a clear description, steps to validate, and any config/env changes. Add screenshots or a short clip for UI changes.
- Keep PRs focused and small; link related work rather than bundling.

## Security & Configuration Tips
- Do not commit secrets. Use `.env.local` for environment variables; prefix client-exposed values with `NEXT_PUBLIC_`.
- Large files and generated artifacts (`.next/`, `out/`) should not be committed.
- Follow accessibility best practices (labels, focus, contrast) to meet Core Web Vitals.


# Repository Guidelines

## Project Structure & Module Organization
- Next.js App Router lives in `app/` with API routes under `app/api/**` and UI entry in `app/page.tsx`; global styles sit in `app/globals.css`.
- Reusable UI pieces are in `components/` (now 단순 게시판 UI + `components/ui`).
- Shared utilities reside in `utils/` and `lib/` (`lib/prisma.ts` is a common touchpoint).
- Data models live in `prisma/schema.prisma`; static assets go to `public/`; TypeScript types belong in `types/`.

## Build, Test, and Development Commands
- `npm run dev` – starts the custom Next.js server (`server.js`) on localhost.
- `npm run build` / `npm start` – production build and launch.
- `npm run lint` – ESLint with Next.js core-web-vitals rules; keep it clean before pushing.
- Database helpers: `npm run db:generate`, `npm run db:migrate`, `npm run db:push`, `npm run db:studio`. Call out migrations in PRs.

## Coding Style & Naming Conventions
- TypeScript-first with strict settings and `@/*` absolute imports (see `tsconfig.json`). Use 2-space indentation and single quotes to match existing files.
- Components are PascalCase; hooks are prefixed with `use`; route handlers mirror API paths (e.g., `app/api/posts/route.ts`).
- Prefer descriptive kebab-case filenames for multiword components (e.g., `post-card.tsx`) and keep UI logic lightweight with helpers in `utils/`.
- Tailwind utilities are the default styling approach; avoid inline styles unless necessary.

## Testing Guidelines
- No automated suite yet; at minimum run `npm run lint` and validate flows manually in `npm run dev` (글 작성, 무한 스크롤, 투표, 댓글 생성/삭제).
- If you add automated tests, colocate `*.test.ts` near the module or under `__tests__/`, and document how to run them in your PR.
- For DB changes, run relevant Prisma commands and verify schema-dependent paths (`utils/path.ts`, deletion logic) still behave.

## Commit & Pull Request Guidelines
- Follow the existing Conventional Commit pattern: `feat(scope): summary` (scopes like `post`, `game`, `ui`; Korean summaries are fine).
- PRs should include: a concise description, linked issue/goal, test/verification steps, screenshots or clips for UI/3D changes, and notes on migrations or new env vars.
- Keep diffs focused; update docs (README, SETUP, this guide) when behavior or setup changes.

## Security & Configuration Tips
- Create `.env.local` with `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`; never commit secrets.
- When touching `server.js`, ensure ports stay aligned with env config.
- Regenerate Prisma client after schema edits (`npm run db:generate`) and confirm migrations are safe for shared databases.

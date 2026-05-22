# AGENTS.md

## Cursor Cloud specific instructions

This is a Next.js 16 application (App Router) bootstrapped with `create-next-app`.

### Services

| Service | Command | Port |
|---------|---------|------|
| Next.js dev server | `npm run dev` | 3000 |

### Common commands

- **Dev server:** `npm run dev` (runs on http://localhost:3000 with hot reload)
- **Lint:** `npm run lint` (runs ESLint with Next.js config)
- **Build:** `npm run build` (production build with TypeScript checking)
- **Start production:** `npm run start` (serves the production build)

### Notes

- No lockfile is committed; `npm install` resolves fresh from `package.json` ranges.
- No database or external service dependencies exist currently.
- The project uses Tailwind CSS v4 with PostCSS and the `@tailwindcss/postcss` plugin.
- TypeScript strict mode is enabled.

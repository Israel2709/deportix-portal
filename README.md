# Deportix Portal

Consumer frontend for the **Deportix API** — Next.js (App Router), TypeScript (strict), Tailwind
CSS v4. It talks **only** to the public API via `NEXT_PUBLIC_API_BASE_URL` and **never** to Firebase.

> Part of the **Deportix API** MVP. API: [`../deportix-api`](../deportix-api).

## Pages

- **Home (`/`)** — product overview, sports coverage, featured leagues, links, live API status.
- **Liga MX (`/liga-mx`)** — data-driven league view (season/teams/calendar/standings from the API;
  nothing hardcoded). Useful even when only partial data exists.
- **American football (`/american-football`)** — progressive-coverage viewer: Available / Partial coverage / No data loaded yet.
  Reflects new data automatically, no code changes.
- **API Explorer (`/explorer`)** — run requests against the API's **defined** endpoints only (not an
  arbitrary URL console): status, timing, non-sensitive headers, formatted JSON.
- **`/leagues/[id]`** — generic league detail (reused by Home's featured leagues).

Every data section renders the four states: **loading / error (with retry) / empty / populated**.

## Quick start

```bash
pnpm install
cp .env.example .env.local           # NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
pnpm dev                             # http://localhost:3001
```

Run the API (`../deportix-api`, port 3000) alongside it so the portal has data to show.

### Acceso desde otro dispositivo en la red

1. Levanta la API y el portal en este equipo (`pnpm dev` en ambos repos).
2. Anota la IP que muestra Next.js en la línea `Network:` (ej. `http://192.168.x.x:3001`).
3. Desde el otro dispositivo (misma Wi‑Fi), abre esa URL. Las peticiones a la API irán a
   `http://<misma-ip>:3000` automáticamente.
4. Si no carga, revisa el firewall de macOS para Node en los puertos 3000 y 3001.

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Dev server (port 3001, all interfaces — LAN via `Network:` URL). |
| `pnpm build` / `pnpm start` | Production build / serve. |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit`. |
| `pnpm test` | Vitest + Testing Library (states, Liga MX, NFL, data-status, Explorer). Network mocked — never hits Firestore. |

## Environment

```env
# Base URL of the public Deportix API. No secrets belong here.
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
# Port used for LAN auto-resolution when base URL is localhost (default 3000).
NEXT_PUBLIC_API_PORT=3000
```

## Architecture notes

- Typed API client in `src/lib/api.ts`; client-side data hook `useApi` in `src/lib/use-api.ts`.
- Reusable UI in `src/components/ui` + state components in `src/components/states`.
- No Firebase dependency of any kind — the portal is a pure API consumer.

## Documentación interna

- **[American football — endpoints, contratos y shapes BFF](docs/american-football-segment.md)** — guía para cargar datos vía `/american-football/*` (POST/PATCH/DELETE) con shapes api-sports.

## Deploy to Vercel

1. New Vercel project from this directory (framework **Next.js**, auto-detected).
2. Set `NEXT_PUBLIC_API_BASE_URL` to the deployed API URL for Preview + Production.
3. Post-deploy: open `/`, `/liga-mx`, `/american-football`, `/explorer`; confirm coverage loads and the Explorer
   can call the API (the API allows CORS for `/v1` reads).

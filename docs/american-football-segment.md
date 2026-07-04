# American football — contrato de API para carga de datos (portal)

Guía para integrar el segmento **american football** del **Deportix Portal** con la API pública. Describe los endpoints BFF bajo `/american-football/*`, el envelope api-sports, y los **shapes exactos** que el portal debe enviar en POST/PATCH.

**API:** [`deportix-api`](../../deportix-api) · **Base URL:** `NEXT_PUBLIC_API_BASE_URL` (ej. `http://localhost:3000`)

---

## Dos superficies de la API

| Superficie | Prefijo | Uso en portal |
|------------|---------|---------------|
| **Deportix REST** | `/v1/*` | Lectura genérica, cobertura (`/v1/data-status`), vista American football (`/v1/leagues?sport=american-football`) |
| **BFF American football (api-sports)** | `/american-football/*` | **Carga manual de datos** — POST/PATCH/DELETE con shapes idénticos a api-sports American Football v1 |

Para **escribir** datos de american football (equipos, partidos, clasificación, ligas, etc.) el portal debe usar **`/american-football/*`**, no `/v1/leagues/.../matches`. Los bodies de escritura son los mismos objetos que devuelve `response[]` en GET.

Referencia en la API: [`docs/american-football-api-reference.md`](../../deportix-api/docs/american-football-api-reference.md)  
Fixtures de contrato: [`deportix-api/tests/fixtures/api-sports-nfl/`](../../deportix-api/tests/fixtures/api-sports-nfl/)

---

## Envelope de respuesta (todas las rutas `/american-football/*`)

Todas las respuestas JSON usan el envelope **completo** de api-sports (distinto al BFF soccer, que solo devuelve `{ response, results, errors }`).

```json
{
  "get": "games",
  "parameters": { "league": "1", "season": "2022" },
  "errors": [],
  "results": 1,
  "paging": { "current": 1, "total": 1 },
  "response": []
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `get` | `string` | Nombre lógico del endpoint (`"timezone"`, `"games"`, `"standings"`, …) |
| `parameters` | `object` \| `[]` | Query params recibidos (objeto clave-valor en la mayoría de rutas) |
| `errors` | `[]` \| `{ [field]: string }` | Vacío/`[]` en éxito; objeto con mensaje en error |
| `results` | `number` | Cantidad de elementos en `response` |
| `paging` | `{ current, total }` | Paginación api-sports (default `{ current: 1, total: 1 }`) |
| `response` | `array` | Datos del recurso — **este es el array que importa al portal** |

### Errores HTTP

| Status | Cuándo |
|--------|--------|
| `400` | Query o body inválido (schema Zod estricto) |
| `404` | Recurso no encontrado (PATCH/DELETE) |
| `503` | Firestore no configurado |

Cuerpo de error (ejemplo):

```json
{
  "get": "teams",
  "parameters": { "league": "1" },
  "errors": { "parameters": "The \"season\" parameter is required." },
  "results": 0,
  "paging": { "current": 1, "total": 1 },
  "response": []
}
```

### Cliente HTTP del portal

Usar las funciones de [`src/lib/api.ts`](../src/lib/api.ts):

```typescript
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

// GET
const envelope = await apiGet<AmericanFootballEnvelope<AmericanFootballGameItem>>('/american-football/games?league=1&season=2022');
const games = envelope.response;

// POST
await apiPost('/american-football/games', gameItem);

// PATCH
await apiPatch('/american-football/games/4550?replace=true', gameItem);

// DELETE → 204 sin body
await apiDelete('/american-football/teams?id=tm_mia');
```

---

## Reglas de validación (escritura)

1. **Body = un elemento de `response[]`** — el mismo objeto que devolvería un GET.
2. **Schemas estrictos** — campos extra en el JSON son rechazados con `400`.
3. **IDs api-sports** — usar `id` numérico de api-sports en `game.id`, `team.id`, `league.id` (se persisten como `external_id` en Firestore).
4. **Sin auth en MVP** — acceso restringido operacionalmente; CORS abierto en lecturas.

---

## Orden recomendado de carga

```text
1. POST /american-football/countries          (opcional — shape Football v3)
2. POST /american-football/leagues            (incluye seasons[] anidadas)
   — o POST /american-football/seasons { year } si la liga ya existe
3. POST /american-football/teams?league=1     (equipos por liga)
4. POST /american-football/games              (partidos — referencian team.id y league.id)
5. POST /american-football/standings          (filas de clasificación por equipo)
```

Catálogos auxiliares: `GET/POST /american-football/timezone`, `GET /american-football/seasons`.

---

## Endpoints

### Resumen

| Método | Ruta | Query (GET) | Body (POST/PATCH) |
|--------|------|-------------|-------------------|
| GET, POST, PATCH, DELETE | `/american-football/timezone` | — | `{ timezone }` / `{ timezone, newTimezone }` |
| GET, POST, DELETE | `/american-football/seasons` | — | `{ year: number }` |
| GET, POST, PATCH, DELETE | `/american-football/countries` | `name` | `CountryItem` |
| GET, POST, PATCH, DELETE | `/american-football/leagues` | `id`, `name`, `country_id`, `country`, `type`, `season`, `search` | `LeagueItem` |
| GET, POST | `/american-football/games` | ver abajo | `GameItem` |
| GET, PATCH, DELETE | `/american-football/games/{gameId}` | — | `GameItem` (PATCH) |
| GET, POST, PATCH, DELETE | `/american-football/teams` | `league`, `season` **requeridos** | `TeamItem` |
| GET, POST, PATCH, DELETE | `/american-football/standings` | `league`, `season` **requeridos**; `conference` opcional | `StandingItem` |

---

### `/american-football/timezone`

**GET** — lista de zonas IANA.

```http
GET /american-football/timezone
```

`response`: `string[]` — ej. `["UTC", "America/New_York", …]`

**POST** — agregar timezone.

```json
{ "timezone": "America/Chicago" }
```

**PATCH** — renombrar.

```json
{ "timezone": "America/Chicago", "newTimezone": "America/Mexico_City" }
```

**DELETE**

```json
{ "timezone": "America/Chicago" }
```

---

### `/american-football/seasons`

**GET** — años de temporada NFL distintos en la plataforma.

`response`: `number[]` — ej. `[2024, 2023, 2022]`

**POST** — registrar año (asocia a la primera liga NFL existente).

```json
{ "year": 2024 }
```

**DELETE** — elimina temporadas con ese año en todas las ligas NFL.

```json
{ "year": 2024 }
```

---

### `/american-football/countries`

Shape **Football v3** (api-sports soccer), aunque NFL no exponga `/countries` oficialmente.

**GET**

```http
GET /american-football/countries?name=USA
```

**POST / PATCH / DELETE** — body o query `name` para identificar.

#### `CountryItem` (`response[]`)

```typescript
interface CountryItem {
  name: string;
  code?: string | null;
  flag?: string | null;
}
```

```json
{
  "name": "USA",
  "code": "US",
  "flag": "https://media.api-sports.io/flags/us.svg"
}
```

---

### `/american-football/leagues`

**GET** — filtros opcionales: `id`, `name`, `country_id`, `country`, `type`, `season` (año), `search`.

**POST** — crea liga NFL + temporadas anidadas.

**PATCH** — `?id={externalId}` requerido.

**DELETE** — `?id={externalId}` requerido.

#### `LeagueItem` (`response[]`)

```typescript
interface LeagueItem {
  league: {
    id: number | string;
    name: string;
    type?: string | null;   // ej. "league"
    logo?: string | null;
  };
  country: {
    name: string;
    code?: string | null;
    flag?: string | null;
  };
  seasons: Array<{
    year: number;
    start?: string | null;   // "YYYY-MM-DD"
    end?: string | null;
    current: boolean;
    coverage?: {
      games?: {
        events?: boolean;
        statisitcs?: { teams?: boolean; players?: boolean }; // typo api-sports
      };
      statistics?: { season?: { players?: boolean } };
      players?: boolean;
      injuries?: boolean;
      standings?: boolean;
    };
  }>;
}
```

Ejemplo mínimo para POST:

```json
{
  "league": { "id": 1, "name": "NFL", "type": "league", "logo": "https://media.api-sports.io/american-football/leagues/1.png" },
  "country": { "name": "USA", "code": "US", "flag": "https://media.api-sports.io/flags/us.svg" },
  "seasons": [
    {
      "year": 2022,
      "start": "2022-08-05",
      "end": "2023-02-12",
      "current": true,
      "coverage": {
        "games": { "events": true, "statisitcs": { "teams": true, "players": true } },
        "statistics": { "season": { "players": true } },
        "players": true,
        "injuries": true,
        "standings": true
      }
    }
  ]
}
```

---

### `/american-football/games`

**GET** — tres modos de consulta:

| Modo | Query params |
|------|--------------|
| Por liga y temporada | `league`, `season`, `timezone` (opcional) |
| Detalle por id | `id={gameExternalId}` |
| Por equipo | `league`, `season`, `team` |

```http
GET /american-football/games?league=1&season=2022&timezone=UTC
GET /american-football/games?id=4550
GET /american-football/games?league=1&season=2022&team=25
GET /american-football/games/4550
```

**POST** — crear partido. Body = `GameItem` completo.

**PATCH** `/american-football/games/{gameId}`:

- Merge parcial (default): combina con payload almacenado.
- Reemplazo total: `?replace=true` + body `GameItem` completo.

**DELETE** `/american-football/games/{gameId}` → `204`.

#### `GameItem` (`response[]`)

```typescript
interface GameItem {
  game: {
    id: number | string;
    stage?: string | null;
    week?: string | null;
    date?: {
      timezone?: string | null;
      date?: string | null;      // "YYYY-MM-DD"
      time?: string | null;      // "HH:mm"
      timestamp?: number | null;
    };
    venue?: { name?: string | null; city?: string | null };
    status?: { short?: string | null; long?: string | null; timer?: string | null };
  };
  league: {
    id: number | string;
    name: string;
    season?: number | string;
    logo?: string | null;
    country?: { name: string; code?: string | null; flag?: string | null };
  };
  teams: {
    home: { id: number | string; name: string; logo?: string | null };
    away: { id: number | string; name: string; logo?: string | null };
  };
  scores?: {
    home?: {
      quarter_1?: number | null;
      quarter_2?: number | null;
      quarter_3?: number | null;
      quarter_4?: number | null;
      overtime?: number | null;
      total?: number | null;
    };
    away?: { /* mismo shape */ };
  };
}
```

Ejemplo POST (partido terminado):

```json
{
  "game": {
    "id": 4550,
    "stage": "Regular Season",
    "week": "5",
    "date": { "timezone": "UTC", "date": "2022-09-30", "time": "00:00", "timestamp": 1664496000 },
    "venue": { "name": "Hard Rock Stadium", "city": "Miami Gardens" },
    "status": { "short": "FT", "long": "Finished", "timer": null }
  },
  "league": {
    "id": 1,
    "name": "NFL",
    "season": "2022",
    "logo": "https://media.api-sports.io/american-football/leagues/1.png",
    "country": { "name": "USA", "code": "US", "flag": "https://media.api-sports.io/flags/us.svg" }
  },
  "teams": {
    "home": { "id": 25, "name": "Miami Dolphins", "logo": "https://media.api-sports.io/american-football/teams/25.png" },
    "away": { "id": 7, "name": "Detroit Lions", "logo": "https://media.api-sports.io/american-football/teams/7.png" }
  },
  "scores": {
    "home": { "quarter_1": 14, "quarter_2": 3, "quarter_3": 14, "quarter_4": 7, "overtime": null, "total": 38 },
    "away": { "quarter_1": 7, "quarter_2": 10, "quarter_3": 3, "quarter_4": 6, "overtime": null, "total": 26 }
  }
}
```

> Si el equipo no existe en Firestore, POST `/american-football/games` crea un stub de equipo a partir de `teams.home.id` / `teams.away.id`. Se recomienda cargar equipos antes con POST `/american-football/teams`.

---

### `/american-football/teams`

**GET** — requiere `league` y `season`.

```http
GET /american-football/teams?league=1&season=2022
```

**POST** — `?league={externalId}` requerido.

**PATCH / DELETE** — `?id={teamId}` (id interno Firestore o external id api-sports).

#### `TeamItem` (`response[]`)

```typescript
interface TeamItem {
  id: number | string;
  name: string;
  logo?: string | null;
}
```

```json
{
  "id": 25,
  "name": "Miami Dolphins",
  "logo": "https://media.api-sports.io/american-football/teams/25.png"
}
```

> El formulario NFL del portal (`team-form.ts`) también captura `code`, `city`, `conference`, `division` para `/v1` — esos campos **no** forman parte del BFF `/american-football/teams`. Para paridad api-sports usar solo `{ id, name, logo }` en POST/PATCH BFF.

---

### `/american-football/standings`

**GET** — requiere `league` y `season`; filtro opcional `conference`.

```http
GET /american-football/standings?league=1&season=2022&conference=American%20Football%20Conference
```

**POST** — body = `StandingItem` (una fila por equipo).

**PATCH / DELETE** — `?id={standingId}`.

#### `StandingItem` (`response[]`)

```typescript
interface StandingItem {
  league: {
    id: number | string;
    name: string;
    season?: number | string;
    logo?: string | null;
    country?: { name: string; code?: string | null; flag?: string | null };
  };
  conference?: string | null;
  division?: string | null;
  position?: number | null;
  team: { id: number | string; name: string; logo?: string | null };
  won?: number | null;
  lost?: number | null;
  ties?: number | null;
  points?: {
    for?: number | null;
    against?: number | null;
    difference?: number | null;
  };
  records?: {
    home?: string | null;
    road?: string | null;
    conference?: string | null;
    division?: string | null;
  };
  streak?: string | null;
  ncaa_conference?: {
    won?: number | null;
    lost?: number | null;
    points?: { for?: number | null; against?: number | null };
  };
}
```

Ejemplo POST:

```json
{
  "league": {
    "id": 1,
    "name": "NFL",
    "season": 2022,
    "logo": "https://media.api-sports.io/american-football/leagues/1.png",
    "country": { "name": "USA", "code": "US", "flag": "https://media.api-sports.io/flags/us.svg" }
  },
  "conference": "American Football Conference",
  "division": "East",
  "position": 1,
  "team": { "id": 25, "name": "Miami Dolphins", "logo": "https://media.api-sports.io/american-football/teams/25.png" },
  "won": 3,
  "lost": 1,
  "ties": 0,
  "points": { "for": 98, "against": 91, "difference": 7 },
  "records": { "home": "2-0", "road": "1-1", "conference": "3-1", "division": "2-0" },
  "streak": "L1",
  "ncaa_conference": { "won": null, "lost": null, "points": { "for": null, "against": null } }
}
```

> POST `/american-football/standings` exige que el equipo (`team.id`) ya exista en la liga.

---

## Tipos TypeScript sugeridos (portal)

```typescript
/** Envelope genérico BFF NFL */
export interface AmericanFootballEnvelope<T> {
  get: string;
  parameters: Record<string, string> | unknown[];
  errors: unknown[] | Record<string, string>;
  results: number;
  paging?: { current: number; total: number };
  response: T[];
}

// Re-exportar items
export type AmericanFootballCountryItem = { name: string; code?: string | null; flag?: string | null };
export type AmericanFootballTeamItem = { id: number | string; name: string; logo?: string | null };
// GameItem, LeagueItem, StandingItem — ver secciones arriba
```

Ubicación recomendada: `src/lib/american-football-bff-types.ts`.

---

## Lectura vs escritura en el portal hoy

| Pantalla / flujo | Endpoint actual | Endpoint BFF American football (carga) |
|------------------|-----------------|---------------------------|
| `/american-football` cobertura | `GET /v1/data-status` | — |
| `/american-football` ligas listadas | `GET /v1/leagues?sport=american-football` | `GET /american-football/leagues` |
| Editar equipos | `GET/PATCH /v1/teams/{id}` | `POST/PATCH /american-football/teams?league=1` |
| Crear partidos | `POST /v1/leagues/{id}/matches` | `POST /american-football/games` con `GameItem` |
| Clasificación | `GET /v1/leagues/{id}/standings` | `POST /american-football/standings` con `StandingItem` |

La app Flutter NFL consume **`/american-football/*` en GET** con el mismo shape que api-sports. El portal debe escribir con esos mismos objetos para que Flutter lea datos consistentes.

---

## Verificación

1. **Local:** API en `:3000`, portal en `:3001`, `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000`.
2. **Probar GET vacío:** `curl -s 'http://localhost:3000/american-football/leagues' | jq .results` → `0` hasta cargar datos.
3. **Probar POST:** enviar un `LeagueItem` de ejemplo; verificar `results: 1` y `response[0]`.
4. **Fixtures de referencia:** copiar JSON desde [`deportix-api/tests/fixtures/api-sports-nfl/`](../../deportix-api/tests/fixtures/api-sports-nfl/).

OpenAPI interactivo: `http://localhost:3000/docs` → tag **BFF NFL**.

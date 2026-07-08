# American football — contrato de API para carga de datos (portal)

Guía para integrar el segmento **american football** del **Deportix Portal** con la API pública. Describe los endpoints BFF bajo `/american-football/*`, el envelope api-sports, y los **shapes exactos** que el portal debe enviar en POST/PATCH.

**API:** [`deportix-api`](../../deportix-api) · **Base URL:** `NEXT_PUBLIC_API_BASE_URL` (ej. `http://localhost:3000`)

---

## Dos superficies de la API

| Superficie | Prefijo | Uso en portal |
|------------|---------|---------------|
| **Deportix REST** | `/v1/*` | Lectura genérica, cobertura (`/v1/data-status`), vista American football (`/v1/leagues?sport=american-football`) |
| **BFF American football (api-sports)** | `/american-football/*` | **Carga manual de datos** — POST/PATCH/DELETE con envelope api-sports y **IDs canónicos UUID** |

Para **escribir** datos de american football (equipos, partidos, clasificación, ligas, etc.) el portal debe usar **`/american-football/*`**, no `/v1/leagues/.../matches`.

Referencia en la API: [`docs/american-football-api-reference.md`](../../deportix-api/docs/american-football-api-reference.md)  
Fixtures de contrato (import legacy): [`deportix-api/tests/fixtures/api-sports-nfl/`](../../deportix-api/tests/fixtures/api-sports-nfl/)

---

## IDs canónicos (UUID)

| Regla | Detalle |
|-------|---------|
| **Respuestas** | Todo `id` visible (`league.id`, `team.id`, `game.id`, fila de standing) es un **UUID** asignado por Firestore |
| **POST create** | **No incluir** `id` del recurso que se crea — el servidor lo asigna y lo devuelve en `response[0]` |
| **Referencias** | En POST de games/standings, `league.id` y `team.id` deben ser UUIDs **ya existentes** |
| **GET / PATCH / DELETE** | Query/path aceptan UUID canónico; lookup por `external_id` legacy solo como fallback deprecado |
| **Schemas estrictos** | Campos extra (p. ej. `game.id` en POST) → `400` |

Tras crear una liga o equipo, copia el UUID del toast o de `response[0]` para usarlo en cargas posteriores (temporadas, equipos, partidos, clasificación).

---

## Envelope de respuesta (todas las rutas `/american-football/*`)

Todas las respuestas JSON usan el envelope **completo** de api-sports (distinto al BFF soccer, que solo devuelve `{ response, results, errors }`).

```json
{
  "get": "games",
  "parameters": { "league": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "season": "2022" },
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
  "parameters": { "league": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
  "errors": { "parameters": "The \"season\" parameter is required." },
  "results": 0,
  "paging": { "current": 1, "total": 1 },
  "response": []
}
```

### Cliente HTTP del portal

Usar las funciones de [`src/lib/american-football-api.ts`](../src/lib/american-football-api.ts) (tipos en [`american-football-bff-types.ts`](../src/lib/american-football-bff-types.ts)):

```typescript
import { createAmericanFootballTeam, listAmericanFootballLeagues } from '@/lib/american-football-api';

// GET
const envelope = await listAmericanFootballLeagues();
const leagues = envelope.response;

// POST — body sin id; la respuesta trae el UUID asignado
const created = await createAmericanFootballTeam(leagueUuid, { name: 'Miami Dolphins', logo: '…' });
const teamId = created.response[0].id;
```

---

## Reglas de validación (escritura)

1. **Create vs response** — POST usa tipos `*Create` (sin ids de recurso); GET/PATCH devuelven `*Item` con UUIDs.
2. **Schemas estrictos** — campos extra en el JSON son rechazados con `400`.
3. **Referencias UUID** — `league.id`, `team.id`, etc. deben existir antes de crear games o standings.
4. **Sin auto-creación de equipos** — POST `/american-football/games` **no** crea stubs; cargar equipos antes.
5. **Sin auth en MVP** — acceso restringido operacionalmente; CORS abierto en lecturas.

---

## Orden recomendado de carga

```text
1. POST /american-football/countries          (opcional — shape Football v3)
2. POST /american-football/leagues            (sin league.id — copiar UUID de response)
   — o POST /american-football/seasons { year } con ?league=<uuid>
3. POST /american-football/teams?league=<uuid>
4. POST /american-football/games              (teams.*.id y league.id = UUIDs existentes)
5. POST /american-football/standings          (team.id y league.id = UUIDs existentes)
```

Catálogos auxiliares: `GET/POST /american-football/timezone`, `GET /american-football/seasons`.

Reset de capa NFL (API): `pnpm data:reset-american-football -- --confirm`

---

## Endpoints

### Resumen

| Método | Ruta | Query (GET) | Body (POST/PATCH) |
|--------|------|-------------|-------------------|
| GET, POST, PATCH, DELETE | `/american-football/timezone` | — | `{ timezone }` / `{ timezone, newTimezone }` |
| GET, POST, DELETE | `/american-football/seasons` | `league` (UUID) | `{ year: number }` |
| GET, POST, PATCH, DELETE | `/american-football/countries` | `name` | `CountryItem` |
| GET, POST, PATCH, DELETE | `/american-football/leagues` | `id` (UUID), `name`, … | `LeagueCreate` (sin `league.id`) |
| GET, POST | `/american-football/games` | ver abajo | `GameCreate` (sin `game.id`) |
| GET, PATCH, DELETE | `/american-football/games/{gameId}` | — | `GameCreate` (PATCH) |
| GET, POST, PATCH, DELETE | `/american-football/teams` | `league`, `season` **requeridos** | `TeamCreate` / `TeamCreate` |
| GET, POST, PATCH, DELETE | `/american-football/standings` | `league`, `season` **requeridos** | `StandingCreate` (sin `id`) |

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

**POST** — registrar año (asocia a liga NFL; opcional `?league=<uuid>`).

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

**GET** — filtros opcionales: `id` (UUID), `name`, `country_id`, `country`, `type`, `season` (año), `search`.

**POST** — crea liga NFL + temporadas anidadas (**sin** `league.id`).

**PATCH** — `?id={uuid}` requerido.

**DELETE** — `?id={uuid}` requerido.

#### `LeagueItem` (`response[]`)

```typescript
interface LeagueItem {
  league: {
    id: string;           // UUID — solo en respuestas
    name: string;
    type?: string | null;
    logo?: string | null;
    altLogo?: string | null;
  };
  country: { name: string; code?: string | null; flag?: string | null };
  seasons: Array<{
    year: number;
    start?: string | null;
    end?: string | null;
    current: boolean;
    coverage?: { /* … */ };
  }>;
}

interface LeagueCreate {
  league: { name: string; type?: string | null; logo?: string | null; altLogo?: string | null };
  country: LeagueItem['country'];
  seasons: LeagueItem['seasons'];
}
```

Ejemplo POST:

```json
{
  "league": { "name": "NFL", "type": "league", "logo": "https://media.api-sports.io/american-football/leagues/1.png" },
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
| Por liga y temporada | `league` (UUID), `season`, `timezone` (opcional) |
| Detalle por id | `id={gameUuid}` |
| Por equipo | `league`, `season`, `team` (UUIDs) |

```http
GET /american-football/games?league=<uuid>&season=2022
GET /american-football/games?id=<game-uuid>
GET /american-football/games?league=<uuid>&season=2022&team=<team-uuid>
GET /american-football/games/<game-uuid>
```

**POST** — crear partido. Body = `GameCreate` (**sin** `game.id`).

**PATCH** `/american-football/games/{gameId}`:

- Merge parcial (default): combina con payload almacenado.
- Reemplazo total: `?replace=true` + body `GameCreate` completo.

**DELETE** `/american-football/games/{gameId}` → `204`.

#### Tipos

```typescript
interface GameCreate {
  game: {
    stage?: string | null;
    week?: string | null;
    date?: { timezone?: string | null; date?: string | null; time?: string | null; timestamp?: number | null };
    venue?: { name?: string | null; city?: string | null };
    status?: { short?: string | null; long?: string | null; timer?: string | null };
  };
  league: { id: string; name: string; season?: number | string; logo?: string | null; country?: CountryItem };
  teams: {
    home: { id: string; name: string; logo?: string | null };
    away: { id: string; name: string; logo?: string | null };
  };
  scores?: { home?: GameScoreSide; away?: GameScoreSide };
}

interface GameItem extends GameCreate {
  game: GameCreate['game'] & { id: string };
}
```

Ejemplo POST (usar UUIDs reales de liga y equipos):

```json
{
  "game": {
    "stage": "Regular Season",
    "week": "5",
    "date": { "timezone": "UTC", "date": "2022-09-30", "time": "00:00", "timestamp": 1664496000 },
    "venue": { "name": "Hard Rock Stadium", "city": "Miami Gardens" },
    "status": { "short": "FT", "long": "Finished", "timer": null }
  },
  "league": {
    "id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "name": "NFL",
    "season": "2022",
    "logo": "https://media.api-sports.io/american-football/leagues/1.png",
    "country": { "name": "USA", "code": "US", "flag": "https://media.api-sports.io/flags/us.svg" }
  },
  "teams": {
    "home": { "id": "bbbbbbbb-cccc-dddd-eeee-ffffffffffff", "name": "Miami Dolphins", "logo": "https://media.api-sports.io/american-football/teams/25.png" },
    "away": { "id": "cccccccc-dddd-eeee-ffff-000000000000", "name": "Detroit Lions", "logo": "https://media.api-sports.io/american-football/teams/7.png" }
  },
  "scores": {
    "home": { "quarter_1": 14, "quarter_2": 3, "quarter_3": 14, "quarter_4": 7, "overtime": null, "total": 38 },
    "away": { "quarter_1": 7, "quarter_2": 10, "quarter_3": 3, "quarter_4": 6, "overtime": null, "total": 26 }
  }
}
```

---

### `/american-football/teams`

**GET** — requiere `league` (UUID) y `season`.

```http
GET /american-football/teams?league=<uuid>&season=2022
```

**POST** — `?league={uuid}` requerido. Body sin `id`.

**PATCH / DELETE** — `?id={teamUuid}`.

#### Tipos

```typescript
interface TeamCreate {
  name: string;
  logo?: string | null;
  altLogo?: string | null;
}

interface TeamItem extends TeamCreate {
  id: string;
}
```

```json
{
  "name": "Miami Dolphins",
  "logo": "https://media.api-sports.io/american-football/teams/25.png"
}
```

> El formulario NFL del portal también captura `code`, `city`, `conference`, `division` para contexto UI — el BFF `/american-football/teams` persiste `{ name, logo, altLogo }` en POST/PATCH.

---

### `/american-football/standings`

**GET** — requiere `league` (UUID) y `season`; filtro opcional `conference`.

```http
GET /american-football/standings?league=<uuid>&season=2022
```

**POST** — body = `StandingCreate` (sin `id`).

**PATCH / DELETE** — `?id={standingUuid}`.

#### Tipos

```typescript
interface StandingCreate {
  league: GameCreate['league'];
  conference?: string | null;
  division?: string | null;
  position?: number | null;
  team: { id: string; name: string; logo?: string | null };
  won?: number | null;
  lost?: number | null;
  ties?: number | null;
  points?: { for?: number | null; against?: number | null; difference?: number | null };
  records?: { home?: string | null; road?: string | null; conference?: string | null; division?: string | null };
  streak?: string | null;
  ncaa_conference?: { won?: number | null; lost?: number | null; points?: { for?: number | null; against?: number | null } };
}

interface StandingItem extends StandingCreate {
  id: string;
}
```

> POST exige que el equipo (`team.id`) ya exista en la liga.

---

## Tipos TypeScript (portal)

Implementados en [`src/lib/american-football-bff-types.ts`](../src/lib/american-football-bff-types.ts):

- `AmericanFootballLeagueCreate` / `AmericanFootballLeagueItem`
- `AmericanFootballTeamCreate` / `AmericanFootballTeamItem`
- `AmericanFootballGameCreate` / `AmericanFootballGameItem`
- `AmericanFootballStandingCreate` / `AmericanFootballStandingItem`

Helpers UUID: [`src/lib/american-football-forms/shared.ts`](../src/lib/american-football-forms/shared.ts) (`isCanonicalId`, `truncateCanonicalId`).

---

## Lectura vs escritura en el portal

| Pantalla / flujo | Endpoint actual | Endpoint BFF (carga) |
|------------------|-----------------|------------------------|
| `/american-football` cobertura | `GET /v1/data-status` | — |
| `/american-football` ligas | `GET /v1/leagues?sport=american-football` | `GET/POST /american-football/leagues` |
| Equipos | `GET /v1/teams/{id}` | `POST/PATCH /american-football/teams?league=<uuid>` |
| Partidos | — | `POST /american-football/games` con UUIDs de liga/equipos |
| Clasificación | `GET /v1/leagues/{id}/standings` | `POST /american-football/standings` |

La app Flutter NFL consume **`/american-football/*` en GET** con el mismo envelope api-sports; los `id` en `response[]` son UUIDs canónicos.

---

## Verificación

1. **Local:** API en `:3000`, portal en `:3001`, `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000`.
2. **GET vacío:** `curl -s 'http://localhost:3000/american-football/leagues' | jq .results` → `0` tras reset.
3. **POST liga:** enviar `LeagueCreate`; verificar `response[0].league.id` es UUID.
4. **Cadena:** equipos → partidos → standings usando UUIDs copiados de respuestas previas.

OpenAPI interactivo: `http://localhost:3000/docs` → tag **BFF American Football**.

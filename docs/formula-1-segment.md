# Formula 1 — contrato de API para carga de datos (portal)

Guía para integrar el segmento **Formula 1** del **Deportix Portal** con la API pública. Describe los endpoints BFF bajo `/formula-1/*`, el envelope api-sports, y el orden de escritura.

**API:** [`deportix-api`](../../deportix-api) · **Base URL:** `NEXT_PUBLIC_API_BASE_URL` (ej. `http://localhost:3000`)

Referencia en la API: [`docs/formula-1-api-reference.md`](../../deportix-api/docs/formula-1-api-reference.md)  
OpenAPI: tag **BFF Formula 1** en `{API}/docs`

Sport slug en catálogo: **`f1`** · Ruta del portal: **`/formula-1`**

---

## Superficie BFF

| Prefijo | Uso |
|---------|-----|
| `/formula-1/*` | Lectura y carga manual (POST/PATCH/DELETE) con envelope api-sports e IDs UUID |

F1 **no** usa `/v1/leagues/.../teams|matches|standings` (`genericEndpointsSupported: false`).

---

## Endpoints

| Method | Path | Notas |
| --- | --- | --- |
| GET | `/formula-1/seasons` | Años distintos derivados de `f1_races` |
| GET/POST/PATCH/DELETE | `/formula-1/competitions` | `id` / `name` / `search` |
| GET/POST/PATCH/DELETE | `/formula-1/circuits` | + `country` |
| GET/POST/PATCH/DELETE | `/formula-1/teams` | Constructores |
| GET/POST/PATCH/DELETE | `/formula-1/drivers` | Filter `team` |
| GET/POST/PATCH/DELETE | `/formula-1/races` | List requiere `season` (salvo `id`) |
| GET | `/formula-1/races/{raceId}` | Detalle |
| GET/POST/PATCH/DELETE | `/formula-1/rankings/drivers` | GET requiere `season` |
| GET/POST/PATCH/DELETE | `/formula-1/rankings/teams` | GET requiere `season` |
| GET/POST/PATCH/DELETE | `/formula-1/rankings/races` | GET requiere `race` |

---

## Orden de escritura

1. Competiciones + circuitos + equipos  
2. Pilotos (`teamId` opcional)  
3. Carreras (`competitionId`, `circuitId`)  
4. Rankings (pilotos / equipos / resultados)

Cliente del portal: [`src/lib/formula-1-api.ts`](../src/lib/formula-1-api.ts), tipos en [`formula-1-bff-types.ts`](../src/lib/formula-1-bff-types.ts).

---

## IDs canónicos

- Responses exponen UUID de Firestore.
- POST **sin** `id` del recurso.
- Referencias anidadas deben ser UUIDs existentes.
- Los items de ranking (api-sports) **no** incluyen el UUID del documento; PATCH/DELETE requieren `?id=` del documento (campo manual en el loader).

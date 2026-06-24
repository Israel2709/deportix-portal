import { LeagueDetail } from '@/components/views/LeagueDetail';

// Liga MX is identified by its stable provider external id (262); the page is fully
// data-driven — seasons, teams, matches and standings come from the API, never hardcoded.
export default function Page() {
  return (
    <LeagueDetail
      league="262"
      title="Liga MX"
      intro="La máxima categoría de México. La temporada disponible, equipos, calendario y clasificación que aparecen abajo provienen directamente de la API — solo se muestra lo que está realmente cargado."
    />
  );
}

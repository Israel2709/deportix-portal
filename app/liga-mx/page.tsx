import { LeagueDetail } from '@/components/views/LeagueDetail';

// Liga MX is identified by its stable provider external id (262); the page is fully
// data-driven — seasons, teams, matches and standings come from the API, never hardcoded.
export default function Page() {
  return (
    <LeagueDetail
      league="262"
      title="Liga MX"
      intro="Mexico's top flight. The available season, teams, calendar and standings shown below come straight from the API — only what is actually loaded appears."
    />
  );
}

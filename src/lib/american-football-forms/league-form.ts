import type {
  AmericanFootballLeagueCreate,
  AmericanFootballLeagueItem,
  AmericanFootballLeagueSeason,
} from '../american-football-bff-types';
import { nullableString, requireCanonicalId } from './shared';

export interface AmericanFootballLeagueFormValues {
  leagueId: string;
  leagueName: string;
  leagueType: string;
  leagueLogo: string;
  leagueAltLogo: string;
  countryName: string;
  countryCode: string;
  countryFlag: string;
}

export const EMPTY_AMERICAN_FOOTBALL_LEAGUE_FORM: AmericanFootballLeagueFormValues = {
  leagueId: '',
  leagueName: '',
  leagueType: 'league',
  leagueLogo: '',
  leagueAltLogo: '',
  countryName: 'USA',
  countryCode: 'US',
  countryFlag: '',
};

export function leagueToFormValues(item: AmericanFootballLeagueItem): AmericanFootballLeagueFormValues {
  return {
    leagueId: item.league.id,
    leagueName: item.league.name,
    leagueType: item.league.type ?? 'league',
    leagueLogo: item.league.logo ?? '',
    leagueAltLogo: item.league.altLogo ?? '',
    countryName: item.country.name,
    countryCode: item.country.code ?? '',
    countryFlag: item.country.flag ?? '',
  };
}

export function validateAmericanFootballLeagueForm(
  values: AmericanFootballLeagueFormValues,
  mode: 'create' | 'edit' | 'delete',
  options?: { allowedLeagueTypes?: string[] },
): string | null {
  if (mode === 'delete') {
    if (requireCanonicalId(values.leagueId, 'ID') === 'invalid') {
      return 'Selecciona una liga de la lista para eliminar.';
    }
    return null;
  }
  if (!values.leagueName.trim()) return 'El nombre de la liga es obligatorio.';
  if (!values.leagueType.trim()) return 'El tipo de liga es obligatorio.';
  if (
    options?.allowedLeagueTypes?.length &&
    !options.allowedLeagueTypes.includes(values.leagueType.trim())
  ) {
    return 'Selecciona un tipo de liga válido del catálogo.';
  }
  if (!values.countryName.trim()) return 'El país es obligatorio.';
  if (mode === 'edit' && requireCanonicalId(values.leagueId, 'ID') === 'invalid') {
    return 'Selecciona una liga de la lista para editar.';
  }
  return null;
}

export function buildAmericanFootballLeagueBody(
  values: AmericanFootballLeagueFormValues,
  existingSeasons: AmericanFootballLeagueSeason[] = [],
): AmericanFootballLeagueCreate {
  return {
    league: {
      name: values.leagueName.trim(),
      type: nullableString(values.leagueType),
      logo: nullableString(values.leagueLogo),
      altLogo: nullableString(values.leagueAltLogo),
    },
    country: {
      name: values.countryName.trim(),
      code: nullableString(values.countryCode),
      flag: nullableString(values.countryFlag),
    },
    seasons: existingSeasons,
  };
}

/** Global country catalog — shared by all sports (Firestore `countries` collection). */

export interface CatalogCountry {
  name: string;
  code: string | null;
  flag: string | null;
}

/** Global league type catalog — shared by all sports (Firestore `league_types` collection). */

export interface CatalogLeagueType {
  code: string;
  label: string;
}

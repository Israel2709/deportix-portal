/** Global country catalog — shared by all sports (Firestore `countries` collection). */

export interface CatalogCountry {
  name: string;
  code: string | null;
  flag: string | null;
}

/** Les 54 pays africains (ISO 3166-1 alpha-2). Les noms viennent du navigateur, dans la langue choisie. */
export const AFRICAN_COUNTRIES = [
  'DZ',
  'AO',
  'BJ',
  'BW',
  'BF',
  'BI',
  'CV',
  'CM',
  'CF',
  'TD',
  'KM',
  'CG',
  'CD',
  'CI',
  'DJ',
  'EG',
  'GQ',
  'ER',
  'SZ',
  'ET',
  'GA',
  'GM',
  'GH',
  'GN',
  'GW',
  'KE',
  'LS',
  'LR',
  'LY',
  'MG',
  'MW',
  'ML',
  'MR',
  'MU',
  'MA',
  'MZ',
  'NA',
  'NE',
  'NG',
  'RW',
  'ST',
  'SN',
  'SC',
  'SL',
  'SO',
  'ZA',
  'SS',
  'SD',
  'TZ',
  'TG',
  'TN',
  'UG',
  'ZM',
  'ZW',
] as const;

/** Pour la diaspora et les membres hors du continent. */
export const OTHER_COUNTRY = 'OTHER';

export type CountryOption = { code: string; name: string };

export function countryOptions(language: string): CountryOption[] {
  const names = new Intl.DisplayNames([language], { type: 'region' });
  return AFRICAN_COUNTRIES.map((code) => ({ code, name: names.of(code) ?? code })).sort((a, b) =>
    a.name.localeCompare(b.name, language),
  );
}

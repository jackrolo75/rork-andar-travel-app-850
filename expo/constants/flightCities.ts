/**
 * Curated city → IATA airport-code dictionary for flight search.
 *
 * Aviasales deep-links require IATA codes, but users type city names. This
 * covers the most searched destinations at launch; any 3-letter code typed
 * directly (e.g. "DXB") passes through as-is.
 */
export interface FlightCity {
  city: string;
  country: string;
  iata: string;
}

export const FLIGHT_CITIES: FlightCity[] = [
  { city: 'Dubai', country: 'UAE', iata: 'DXB' },
  { city: 'Abu Dhabi', country: 'UAE', iata: 'AUH' },
  { city: 'Doha', country: 'Qatar', iata: 'DOH' },
  { city: 'Riyadh', country: 'Saudi Arabia', iata: 'RUH' },
  { city: 'Jeddah', country: 'Saudi Arabia', iata: 'JED' },
  { city: 'Cairo', country: 'Egypt', iata: 'CAI' },
  { city: 'Istanbul', country: 'Turkey', iata: 'IST' },
  { city: 'Antalya', country: 'Turkey', iata: 'AYT' },
  { city: 'London', country: 'UK', iata: 'LON' },
  { city: 'Manchester', country: 'UK', iata: 'MAN' },
  { city: 'Paris', country: 'France', iata: 'PAR' },
  { city: 'Rome', country: 'Italy', iata: 'ROM' },
  { city: 'Milan', country: 'Italy', iata: 'MIL' },
  { city: 'Barcelona', country: 'Spain', iata: 'BCN' },
  { city: 'Madrid', country: 'Spain', iata: 'MAD' },
  { city: 'Amsterdam', country: 'Netherlands', iata: 'AMS' },
  { city: 'Frankfurt', country: 'Germany', iata: 'FRA' },
  { city: 'Munich', country: 'Germany', iata: 'MUC' },
  { city: 'Berlin', country: 'Germany', iata: 'BER' },
  { city: 'Zurich', country: 'Switzerland', iata: 'ZRH' },
  { city: 'Vienna', country: 'Austria', iata: 'VIE' },
  { city: 'Lisbon', country: 'Portugal', iata: 'LIS' },
  { city: 'Athens', country: 'Greece', iata: 'ATH' },
  { city: 'Prague', country: 'Czechia', iata: 'PRG' },
  { city: 'Budapest', country: 'Hungary', iata: 'BUD' },
  { city: 'Warsaw', country: 'Poland', iata: 'WAW' },
  { city: 'Moscow', country: 'Russia', iata: 'MOW' },
  { city: 'New York', country: 'USA', iata: 'NYC' },
  { city: 'Los Angeles', country: 'USA', iata: 'LAX' },
  { city: 'Chicago', country: 'USA', iata: 'CHI' },
  { city: 'San Francisco', country: 'USA', iata: 'SFO' },
  { city: 'Miami', country: 'USA', iata: 'MIA' },
  { city: 'Toronto', country: 'Canada', iata: 'YTO' },
  { city: 'Mumbai', country: 'India', iata: 'BOM' },
  { city: 'Delhi', country: 'India', iata: 'DEL' },
  { city: 'Bengaluru', country: 'India', iata: 'BLR' },
  { city: 'Hyderabad', country: 'India', iata: 'HYD' },
  { city: 'Chennai', country: 'India', iata: 'MAA' },
  { city: 'Kochi', country: 'India', iata: 'COK' },
  { city: 'Karachi', country: 'Pakistan', iata: 'KHI' },
  { city: 'Lahore', country: 'Pakistan', iata: 'LHE' },
  { city: 'Islamabad', country: 'Pakistan', iata: 'ISB' },
  { city: 'Dhaka', country: 'Bangladesh', iata: 'DAC' },
  { city: 'Colombo', country: 'Sri Lanka', iata: 'CMB' },
  { city: 'Kathmandu', country: 'Nepal', iata: 'KTM' },
  { city: 'Singapore', country: 'Singapore', iata: 'SIN' },
  { city: 'Kuala Lumpur', country: 'Malaysia', iata: 'KUL' },
  { city: 'Bangkok', country: 'Thailand', iata: 'BKK' },
  { city: 'Phuket', country: 'Thailand', iata: 'HKT' },
  { city: 'Jakarta', country: 'Indonesia', iata: 'JKT' },
  { city: 'Bali', country: 'Indonesia', iata: 'DPS' },
  { city: 'Manila', country: 'Philippines', iata: 'MNL' },
  { city: 'Hong Kong', country: 'Hong Kong', iata: 'HKG' },
  { city: 'Tokyo', country: 'Japan', iata: 'TYO' },
  { city: 'Seoul', country: 'South Korea', iata: 'SEL' },
  { city: 'Beijing', country: 'China', iata: 'BJS' },
  { city: 'Shanghai', country: 'China', iata: 'SHA' },
  { city: 'Sydney', country: 'Australia', iata: 'SYD' },
  { city: 'Melbourne', country: 'Australia', iata: 'MEL' },
  { city: 'Auckland', country: 'New Zealand', iata: 'AKL' },
  { city: 'Casablanca', country: 'Morocco', iata: 'CMN' },
  { city: 'Marrakesh', country: 'Morocco', iata: 'RAK' },
  { city: 'Nairobi', country: 'Kenya', iata: 'NBO' },
  { city: 'Cape Town', country: 'South Africa', iata: 'CPT' },
  { city: 'Johannesburg', country: 'South Africa', iata: 'JNB' },
  { city: 'São Paulo', country: 'Brazil', iata: 'SAO' },
  { city: 'Buenos Aires', country: 'Argentina', iata: 'BUE' },
  { city: 'Mexico City', country: 'Mexico', iata: 'MEX' },
  { city: 'Maldives', country: 'Maldives', iata: 'MLE' },
  { city: 'Tashkent', country: 'Uzbekistan', iata: 'TAS' },
  { city: 'Baku', country: 'Azerbaijan', iata: 'GYD' },
  { city: 'Tbilisi', country: 'Georgia', iata: 'TBS' },
  { city: 'Yerevan', country: 'Armenia', iata: 'EVN' },
  { city: 'Amman', country: 'Jordan', iata: 'AMM' },
  { city: 'Beirut', country: 'Lebanon', iata: 'BEY' },
  { city: 'Tunis', country: 'Tunisia', iata: 'TUN' },
  { city: 'Paris (Beauvais)', country: 'France', iata: 'BVA' },
  { city: 'Male', country: 'Maldives', iata: 'MLE' },
  { city: 'Jeddah (Hajj Terminal)', country: 'Saudi Arabia', iata: 'JED' },
];

/**
 * Resolves user input (city name or raw IATA code) to an IATA code.
 * Returns null when the input matches nothing — callers show a hint instead
 * of silently building a broken search URL.
 */
export function resolveIata(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  // Raw 3-letter IATA code typed directly.
  if (/^[a-z]{3}$/i.test(value)) return value.toUpperCase();

  const lower = value.toLowerCase();
  const exact = FLIGHT_CITIES.find(
    (c) => c.city.toLowerCase() === lower || `${c.city}, ${c.country}`.toLowerCase() === lower
  );
  if (exact) return exact.iata;

  const startsWith = FLIGHT_CITIES.filter((c) => c.city.toLowerCase().startsWith(lower));
  if (startsWith.length === 1) return startsWith[0].iata;

  // Ambiguous or unmatched — prefer the dictionary's first city match
  // (Dubai before Dubai-adjacent entries), otherwise give up.
  return startsWith[0]?.iata ?? null;
}

/** Case-insensitive prefix search for the autocomplete dropdown. */
export function searchCities(query: string, limit = 6): FlightCity[] {
  const q = query.trim().toLowerCase();
  if (!q) return FLIGHT_CITIES.slice(0, limit);
  return FLIGHT_CITIES.filter(
    (c) => c.city.toLowerCase().includes(q) || c.iata.toLowerCase() === q || c.country.toLowerCase().includes(q)
  ).slice(0, limit);
}

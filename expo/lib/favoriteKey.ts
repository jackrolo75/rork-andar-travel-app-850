/**
 * Stable favorite identity.
 *
 * Offer IDs are regenerated on every search (`${partner}-act-...-${Date.now()}`),
 * so they cannot be used to remember favorites across app restarts. Favorites are
 * therefore keyed on the immutable traits of an offer: title, price, and duration.
 */
export interface FavoriteKeySource {
  title: string;
  price: number;
  duration: string;
}

/** What we persist for each favorite so the Favorites screen can list it. */
export interface FavoriteSnapshot extends FavoriteKeySource {
  currency?: string;
  imageUrl?: string;
  location?: string;
  deepLink?: string;
  destination?: string;
  category?: string;
  partnerId?: string;
  partnerName?: string;
  isExample?: boolean;
  savedAt?: string;
}

export function favoriteKeyFor(offer: FavoriteKeySource): string {
  return `${(offer.title || '').trim().toLowerCase()}|${offer.price}|${offer.duration || ''}`;
}

export function resolveFavoriteKey(input: string | FavoriteKeySource): string {
  return typeof input === 'string' ? input : favoriteKeyFor(input);
}

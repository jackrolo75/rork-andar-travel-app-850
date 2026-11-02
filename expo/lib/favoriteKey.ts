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

export function favoriteKeyFor(offer: FavoriteKeySource): string {
  return `${(offer.title || '').trim().toLowerCase()}|${offer.price}|${offer.duration || ''}`;
}

export function resolveFavoriteKey(input: string | FavoriteKeySource): string {
  return typeof input === 'string' ? input : favoriteKeyFor(input);
}

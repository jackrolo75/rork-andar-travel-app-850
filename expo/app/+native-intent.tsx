// Native Intent Handler — routes deep links to the correct screen
export function redirectSystemPath({
  path,
  initial: _initial,
}: { path: string; initial: boolean }): string {
  // Remove scheme prefix if present (e.g. "andartravel://")
  const normalizedPath = path.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');

  // Strip leading slash for consistent matching
  const cleanPath = normalizedPath.replace(/^\/+/, '');

  // Known route mappings
  if (cleanPath === '' || cleanPath === '/') {
    return '/';
  }
  if (/^(explore|home)/i.test(cleanPath)) {
    return '/';
  }
  if (/^search/i.test(cleanPath)) {
    return '/activities-search';
  }
  if (/^(booking|bookings|my-bookings)/i.test(cleanPath)) {
    return '/(tabs)/bookings';
  }
  if (/^(profile|account)/i.test(cleanPath)) {
    return '/(tabs)/profile';
  }
  if (/^favorites/i.test(cleanPath)) {
    return '/favorites';
  }
  if (/^promotions/i.test(cleanPath)) {
    return '/promotions';
  }
  if (/^contact/i.test(cleanPath)) {
    return '/contact';
  }
  if (/^privacy/i.test(cleanPath)) {
    return '/privacy-policy';
  }
  if (/^terms/i.test(cleanPath)) {
    return '/terms-of-service';
  }
  if (/^activity\//i.test(cleanPath)) {
    // Pass through activity deep links: activity/{id}
    return `/${normalizedPath}`;
  }

  // Fallback: return the path as-is for Expo Router to resolve
  return `/${cleanPath}`;
}

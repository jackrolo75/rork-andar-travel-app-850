interface FeatureFlags {
  activities_enabled: boolean;
  activities_affiliate_redirect_enabled: boolean;
  activities_osm_geocoder_enabled: boolean;
  activities_worker_enabled: boolean;
  partner_selector_enabled: boolean;
  external_partner_flow: boolean;
}

const isProduction = process.env.NODE_ENV === 'production';

const DEFAULT_FLAGS: FeatureFlags = {
  activities_enabled: isProduction ? process.env.FEATURE_ACTIVITIES_ENABLED === 'true' : true,
  activities_affiliate_redirect_enabled: process.env.FEATURE_ACTIVITIES_AFFILIATE_REDIRECT_ENABLED !== 'false',
  activities_osm_geocoder_enabled: isProduction ? process.env.FEATURE_OSM_GEOCODER_ENABLED !== 'false' : true,
  activities_worker_enabled: isProduction ? process.env.FEATURE_WORKER_ENABLED !== 'false' : true,
  partner_selector_enabled: isProduction ? process.env.FEATURE_PARTNER_SELECTOR_ENABLED === 'true' : true,
  external_partner_flow: process.env.FEATURE_EXTERNAL_PARTNER_FLOW !== 'false',
};

let runtimeOverrides: Partial<FeatureFlags> = {};

export function getFeatureFlags(): FeatureFlags {
  return { ...DEFAULT_FLAGS, ...runtimeOverrides };
}

export function getFlag(key: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[key];
}

export function setFlagOverride(key: keyof FeatureFlags, value: boolean): void {
  runtimeOverrides[key] = value;
  console.log(`[FeatureFlags] Override set: ${key} = ${value}`);
}

export function clearFlagOverrides(): void {
  runtimeOverrides = {};
  console.log('[FeatureFlags] All overrides cleared');
}

export function logFlags(): void {
  const flags = getFeatureFlags();
  console.log('[FeatureFlags] Current flags:', JSON.stringify(flags, null, 2));
}

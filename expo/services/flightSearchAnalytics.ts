/**
 * Local flight-search analytics store.
 *
 * Every tap on the flight-search CTA appends a timestamped entry to a
 * persistent on-device store (AsyncStorage), independent of the remote
 * analytics buffer — entries survive app restarts and are readable offline.
 *
 * Entry shape:
 *   { id, timestamp, origin, destination, roundTrip, passengers, iataResolved }
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'andartravel_flight_search_analytics';
/** Keep the store bounded — newest entries win. */
const MAX_ENTRIES = 500;

export interface FlightSearchTapEntry {
  id: string;
  /** ISO-8601 timestamp, e.g. 2026-10-28T14:03:11.482Z */
  timestamp: string;
  origin: string;
  destination: string;
  roundTrip: boolean;
  passengers: number;
  /** True when both cities resolved to IATA codes (search could be built). */
  iataResolved: boolean;
}

function makeId(): string {
  return `flt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function recordFlightSearchTap(params: {
  origin: string;
  destination: string;
  roundTrip: boolean;
  passengers: number;
  iataResolved: boolean;
}): Promise<FlightSearchTapEntry> {
  const entry: FlightSearchTapEntry = {
    id: makeId(),
    timestamp: new Date().toISOString(),
    origin: params.origin.trim(),
    destination: params.destination.trim(),
    roundTrip: params.roundTrip,
    passengers: params.passengers,
    iataResolved: params.iataResolved,
  };

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const existing: FlightSearchTapEntry[] = raw ? JSON.parse(raw) : [];
    const next = [...existing, entry].slice(-MAX_ENTRIES);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    // Analytics must never break the CTA — log and continue.
    console.warn('[FlightAnalytics] Failed to persist tap entry:', error);
  }

  return entry;
}

/** Newest first. Returns an empty list on any read failure. */
export async function getFlightSearchTaps(limit = 100): Promise<FlightSearchTapEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries: FlightSearchTapEntry[] = JSON.parse(raw);
    return entries.slice(-limit).reverse();
  } catch (error) {
    console.warn('[FlightAnalytics] Failed to read tap entries:', error);
    return [];
  }
}

export async function clearFlightSearchTaps(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[FlightAnalytics] Failed to clear tap entries:', error);
  }
}

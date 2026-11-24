import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ActivitiesFeatureFlags,
  DEFAULT_ACTIVITIES_FLAGS,
  ActivityOffer,
  ActivitySearchParams,
  ActivityBooking,
  ActivityClickRecord,
} from '@/types/activities';
import { getApiBaseUrl } from '@/lib/env';
import { FavoriteKeySource, FavoriteSnapshot, resolveFavoriteKey } from '@/lib/favoriteKey';

const ACTIVITIES_FLAGS_KEY = 'andar_activities_flags';
const ACTIVITIES_FAVORITES_KEY = 'andar_activities_favorites';
const ACTIVITIES_FAVORITE_ITEMS_KEY = 'andar_activities_favorite_items';

type FavoriteItems = Record<string, FavoriteSnapshot>;

async function loadFavoriteItems(): Promise<FavoriteItems> {
  try {
    const stored = await AsyncStorage.getItem(ACTIVITIES_FAVORITE_ITEMS_KEY);
    if (stored) return JSON.parse(stored) as FavoriteItems;
  } catch (e) {
    console.error('[ActivitiesContext] Failed to load favorite items:', e);
  }
  return {};
}

async function loadPersistedFlags(): Promise<ActivitiesFeatureFlags> {
  try {
    const stored = await AsyncStorage.getItem(ACTIVITIES_FLAGS_KEY);
    if (stored) {
      return { ...DEFAULT_ACTIVITIES_FLAGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('[ActivitiesContext] Failed to load flags:', e);
  }
  return DEFAULT_ACTIVITIES_FLAGS;
}

async function loadFavorites(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(ACTIVITIES_FAVORITES_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('[ActivitiesContext] Failed to load favorites:', e);
  }
  return [];
}

export const [ActivitiesProvider, useActivities] = createContextHook(() => {
  const queryClient = useQueryClient();

  const [flags, setFlags] = useState<ActivitiesFeatureFlags>(DEFAULT_ACTIVITIES_FLAGS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const favoritesRef = useRef<string[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItems>({});
  const favoriteItemsRef = useRef<FavoriteItems>({});
  const [currentSearchParams, setCurrentSearchParams] = useState<ActivitySearchParams | null>(null);
  const [recentBookings, setRecentBookings] = useState<ActivityBooking[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');


  const flagsQuery = useQuery({
    queryKey: ['activities-flags'],
    queryFn: loadPersistedFlags,
    staleTime: Infinity,
  });

  const favoritesQuery = useQuery({
    queryKey: ['activities-favorites'],
    queryFn: loadFavorites,
    staleTime: 1000 * 60 * 10,
  });

  const favoriteItemsQuery = useQuery({
    queryKey: ['activities-favorite-items'],
    queryFn: loadFavoriteItems,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (favoriteItemsQuery.data) {
      setFavoriteItems(favoriteItemsQuery.data);
      favoriteItemsRef.current = favoriteItemsQuery.data;
    }
  }, [favoriteItemsQuery.data]);

  useEffect(() => {
    if (flagsQuery.data) {
      setFlags(flagsQuery.data);
      console.log('[ActivitiesContext] Feature flags loaded:', flagsQuery.data);
    }
  }, [flagsQuery.data]);

  useEffect(() => {
    if (favoritesQuery.data) {
      setFavorites(favoritesQuery.data);
      favoritesRef.current = favoritesQuery.data;
    }
  }, [favoritesQuery.data]);

  const updateFlagsMutation = useMutation({
    mutationFn: async (newFlags: Partial<ActivitiesFeatureFlags>) => {
      const merged = { ...flags, ...newFlags };
      await AsyncStorage.setItem(ACTIVITIES_FLAGS_KEY, JSON.stringify(merged));
      return merged;
    },
    onSuccess: (merged) => {
      setFlags(merged);
      queryClient.setQueryData(['activities-flags'], merged);
      console.log('[ActivitiesContext] Feature flags updated:', merged);
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (input: string | FavoriteSnapshot) => {
      const key = resolveFavoriteKey(input);
      // Read from refs so rapid consecutive toggles never act on a stale list.
      const current = favoritesRef.current;
      const removing = current.includes(key);
      const updated = removing
        ? current.filter(id => id !== key)
        : [...current, key];
      favoritesRef.current = updated;

      const items = { ...favoriteItemsRef.current };
      if (removing) {
        delete items[key];
      } else if (typeof input !== 'string') {
        items[key] = { ...input, savedAt: new Date().toISOString() };
      }
      favoriteItemsRef.current = items;

      await AsyncStorage.multiSet([
        [ACTIVITIES_FAVORITES_KEY, JSON.stringify(updated)],
        [ACTIVITIES_FAVORITE_ITEMS_KEY, JSON.stringify(items)],
      ]);
      return { updated, items };
    },
    onSuccess: ({ updated, items }) => {
      setFavorites(updated);
      setFavoriteItems(items);
      queryClient.setQueryData(['activities-favorites'], updated);
      queryClient.setQueryData(['activities-favorite-items'], items);
    },
  });

  const redirectBookMutation = useMutation({
    mutationFn: async (params: {
      activityId: string;
      partnerId: string;
      quoteId: string;
      partnerBaseUrl: string;
    }) => {
      const apiBase = getApiBaseUrl();
      console.log('[ActivitiesContext] Creating redirect booking:', params);

      const response = await fetch(`${apiBase}/api/activities/redirect-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Redirect booking failed');
      }

      return {
        clickId: data.clickId as string,
        redirectUrl: data.redirectUrl as string,
        clickRecord: data.clickRecord as ActivityClickRecord,
      };
    },
  });

  const isEnabled = flags.activities_enabled;
  const isRedirectEnabled = flags.activities_affiliate_redirect_enabled;

  const isFavorite = useCallback((input: string | FavoriteKeySource) => {
    return favorites.includes(resolveFavoriteKey(input));
  }, [favorites]);

  /** Saved favorites with enough data to render, newest first. */
  const savedFavorites = useMemo<FavoriteSnapshot[]>(() => {
    return favorites
      .map(key => favoriteItems[key])
      .filter((item): item is FavoriteSnapshot => !!item)
      .sort((a, b) => (b.savedAt ?? '').localeCompare(a.savedAt ?? ''));
  }, [favorites, favoriteItems]);

  const toggleFavorite = useCallback((input: string | FavoriteSnapshot) => {
    toggleFavoriteMutation.mutate(input);
  }, [toggleFavoriteMutation]);

  const updateFlags = useCallback((newFlags: Partial<ActivitiesFeatureFlags>) => {
    updateFlagsMutation.mutate(newFlags);
  }, [updateFlagsMutation]);

  const addRecentBooking = useCallback((booking: ActivityBooking) => {
    setRecentBookings(prev => [booking, ...prev].slice(0, 20));
  }, []);

  return useMemo(() => ({
    flags,
    isEnabled,
    isRedirectEnabled,
    updateFlags,

    favorites,
    savedFavorites,
    isFavorite,
    toggleFavorite,

    currentSearchParams,
    setCurrentSearchParams,

    selectedCity,
    setSelectedCity,

    recentBookings,
    addRecentBooking,

    redirectBook: redirectBookMutation,

    isLoading: flagsQuery.isLoading,
  }), [
    flags, isEnabled, isRedirectEnabled, updateFlags,
    favorites, savedFavorites, isFavorite, toggleFavorite,
    currentSearchParams, setCurrentSearchParams,
    selectedCity, setSelectedCity,
    recentBookings, addRecentBooking,
    redirectBookMutation,
    flagsQuery.isLoading,
  ]);
});

export function useActivitiesSearch(params: ActivitySearchParams | null) {
  const { isEnabled } = useActivities();

  return useQuery({
    queryKey: ['activities-search', params],
    queryFn: async () => {
      if (!params) return [];
      const apiBase = getApiBaseUrl();
      console.log('[useActivitiesSearch] Searching:', params);

      try {
        const response = await fetch(`${apiBase}/api/activities/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[useActivitiesSearch] Backend search initiated:', data.searchId);
        }
      } catch {
        console.log('[useActivitiesSearch] Backend unavailable, using client-side search');
      }

      return [] as ActivityOffer[];
    },
    enabled: isEnabled && !!params,
    staleTime: 1000 * 60 * 2,
  });
}

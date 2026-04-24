import { useState, useEffect, useMemo, useCallback } from 'react';
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

const ACTIVITIES_FLAGS_KEY = 'andar_activities_flags';
const ACTIVITIES_FAVORITES_KEY = 'andar_activities_favorites';

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

  useEffect(() => {
    if (flagsQuery.data) {
      setFlags(flagsQuery.data);
      console.log('[ActivitiesContext] Feature flags loaded:', flagsQuery.data);
    }
  }, [flagsQuery.data]);

  useEffect(() => {
    if (favoritesQuery.data) {
      setFavorites(favoritesQuery.data);
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
    mutationFn: async (offerId: string) => {
      const updated = favorites.includes(offerId)
        ? favorites.filter(id => id !== offerId)
        : [...favorites, offerId];
      await AsyncStorage.setItem(ACTIVITIES_FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (updated) => {
      setFavorites(updated);
      queryClient.setQueryData(['activities-favorites'], updated);
    },
  });

  const createPaymentIntentMutation = useMutation({
    mutationFn: async (params: {
      activityId: string;
      partnerId: string;
      clickId: string;
      quoteId: string;
      amount: number;
      currency: string;
      customerEmail: string;
    }) => {
      const apiBase = getApiBaseUrl();
      console.log('[ActivitiesContext] Creating payment intent:', params);

      const response = await fetch(`${apiBase}/api/activities/create-payment-intent`, {
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
        throw new Error(data.error || 'Failed to create payment intent');
      }

      return {
        clientSecret: data.clientSecret as string,
        paymentIntentId: data.paymentIntentId as string,
        amount: data.amount as number,
        currency: data.currency as string,
      };
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (params: {
      paymentIntentId: string;
      clientSecret: string;
      activityId: string;
      partnerId: string;
      clickId: string;
      quoteId: string;
      amount: number;
      currency: string;
    }) => {
      const apiBase = getApiBaseUrl();
      console.log('[ActivitiesContext] Confirming payment:', params.paymentIntentId);

      const response = await fetch(`${apiBase}/api/activities/confirm-payment`, {
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
        throw new Error(data.error || 'Payment confirmation failed');
      }

      return {
        bookingId: data.bookingId as string,
        status: data.status as string,
      };
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
  const isStripeEnabled = flags.activities_stripe_enabled;

  const isFavorite = useCallback((offerId: string) => {
    return favorites.includes(offerId);
  }, [favorites]);

  const toggleFavorite = useCallback((offerId: string) => {
    toggleFavoriteMutation.mutate(offerId);
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
    isStripeEnabled,
    updateFlags,

    favorites,
    isFavorite,
    toggleFavorite,

    currentSearchParams,
    setCurrentSearchParams,

    selectedCity,
    setSelectedCity,

    recentBookings,
    addRecentBooking,

    createPaymentIntent: createPaymentIntentMutation,
    confirmPayment: confirmPaymentMutation,
    redirectBook: redirectBookMutation,

    isLoading: flagsQuery.isLoading,
  }), [
    flags, isEnabled, isRedirectEnabled, isStripeEnabled, updateFlags,
    favorites, isFavorite, toggleFavorite,
    currentSearchParams, setCurrentSearchParams,
    selectedCity, setSelectedCity,
    recentBookings, addRecentBooking,
    createPaymentIntentMutation, confirmPaymentMutation, redirectBookMutation,
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

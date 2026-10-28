// Activities Results Screen
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  TrendingDown,
  Star,
  Flame,
  Maximize2,
  Navigation,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import ActivityResultCard from '@/components/ActivityResultCard';
import ActivitiesDisclaimer from '@/components/ActivitiesDisclaimer';
import SearchAnimation from '@/components/SearchAnimation';
import { SkeletonBox } from '@/components/SkeletonLoader';
import { ActivityOffer, ActivitySearchParams, ResolvedPlace } from '@/types/activities';
import { searchActivities } from '@/services/ActivitiesSearchService';
import { useActivities } from '@/contexts/ActivitiesContext';
import { getApiBaseUrl } from '@/lib/env';


type SortOption = 'relevance' | 'price_low' | 'price_high' | 'rating' | 'popularity';

const SORT_OPTIONS: { id: SortOption; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'relevance', label: 'Best Match', icon: Flame },
  { id: 'price_low', label: 'Price: Low', icon: TrendingDown },
  { id: 'rating', label: 'Top Rated', icon: Star },
  { id: 'popularity', label: 'Most Popular', icon: Users },
];

const RADIUS_QUICK = [25, 50, 100, 200];

function ActivitySkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <SkeletonBox width="100%" height={180} borderRadius={18} />
      <View style={skeletonStyles.content}>
        <SkeletonBox width={80} height={14} borderRadius={7} />
        <SkeletonBox width="85%" height={18} borderRadius={8} style={{ marginTop: 8 }} />
        <SkeletonBox width="60%" height={14} borderRadius={7} style={{ marginTop: 8 }} />
        <View style={skeletonStyles.footer}>
          <SkeletonBox width={80} height={24} borderRadius={8} />
          <SkeletonBox width={100} height={40} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
  },
  content: {
    padding: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});

export default function ActivitiesResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    destination: string;
    date: string;
    endDate?: string;
    guests: string;
    category?: string;
    strictLocation?: string;
    radiusKm?: string;
    placeId?: string;
    placeName?: string;
    requestId?: string;
  }>();

  const [offers, setOffers] = useState<ActivityOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(true);
  const [searchReady, setSearchReady] = useState(false);
  const [showSearchAnimation, setShowSearchAnimation] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [_completedPartners, setCompletedPartners] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [resolvedPlace, setResolvedPlace] = useState<ResolvedPlace | null>(null);
  const [strictMode, setStrictMode] = useState(params.strictLocation !== 'false');
  const [currentRadius, setCurrentRadius] = useState(parseInt(params.radiusKm || '50', 10));
  const [expandedOnce, setExpandedOnce] = useState(false);
  const { isEnabled, isFavorite, toggleFavorite: ctxToggleFavorite } = useActivities();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const resultsCountAnim = useRef(new Animated.Value(0)).current;

  const pollSearchStatus = useCallback(async (reqId: string) => {
    if (!reqId) return;
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/activities/search/status?request_id=${reqId}`);
      if (res.ok) {
        const data = await res.json();
        console.log('[ActivitiesResults] Backend status poll:', data.status, 'request_id:', reqId);
      }
    } catch (e) {
      console.warn('[ActivitiesResults] Status poll failed:', e);
    }
  }, []);

  const doSearch = useCallback((strict: boolean, radius: number) => {
    if (!isEnabled) return;

    setOffers([]);
    setIsLoading(true);
    setIsSearching(true);
    setShowSearchAnimation(true);
    setSearchReady(false);
    setSearchError(null);
    setCompletedPartners([]);

    const reqId = params.requestId;
    if (reqId) {
      void pollSearchStatus(reqId);
    }

    const searchParams: ActivitySearchParams = {
      destination: params.destination || 'Bangkok',
      date: params.date || new Date().toISOString().split('T')[0],
      endDate: params.endDate || undefined,
      guests: parseInt(params.guests || '2', 10),
      category: params.category as any || undefined,
      sortBy,
      strictLocation: strict,
      radiusKm: radius,
      placeId: params.placeId || undefined,
    };

    console.log('[ActivitiesResults] Starting search:', searchParams);

    void searchActivities(
      searchParams,
      (partnerId, partnerOffers) => {
        console.log(`[ActivitiesResults] Partner ${partnerId} returned ${partnerOffers.length} offers`);
        setCompletedPartners(prev => [...prev, partnerId]);
      },
      (allOffers, place) => {
        console.log(`[ActivitiesResults] Search complete: ${allOffers.length} offers`);
        setOffers(allOffers);
        setResolvedPlace(place);
        setIsLoading(false);
        setSearchReady(true);
      },
      (error) => {
        console.error('[ActivitiesResults] Search error:', error);
        setSearchError(error);
        setIsLoading(false);
        setSearchReady(true);
      },
    );
  }, [isEnabled, params.destination, params.date, params.endDate, params.guests, params.category, params.placeId, params.requestId, sortBy, pollSearchStatus]);

  useEffect(() => {
    doSearch(strictMode, currentRadius);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.destination, params.date, params.endDate, params.guests, params.category]);

  useEffect(() => {
    if (!isLoading && offers.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(resultsCountAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [isLoading, offers.length, fadeAnim, resultsCountAnim]);

  const sortedOffers = useMemo(() => {
    const sorted = [...offers];
    switch (sortBy) {
      case 'price_low': sorted.sort((a, b) => a.price - b.price); break;
      case 'price_high': sorted.sort((a, b) => b.price - a.price); break;
      case 'rating': sorted.sort((a, b) => b.rating - a.rating); break;
      case 'popularity': sorted.sort((a, b) => b.reviewCount - a.reviewCount); break;
      default: break;
    }
    return sorted;
  }, [offers, sortBy]);

  const handleSearchComplete = useCallback(() => {
    setShowSearchAnimation(false);
    setIsSearching(false);
  }, []);

  const handleExpandSearch = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStrictMode(false);
    setExpandedOnce(true);
    fadeAnim.setValue(0);
    resultsCountAnim.setValue(0);
    doSearch(false, currentRadius);
  }, [doSearch, currentRadius, fadeAnim, resultsCountAnim]);

  const handleChangeRadius = useCallback((radius: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentRadius(radius);
    fadeAnim.setValue(0);
    resultsCountAnim.setValue(0);
    doSearch(strictMode, radius);
  }, [doSearch, strictMode, fadeAnim, resultsCountAnim]);

  const handleActivityPress = useCallback((offer: ActivityOffer) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/activity-details' as any,
      params: {
        offerId: offer.id,
        title: offer.title,
        price: offer.price.toString(),
        currency: offer.currency,
        partnerId: offer.partnerId,
        partnerName: offer.partnerName,
        imageUrl: offer.imageUrl,
        duration: offer.duration,
        rating: offer.rating.toString(),
        reviewCount: offer.reviewCount.toString(),
        location: offer.location,
        deepLink: offer.deepLink,
        destination: params.destination || '',
        date: params.date || '',
        guests: params.guests || '2',
        description: offer.description,
        highlights: JSON.stringify(offer.highlights),
        includes: JSON.stringify(offer.includes),
        cancellationPolicy: offer.cancellationPolicy || '',
        originalPrice: offer.originalPrice?.toString() || '',
        discount: offer.discount?.toString() || '',
        timeSlots: JSON.stringify(offer.timeSlots || []),
        languages: JSON.stringify(offer.languages || []),
        maxGroupSize: offer.maxGroupSize?.toString() || '',
        category: offer.category || '',
        distanceKm: offer.geo?.distanceToPlaceKm?.toString() || '',
      },
    });
  }, [router, params]);

  const handleBookPress = useCallback((offer: ActivityOffer) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleActivityPress(offer);
  }, [handleActivityPress]);

  const handleToggleFavorite = useCallback((offerId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    ctxToggleFavorite(offerId);
  }, [ctxToggleFavorite]);

  const lowestPrice = useMemo(() => {
    if (offers.length === 0) return 0;
    return Math.min(...offers.map(o => o.price));
  }, [offers]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Activities in {params.destination}
          </Text>
          <View style={styles.headerMeta}>
            <Calendar size={12} color={Colors.textSecondary} />
            <Text style={styles.headerMetaText}>{params.date}</Text>
            <Users size={12} color={Colors.textSecondary} />
            <Text style={styles.headerMetaText}>{params.guests} guests</Text>
            {strictMode && (
              <>
                <Maximize2 size={11} color={Colors.teal} />
                <Text style={[styles.headerMetaText, { color: Colors.teal }]}>strict</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {resolvedPlace && !isSearching && !isLoading && (
        <View style={styles.geoBar}>
          <View style={styles.geoBarLeft}>
            <Navigation size={13} color={Colors.teal} />
            <Text style={styles.geoBarText} numberOfLines={1}>
              {resolvedPlace.displayName}
            </Text>
            <View style={styles.geoBarRadiusBadge}>
              <Text style={styles.geoBarRadiusText}>
                {strictMode ? `≤${currentRadius} km` : 'expanded'}
              </Text>
            </View>
          </View>
          {strictMode && offers.length < 5 && !expandedOnce && (
            <TouchableOpacity style={styles.expandButton} onPress={handleExpandSearch}>
              <Text style={styles.expandButtonText}>Expand</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!strictMode && !isSearching && !isLoading && (
        <View style={styles.radiusQuickBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusQuickScroll}>
            {RADIUS_QUICK.map((r) => (
              <TouchableOpacity
                key={`rq-${r}`}
                style={[styles.radiusQuickChip, currentRadius === r && styles.radiusQuickChipActive]}
                onPress={() => handleChangeRadius(r)}
              >
                <Text style={[styles.radiusQuickText, currentRadius === r && styles.radiusQuickTextActive]}>
                  {r} km
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {!isSearching && !isLoading && offers.length > 0 && (
        <View style={styles.sortBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>
            {SORT_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = sortBy === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.sortChip, isActive && styles.sortChipActive]}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSortBy(option.id);
                  }}
                >
                  <Icon size={13} color={isActive ? '#FFFFFF' : Colors.textSecondary} />
                  <Text style={[styles.sortChipText, isActive && styles.sortChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={styles.resultsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resultsContent}
      >
        {!isSearching && !isLoading && offers.length > 0 && (
          <Animated.View style={[styles.resultsHeader, { opacity: resultsCountAnim }]}>
            <Text style={styles.resultsCount}>
              {sortedOffers.length} activities found
            </Text>
            {lowestPrice > 0 && (
              <Text style={styles.lowestPrice}>From ${lowestPrice}</Text>
            )}
          </Animated.View>
        )}

        {isSearching || isLoading ? (
          <View style={styles.skeletonContainer}>
            <ActivitySkeleton />
            <ActivitySkeleton />
            <ActivitySkeleton />
          </View>
        ) : searchError ? (
          <View style={styles.emptyState}>
            <MapPin size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Search Error</Text>
            <Text style={styles.emptySubtitle}>{searchError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => doSearch(strictMode, currentRadius)}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : sortedOffers.length > 0 ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            {sortedOffers.map((offer) => (
              <ActivityResultCard
                key={offer.id}
                offer={offer}
                onPress={handleActivityPress}
                onBookPress={handleBookPress}
                isFavorite={isFavorite(offer.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </Animated.View>
        ) : (
          <View style={styles.emptyState}>
            <MapPin size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No activities found</Text>
            <Text style={styles.emptySubtitle}>
              {strictMode
                ? `No activities within ${currentRadius} km of ${resolvedPlace?.name || params.destination}. Try expanding your search.`
                : 'Try adjusting your search or dates'}
            </Text>
            {strictMode && (
              <TouchableOpacity
                style={styles.expandSearchButton}
                onPress={handleExpandSearch}
              >
                <Maximize2 size={16} color="#FFFFFF" />
                <Text style={styles.expandSearchButtonText}>Expand Search Area</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.retryButtonText}>Modify Search</Text>
            </TouchableOpacity>
          </View>
        )}

        <ActivitiesDisclaimer variant="banner" />
      </ScrollView>

      <SearchAnimation
        visible={showSearchAnimation}
        onComplete={handleSearchComplete}
        origin="Your City"
        destination={params.destination || 'Destination'}
        searchReady={searchReady}
        searchType="tours"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.backgroundCard,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  headerMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  geoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.tealMuted,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderAccent,
  },
  geoBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  geoBarText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.tealDark,
    flex: 1,
  },
  geoBarRadiusBadge: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  geoBarRadiusText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  expandButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    marginLeft: 8,
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  radiusQuickBar: {
    backgroundColor: Colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingVertical: 8,
  },
  radiusQuickScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  radiusQuickChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radiusQuickChipActive: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  radiusQuickText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  radiusQuickTextActive: {
    color: '#FFFFFF',
  },
  sortBar: {
    backgroundColor: Colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingVertical: 10,
  },
  sortScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    gap: 5,
  },
  sortChipActive: {
    backgroundColor: Colors.teal,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  lowestPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.teal,
  },
  skeletonContainer: {
    gap: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  expandSearchButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  expandSearchButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: Colors.teal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});

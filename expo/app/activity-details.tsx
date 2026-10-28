// Activity Details Screen
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  CheckCircle,
  Shield,
  Users,
  Globe,
  Heart,
  Tag,
  ExternalLink,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import ActivitiesDisclaimer from '@/components/ActivitiesDisclaimer';
import { SkeletonBox } from '@/components/SkeletonLoader';
import { useActivities } from '@/contexts/ActivitiesContext';
import { openWithClickPersistence, openInExternalBrowser } from '@/services/RedirectService';
import { useTapGuard } from '@/hooks/useTapGuard';
import { getSlideshowImages } from '@/constants/activityImageDatabase';
import { ActivityCategory } from '@/types/activities';

const { width: DETAIL_SCREEN_WIDTH } = Dimensions.get('window');

const MOCK_REVIEWS = [
  { id: '1', name: 'Sarah M.', rating: 5, text: 'Incredible experience! The guide was knowledgeable and friendly. Highly recommend.', date: '2 weeks ago' },
  { id: '2', name: 'James K.', rating: 4, text: 'Great tour overall. Beautiful locations and well-organized. Could have been a bit longer.', date: '1 month ago' },
  { id: '3', name: 'Ana L.', rating: 5, text: 'Best activity we did on our trip! Worth every penny. The views were breathtaking.', date: '3 weeks ago' },
];

function DetailSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      <SkeletonBox width="100%" height={300} borderRadius={0} />
      <View style={skeletonStyles.content}>
        <SkeletonBox width="90%" height={24} borderRadius={8} />
        <SkeletonBox width="60%" height={16} borderRadius={6} style={{ marginTop: 12 }} />
        <SkeletonBox width="40%" height={14} borderRadius={6} style={{ marginTop: 10 }} />
        <SkeletonBox width="100%" height={80} borderRadius={12} style={{ marginTop: 20 }} />
        <SkeletonBox width="100%" height={60} borderRadius={12} style={{ marginTop: 16 }} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
});

export default function ActivityDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    offerId: string;
    title: string;
    price: string;
    currency: string;
    partnerId: string;
    partnerName: string;
    imageUrl: string;
    duration: string;
    rating: string;
    reviewCount: string;
    location: string;
    deepLink: string;
    destination: string;
    date: string;
    guests: string;
    description: string;
    highlights: string;
    includes: string;
    cancellationPolicy: string;
    originalPrice: string;
    discount: string;
    timeSlots: string;
    languages: string;
    maxGroupSize: string;
    category: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [isQuoting, setIsQuoting] = useState(false);
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  const heroImages = getSlideshowImages(
    params.destination || params.location || '',
    (params.category || 'culture') as ActivityCategory,
    3,
    5,
  );

  const handleHeroScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / DETAIL_SCREEN_WIDTH);
    setHeroImageIndex(idx);
  }, []);
  const { isEnabled, isFavorite: ctxIsFavorite, toggleFavorite, addRecentBooking } = useActivities();
  const isFavorite = ctxIsFavorite(params.offerId || '');


  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const price = parseFloat(params.price || '0');
  const originalPrice = params.originalPrice ? parseFloat(params.originalPrice) : undefined;
  const _guests = parseInt(params.guests || '2', 10);
  const isRedirect = true;
  const discount = params.discount ? parseInt(params.discount, 10) : undefined;

  let highlights: string[] = [];
  let includes: string[] = [];
  let timeSlots: string[] = [];
  let languages: string[] = [];
  try {
    highlights = JSON.parse(params.highlights || '[]');
    includes = JSON.parse(params.includes || '[]');
    timeSlots = JSON.parse(params.timeSlots || '[]');
    languages = JSON.parse(params.languages || '[]');
  } catch {
    highlights = [];
    includes = [];
    timeSlots = ['09:00', '10:00', '13:00', '14:00'];
    languages = ['English'];
  }

  if (timeSlots.length === 0) {
    timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '16:00'];
  }

  const maxGroupSize = params.maxGroupSize ? parseInt(params.maxGroupSize, 10) : 15;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 600);
    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (timeSlots.length > 0 && !selectedTimeSlot) {
      setSelectedTimeSlot(timeSlots[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeSlot]);

  const handleScroll = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const opacity = Math.min(y / 200, 1);
    headerOpacity.setValue(opacity);
  }, [headerOpacity]);

  const handleToggleFavorite = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(params.offerId || '');
  }, [toggleFavorite, params.offerId]);

  const handleBookNow = useCallback(async () => {
    if (!isEnabled) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsQuoting(true);

    try {
      // Affiliate-only flow: open the partner (GetYourGuide / Aviasales) deep
      // link in the external browser. No in-app checkout — the booking happens
      // on the partner's site, we track the click for attribution.
      const quoteId = `qt_${Date.now()}`;
      const partnerUrl = params.deepLink || '';

      console.log('[ActivityDetails] Opening partner in external browser, partnerUrl:', partnerUrl ? 'provided' : 'server-select');

      const result = await openWithClickPersistence({
        activityId: params.offerId || '',
        partnerUrl: partnerUrl || undefined,
        partnerId: params.partnerId || undefined,
        quoteId,
        activityTitle: params.title,
        destination: params.destination,
        category: params.category,
      });

      console.log('[ActivityDetails] Redirect result:', {
        clickId: result.clickId,
        opened: result.opened,
        fallback: result.fallback,
        partnerId: result.partnerId,
      });

      const guests = parseInt(params.guests || '2', 10);
      const totalPrice = parseFloat(params.price || '0') * guests;

      // Remember the redirect so the Bookings tab shows click history.
      addRecentBooking({
        bookingId: result.clickId,
        activityId: params.offerId || '',
        partnerId: params.partnerId || 'getyourguide',
        quoteId,
        clickId: result.clickId,
        status: result.opened ? 'confirmed' : 'pending',
        price: totalPrice,
        currency: params.currency || 'USD',
        guests,
        date: params.date || new Date().toISOString(),
        customerName: '',
        customerEmail: '',
        createdAt: new Date().toISOString(),
        confirmedAt: result.opened ? new Date().toISOString() : undefined,
      });

      if (!result.opened) {
        Alert.alert(
          'Could not open link',
          'The partner website could not be opened automatically. Would you like to copy the link instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Try Again',
              onPress: () => { void openInExternalBrowser(result.redirectUrl); },
            },
          ],
        );
      }
    } catch (error) {
      console.error('[ActivityDetails] Redirect error:', error);
      Alert.alert('Error', 'Could not open the partner site. Please try again.');
    } finally {
      setIsQuoting(false);
    }
  }, [params, router, isEnabled, addRecentBooking]);

  const guardedBookNow = useTapGuard(handleBookNow, 800);

  if (!isEnabled) {
    return null;
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <DetailSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <View style={styles.stickyHeaderInner}>
          <Text style={styles.stickyHeaderTitle} numberOfLines={1}>{params.title}</Text>
        </View>
      </Animated.View>

      <View style={styles.floatingActions}>
        <TouchableOpacity
          style={styles.floatingBtn}
          onPress={() => router.back()}
          testID="activity-details-back"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.floatingRight}>
          <TouchableOpacity style={styles.floatingBtn} onPress={handleToggleFavorite}>
            <Heart
              size={20}
              color={isFavorite ? Colors.accent : '#FFFFFF'}
              fill={isFavorite ? Colors.accent : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.heroImage}>
            {heroImages.length > 1 ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleHeroScrollEnd}
                scrollEventThrottle={16}
                style={styles.heroScrollView}
                decelerationRate="fast"
              >
                {heroImages.map((imgUri, idx) => (
                  <Image
                    key={`hero-${idx}`}
                    source={{ uri: imgUri }}
                    style={styles.heroSlideImage}
                    contentFit="cover"
                    transition={300}
                  />
                ))}
              </ScrollView>
            ) : (
              <Image
                source={{ uri: params.imageUrl }}
                style={styles.mainImage}
                contentFit="cover"
                transition={400}
              />
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.6)']}
              style={styles.imageOverlay}
              pointerEvents="none"
            />
            {heroImages.length > 1 && (
              <View style={styles.heroDotsContainer} pointerEvents="none">
                {heroImages.map((_, idx) => (
                  <View
                    key={`hdot-${idx}`}
                    style={[
                      styles.heroDot,
                      idx === heroImageIndex && styles.heroDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
            {!!discount && (
              <View style={styles.discountBadge}>
                <Tag size={12} color="#FFFFFF" />
                <Text style={styles.discountText}>-{discount}%</Text>
              </View>
            )}
          </View>

          <View style={styles.contentSection}>
            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Star size={14} color={Colors.secondary} fill={Colors.secondary} />
                <Text style={styles.ratingValue}>{parseFloat(params.rating || '0').toFixed(1)}</Text>
              </View>
              <Text style={styles.reviewCount}>
                {parseInt(params.reviewCount || '0', 10).toLocaleString()} reviews
              </Text>
              {isRedirect && (
                <View style={styles.partnerBadge}>
                  <ExternalLink size={10} color={Colors.teal} />
                  <Text style={styles.partnerBadgeText}>Partner</Text>
                </View>
              )}
            </View>

            <Text style={styles.title}>{params.title}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <MapPin size={14} color={Colors.teal} />
                <Text style={styles.metaText}>{params.location}</Text>
              </View>
              <View style={styles.metaChip}>
                <Clock size={14} color={Colors.secondary} />
                <Text style={styles.metaText}>{params.duration}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              {languages.length > 0 && (
                <View style={styles.metaChip}>
                  <Globe size={14} color={Colors.olive} />
                  <Text style={styles.metaText}>{languages.join(', ')}</Text>
                </View>
              )}
              <View style={styles.metaChip}>
                <Users size={14} color={Colors.deepBlueLight} />
                <Text style={styles.metaText}>Max {maxGroupSize}</Text>
              </View>
            </View>

            {params.cancellationPolicy ? (
              <View style={styles.cancellationBanner}>
                <Shield size={16} color={Colors.teal} />
                <Text style={styles.cancellationText}>{params.cancellationPolicy}</Text>
              </View>
            ) : null}
          </View>

          {params.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About This Activity</Text>
              <Text style={styles.descriptionText}>{params.description}</Text>
            </View>
          ) : null}

          {highlights.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Highlights</Text>
              <View style={styles.listContainer}>
                {highlights.map((h, idx) => (
                  <View key={`hl-${idx}`} style={styles.listItem}>
                    <View style={styles.listBullet}>
                      <CheckCircle size={16} color={Colors.teal} />
                    </View>
                    <Text style={styles.listItemText}>{h}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {includes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's Included</Text>
              <View style={styles.listContainer}>
                {includes.map((item, idx) => (
                  <View key={`inc-${idx}`} style={styles.listItem}>
                    <View style={[styles.listBullet, { backgroundColor: Colors.oliveMuted }]}>
                      <CheckCircle size={16} color={Colors.olive} />
                    </View>
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timeSlotsScroll}
            >
              {timeSlots.map(slot => (
                <TouchableOpacity
                  key={slot}
                  style={[styles.timeSlot, selectedTimeSlot === slot && styles.timeSlotActive]}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTimeSlot(slot);
                  }}
                >
                  <Clock size={14} color={selectedTimeSlot === slot ? '#FFFFFF' : Colors.textSecondary} />
                  <Text style={[styles.timeSlotText, selectedTimeSlot === slot && styles.timeSlotTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {MOCK_REVIEWS.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>
                      {review.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewName}>{review.name}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                  <View style={styles.reviewRating}>
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={`star-${i}`} size={12} color={Colors.secondary} fill={Colors.secondary} />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))}
          </View>

          <ActivitiesDisclaimer variant="banner" />
        </Animated.View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
          {originalPrice !== undefined && (
            <Text style={styles.originalPriceText}>${originalPrice}</Text>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.priceFrom}>From</Text>
            <Text style={styles.priceValue}>${price}</Text>
          </View>
          <Text style={styles.perPerson}>per person</Text>
        </View>

        <TouchableOpacity
          style={[styles.bookButton, isQuoting && styles.bookButtonDisabled]}
          onPress={guardedBookNow}
          disabled={isQuoting}
          activeOpacity={0.8}
          testID="activity-details-book-btn"
        >
          {isQuoting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <ExternalLink size={18} color="#FFFFFF" />
              <Text style={styles.bookButtonText}>View Deal</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: Colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 60,
  },
  stickyHeaderInner: {
    alignItems: 'center',
  },
  stickyHeaderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  floatingActions: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  floatingRight: {
    flexDirection: 'row',
    gap: 10,
  },
  floatingBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroImage: {
    height: 340,
    position: 'relative',
  },
  heroScrollView: {
    width: '100%',
    height: 340,
  },
  heroSlideImage: {
    width: DETAIL_SCREEN_WIDTH,
    height: 340,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroDotsContainer: {
    position: 'absolute' as const,
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  heroDotActive: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FFFFFF',
  },
  discountBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  discountText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  contentSection: {
    padding: 20,
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.tealMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 'auto' as const,
  },
  partnerBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.teal,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    lineHeight: 30,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  cancellationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.tealMuted,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  cancellationText: {
    fontSize: 14,
    color: Colors.teal,
    fontWeight: '600' as const,
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  descriptionText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 23,
  },
  listContainer: {
    gap: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  listBullet: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.tealMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    paddingTop: 5,
  },
  timeSlotsScroll: {
    gap: 10,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  timeSlotActive: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  timeSlotText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  timeSlotTextActive: {
    color: '#FFFFFF',
  },
  reviewCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.tealMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  reviewAvatarText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.teal,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  bottomPrice: {},
  originalPriceText: {
    fontSize: 13,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceFrom: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.teal,
  },
  perPerson: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.teal,
    paddingHorizontal: 26,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});

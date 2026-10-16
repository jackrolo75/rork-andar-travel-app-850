import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import {
  MapPin,
  ArrowRight,
  Compass,
  TrendingUp,
  Flame,
  Zap,
  Star,
  Clock,
  ChevronRight,
  Globe,
  ExternalLink,
  Plane,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useLocale } from '@/contexts/LocaleContext';
import ActivitiesDisclaimer from '@/components/ActivitiesDisclaimer';
import AppHeader from '@/components/AppHeader';
import OfflineBanner from '@/components/OfflineBanner';
import CategoryStrip from '@/components/CategoryStrip';
import HeroSlideshow from '@/components/HeroSlideshow';
import RotatingPlaceholder from '@/components/RotatingPlaceholder';
import PressableScale from '@/components/PressableScale';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

import { AFFILIATE_DISCLOSURE, buildDestinationAffiliateUrl } from '@/constants/affiliateLinks';
import {
  ExperienceCategoryId,
  EXPERIENCE_CATEGORIES,
  getCityPriority,
} from '@/constants/experienceProviders';
import {
  normalizeSearchInput,
  aggregateAndRank,
  RankedExperience,
  getTopForCategory,
} from '@/services/ExperienceAggregator';
import { searchActivities } from '@/services/ActivitiesSearchService';
import { openWithClickPersistence, openInExternalBrowser } from '@/services/RedirectService';
import { useTapGuard } from '@/hooks/useTapGuard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const FEATURED_DESTINATIONS = [
  { name: 'Tokyo', country: 'Japan', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400', emoji: '🇯🇵' },
  { name: 'Bali', country: 'Indonesia', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400', emoji: '🇮🇩' },
  { name: 'Paris', country: 'France', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400', emoji: '🇫🇷' },
  { name: 'Dubai', country: 'UAE', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400', emoji: '🇦🇪' },
  { name: 'Barcelona', country: 'Spain', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400', emoji: '🇪🇸' },
  { name: 'Rome', country: 'Italy', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400', emoji: '🇮🇹' },
  { name: 'Bangkok', country: 'Thailand', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400', emoji: '🇹🇭' },
  { name: 'Lisbon', country: 'Portugal', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400', emoji: '🇵🇹' },
  { name: 'London', country: 'UK', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400', emoji: '🇬🇧' },
  { name: 'Madrid', country: 'Spain', image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400', emoji: '🇪🇸' },
  { name: 'Amsterdam', country: 'Netherlands', image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5571?w=400', emoji: '🇳🇱' },
  { name: 'New York', country: 'USA', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400', emoji: '🇺🇸' },
  { name: 'Los Angeles', country: 'USA', image: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=400', emoji: '🇺🇸' },
  { name: 'San Francisco', country: 'USA', image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400', emoji: '🇺🇸' },
  { name: 'Las Vegas', country: 'USA', image: 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=400', emoji: '🇺🇸' },
  { name: 'Orlando', country: 'USA', image: 'https://images.unsplash.com/photo-1575089776834-8be34f8e44ba?w=400', emoji: '🇺🇸' },
  { name: 'Miami', country: 'USA', image: 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=400', emoji: '🇺🇸' },
  { name: 'Milan', country: 'Italy', image: 'https://images.unsplash.com/photo-1520440229-6469a149ac59?w=400', emoji: '🇮🇹' },
  { name: 'Florence', country: 'Italy', image: 'https://images.unsplash.com/photo-1543429258-49e71e6e4585?w=400', emoji: '🇮🇹' },
  { name: 'Venice', country: 'Italy', image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400', emoji: '🇮🇹' },
  { name: 'Palma de Mallorca', country: 'Spain', image: 'https://images.unsplash.com/photo-1591970446609-561cd6e65fb5?w=400', emoji: '🇪🇸' },
  { name: 'Malaga', country: 'Spain', image: 'https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?w=400', emoji: '🇪🇸' },
  { name: 'Seville', country: 'Spain', image: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=400', emoji: '🇪🇸' },
  { name: 'Istanbul', country: 'Turkey', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400', emoji: '🇹🇷' },
  { name: 'Rio de Janeiro', country: 'Brazil', image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400', emoji: '🇧🇷' },
  { name: 'Berlin', country: 'Germany', image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400', emoji: '🇩🇪' },
  { name: 'Athens', country: 'Greece', image: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=400', emoji: '🇬🇷' },
];

export default function ExploreScreen() {
  const _router = useRouter();
  const { isEnabled, setSelectedCity } = useActivities();
  const { t, currentLanguage, currentCurrency } = useLocale();
  const { isConnected, isChecking, checkConnection } = useNetworkStatus();

  const [activeCategory, setActiveCategory] = useState<ExperienceCategoryId | null>(null);
  const [topExperiences, setTopExperiences] = useState<RankedExperience[]>([]);
  const [cityResults, setCityResults] = useState<RankedExperience[]>([]);
  const [allRankedResults, setAllRankedResults] = useState<RankedExperience[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [activeCityName, setActiveCityName] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const resultsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const loadCityExperiences = useCallback((cityName: string) => {
    console.log('[Explore] Loading experiences for:', cityName);
    setIsLoadingResults(true);
    setActiveCityName(cityName);
    resultsOpacity.setValue(0);

    const searchInput = normalizeSearchInput(cityName);

    void searchActivities(
      {
        destination: cityName,
        date: new Date().toISOString().split('T')[0],
        guests: 2,
        sortBy: 'relevance',
      },
      (partnerId, offers) => {
        console.log(`[Explore] Partner ${partnerId}: ${offers.length} offers`);
      },
      (allOffers) => {
        const aggregated = aggregateAndRank(allOffers, searchInput, cityName);
        setTopExperiences(aggregated.topExperiences);
        setCityResults(aggregated.categoryResults);
        setAllRankedResults(aggregated.allResults);
        setIsLoadingResults(false);

        Animated.timing(resultsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();

        console.log('[Explore] Aggregated results:', {
          top: aggregated.topExperiences.length,
          city: aggregated.categoryResults.length,
          total: aggregated.allResults.length,
        });
      },
      (error) => {
        console.error('[Explore] Search error:', error);
        setIsLoadingResults(false);
      },
    );
  }, [resultsOpacity]);

  const handleDestinationPress = useCallback((name: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCity(name);
    setActiveCategory(null);
    loadCityExperiences(name);
  }, [setSelectedCity, loadCityExperiences]);

  const handleExperiencePress = useTapGuard(useCallback(async (experience: RankedExperience) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await openWithClickPersistence({
        activityId: experience.id,
        partnerUrl: experience.affiliateUrl,
        partnerId: experience.partnerId ?? undefined,
        activityTitle: experience.title,
        destination: experience.city || experience.location,
        category: experience.category,
      });
    } catch (err) {
      console.error('[Explore] Redirect failed:', err);
      Alert.alert('Error', 'Could not open the link. Please try again.');
    }
  }, []), 500);

  const handleViewAllPress = useTapGuard(useCallback(async () => {
    if (!activeCityName) {
      Alert.alert('Select a Destination', 'Please pick a destination above to see all experiences.');
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const affiliateUrl = buildDestinationAffiliateUrl(activeCityName);
    try {
      await openWithClickPersistence({
        activityId: `city_${activeCityName.toLowerCase()}`,
        partnerUrl: affiliateUrl,
        partnerId: 'getyourguide',
      });
    } catch (err) {
      console.error('[Explore] City affiliate redirect failed, opening directly:', err);
      void openInExternalBrowser(affiliateUrl);
    }
  }, [activeCityName]), 500);

  const handleFlightsPress = useTapGuard(useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    _router.push('/flights-search');
  }, [_router]), 500);

  const handleCategorySelect = useCallback((category: ExperienceCategoryId | null) => {
    setActiveCategory(category);
  }, []);

  const filteredResults = useMemo(() => {
    if (!activeCategory) return cityResults;
    return getTopForCategory(allRankedResults, activeCategory, 8);
  }, [activeCategory, cityResults, allRankedResults]);

  const cityPriority = useMemo(() => {
    if (!activeCityName) return null;
    return getCityPriority(activeCityName);
  }, [activeCityName]);

  if (!isEnabled) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.disabledState}>
          <Compass size={48} color={Colors.textTertiary} />
          <Text style={styles.disabledTitle}>{t('coming_soon')}</Text>
          <Text style={styles.disabledSubtitle}>{t('feature_preparing')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces
      >
        <View style={styles.headerOverlay}>
          <SafeAreaView edges={['top']} style={styles.safeHeader}>
            <AppHeader
              rightContent={
                <View style={styles.localeBarInner}>
                  <Text style={styles.localeBadgeText}>
                    {currentLanguage.flag} {currentLanguage.nativeLabel}
                  </Text>
                  <View style={styles.localeDot} />
                  <Text style={styles.localeBadgeText}>
                    {currentCurrency.symbol} {currentCurrency.code}
                  </Text>
                </View>
              }
            />
          </SafeAreaView>
        </View>

        <OfflineBanner visible={!isConnected} onRetry={checkConnection} isRetrying={isChecking} />

        <HeroSlideshow
          title={t('discover_experiences')}
          subtitle={t('tours_activities')}
          onDestinationPress={handleDestinationPress}
        />

        {/* Flight deals — Aviasales via Travelpayouts (marker 698160) */}
        <PressableScale
          onPress={handleFlightsPress}
          testID="home-flights-banner"
        >
          <LinearGradient
            colors={[Colors.primaryDeep, Colors.teal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.flightsBanner}
          >
            <View style={styles.flightsBannerIcon}>
              <Plane size={22} color="#FFFFFF" />
            </View>
            <View style={styles.flightsBannerText}>
              <Text style={styles.flightsBannerTitle}>Flight Deals</Text>
              <Text style={styles.flightsBannerSubtitle}>Compare 700+ airlines & agencies</Text>
            </View>
            <ArrowRight size={18} color="#FFFFFF" />
          </LinearGradient>
        </PressableScale>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.quickPickSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Globe size={17} color={Colors.teal} />
                <Text style={styles.sectionTitle}>Pick a Destination</Text>
              </View>
              <View style={styles.rotatingHint}>
                <RotatingPlaceholder prefix="Try" />
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickPickScroll}
              decelerationRate="fast"
            >
              {FEATURED_DESTINATIONS.map((dest) => {
                const isActive = activeCityName === dest.name;
                return (
                  <TouchableOpacity
                    key={dest.name}
                    style={[styles.quickPickChip, isActive && styles.quickPickChipActive]}
                    onPress={() => handleDestinationPress(dest.name)}
                    activeOpacity={0.8}
                    testID={`dest-chip-${dest.name}`}
                  >
                    <Image
                      source={{ uri: dest.image }}
                      style={styles.quickPickImage}
                      contentFit="cover"
                      transition={200}
                    />
                    <View style={styles.quickPickInfo}>
                      <Text style={[styles.quickPickName, isActive && styles.quickPickNameActive]}>
                        {dest.emoji} {dest.name}
                      </Text>
                    </View>
                    {isActive && <View style={styles.quickPickActiveDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {activeCityName && !isLoadingResults && topExperiences.length > 0 && (
            <Animated.View style={[styles.topSection, { opacity: resultsOpacity }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <Flame size={18} color="#E25822" />
                  <Text style={styles.sectionTitle}>{"Top Picks in " + activeCityName}</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>
                {"Curated for you \u2014 highest rated, best value"}
              </Text>

              {topExperiences.slice(0, 3).map((exp, idx) => (
                <TopCard key={exp.id} experience={exp} index={idx} onPress={handleExperiencePress} />
              ))}
            </Animated.View>
          )}

          {activeCityName && !isLoadingResults && allRankedResults.length > 0 && (
            <Animated.View style={{ opacity: resultsOpacity }}>
              <CategoryStrip
                selectedCategory={activeCategory}
                onSelectCategory={handleCategorySelect}
                activeCity={activeCityName}
              />
            </Animated.View>
          )}

          {activeCityName && !isLoadingResults && cityPriority && filteredResults.length > 0 && (
            <Animated.View style={[styles.cityBestSection, { opacity: resultsOpacity }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <Zap size={16} color={Colors.teal} />
                  <Text style={styles.sectionTitle}>
                    {activeCategory
                      ? EXPERIENCE_CATEGORIES.find(c => c.id === activeCategory)?.label ?? 'Results'
                      : "\uD83D\uDD25 Best in " + activeCityName + " right now"
                    }
                  </Text>
                </View>
              </View>

              <View style={styles.gridContainer}>
                {filteredResults.map((exp) => (
                  <GridCard key={exp.id} experience={exp} onPress={handleExperiencePress} />
                ))}
              </View>

              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={handleViewAllPress}
                activeOpacity={0.8}
                testID="view-all-experiences"
              >
                <LinearGradient
                  colors={[Colors.teal, Colors.tealDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.viewAllGradient}
                >
                  <ExternalLink size={17} color="#FFFFFF" />
                  <Text style={styles.viewAllText}>{"Show All Experiences in " + activeCityName}</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {isLoadingResults && (
            <View style={styles.loadingSection}>
              <View style={styles.loadingPulse}>
                <Text style={styles.loadingEmoji}>{"\u2708\uFE0F"}</Text>
              </View>
              <Text style={styles.loadingText}>Finding the best experiences...</Text>
              <Text style={styles.loadingSubtext}>Comparing across providers</Text>
            </View>
          )}

          {!activeCityName && (
            <View style={styles.promptSection}>
              <LinearGradient
                colors={['rgba(8,145,178,0.06)', 'rgba(8,145,178,0.02)']}
                style={styles.promptCard}
              >
                <View style={styles.promptIconWrap}>
                  <Compass size={28} color={Colors.teal} />
                </View>
                <Text style={styles.promptTitle}>Select a destination above</Text>
                <Text style={styles.promptSubtitle}>
                  {"We\u2019ll find the top 3 things to do \u2014 curated for you"}
                </Text>
              </LinearGradient>
            </View>
          )}

          {!activeCityName && (
            <View style={styles.trendingSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <TrendingUp size={18} color={Colors.teal} />
                  <Text style={styles.sectionTitle}>{t('trending_now')}</Text>
                </View>
              </View>
              <TrendingList onDestinationPress={handleDestinationPress} />
            </View>
          )}

          <ActivitiesDisclaimer variant="inline" />
          <View style={styles.affiliateDisclosureContainer}>
            <Text style={styles.affiliateDisclosureText}>{AFFILIATE_DISCLOSURE}</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function TopCard({ experience, index, onPress }: { experience: RankedExperience; index: number; onPress: (e: RankedExperience) => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isTopPick = index === 0;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(experience);
  }, [experience, onPress]);

  return (
    <Animated.View style={[topStyles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`top-exp-${index}`}
      >
        <View style={topStyles.imageWrap}>
          <Image source={{ uri: experience.imageUrl }} style={topStyles.image} contentFit="cover" transition={300} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.82)']}
            locations={[0, 0.3, 1]}
            style={topStyles.gradient}
          />

          {isTopPick && (
            <View style={topStyles.topBadge}>
              <Flame size={11} color="#FFF" />
              <Text style={topStyles.topBadgeText}>Top Pick</Text>
            </View>
          )}

          {!!experience.scarcityLabel && (
            <View style={topStyles.scarcityBadge}>
              <Zap size={9} color="#F5C842" />
              <Text style={topStyles.scarcityText}>{experience.scarcityLabel}</Text>
            </View>
          )}

          <View style={topStyles.providerBadge}>
            <Text style={topStyles.providerText}>{experience.providerDisplayName}</Text>
          </View>

          <View style={topStyles.overlay}>
            <Text style={topStyles.title} numberOfLines={2}>{experience.title}</Text>
            <View style={topStyles.metaRow}>
              <View style={topStyles.ratingWrap}>
                <Star size={12} color="#F5C842" fill="#F5C842" />
                <Text style={topStyles.ratingText}>{experience.rating.toFixed(1)}</Text>
                <Text style={topStyles.reviewText}>{"(" + experience.reviewCount.toLocaleString() + ")"}</Text>
              </View>
              <View style={topStyles.durationWrap}>
                <Clock size={11} color="rgba(255,255,255,0.7)" />
                <Text style={topStyles.durationText}>{experience.duration}</Text>
              </View>
            </View>
            <View style={topStyles.bottomRow}>
              <View>
                {!!experience.originalPrice && <Text style={topStyles.origPrice}>{"$" + experience.originalPrice}</Text>}
                <Text style={topStyles.price}>
                  <Text style={topStyles.priceLabel}>{"From "}</Text>{"$" + experience.price}
                </Text>
              </View>
              <View style={topStyles.cta}>
                <Text style={topStyles.ctaText}>View Deal</Text>
                <ArrowRight size={14} color="#FFF" />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function GridCard({ experience, onPress }: { experience: RankedExperience; onPress: (e: RankedExperience) => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(experience);
  }, [experience, onPress]);

  const catTag = CATEGORY_TAGS[experience.category] || { label: experience.category, color: Colors.teal };

  return (
    <Animated.View style={[gridStyles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity activeOpacity={1} onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={gridStyles.imageWrap}>
          <Image source={{ uri: experience.imageUrl }} style={gridStyles.image} contentFit="cover" transition={200} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} locations={[0.45, 1]} style={gridStyles.gradient} />
          <View style={[gridStyles.catTag, { backgroundColor: catTag.color }]}>
            <Text style={gridStyles.catTagText}>{catTag.label}</Text>
          </View>
          {!!experience.scarcityLabel && (
            <View style={gridStyles.scarcityWrap}>
              <Text style={gridStyles.scarcityText}>{"\uD83D\uDD25"}</Text>
            </View>
          )}
        </View>
        <View style={gridStyles.content}>
          <Text style={gridStyles.title} numberOfLines={2}>{experience.title}</Text>
          <View style={gridStyles.ratingRow}>
            <Star size={10} color="#F5C842" fill="#F5C842" />
            <Text style={gridStyles.ratingText}>{experience.rating.toFixed(1)}</Text>
            <Text style={gridStyles.reviewText}>
              {"(" + (experience.reviewCount >= 1000 ? (experience.reviewCount / 1000).toFixed(1) + "k" : String(experience.reviewCount)) + ")"}
            </Text>
          </View>
          <View style={gridStyles.priceRow}>
            {!!experience.originalPrice && <Text style={gridStyles.origPrice}>{"$" + experience.originalPrice}</Text>}
            <Text style={gridStyles.price}>{"$" + experience.price}</Text>
          </View>
          <View style={gridStyles.providerRow}>
            <View style={gridStyles.providerDot} />
            <Text style={gridStyles.providerText}>{experience.providerDisplayName}</Text>
          </View>
          <TouchableOpacity style={gridStyles.cta} onPress={handlePress} activeOpacity={0.8}>
            <Text style={gridStyles.ctaText}>Check Availability</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const TRENDING_DATA = [
  { title: 'Skip-the-Line Colosseum', location: 'Rome', price: 45, rating: 4.8, reviews: 12400, image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=300', scarcity: 'Likely to sell out' },
  { title: 'Mount Fuji Day Trip', location: 'Tokyo', price: 89, rating: 4.9, reviews: 8200, image: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=300', scarcity: 'Booked 47 times today' },
  { title: 'Ubud Rice Terrace Tour', location: 'Bali', price: 35, rating: 4.7, reviews: 6100, image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=300', scarcity: undefined },
];

function TrendingList({ onDestinationPress }: { onDestinationPress: (name: string) => void }) {
  return (
    <View>
      {TRENDING_DATA.map((item, idx) => (
        <TouchableOpacity
          key={`trend-${idx}`}
          style={trendStyles.card}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDestinationPress(item.location);
          }}
          activeOpacity={0.85}
        >
          <Image source={{ uri: item.image }} style={trendStyles.image} contentFit="cover" transition={200} />
          <View style={trendStyles.content}>
            <Text style={trendStyles.title} numberOfLines={2}>{item.title}</Text>
            <View style={trendStyles.metaRow}>
              <MapPin size={11} color={Colors.textSecondary} />
              <Text style={trendStyles.location}>{item.location}</Text>
              {!!item.scarcity && (
                <View style={trendStyles.scarcityTag}>
                  <Text style={trendStyles.scarcityText}>{item.scarcity}</Text>
                </View>
              )}
            </View>
            <View style={trendStyles.footer}>
              <Text style={trendStyles.price}>{"From $" + item.price}</Text>
              <View style={trendStyles.ratingBadge}>
                <Star size={10} color={Colors.teal} fill={Colors.teal} />
                <Text style={trendStyles.ratingText}>{String(item.rating)}</Text>
              </View>
            </View>
          </View>
          <View style={trendStyles.arrowWrap}>
            <ChevronRight size={16} color={Colors.textTertiary} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const CATEGORY_TAGS: Record<string, { label: string; color: string }> = {
  adventure: { label: 'Adventure', color: '#E27D60' },
  culture: { label: 'Culture', color: '#1A3A5C' },
  food: { label: 'Food', color: '#C77B4F' },
  nature: { label: 'Nature', color: '#3D7A5F' },
  wellness: { label: 'Wellness', color: '#8B5E83' },
  water: { label: 'Water', color: '#0D7377' },
  nightlife: { label: 'Nightlife', color: '#5B21B6' },
  tickets: { label: 'Tickets', color: '#2A5A8C' },
};

const topStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
    backgroundColor: Colors.backgroundCard,
  },
  imageWrap: {
    width: SCREEN_WIDTH - 32,
    height: 240,
    position: 'relative' as const,
  },
  image: { width: '100%', height: '100%' },
  gradient: {
    position: 'absolute' as const, left: 0, right: 0, bottom: 0, height: '100%',
  },
  topBadge: {
    position: 'absolute' as const, top: 14, left: 14,
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4,
    backgroundColor: '#E25822', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  topBadgeText: { fontSize: 11, fontWeight: '800' as const, color: '#FFF', letterSpacing: 0.3 },
  scarcityBadge: {
    position: 'absolute' as const, top: 14, right: 14,
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)',
  },
  scarcityText: { fontSize: 10, fontWeight: '700' as const, color: '#F5C842' },
  providerBadge: {
    position: 'absolute' as const, bottom: 86, right: 14,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  providerText: { fontSize: 9, fontWeight: '600' as const, color: 'rgba(255,255,255,0.7)' },
  overlay: {
    position: 'absolute' as const, bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '800' as const, color: '#FFF', lineHeight: 23, marginBottom: 8 },
  metaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: 10 },
  ratingWrap: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  ratingText: { fontSize: 13, fontWeight: '700' as const, color: '#FFF' },
  reviewText: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  durationWrap: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  durationText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  bottomRow: { flexDirection: 'row' as const, alignItems: 'flex-end' as const, justifyContent: 'space-between' as const },
  origPrice: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecorationLine: 'line-through' as const },
  priceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  price: { fontSize: 24, fontWeight: '800' as const, color: '#FFF' },
  cta: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    backgroundColor: Colors.teal, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14,
    shadowColor: Colors.tealDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  ctaText: { fontSize: 14, fontWeight: '800' as const, color: '#FFF', letterSpacing: 0.2 },
});

const gridStyles = StyleSheet.create({
  container: {
    width: GRID_CARD_WIDTH,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  imageWrap: { width: GRID_CARD_WIDTH, height: GRID_CARD_WIDTH * 0.72, position: 'relative' as const },
  image: { width: '100%', height: '100%' },
  gradient: { position: 'absolute' as const, left: 0, right: 0, bottom: 0, height: '60%' },
  catTag: { position: 'absolute' as const, top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  catTagText: { fontSize: 9, fontWeight: '700' as const, color: '#FFF', letterSpacing: 0.2 },
  scarcityWrap: { position: 'absolute' as const, bottom: 6, left: 6 },
  scarcityText: { fontSize: 12 },
  content: { padding: 10 },
  title: { fontSize: 13, fontWeight: '700' as const, color: Colors.text, lineHeight: 17, marginBottom: 5 },
  ratingRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 3, marginBottom: 5 },
  ratingText: { fontSize: 11, fontWeight: '700' as const, color: Colors.text },
  reviewText: { fontSize: 10, color: Colors.textTertiary },
  priceRow: { flexDirection: 'row' as const, alignItems: 'baseline' as const, gap: 4, marginBottom: 5 },
  origPrice: { fontSize: 10, color: Colors.textTertiary, textDecorationLine: 'line-through' as const },
  price: { fontSize: 17, fontWeight: '800' as const, color: Colors.teal },
  providerRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, marginBottom: 8 },
  providerDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.teal },
  providerText: { fontSize: 9, fontWeight: '600' as const, color: Colors.textTertiary },
  cta: { backgroundColor: Colors.teal, paddingVertical: 10, borderRadius: 12, alignItems: 'center' as const },
  ctaText: { fontSize: 12, fontWeight: '700' as const, color: '#FFF' },
});

const trendStyles = StyleSheet.create({
  card: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 10,
    marginHorizontal: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center' as const,
  },
  image: { width: 100, height: 100, borderRadius: 0 },
  content: { flex: 1, padding: 12, justifyContent: 'space-between' as const },
  title: { fontSize: 14, fontWeight: '700' as const, color: Colors.text, lineHeight: 19 },
  metaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, flexWrap: 'wrap' as const, marginTop: 4 },
  location: { fontSize: 12, color: Colors.textSecondary },
  scarcityTag: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  scarcityText: { fontSize: 9, fontWeight: '600' as const, color: '#D97706' },
  footer: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginTop: 6 },
  price: { fontSize: 14, fontWeight: '800' as const, color: Colors.teal },
  ratingBadge: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 3,
    backgroundColor: Colors.tealMuted, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  ratingText: { fontSize: 11, fontWeight: '700' as const, color: Colors.teal },
  arrowWrap: {
    paddingRight: 12,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 30 },
  headerOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(245,247,250,0.92)',
  },
  safeHeader: {},
  disabledState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  disabledTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  disabledSubtitle: { fontSize: 14, color: Colors.textSecondary },
  localeBarInner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundCard,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  localeBadgeText: { fontSize: 11, fontWeight: '600' as const, color: Colors.textSecondary },
  localeDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textTertiary, marginHorizontal: 6 },
  quickPickSection: { marginTop: 20, paddingBottom: 4 },
  quickPickScroll: { gap: 10, paddingRight: 16, paddingLeft: 16, paddingTop: 12 },
  quickPickChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundCard,
    borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  quickPickChipActive: { borderColor: Colors.teal, backgroundColor: Colors.tealMuted },
  quickPickImage: { width: 44, height: 44 },
  quickPickInfo: { paddingHorizontal: 12, paddingVertical: 10 },
  quickPickName: { fontSize: 13, fontWeight: '700' as const, color: Colors.text },
  quickPickNameActive: { color: Colors.teal },
  quickPickActiveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.teal,
    position: 'absolute', top: 4, right: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  sectionHeaderRow: { paddingHorizontal: 16, marginBottom: 4 },
  flightsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
  },
  flightsBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flightsBannerText: {
    flex: 1,
  },
  flightsBannerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  flightsBannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  rotatingHint: { marginTop: 4 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionSubtitle: { fontSize: 13, color: Colors.textSecondary, paddingHorizontal: 16, marginBottom: 14 },
  topSection: { marginTop: 28 },
  cityBestSection: { marginTop: 20, paddingBottom: 8 },
  gridContainer: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 14, marginTop: 12,
  },
  viewAllButton: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.tealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  viewAllGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16,
  },
  viewAllText: { fontSize: 15, fontWeight: '700' as const, color: '#FFF' },
  loadingSection: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingPulse: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.tealMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingEmoji: { fontSize: 28 },
  loadingText: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  loadingSubtext: { fontSize: 13, color: Colors.textSecondary },
  promptSection: { paddingHorizontal: 16, marginTop: 28 },
  promptCard: {
    borderRadius: 22, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderAccent,
  },
  promptIconWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.tealMuted,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  promptTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text, marginBottom: 6 },
  promptSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  trendingSection: { marginTop: 28 },
  affiliateDisclosureContainer: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 8 },
  affiliateDisclosureText: { fontSize: 10, color: Colors.textTertiary, textAlign: 'center', lineHeight: 14, fontStyle: 'italic' as const },
});

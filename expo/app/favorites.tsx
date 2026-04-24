import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Heart,
  MapPin,
  ExternalLink,
  TrendingUp,
  Sparkles,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useActivities } from '@/contexts/ActivitiesContext';
import { buildDestinationAffiliateUrl, AFFILIATE_DISCLOSURE } from '@/constants/affiliateLinks';
import { openInExternalBrowser } from '@/services/RedirectService';

const POPULAR_CITIES = [
  { name: 'Tokyo', country: 'Japan', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400', emoji: '🇯🇵', searches: 284 },
  { name: 'Paris', country: 'France', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400', emoji: '🇫🇷', searches: 312 },
  { name: 'Dubai', country: 'UAE', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400', emoji: '🇦🇪', searches: 198 },
  { name: 'Barcelona', country: 'Spain', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400', emoji: '🇪🇸', searches: 176 },
  { name: 'Rome', country: 'Italy', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400', emoji: '🇮🇹', searches: 245 },
  { name: 'London', country: 'UK', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400', emoji: '🇬🇧', searches: 267 },
  { name: 'New York', country: 'USA', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400', emoji: '🇺🇸', searches: 301 },
  { name: 'Bangkok', country: 'Thailand', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400', emoji: '🇹🇭', searches: 153 },
  { name: 'Bali', country: 'Indonesia', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400', emoji: '🇮🇩', searches: 189 },
  { name: 'Amsterdam', country: 'Netherlands', image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5571?w=400', emoji: '🇳🇱', searches: 134 },
  { name: 'Lisbon', country: 'Portugal', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400', emoji: '🇵🇹', searches: 121 },
  { name: 'Istanbul', country: 'Turkey', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400', emoji: '🇹🇷', searches: 98 },
  { name: 'Miami', country: 'USA', image: 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=400', emoji: '🇺🇸', searches: 142 },
  { name: 'Florence', country: 'Italy', image: 'https://images.unsplash.com/photo-1543429258-49e71e6e4585?w=400', emoji: '🇮🇹', searches: 87 },
  { name: 'Rio de Janeiro', country: 'Brazil', image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400', emoji: '🇧🇷', searches: 94 },
];

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, selectedCity } = useActivities();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const sortedCities = [...POPULAR_CITIES].sort((a, b) => b.searches - a.searches);

  const handleCityPress = useCallback((cityName: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = buildDestinationAffiliateUrl(cityName);
    console.log('[Favorites] Opening city activities:', cityName, url);
    void openInExternalBrowser(url);
  }, []);

  const handleBack = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <View style={styles.headerRight}>
          <Heart size={20} color={Colors.secondary} fill={Colors.secondary} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={[Colors.teal, Colors.tealDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryGradient}
            >
              <View style={styles.summaryIconWrap}>
                <Sparkles size={22} color="#FFF" />
              </View>
              <Text style={styles.summaryTitle}>Your Travel Interests</Text>
              <Text style={styles.summarySubtitle}>
                {favorites.length > 0
                  ? `${favorites.length} saved experiences`
                  : 'Explore destinations below to find your favorites'}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.sectionHeaderRow}>
            <TrendingUp size={16} color={Colors.teal} />
            <Text style={styles.sectionTitle}>Most Searched Destinations</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Tap any city to explore activities</Text>

          <View style={styles.citiesGrid}>
            {sortedCities.map((city, index) => (
              <CityCard
                key={city.name}
                city={city}
                index={index}
                onPress={handleCityPress}
              />
            ))}
          </View>

          <View style={styles.affiliateFooter}>
            <Text style={styles.affiliateText}>{AFFILIATE_DISCLOSURE}</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface CityCardProps {
  city: typeof POPULAR_CITIES[0];
  index: number;
  onPress: (name: string) => void;
}

function CityCard({ city, index, onPress }: CityCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[styles.cityCardWrap, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.cityCard}
        activeOpacity={1}
        onPress={() => onPress(city.name)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`fav-city-${city.name}`}
      >
        <Image source={{ uri: city.image }} style={styles.cityImage} contentFit="cover" transition={200} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          locations={[0.3, 1]}
          style={styles.cityGradient}
        />
        {index < 3 && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{"#" + (index + 1)}</Text>
          </View>
        )}
        <View style={styles.cityOverlay}>
          <Text style={styles.cityEmoji}>{city.emoji}</Text>
          <Text style={styles.cityName}>{city.name}</Text>
          <View style={styles.cityMeta}>
            <MapPin size={10} color="rgba(255,255,255,0.8)" />
            <Text style={styles.cityCountry}>{city.country}</Text>
          </View>
          <View style={styles.citySearchBadge}>
            <TrendingUp size={9} color={Colors.teal} />
            <Text style={styles.citySearchCount}>{city.searches + " searches"}</Text>
          </View>
        </View>
        <View style={styles.cityExternalIcon}>
          <ExternalLink size={12} color="rgba(255,255,255,0.8)" />
        </View>
      </TouchableOpacity>
    </Animated.View>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  headerRight: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.tealDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  summaryGradient: {
    padding: 24,
    alignItems: 'center',
  },
  summaryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  summarySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  citiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 10,
  },
  cityCardWrap: {
    width: '47%' as any,
    flexGrow: 1,
  },
  cityCard: {
    borderRadius: 18,
    overflow: 'hidden',
    height: 170,
    backgroundColor: Colors.backgroundCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cityImage: {
    width: '100%',
    height: '100%',
    position: 'absolute' as const,
  },
  cityGradient: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  rankBadge: {
    position: 'absolute' as const,
    top: 10,
    left: 10,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#FFF',
  },
  cityOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  cityEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  cityCountry: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500' as const,
  },
  citySearchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  citySearchCount: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  cityExternalIcon: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  affiliateFooter: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  affiliateText: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 14,
    fontStyle: 'italic' as const,
  },
});

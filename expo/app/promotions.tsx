import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Bell,
  ExternalLink,
  Tag,
  Percent,
  Zap,
  Star,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { AFFILIATE_DISCLOSURE } from '@/constants/affiliateLinks';
import { GYG_PARTNER_ID, openInExternalBrowser } from '@/services/RedirectService';
import { buildTravelpayoutsDestinationUrl } from '@/constants/travelpayoutsLinks';

const GYG_DEALS_URL = `https://www.getyourguide.com/s/?q=deals&partner_id=${GYG_PARTNER_ID}&utm_source=andartravel&utm_medium=app&utm_campaign=promotions`;

const PROMO_DEALS = [
  {
    id: 'gyg_deals',
    title: 'Best Deals on GetYourGuide',
    subtitle: 'Up to 30% off top-rated tours & activities worldwide',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600',
    url: GYG_DEALS_URL,
    badge: 'Hot Deals',
    badgeColor: '#E25822',
    provider: 'GetYourGuide',
  },
  {
    id: 'gyg_rome',
    title: 'Rome: Skip-the-Line Experiences',
    subtitle: 'Colosseum, Vatican & more from $29',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400',
    url: `https://www.getyourguide.com/s/?q=Rome+deals&partner_id=${GYG_PARTNER_ID}&utm_source=andartravel&utm_medium=app&utm_campaign=rome_deals`,
    badge: 'From $29',
    badgeColor: Colors.teal,
    provider: 'GetYourGuide',
  },
  {
    id: 'gyg_paris',
    title: 'Paris: Museum Pass & River Cruises',
    subtitle: 'Save on Louvre, Eiffel Tower & Seine cruises',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
    url: `https://www.getyourguide.com/s/?q=Paris+deals&partner_id=${GYG_PARTNER_ID}&utm_source=andartravel&utm_medium=app&utm_campaign=paris_deals`,
    badge: 'Popular',
    badgeColor: '#F59E0B',
    provider: 'GetYourGuide',
  },
  {
    id: 'tp_tokyo',
    title: 'Tokyo: Cherry Blossom Season Tours',
    subtitle: 'Guided tours, food walks & day trips',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    url: buildTravelpayoutsDestinationUrl('Tokyo'),
    badge: 'Trending',
    badgeColor: '#8B5CF6',
    provider: 'Travelpayouts',
  },
  {
    id: 'gyg_dubai',
    title: 'Dubai: Desert Safari & Skyline Deals',
    subtitle: 'Adventure packages from $39',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400',
    url: `https://www.getyourguide.com/s/?q=Dubai+deals&partner_id=${GYG_PARTNER_ID}&utm_source=andartravel&utm_medium=app&utm_campaign=dubai_deals`,
    badge: 'From $39',
    badgeColor: Colors.teal,
    provider: 'GetYourGuide',
  },
  {
    id: 'tp_bali',
    title: 'Bali: Temple Tours & Water Activities',
    subtitle: 'Discover Ubud, Tanah Lot & snorkeling',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400',
    url: buildTravelpayoutsDestinationUrl('Bali'),
    badge: 'Best Value',
    badgeColor: '#059669',
    provider: 'Travelpayouts',
  },
  {
    id: 'gyg_barcelona',
    title: 'Barcelona: Sagrada Familia & Tapas',
    subtitle: 'Guided tours with priority access',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400',
    url: `https://www.getyourguide.com/s/?q=Barcelona+deals&partner_id=${GYG_PARTNER_ID}&utm_source=andartravel&utm_medium=app&utm_campaign=barcelona_deals`,
    badge: 'Top Rated',
    badgeColor: '#E25822',
    provider: 'GetYourGuide',
  },
  {
    id: 'tp_london',
    title: 'London: Theatre, Pubs & Harry Potter',
    subtitle: 'Best-selling experiences in London',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400',
    url: buildTravelpayoutsDestinationUrl('London'),
    badge: 'Bestseller',
    badgeColor: '#F59E0B',
    provider: 'Travelpayouts',
  },
];

export default function PromotionsScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleBack = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleDealPress = useCallback((url: string, title: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('[Promotions] Opening deal:', title, url);
    void openInExternalBrowser(url);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deals & Promotions</Text>
        <View style={styles.headerRight}>
          <Bell size={20} color={Colors.accent} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.heroBanner}>
            <LinearGradient
              colors={['#E25822', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroIconRow}>
                <Zap size={20} color="#FFF" />
                <Tag size={18} color="#FFF" />
                <Percent size={18} color="#FFF" />
              </View>
              <Text style={styles.heroTitle}>Cheapest Promotions</Text>
              <Text style={styles.heroSubtitle}>
                Curated deals from GetYourGuide & Travelpayouts partners
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Star size={16} color={Colors.secondary} fill={Colors.secondary} />
            <Text style={styles.sectionTitle}>Featured Deals</Text>
          </View>

          {PROMO_DEALS.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onPress={() => handleDealPress(deal.url, deal.title)}
            />
          ))}

          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => handleDealPress(GYG_DEALS_URL, 'All Deals')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.teal, Colors.tealDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.viewAllGradient}
            >
              <ExternalLink size={16} color="#FFF" />
              <Text style={styles.viewAllText}>Browse All Deals</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.affiliateFooter}>
            <Text style={styles.affiliateText}>{AFFILIATE_DISCLOSURE}</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface DealCardProps {
  deal: typeof PROMO_DEALS[0];
  onPress: () => void;
}

function DealCard({ deal, onPress }: DealCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[styles.dealWrap, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.dealCard}
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Image source={{ uri: deal.image }} style={styles.dealImage} contentFit="cover" transition={200} />
        <View style={styles.dealContent}>
          <View style={styles.dealTop}>
            <View style={[styles.dealBadge, { backgroundColor: deal.badgeColor }]}>
              <Text style={styles.dealBadgeText}>{deal.badge}</Text>
            </View>
            <Text style={styles.dealProvider}>{deal.provider}</Text>
          </View>
          <Text style={styles.dealTitle} numberOfLines={2}>{deal.title}</Text>
          <Text style={styles.dealSubtitle} numberOfLines={2}>{deal.subtitle}</Text>
          <View style={styles.dealCta}>
            <Text style={styles.dealCtaText}>View Deal</Text>
            <ExternalLink size={12} color={Colors.teal} />
          </View>
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
  heroBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#E25822',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  heroGradient: {
    padding: 24,
    alignItems: 'center',
  },
  heroIconRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  dealWrap: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  dealCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  dealImage: {
    width: 110,
    height: 130,
  },
  dealContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  dealTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dealBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dealBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  dealProvider: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
  },
  dealTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 20,
  },
  dealSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  dealCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  dealCtaText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.teal,
  },
  viewAllBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.tealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  viewAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFF',
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

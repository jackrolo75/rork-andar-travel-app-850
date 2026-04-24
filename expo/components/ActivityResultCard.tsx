import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Star,
  Clock,
  MapPin,
  Heart,
  Tag,
  CheckCircle,
  ExternalLink,
  Navigation,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { ActivityOffer } from '@/types/activities';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_IMAGE_WIDTH = SCREEN_WIDTH - 32;

interface ActivityResultCardProps {
  offer: ActivityOffer;
  onPress: (offer: ActivityOffer) => void;
  onBookPress: (offer: ActivityOffer) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (offerId: string) => void;
}

export default function ActivityResultCard({
  offer,
  onPress,
  onBookPress,
  isFavorite = false,
  onToggleFavorite,
}: ActivityResultCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const slideshowImages = offer.images && offer.images.length > 1
    ? offer.images.slice(0, 5)
    : [offer.imageUrl];

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(offer);
  }, [offer, onPress]);

  const handleBook = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onBookPress(offer);
  }, [offer, onBookPress]);

  const handleFavorite = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleFavorite?.(offer.id);
  }, [offer.id, onToggleFavorite]);

  const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_IMAGE_WIDTH));
    setActiveImageIndex(index);
  }, []);

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`activity-card-${offer.id}`}
        accessibilityLabel={`${offer.title}, ${offer.location}, from ${offer.price} per person, rated ${offer.rating.toFixed(1)} stars`}
        accessibilityRole="button"
        accessibilityHint="Double tap to view activity details"
      >
        <View style={styles.imageContainer}>
          {slideshowImages.length > 1 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScrollEnd}
              scrollEventThrottle={16}
              style={styles.imageScrollView}
              decelerationRate="fast"
            >
              {slideshowImages.map((imgUrl, idx) => (
                <Image
                  key={`slide-${idx}`}
                  source={{ uri: imgUrl }}
                  style={styles.slideImage}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </ScrollView>
          ) : (
            <Image
              source={{ uri: offer.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={300}
            />
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)']}
            style={styles.imageGradient}
            pointerEvents="none"
          />

          {slideshowImages.length > 1 && (
            <View style={styles.dotsContainer} pointerEvents="none">
              {slideshowImages.map((_, idx) => (
                <View
                  key={`dot-${idx}`}
                  style={[
                    styles.dot,
                    idx === activeImageIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {!!offer.discount && (
            <View style={styles.discountBadge}>
              <Tag size={10} color="#FFFFFF" />
              <Text style={styles.discountText}>-{offer.discount}%</Text>
            </View>
          )}

          {!!offer.isBestPrice && !offer.discount && (
            <View style={styles.bestPriceBadge}>
              <Text style={styles.bestPriceText}>Best Price</Text>
            </View>
          )}

          {onToggleFavorite && (
            <TouchableOpacity
              style={styles.favoriteBtn}
              onPress={handleFavorite}
              accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              accessibilityRole="button"
            >
              <Heart
                size={18}
                color={isFavorite ? Colors.accent : '#FFFFFF'}
                fill={isFavorite ? Colors.accent : 'transparent'}
              />
            </TouchableOpacity>
          )}

          <View style={styles.imageFooter}>
            <View style={styles.durationBadge}>
              <Clock size={11} color="#FFFFFF" />
              <Text style={styles.durationText}>{offer.duration}</Text>
            </View>
            {slideshowImages.length > 1 && (
              <View style={styles.imageCountBadge}>
                <Text style={styles.imageCountText}>
                  {activeImageIndex + 1}/{slideshowImages.length}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.ratingRow}>
            <Star size={13} color={Colors.secondary} fill={Colors.secondary} />
            <Text style={styles.ratingText}>{offer.rating.toFixed(1)}</Text>
            <Text style={styles.reviewText}>({offer.reviewCount.toLocaleString()})</Text>
            {offer.bookingFlow === 'affiliate_redirect' && (
              <View style={styles.redirectBadge}>
                <ExternalLink size={9} color={Colors.teal} />
              </View>
            )}
          </View>

          <Text style={styles.title} numberOfLines={2}>{offer.title}</Text>

          <View style={styles.locationRow}>
            <MapPin size={12} color={Colors.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>{offer.location}</Text>
            {offer.geo?.distanceToPlaceKm !== undefined && (
              <View style={styles.distanceBadge}>
                <Navigation size={9} color={Colors.teal} />
                <Text style={styles.distanceText}>
                  {offer.geo.distanceToPlaceKm < 1
                    ? '<1 km'
                    : `${offer.geo.distanceToPlaceKm.toFixed(1)} km`}
                </Text>
              </View>
            )}
          </View>

          {offer.highlights.length > 0 && (
            <View style={styles.highlightsRow}>
              {offer.highlights.slice(0, 2).map((h, idx) => (
                <View key={`hl-${idx}`} style={styles.highlightChip}>
                  <CheckCircle size={10} color={Colors.teal} />
                  <Text style={styles.highlightText}>{h}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.priceContainer}>
              {!!offer.originalPrice && (
                <Text style={styles.originalPrice}>${offer.originalPrice}</Text>
              )}
              <View style={styles.priceRow}>
                <Text style={styles.priceFrom}>From</Text>
                <Text style={styles.price}>${offer.price}</Text>
              </View>
              <Text style={styles.perPerson}>per person</Text>
            </View>

            <TouchableOpacity
              style={styles.bookButton}
              onPress={handleBook}
              activeOpacity={0.8}
              testID={`book-activity-${offer.id}`}
              accessibilityLabel={offer.bookingFlow === 'affiliate_redirect' ? `View deal for ${offer.title}` : `Book ${offer.title}`}
              accessibilityRole="button"
            >
              <Text style={styles.bookButtonText}>
                {offer.bookingFlow === 'affiliate_redirect' ? 'View Deal' : 'Book Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative' as const,
    height: 180,
  },
  imageScrollView: {
    width: '100%',
    height: 180,
  },
  slideImage: {
    width: CARD_IMAGE_WIDTH,
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  dotsContainer: {
    position: 'absolute' as const,
    bottom: 38,
    left: 0,
    right: 0,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  discountBadge: {
    position: 'absolute' as const,
    top: 12,
    left: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  bestPriceBadge: {
    position: 'absolute' as const,
    top: 12,
    left: 12,
    backgroundColor: Colors.teal,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestPriceText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  favoriteBtn: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  imageFooter: {
    position: 'absolute' as const,
    bottom: 10,
    left: 12,
    right: 12,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  durationBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  imageCountBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  imageCountText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  content: {
    padding: 14,
  },
  ratingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  reviewText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  redirectBadge: {
    marginLeft: 'auto' as const,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.tealMuted,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  distanceBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    backgroundColor: Colors.tealMuted,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.teal,
  },
  highlightsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 12,
  },
  highlightChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.tealMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  highlightText: {
    fontSize: 11,
    color: Colors.teal,
    fontWeight: '500' as const,
  },
  footer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-end' as const,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  priceContainer: {},
  originalPrice: {
    fontSize: 12,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through' as const,
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: 4,
  },
  priceFrom: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  price: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.teal,
  },
  perPerson: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  bookButton: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});

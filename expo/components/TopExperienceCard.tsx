import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Star, Clock, Flame, Zap } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { RankedExperience } from '@/services/ExperienceAggregator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TopExperienceCardProps {
  experience: RankedExperience;
  onPress: (experience: RankedExperience) => void;
  index: number;
}

function TopExperienceCard({ experience, onPress, index }: TopExperienceCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(experience);
  }, [experience, onPress]);

  const isTopPick = index === 0;

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`top-experience-${index}`}
        accessibilityLabel={`${experience.title}, rated ${experience.rating}, from $${experience.price}`}
        accessibilityRole="button"
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: experience.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']}
            locations={[0, 0.4, 1]}
            style={styles.gradient}
          />

          {isTopPick && (
            <View style={styles.topPickBadge}>
              <Flame size={12} color="#FFF" />
              <Text style={styles.topPickText}>Top Pick</Text>
            </View>
          )}

          {!!experience.scarcityLabel && (
            <View style={styles.scarcityBadge}>
              <Zap size={10} color="#F59E0B" />
              <Text style={styles.scarcityText}>{experience.scarcityLabel}</Text>
            </View>
          )}

          <View style={styles.providerBadge}>
            <Text style={styles.providerText}>{experience.providerDisplayName}</Text>
          </View>

          <View style={styles.contentOverlay}>
            <Text style={styles.title} numberOfLines={2}>{experience.title}</Text>

            <View style={styles.metaRow}>
              <View style={styles.ratingContainer}>
                <Star size={13} color="#F5C842" fill="#F5C842" />
                <Text style={styles.ratingText}>{experience.rating.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>({experience.reviewCount.toLocaleString()})</Text>
              </View>
              <View style={styles.durationContainer}>
                <Clock size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.durationText}>{experience.duration}</Text>
              </View>
            </View>

            <View style={styles.bottomRow}>
              <View style={styles.priceBlock}>
                {!!experience.originalPrice && (
                  <Text style={styles.originalPrice}>${experience.originalPrice}</Text>
                )}
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>From </Text>
                  <Text style={styles.price}>${experience.price}</Text>
                </View>
              </View>
              <View style={styles.ctaButton}>
                <Text style={styles.ctaText}>View Deal</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default React.memo(TopExperienceCard);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
    backgroundColor: Colors.backgroundCard,
  },
  imageContainer: {
    width: SCREEN_WIDTH - 32,
    height: 240,
    position: 'relative' as const,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  topPickBadge: {
    position: 'absolute' as const,
    top: 14,
    left: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: '#E25822',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  topPickText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  scarcityBadge: {
    position: 'absolute' as const,
    top: 14,
    right: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
  },
  scarcityText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#F5C842',
  },
  providerBadge: {
    position: 'absolute' as const,
    bottom: 90,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  providerText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
  },
  contentOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    lineHeight: 23,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  metaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  reviewCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  durationContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  bottomRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-between' as const,
  },
  priceBlock: {},
  originalPrice: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'line-through' as const,
    marginBottom: 1,
  },
  priceRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
  },
  priceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  price: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  ctaButton: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: Colors.tealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

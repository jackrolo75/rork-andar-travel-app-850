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
import { Star, Zap } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { RankedExperience } from '@/services/ExperienceAggregator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface ExperienceGridCardProps {
  experience: RankedExperience;
  onPress: (experience: RankedExperience) => void;
}

function ExperienceGridCard({ experience, onPress }: ExperienceGridCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(experience);
  }, [experience, onPress]);

  const categoryDef = CATEGORY_TAG_MAP[experience.category] || { label: experience.category, color: Colors.teal };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`grid-experience-${experience.id}`}
        accessibilityLabel={`${experience.title}, $${experience.price}`}
        accessibilityRole="button"
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: experience.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            locations={[0.5, 1]}
            style={styles.gradient}
          />

          <View style={[styles.categoryTag, { backgroundColor: categoryDef.color }]}>
            <Text style={styles.categoryTagText}>{categoryDef.label}</Text>
          </View>

          {!!experience.scarcityLabel && (
            <View style={styles.scarcityBadge}>
              <Zap size={8} color="#F5C842" />
              <Text style={styles.scarcityText} numberOfLines={1}>
                {experience.scarcityLabel.includes('Booked') ? '🔥 Hot' : experience.scarcityLabel}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{experience.title}</Text>

          <View style={styles.ratingRow}>
            <Star size={11} color="#F5C842" fill="#F5C842" />
            <Text style={styles.ratingText}>{experience.rating.toFixed(1)}</Text>
            <Text style={styles.reviewText}>({experience.reviewCount >= 1000 ? `${(experience.reviewCount / 1000).toFixed(1)}k` : experience.reviewCount})</Text>
          </View>

          <View style={styles.bottomRow}>
            <View>
              {!!experience.originalPrice && (
                <Text style={styles.originalPrice}>${experience.originalPrice}</Text>
              )}
              <Text style={styles.price}>
                <Text style={styles.priceFrom}>From </Text>${experience.price}
              </Text>
            </View>
          </View>

          <View style={styles.providerRow}>
            <View style={styles.providerDot} />
            <Text style={styles.providerText}>{experience.providerDisplayName}</Text>
          </View>

          <TouchableOpacity style={styles.ctaButton} onPress={handlePress} activeOpacity={0.8}>
            <Text style={styles.ctaText}>Check Availability</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const CATEGORY_TAG_MAP: Record<string, { label: string; color: string }> = {
  adventure: { label: 'Adventure', color: '#E27D60' },
  culture: { label: 'Culture', color: '#1A3A5C' },
  food: { label: 'Food & Drink', color: '#C77B4F' },
  nature: { label: 'Nature', color: '#3D7A5F' },
  wellness: { label: 'Wellness', color: '#8B5E83' },
  water: { label: 'Water', color: '#0D7377' },
  nightlife: { label: 'Nightlife', color: '#5B21B6' },
  tickets: { label: 'Tickets', color: '#2A5A8C' },
};

export default React.memo(ExperienceGridCard);

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.75,
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
    height: '60%',
  },
  categoryTag: {
    position: 'absolute' as const,
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  scarcityBadge: {
    position: 'absolute' as const,
    bottom: 8,
    left: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  scarcityText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: '#F5C842',
  },
  content: {
    padding: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 17,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  reviewText: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  bottomRow: {
    marginBottom: 6,
  },
  originalPrice: {
    fontSize: 10,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through' as const,
  },
  priceFrom: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  price: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.teal,
  },
  providerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 8,
  },
  providerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.teal,
  },
  providerText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    letterSpacing: 0.2,
  },
  ctaButton: {
    backgroundColor: Colors.teal,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center' as const,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});

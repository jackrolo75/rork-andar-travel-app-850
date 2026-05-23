import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { openInExternalBrowser } from '@/services/RedirectService';
import { useTapGuard } from '@/hooks/useTapGuard';
import * as Haptics from 'expo-haptics';
import { ExternalLink } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { EXPERIENCE_CATEGORIES, ExperienceCategoryId } from '@/constants/experienceProviders';
import { buildCategoryAffiliateUrl } from '@/constants/affiliateLinks';

interface CategoryStripProps {
  selectedCategory: ExperienceCategoryId | null;
  onSelectCategory: (category: ExperienceCategoryId | null) => void;
  activeCity?: string;
}

function CategoryStrip({ selectedCategory, onSelectCategory, activeCity }: CategoryStripProps) {
  const scaleAnims = useRef(
    EXPERIENCE_CATEGORIES.reduce<Record<string, Animated.Value>>((acc, cat) => {
      acc[cat.id] = new Animated.Value(1);
      return acc;
    }, {})
  ).current;

  const handlePress = useTapGuard(useCallback(async (catId: ExperienceCategoryId) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.sequence([
      Animated.spring(scaleAnims[catId], { toValue: 0.9, useNativeDriver: true, speed: 50, bounciness: 4 }),
      Animated.spring(scaleAnims[catId], { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
    ]).start();

    if (activeCity) {
      const catDef = EXPERIENCE_CATEGORIES.find(c => c.id === catId);
      const activityCategory = catDef?.mapToActivityCategory || 'culture';
      const url = buildCategoryAffiliateUrl(activityCategory, activeCity);
      const opened = await openInExternalBrowser(url);
      if (!opened) Alert.alert('Error', 'Could not open the link. Please try again.');
      return;
    }

    if (selectedCategory === catId) {
      onSelectCategory(null);
    } else {
      onSelectCategory(catId);
    }
  }, [selectedCategory, onSelectCategory, scaleAnims, activeCity]), 400);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {EXPERIENCE_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <Animated.View
              key={cat.id}
              style={{ transform: [{ scale: scaleAnims[cat.id] }] }}
            >
              <TouchableOpacity
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => handlePress(cat.id)}
                activeOpacity={0.8}
                testID={`category-strip-${cat.id}`}
                accessibilityLabel={`Filter by ${cat.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={styles.emoji}>{cat.emoji}</Text>
                <Text style={[styles.label, isActive && styles.labelActive]}>
                  {cat.label}
                </Text>
                {activeCity ? <ExternalLink size={11} color={isActive ? '#FFFFFF' : Colors.textTertiary} /> : null}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default React.memo(CategoryStrip);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
});

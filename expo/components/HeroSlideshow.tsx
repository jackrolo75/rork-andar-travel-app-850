import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_INTERVAL = 3500;

interface Slide {
  name: string;
  country: string;
  image: string;
  emoji: string;
}

const SLIDES: Slide[] = [
  { name: 'Dubai', country: 'UAE', emoji: '🇦🇪', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80' },
  { name: 'Tokyo', country: 'Japan', emoji: '🇯🇵', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80' },
  { name: 'Bali', country: 'Indonesia', emoji: '🇮🇩', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80' },
  { name: 'Paris', country: 'France', emoji: '🇫🇷', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80' },
  { name: 'Barcelona', country: 'Spain', emoji: '🇪🇸', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80' },
  { name: 'Rome', country: 'Italy', emoji: '🇮🇹', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80' },
];

interface HeroSlideshowProps {
  title?: string;
  subtitle?: string;
  onDestinationPress?: (name: string) => void;
}

function HeroSlideshow({
  title = 'Discover Experiences',
  subtitle = 'Tours, activities & things to do worldwide',
  onDestinationPress,
}: HeroSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const textSlide = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeIndexRef = useRef(0);

  const goToSlide = useCallback((nextIndex: number) => {
    progressAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(textSlide, { toValue: -12, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setActiveIndex(nextIndex);
      activeIndexRef.current = nextIndex;
      textSlide.setValue(12);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(textSlide, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }),
      ]).start();

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: SLIDE_INTERVAL,
        useNativeDriver: false,
      }).start();
    });
  }, [fadeAnim, textSlide, progressAnim]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const next = (activeIndexRef.current + 1) % SLIDES.length;
      goToSlide(next);
    }, SLIDE_INTERVAL);
  }, [goToSlide]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: SLIDE_INTERVAL,
      useNativeDriver: false,
    }).start();
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer, progressAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 15,
      onPanResponderRelease: (_, gestureState) => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (gestureState.dx < -40) {
          const next = (activeIndexRef.current + 1) % SLIDES.length;
          goToSlide(next);
        } else if (gestureState.dx > 40) {
          const prev = (activeIndexRef.current - 1 + SLIDES.length) % SLIDES.length;
          goToSlide(prev);
        }
        startTimer();
      },
    })
  ).current;

  const currentSlide = SLIDES[activeIndex];

  const handleExplorePress = useCallback(() => {
    if (onDestinationPress) {
      onDestinationPress(currentSlide.name);
    }
  }, [onDestinationPress, currentSlide.name]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
        <Image
          source={{ uri: currentSlide.image }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          priority="high"
        />
      </Animated.View>

      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
        locations={[0, 0.25, 0.6, 1]}
        style={styles.gradient}
      />

      <View style={styles.content}>
        <Animated.View style={[styles.locationRow, { transform: [{ translateY: textSlide }] }]}>
          <MapPin size={13} color={Colors.accentLight} />
          <Text style={styles.locationTag}>
            {currentSlide.emoji} {currentSlide.name}, {currentSlide.country}
          </Text>
        </Animated.View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {onDestinationPress && (
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={handleExplorePress}
            activeOpacity={0.85}
            testID="hero-explore-btn"
          >
            <Text style={styles.exploreBtnText}>
              {"Explore " + currentSlide.name}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.indicators}>
          {SLIDES.map((_, idx) => {
            const isActive = idx === activeIndex;
            return (
              <View key={`dot-${idx}`} style={[styles.dot, isActive && styles.dotActive]}>
                {isActive && (
                  <Animated.View style={[styles.dotProgress, { width: progressWidth }]} />
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default React.memo(HeroSlideshow);

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: 380,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  locationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 10,
  },
  locationTag: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.accentLight,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  title: {
    fontSize: 34,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 21,
    marginBottom: 18,
  },
  exploreBtn: {
    alignSelf: 'flex-start' as const,
    backgroundColor: Colors.teal,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
    marginBottom: 18,
    shadowColor: Colors.tealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  exploreBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  indicators: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 20,
    overflow: 'hidden' as const,
  },
  dotActive: {
    width: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotProgress: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
});

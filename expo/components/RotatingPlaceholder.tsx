import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Colors from '@/constants/colors';

const ROTATING_PLACES = [
  'Kathmandu, Nepal',
  'Quito, Ecuador',
  'Rio de Janeiro, Brazil',
  'Manila, Philippines',
  'Calgary, Canada',
  'Edmonton, Canada',
  'Winnipeg, Canada',
  'Fort Lauderdale, USA',
  'Orlando, USA',
  'Las Vegas, USA',
  'Atlanta, USA',
  'Florence, Italy',
  'Venice, Italy',
  'Milan, Italy',
  'Mallorca, Spain',
  'Amsterdam, Netherlands',
  'Bangkok, Thailand',
  'Madrid, Spain',
  'Barcelona, Spain',
  'Rome, Italy',
  'Paris, France',
  'London, UK',
  'New York, USA',
  'Los Angeles, USA',
  'Miami, USA',
  'Tokyo, Japan',
  'Dubai, UAE',
  'Toronto, Canada',
  'Vancouver, Canada',
];

interface RotatingPlaceholderProps {
  prefix?: string;
}

export default React.memo(function RotatingPlaceholder({ prefix = 'Try' }: RotatingPlaceholderProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const animateCycle = useCallback(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setCurrentIndex((prev) => (prev + 1) % ROTATING_PLACES.length);
      }
    });
  }, [fadeAnim]);

  useEffect(() => {
    animateCycle();
  }, [currentIndex, animateCycle]);

  return (
    <View style={styles.container}>
      <Text style={styles.prefix}>{prefix} </Text>
      <Animated.Text style={[styles.place, { opacity: fadeAnim }]}>
        {ROTATING_PLACES[currentIndex]}
      </Animated.Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    overflow: 'hidden',
  },
  prefix: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textTertiary,
  },
  place: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.teal,
    flexShrink: 1,
  },
});

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function SkeletonBox({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        styles.skeletonBox,
        { width, height, borderRadius },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
}

export function FlightOfferSkeleton() {
  return (
    <View style={styles.flightCard}>
      <View style={styles.flightHeader}>
        <SkeletonBox width={44} height={44} borderRadius={12} />
        <View style={styles.flightHeaderContent}>
          <SkeletonBox width={120} height={16} />
          <SkeletonBox width={80} height={12} style={{ marginTop: 6 }} />
        </View>
        <View style={styles.flightPrice}>
          <SkeletonBox width={70} height={24} />
          <SkeletonBox width={40} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <View style={styles.flightDetails}>
        <View style={styles.flightTime}>
          <SkeletonBox width={50} height={20} />
          <SkeletonBox width={30} height={12} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.flightLine}>
          <SkeletonBox width="100%" height={2} />
        </View>
        <View style={styles.flightTime}>
          <SkeletonBox width={50} height={20} />
          <SkeletonBox width={30} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <View style={styles.flightFooter}>
        <SkeletonBox width={60} height={24} borderRadius={6} />
        <SkeletonBox width={100} height={36} borderRadius={10} />
      </View>
    </View>
  );
}

export function HotelOfferSkeleton() {
  return (
    <View style={styles.hotelCard}>
      <SkeletonBox width="100%" height={140} borderRadius={12} />
      <View style={styles.hotelContent}>
        <SkeletonBox width="70%" height={18} />
        <SkeletonBox width="50%" height={14} style={{ marginTop: 8 }} />
        <View style={styles.hotelRating}>
          <SkeletonBox width={60} height={20} borderRadius={10} />
          <SkeletonBox width={80} height={12} />
        </View>
        <View style={styles.hotelFooter}>
          <View>
            <SkeletonBox width={80} height={24} />
            <SkeletonBox width={60} height={12} style={{ marginTop: 4 }} />
          </View>
          <SkeletonBox width={90} height={36} borderRadius={10} />
        </View>
      </View>
    </View>
  );
}

export function TourOfferSkeleton() {
  return (
    <View style={styles.tourCard}>
      <SkeletonBox width={100} height={100} borderRadius={12} />
      <View style={styles.tourContent}>
        <SkeletonBox width="80%" height={16} />
        <SkeletonBox width="50%" height={12} style={{ marginTop: 6 }} />
        <View style={styles.tourRating}>
          <SkeletonBox width={50} height={16} borderRadius={8} />
          <SkeletonBox width={70} height={12} />
        </View>
        <View style={styles.tourFooter}>
          <SkeletonBox width={60} height={20} />
          <SkeletonBox width={80} height={32} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

export function SearchingAnimation() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    rotateAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
    };
  }, [pulseAnim, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.searchingContainer}>
      <Animated.View
        style={[
          styles.searchingOuter,
          { transform: [{ scale: pulseAnim }, { rotate: rotation }] },
        ]}
      >
        <View style={styles.searchingInner}>
          <View style={styles.searchingDot} />
        </View>
      </Animated.View>
    </View>
  );
}

export function PartnerSearchProgress({ 
  partners, 
  completedPartners 
}: { 
  partners: string[]; 
  completedPartners: string[];
}) {
  const totalSteps = partners.length;
  const completedSteps = completedPartners.length;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const SEARCH_STAGES = [
    'Scanning deals...',
    'Comparing prices...',
    'Finding best rates...',
    'Verifying availability...',
    'Finalizing results...',
  ];

  const currentStageIndex = Math.min(
    Math.floor((completedSteps / totalSteps) * SEARCH_STAGES.length),
    SEARCH_STAGES.length - 1
  );

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <SearchingAnimation />
        <View style={styles.progressText}>
          <Animated.Text style={styles.progressTitle}>
            AndarTravel is searching...
          </Animated.Text>
          <Animated.Text style={styles.progressSubtitle}>
            {SEARCH_STAGES[currentStageIndex]}
          </Animated.Text>
        </View>
      </View>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${progressPercent}%` }
          ]} 
        />
      </View>
      <View style={styles.partnerList}>
        {SEARCH_STAGES.map((stage, index) => (
          <View
            key={stage}
            style={[
              styles.partnerChip,
              index <= currentStageIndex && styles.partnerChipComplete,
            ]}
          >
            <View
              style={[
                styles.partnerDot,
                index <= currentStageIndex && styles.partnerDotComplete,
              ]}
            />
            <Animated.Text
              style={[
                styles.partnerName,
                index <= currentStageIndex && styles.partnerNameComplete,
              ]}
            >
              {stage}
            </Animated.Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonBox: {
    backgroundColor: Colors.backgroundSecondary,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  shimmerGradient: {
    flex: 1,
  },
  flightCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  flightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  flightHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },
  flightPrice: {
    alignItems: 'flex-end',
  },
  flightDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  flightTime: {
    alignItems: 'center',
    width: 60,
  },
  flightLine: {
    flex: 1,
    marginHorizontal: 12,
  },
  flightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  hotelCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  hotelContent: {
    padding: 14,
  },
  hotelRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  hotelFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  tourCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
  },
  tourContent: {
    flex: 1,
    marginLeft: 12,
  },
  tourRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  tourFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  searchingContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchingOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.teal,
    borderTopColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchingInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.tealMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.teal,
  },
  progressContainer: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    flex: 1,
    marginLeft: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  progressSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.teal,
    borderRadius: 3,
  },
  partnerList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  partnerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  partnerChipComplete: {
    backgroundColor: Colors.tealMuted,
  },
  partnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textTertiary,
  },
  partnerDotComplete: {
    backgroundColor: Colors.teal,
  },
  partnerName: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  partnerNameComplete: {
    color: Colors.teal,
  },
});

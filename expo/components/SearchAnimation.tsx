import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  Plane,
  Car,
  Building2,
  Globe,
  Search,
  CheckCircle,
  Hotel,
  Ticket,
  Smartphone,
  MapPin,
  Radar,
  ScanLine,
  Wifi,
  Navigation,
} from 'lucide-react-native';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SearchAnimationProps {
  visible: boolean;
  onComplete: () => void;
  origin?: string;
  destination?: string;
  searchType?: 'flight' | 'bundle' | 'all' | 'hotels' | 'tours' | 'transport' | 'essentials';
  searchReady?: boolean;
}

const ROTATING_MESSAGES = [
  'Searching the best deals…',
  'Comparing prices…',
  'Finding top options…',
  'Checking availability…',
  'Preparing your results…',
  'Almost there…',
  'Finalizing top results…',
];

const CATEGORY_MESSAGES: Record<string, string[]> = {
  flight: [
    'Searching the best deals…',
    'Comparing prices…',
    'Scanning flight prices…',
    'Comparing airlines…',
    'Finding top options…',
    'Checking seat availability…',
    'Preparing your results…',
    'Almost there…',
  ],
  flights: [
    'Searching the best deals…',
    'Comparing prices…',
    'Scanning flight prices…',
    'Comparing airlines…',
    'Finding top options…',
    'Checking seat availability…',
    'Preparing your results…',
    'Almost there…',
  ],
  hotels: [
    'Searching the best deals…',
    'Comparing prices…',
    'Scanning hotel rates…',
    'Comparing room options…',
    'Finding top options…',
    'Checking availability…',
    'Preparing your results…',
    'Almost there…',
  ],
  tours: [
    'Searching the best deals…',
    'Comparing prices…',
    'Finding top experiences…',
    'Comparing tour operators…',
    'Finding top options…',
    'Checking schedules…',
    'Preparing your results…',
    'Almost there…',
  ],
  transport: [
    'Searching the best deals…',
    'Comparing prices…',
    'Searching transport options…',
    'Comparing rental prices…',
    'Finding top options…',
    'Checking availability…',
    'Preparing your results…',
    'Almost there…',
  ],
  essentials: [
    'Searching the best deals…',
    'Comparing prices…',
    'Scanning eSIM plans…',
    'Comparing data packages…',
    'Finding top options…',
    'Checking travel essentials…',
    'Preparing your results…',
    'Almost there…',
  ],
};

const PARTNER_SITES_BY_CATEGORY: Record<string, string[]> = {
  flight: ['Trip.com', 'Aviasales', 'Klook', 'Viator', 'Tiqets', 'Skyscanner'],
  all: ['Trip.com', 'Aviasales', 'Klook', 'Viator', 'Tiqets', 'Skyscanner'],
  bundle: ['Trip.com', 'Aviasales', 'Klook', 'Localrent', 'Booking.com', 'Skyscanner'],
  hotels: ['Trip.com', 'Booking.com', 'Klook', 'Skyscanner', 'Viator', 'Tiqets'],
  tours: ['Klook', 'Viator', 'Tiqets', 'Trip.com', 'GetYourGuide', 'Skyscanner'],
  transport: ['Localrent', 'Kiwitaxi', 'Economy Bookings', 'Welcome Pickups', 'Trip.com', 'Klook'],
  essentials: ['Yesim', 'Klook', 'Trip.com', 'Viator', 'Tiqets', 'Skyscanner'],
};

export default function SearchAnimation({
  visible,
  onComplete,
  origin = 'Your City',
  destination = 'Destination',
  searchType = 'all',
  searchReady = false,
}: SearchAnimationProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const planeAnim = useRef(new Animated.Value(-50)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(1)).current;
  const dotAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const hasCompletedRef = useRef(false);

  const partnerSites = PARTNER_SITES_BY_CATEGORY[searchType] || PARTNER_SITES_BY_CATEGORY.all;
  const messages = CATEGORY_MESSAGES[searchType] || ROTATING_MESSAGES;

  const fadeAnims = useRef(partnerSites.map(() => new Animated.Value(0))).current;
  const checkAnims = useRef(partnerSites.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!visible) return;

    setCurrentMessageIndex(0);
    progressAnim.setValue(0);
    planeAnim.setValue(-50);
    iconRotateAnim.setValue(0);
    fadeAnims.forEach(anim => anim.setValue(0));
    checkAnims.forEach(anim => anim.setValue(0));

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(iconRotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    Animated.timing(planeAnim, {
      toValue: SCREEN_WIDTH + 50,
      duration: 3500,
      useNativeDriver: true,
    }).start();

    const dotLoop = Animated.loop(
      Animated.stagger(200, dotAnims.map(anim =>
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ))
    );
    dotLoop.start();

    const siteAnimations = partnerSites.map((_, index) =>
      Animated.sequence([
        Animated.delay(index * 250),
        Animated.parallel([
          Animated.timing(fadeAnims[index], {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(400),
            Animated.timing(checkAnims[index], {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    );

    hasCompletedRef.current = false;
    setMinTimeElapsed(false);

    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: 0.85,
        duration: 3500,
        useNativeDriver: false,
      }),
      ...siteAnimations,
    ]).start(() => {
      setMinTimeElapsed(true);
    });

    const messageInterval = setInterval(() => {
      Animated.timing(messageOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentMessageIndex(prev => (prev + 1) % messages.length);
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 1500);

    return () => {
      clearInterval(messageInterval);
      dotLoop.stop();
    };
  }, [visible]);

  useEffect(() => {
    if (visible && minTimeElapsed && searchReady && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      console.log('[SearchAnimation] Both min time elapsed and search ready — completing');
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        setTimeout(onComplete, 300);
      });
    }
  }, [visible, minTimeElapsed, searchReady, onComplete, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const iconSpin = iconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getCategoryIcon = () => {
    switch (searchType) {
      case 'flight':
        return <Plane size={30} color="#FFFFFF" strokeWidth={2} />;
      case 'hotels':
        return <Hotel size={30} color="#FFFFFF" strokeWidth={2} />;
      case 'tours':
        return <Ticket size={30} color="#FFFFFF" strokeWidth={2} />;
      case 'transport':
        return <Car size={30} color="#FFFFFF" strokeWidth={2} />;
      case 'essentials':
        return <Smartphone size={30} color="#FFFFFF" strokeWidth={2} />;
      case 'bundle':
        return (
          <View style={styles.bundleIcons}>
            <Plane size={18} color="#FFFFFF" />
            <Car size={18} color="#FFFFFF" />
            <Building2 size={18} color="#FFFFFF" />
          </View>
        );
      default:
        return <Globe size={30} color="#FFFFFF" strokeWidth={2} />;
    }
  };

  const getCategoryLabel = () => {
    switch (searchType) {
      case 'flight': return 'Flights';
      case 'hotels': return 'Hotels';
      case 'tours': return 'Tours & Activities';
      case 'transport': return 'Cars & Transfers';
      case 'essentials': return 'Travel Essentials';
      case 'bundle': return 'Bundle Deals';
      default: return 'All Categories';
    }
  };

  const getGradientColors = (): [string, string, string] => {
    switch (searchType) {
      case 'flight': return ['#0A3D5C', '#0D7377', '#064E52'];
      case 'hotels': return ['#1A2A4C', '#1A3A5C', '#2A5A8C'];
      case 'tours': return ['#2D4A22', '#3D6B3D', '#1A3A2C'];
      case 'transport': return ['#3D4A22', '#5E7A5E', '#2D3D1A'];
      case 'essentials': return ['#3D1A5C', '#7C3AED', '#5A2D82'];
      case 'bundle': return ['#0A4B4E', '#0D7377', '#1A3A5C'];
      default: return ['#0A4B4E', '#0D7377', '#0A5A5D'];
    }
  };

  const getFloatingIcon = () => {
    switch (searchType) {
      case 'flight': return <Radar size={20} color="rgba(255,255,255,0.12)" />;
      case 'hotels': return <ScanLine size={20} color="rgba(255,255,255,0.12)" />;
      case 'transport': return <Navigation size={20} color="rgba(255,255,255,0.12)" />;
      case 'essentials': return <Wifi size={20} color="rgba(255,255,255,0.12)" />;
      default: return <Plane size={20} color="rgba(255,255,255,0.12)" />;
    }
  };

  const getProgressColors = (): [string, string] => {
    switch (searchType) {
      case 'flight': return ['#22D3EE', '#06B6D4'];
      case 'hotels': return ['#F59E0B', '#FBBF24'];
      case 'transport': return ['#4ADE80', '#22C55E'];
      case 'essentials': return ['#A78BFA', '#8B5CF6'];
      default: return ['#4ADE80', '#22D3EE'];
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Animated.View style={[styles.planeFloat, { transform: [{ translateX: planeAnim }] }]}>
              {getFloatingIcon()}
            </Animated.View>

            <View style={styles.brandRow}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.brandIcon}
                contentFit="contain"
              />
              <Text style={styles.brandName}>AndarTravel</Text>
            </View>

            <Animated.View style={[styles.iconCircle, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.iconInner}>
                {getCategoryIcon()}
              </View>
              <Animated.View style={[styles.iconRing, { transform: [{ rotate: iconSpin }] }]}>
                <View style={styles.ringDot} />
              </Animated.View>
            </Animated.View>

            <Text style={styles.categoryLabel}>{getCategoryLabel()}</Text>

            {(origin !== 'Your City' || destination !== 'Destination') && (
              <View style={styles.routeRow}>
                <MapPin size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.routeText}>
                  {origin} → {destination}
                </Text>
              </View>
            )}

            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
                  <LinearGradient
                    colors={getProgressColors()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>
              </View>
            </View>

            <View style={styles.messageRow}>
              <Animated.Text style={[styles.rotatingMessage, { opacity: messageOpacity }]}>
                {messages[currentMessageIndex]}
              </Animated.Text>
              <View style={styles.loadingDots}>
                {dotAnims.map((anim, i) => (
                  <Animated.View
                    key={`dot-${i}`}
                    style={[
                      styles.dot,
                      {
                        opacity: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                        transform: [{
                          scale: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1.2],
                          }),
                        }],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.sitesGrid}>
              {partnerSites.map((site, index) => (
                <Animated.View
                  key={`search-site-${site}-${index}`}
                  style={[
                    styles.siteChip,
                    {
                      opacity: index < fadeAnims.length ? fadeAnims[index] : fadeAnims[0],
                      transform: [{
                        translateY: (index < fadeAnims.length ? fadeAnims[index] : fadeAnims[0]).interpolate({
                          inputRange: [0, 1],
                          outputRange: [8, 0],
                        }),
                      }],
                    },
                  ]}
                >
                  <View style={styles.siteChipContent}>
                    <Search size={12} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.siteChipText}>{site}</Text>
                  </View>
                  <Animated.View style={{ opacity: index < checkAnims.length ? checkAnims[index] : checkAnims[0] }}>
                    <CheckCircle size={14} color="#4ADE80" />
                  </Animated.View>
                </Animated.View>
              ))}
            </View>

            <View style={styles.infoBar}>
              <Text style={styles.infoText}>
                Powered by AndarTravel — comparing all major booking sites
              </Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  gradient: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  planeFloat: {
    position: 'absolute',
    top: 24,
    left: 0,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRing: {
    position: 'absolute',
    width: 88,
    height: 88,
  },
  ringDot: {
    position: 'absolute',
    top: 0,
    left: '50%' as any,
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22D3EE',
  },
  bundleIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  categoryLabel: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  routeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500' as const,
  },
  progressWrap: {
    width: '100%',
    marginBottom: 14,
    marginTop: 4,
  },
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    minHeight: 22,
  },
  rotatingMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500' as const,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#22D3EE',
  },
  sitesGrid: {
    width: '100%',
    gap: 6,
    marginBottom: 18,
  },
  siteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  siteChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  siteChipText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500' as const,
  },
  infoBar: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    width: '100%',
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center' as const,
    lineHeight: 17,
  },
});

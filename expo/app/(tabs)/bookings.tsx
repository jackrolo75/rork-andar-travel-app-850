// AndarTravel Bookings Screen
import React, { useRef, useEffect } from 'react';
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
import * as Haptics from 'expo-haptics';
import {
  Ticket,
  Clock,
  MapPin,
  Calendar,
  ChevronRight,
  Search,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useActivities } from '@/contexts/ActivitiesContext';
import ActivitiesDisclaimer from '@/components/ActivitiesDisclaimer';
import AppHeader from '@/components/AppHeader';
import OfflineBanner from '@/components/OfflineBanner';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function BookingsScreen() {
  const router = useRouter();
  const { recentBookings } = useActivities();
  const { isConnected, isChecking, checkConnection } = useNetworkStatus();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleSearchActivities = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)/search' as any);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return Colors.teal;
      case 'pending': return Colors.secondary;
      case 'cancelled': return Colors.accent;
      default: return Colors.textTertiary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle size={16} color={Colors.teal} />;
      case 'pending': return <Clock size={16} color={Colors.secondary} />;
      default: return <AlertCircle size={16} color={Colors.accent} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />
      <OfflineBanner visible={!isConnected} onRetry={checkConnection} isRetrying={isChecking} />
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>
          {recentBookings.length > 0
            ? `${recentBookings.length} booking${recentBookings.length > 1 ? 's' : ''}`
            : 'No bookings yet'}
        </Text>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recentBookings.length === 0 ? (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <View style={styles.emptyIllustration}>
              <View style={styles.emptyCircleOuter}>
                <View style={styles.emptyCircleInner}>
                  <Ticket size={40} color={Colors.teal} strokeWidth={1.5} />
                </View>
              </View>
              <View style={styles.emptyDecoLeft}>
                <MapPin size={16} color={Colors.tealMuted} />
              </View>
              <View style={styles.emptyDecoRight}>
                <Calendar size={16} color={Colors.secondaryMuted} />
              </View>
            </View>
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptySubtitle}>
              Your upcoming adventures will show up here once you book an activity
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleSearchActivities}
              activeOpacity={0.8}
              testID="bookings-find-activities"
            >
              <Search size={18} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Explore Activities</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {recentBookings.map((booking) => (
              <TouchableOpacity
                key={booking.bookingId}
                style={styles.bookingCard}
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingStatus}>
                    {getStatusIcon(booking.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textTertiary} />
                </View>

                <Text style={styles.bookingTitle} numberOfLines={2}>
                  Activity #{booking.bookingId.slice(0, 8).toUpperCase()}
                </Text>

                <View style={styles.bookingMeta}>
                  <View style={styles.metaItem}>
                    <Calendar size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{booking.date}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MapPin size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{booking.guests} guests</Text>
                  </View>
                </View>

                <View style={styles.bookingFooter}>
                  <Text style={styles.bookingPrice}>
                    ${booking.price} {booking.currency}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        <ActivitiesDisclaimer variant="inline" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 40,
  },
  emptyIllustration: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  emptyCircleOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.tealMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCircleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(13,115,119,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDecoLeft: {
    position: 'absolute',
    top: 10,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDecoRight: {
    position: 'absolute',
    bottom: 10,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.teal,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  bookingCard: {
    backgroundColor: Colors.backgroundCard,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 18,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  bookingMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bookingFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  bookingPrice: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.teal,
  },
});

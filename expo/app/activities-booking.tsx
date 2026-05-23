// Activities Booking Screen
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Shield,
  ExternalLink,
  CreditCard,
  Globe,
  AlertCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import ActivitiesDisclaimer from '@/components/ActivitiesDisclaimer';
import { useActivities } from '@/contexts/ActivitiesContext';
import { openWithClickPersistence, openInExternalBrowser } from '@/services/RedirectService';
import { useTapGuard } from '@/hooks/useTapGuard';

const REDIRECT_STUCK_TIMEOUT_MS = 12_000;

export default function ActivitiesBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    offerId: string;
    title: string;
    price: string;
    currency: string;
    partnerId: string;
    partnerName: string;
    imageUrl: string;
    duration: string;
    rating: string;
    reviewCount: string;
    location: string;
    bookingFlow: string;
    deepLink: string;
    destination: string;
    date: string;
    guests: string;
    description: string;
    highlights: string;
    includes: string;
    cancellationPolicy: string;
    selectedTimeSlot: string;
    clickId: string;
  }>();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(params.selectedTimeSlot || '10:00');
  const [showFallback, setShowFallback] = useState(false);
  const [lastRedirectUrl, setLastRedirectUrl] = useState('');
  const { isRedirectEnabled: _isRedirectEnabled } = useActivities();
  const stuckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const price = parseFloat(params.price || '0');
  const guests = parseInt(params.guests || '2', 10);
  const totalPrice = price * guests;
  const isRedirect = true;

  const TIME_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '16:00'];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    return () => {
      if (stuckTimerRef.current) {
        clearTimeout(stuckTimerRef.current);
      }
    };
  }, []);

  const handleOpenFallback = useCallback(async () => {
    if (!lastRedirectUrl) return;
    console.log('[ActivitiesBooking] Fallback: opening in external browser:', lastRedirectUrl);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await openInExternalBrowser(lastRedirectUrl);
  }, [lastRedirectUrl]);

  const handleRedirectBooking = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsBooking(true);
    setShowFallback(false);

    if (stuckTimerRef.current) {
      clearTimeout(stuckTimerRef.current);
    }

    stuckTimerRef.current = setTimeout(() => {
      console.warn('[ActivitiesBooking] Redirect stuck timeout reached');
      setShowFallback(true);
      setIsBooking(false);
    }, REDIRECT_STUCK_TIMEOUT_MS);

    try {
      const partnerUrl = params.deepLink || '';

      console.log('[ActivitiesBooking] Opening partner redirect in external browser');

      const result = await openWithClickPersistence({
        activityId: params.offerId || '',
        partnerUrl: partnerUrl || undefined,
        partnerId: params.partnerId || undefined,
        quoteId: `qt_${Date.now()}`,
      });

      if (stuckTimerRef.current) {
        clearTimeout(stuckTimerRef.current);
        stuckTimerRef.current = null;
      }

      setLastRedirectUrl(result.redirectUrl);

      console.log('[ActivitiesBooking] Redirect result:', {
        clickId: result.clickId,
        opened: result.opened,
        fallback: result.fallback,
      });

      if (!result.opened) {
        setShowFallback(true);
        setIsBooking(false);
        return;
      }

      router.push({
        pathname: '/activity-confirmation' as any,
        params: {
          offerId: params.offerId,
          title: params.title,
          price: totalPrice.toString(),
          currency: params.currency || 'USD',
          destination: params.destination,
          date: params.date,
          guests: params.guests,
          bookingType: 'redirect',
          bookingId: result.clickId,
          customerName: '',
          customerEmail: '',
          imageUrl: params.imageUrl,
          duration: params.duration,
          location: params.location,
          selectedTimeSlot,
          clickId: result.clickId,
          redirectUrl: result.redirectUrl,
        },
      });
    } catch (error) {
      console.error('[ActivitiesBooking] Redirect error:', error);
      if (stuckTimerRef.current) {
        clearTimeout(stuckTimerRef.current);
        stuckTimerRef.current = null;
      }
      setShowFallback(true);
      Alert.alert('Error', 'Something went wrong. Use the "Open in Browser" button below to try again.');
    } finally {
      setIsBooking(false);
    }
  }, [params, totalPrice, selectedTimeSlot, router]);

  const guardedRedirectBooking = useTapGuard(handleRedirectBooking, 800);

  const handleApiBooking = useCallback(async () => {
    if (!customerName || !customerEmail) {
      Alert.alert('Missing Information', 'Please fill in your name and email.');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsBooking(true);

    try {
      console.log('[ActivitiesBooking] Opening Stripe Payment Link...');

      router.push({
        pathname: '/activity-payment' as any,
        params: {
          offerId: params.offerId,
          title: params.title,
          price: params.price,
          currency: params.currency || 'USD',
          partnerId: params.partnerId,
          guests: params.guests,
          date: params.date,
          destination: params.destination,
          clickId: `clk_${Date.now()}`,
          quoteId: `qt_${Date.now()}`,
          customerName,
          customerEmail,
          imageUrl: params.imageUrl,
          duration: params.duration,
          location: params.location,
          selectedTimeSlot,
        },
      });
    } catch (error) {
      console.error('[ActivitiesBooking] API booking error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsBooking(false);
    }
  }, [customerName, customerEmail, params, selectedTimeSlot, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRedirect ? 'Confirm Redirect' : 'Book Activity'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.activityCard}>
            <Image
              source={{ uri: params.imageUrl }}
              style={styles.activityImage}
              contentFit="cover"
              transition={300}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.imageGradient}
            />
            <View style={styles.imageContent}>
              <View style={styles.ratingBadge}>
                <Star size={12} color={Colors.secondary} fill={Colors.secondary} />
                <Text style={styles.ratingText}>{params.rating}</Text>
                <Text style={styles.reviewText}>({params.reviewCount})</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.activityTitle}>{params.title}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MapPin size={14} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{params.location}</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={14} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{params.duration}</Text>
              </View>
            </View>

            {params.cancellationPolicy ? (
              <View style={styles.cancellationBadge}>
                <Shield size={14} color={Colors.teal} />
                <Text style={styles.cancellationText}>{params.cancellationPolicy}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.bookingSection}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timeSlotsScroll}
            >
              {TIME_SLOTS.map(slot => (
                <TouchableOpacity
                  key={slot}
                  style={[styles.timeSlot, selectedTimeSlot === slot && styles.timeSlotActive]}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTimeSlot(slot);
                  }}
                >
                  <Text style={[styles.timeSlotText, selectedTimeSlot === slot && styles.timeSlotTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {"$" + price + " x " + guests + " guest" + (guests > 1 ? "s" : "")}
                </Text>
                <Text style={styles.summaryValue}>{"$" + totalPrice}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.totalLabel}>Estimated Total</Text>
                <Text style={styles.totalValue}>
                  {"$" + totalPrice}
                </Text>
              </View>
              <Text style={styles.pricingNote}>Final price confirmed on partner checkout page</Text>
            </View>

            {isRedirect && (
              <View style={styles.redirectNotice}>
                <Globe size={16} color={Colors.teal} />
                <Text style={styles.redirectNoticeText}>
                  You will be redirected to our partner's website in your browser to complete your booking securely.
                </Text>
              </View>
            )}

            {showFallback && lastRedirectUrl ? (
              <View style={styles.fallbackContainer}>
                <View style={styles.fallbackWarning}>
                  <AlertCircle size={16} color={Colors.secondary} />
                  <Text style={styles.fallbackWarningText}>
                    Having trouble? Open the booking link directly in your browser.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.fallbackButton}
                  onPress={handleOpenFallback}
                  activeOpacity={0.8}
                  testID="fallback-open-browser"
                >
                  <ExternalLink size={18} color="#FFFFFF" />
                  <Text style={styles.fallbackButtonText}>Open in Browser</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <ActivitiesDisclaimer variant="banner" />
        </Animated.View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceLabel}>Estimated</Text>
          <Text style={styles.bottomPriceValue}>
            {"$" + totalPrice}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.bookButton, isBooking && styles.bookButtonDisabled]}
          onPress={guardedRedirectBooking}
          disabled={isBooking || bookingComplete}
          activeOpacity={0.8}
          testID="confirm-booking-button"
        >
          {isBooking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <ExternalLink size={18} color="#FFFFFF" />
              <Text style={styles.bookButtonText}>View on Partner Site</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  activityCard: {
    height: 200,
    position: 'relative',
  },
  activityImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  imageContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  reviewText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  detailsSection: {
    padding: 16,
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    lineHeight: 26,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
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
  cancellationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.tealMuted,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancellationText: {
    fontSize: 13,
    color: Colors.teal,
    fontWeight: '600' as const,
    flex: 1,
  },
  bookingSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  timeSlotsScroll: {
    gap: 8,
    marginBottom: 16,
  },
  timeSlot: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeSlotActive: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  timeSlotTextActive: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  summaryTotal: {
    marginBottom: 0,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pricingNote: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontStyle: 'italic' as const,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.teal,
  },
  formSection: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  redirectNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.tealMuted,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  redirectNoticeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.teal,
    lineHeight: 19,
  },
  fallbackContainer: {
    marginTop: 16,
    gap: 12,
  },
  fallbackWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.secondaryMuted,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  fallbackWarningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.secondary,
    lineHeight: 19,
    fontWeight: '500' as const,
  },
  fallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.deepBlueLight,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  fallbackButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomPrice: {},
  bottomPriceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bottomPriceValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.teal,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.teal,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});

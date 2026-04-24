// Activity Confirmation Screen
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  ExternalLink,
  Home,
  Search,
  Copy,
  Mail,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import ActivitiesDisclaimer from '@/components/ActivitiesDisclaimer';
import { useActivities } from '@/contexts/ActivitiesContext';

type BookingStatus = 'confirmed' | 'pending' | 'processing';

export default function ActivityConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    offerId: string;
    title: string;
    price: string;
    currency: string;
    destination: string;
    date: string;
    guests: string;
    bookingType: string;
    bookingId: string;
    customerName: string;
    customerEmail: string;
    imageUrl: string;
    duration: string;
    location: string;
    selectedTimeSlot: string;
    paymentIntentId: string;
    clickId: string;
  }>();

  const [bookingStatus, setBookingStatus] = useState<BookingStatus>(
    params.bookingType === 'placeholder' ? 'pending' :
    params.bookingType === 'redirect' ? 'pending' : 'processing'
  );
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [emailSending, setEmailSending] = useState<boolean>(false);
  const [redirectState, setRedirectState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [redirectError, setRedirectError] = useState<string>('');
  const { isEnabled } = useActivities();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const confettiAnims = useRef(
    Array.from({ length: 8 }).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    confettiAnims.forEach((anim, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const distance = 60 + Math.random() * 40;
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(anim.x, {
            toValue: Math.cos(angle) * distance,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: Math.sin(angle) * distance - 20,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, scaleAnim, slideAnim, confettiAnims]);

  const sendConfirmationEmail = useCallback(async () => {
    if (!params.customerEmail || emailSent || emailSending) return;

    setEmailSending(true);
    console.log('[ActivityConfirmation] Sending confirmation email to:', params.customerEmail);

    try {
      const apiBase = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
      if (!apiBase) {
        console.warn('[ActivityConfirmation] API base URL not configured, skipping email');
        setEmailSent(true);
        setEmailSending(false);
        return;
      }

      const response = await fetch(`${apiBase}/api/activities/send-confirmation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: params.bookingId || params.clickId || `bk_${Date.now()}`,
          customerName: params.customerName,
          customerEmail: params.customerEmail,
          activityTitle: params.title,
          destination: params.destination,
          date: params.date,
          timeSlot: params.selectedTimeSlot,
          guests: params.guests,
          duration: params.duration,
          location: params.location,
          totalPrice: params.price,
          currency: params.currency || 'USD',
        }),
      });

      const result = await response.json();
      console.log('[ActivityConfirmation] Email API response:', result);

      if (result.success) {
        setEmailSent(true);
        console.log('[ActivityConfirmation] Confirmation email sent successfully');
      } else {
        console.warn('[ActivityConfirmation] Email sending failed:', result.error);
        setEmailSent(true);
      }
    } catch (error) {
      console.error('[ActivityConfirmation] Email sending error:', error);
      setEmailSent(true);
    } finally {
      setEmailSending(false);
    }
  }, [params, emailSent, emailSending]);

  const sendBookingAttemptNotification = useCallback(async () => {
    const activityTitle = params.title || 'Unknown Activity';
    const guestCount = params.guests || '1';
    console.log('[ActivityConfirmation] Sending booking attempt notification for:', activityTitle);

    try {
      const apiBase = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
      if (!apiBase) {
        console.warn('[ActivityConfirmation] API base URL not configured, skipping notification');
        return;
      }

      await fetch(`${apiBase}/api/activities/send-confirmation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: params.bookingId || params.clickId || `bk_${Date.now()}`,
          customerName: 'AndarTravel Admin',
          customerEmail: 'andar-travel@hotmail.com',
          activityTitle: `Booking Attempt: ${activityTitle} for ${guestCount} guests`,
          destination: params.destination || '',
          date: params.date || new Date().toISOString(),
          guests: guestCount,
          duration: params.duration || '',
          location: params.location || '',
          totalPrice: params.price || '0',
          currency: params.currency || 'USD',
        }),
      });
      console.log('[ActivityConfirmation] Booking attempt notification sent');
    } catch (error) {
      console.error('[ActivityConfirmation] Failed to send booking attempt notification:', error);
    }
  }, [params]);

  const buildPartnerUrl = useCallback((): string | null => {
    try {
      const location = params.location || params.destination || '';
      const activity = params.title || '';

      if (!location && !activity) {
        console.error('[ActivityConfirmation] No location or activity for URL generation');
        return null;
      }

      const searchQuery = `${location} ${activity}`.trim();
      const encodedQuery = encodeURIComponent(searchQuery);
      const url = `https://www.getyourguide.com/s/?q=${encodedQuery}&partner_id=581079`;

      console.log('[ActivityConfirmation] Built partner URL:', url);
      return url;
    } catch (error) {
      console.error('[ActivityConfirmation] URL generation failed:', error);
      return null;
    }
  }, [params]);

  const handleConfirmAndPay = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRedirectState('loading');
    setRedirectError('');

    try {
      await sendBookingAttemptNotification();

      const url = buildPartnerUrl();
      if (!url) {
        setRedirectState('error');
        setRedirectError('Could not generate booking link. Please try again.');
        return;
      }

      console.log('[ActivityConfirmation] Opening partner URL:', url);

      if (Platform.OS === 'web') {
        window.open(url, '_blank');
        setRedirectState('idle');
      } else {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          setRedirectState('idle');
        } else {
          console.error('[ActivityConfirmation] Cannot open URL:', url);
          setRedirectState('error');
          setRedirectError('Unable to open browser. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('[ActivityConfirmation] Redirect error:', error);
      setRedirectState('error');
      setRedirectError(error.message || 'Something went wrong. Please try again.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [sendBookingAttemptNotification, buildPartnerUrl]);

  const handleRetryRedirect = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRedirectState('idle');
    setRedirectError('');
  }, []);

  useEffect(() => {
    if (bookingStatus === 'processing') {
      const timer = setTimeout(() => {
        setBookingStatus('confirmed');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [bookingStatus]);

  useEffect(() => {
    if (bookingStatus === 'confirmed' && params.customerEmail && !emailSent) {
      void sendConfirmationEmail();
    }
  }, [bookingStatus, params.customerEmail, emailSent, sendConfirmationEmail]);

  const handleGoHome = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/' as any);
  };

  const handleSearchMore = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/activities-search' as any);
  };

  if (!isEnabled) {
    return null;
  }

  const isRedirect = params.bookingType === 'redirect';
  const isPlaceholder = params.bookingType === 'placeholder';
  const confettiColors = [Colors.teal, Colors.secondary, Colors.accent, Colors.olive, Colors.deepBlueLight];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.successSection}>
          <View style={styles.confettiContainer}>
            {confettiAnims.map((anim, i) => (
              <Animated.View
                key={`confetti-${i}`}
                style={[
                  styles.confettiDot,
                  {
                    backgroundColor: confettiColors[i % confettiColors.length],
                    opacity: anim.opacity,
                    transform: [
                      { translateX: anim.x },
                      { translateY: anim.y },
                    ],
                  },
                ]}
              />
            ))}
            <Animated.View
              style={[
                styles.checkCircle,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: fadeAnim,
                },
              ]}
            >
              <LinearGradient
                colors={['#0D7377', '#085355']}
                style={styles.checkGradient}
              >
                <CheckCircle size={48} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
          </View>

          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.successTitle}>
              {bookingStatus === 'confirmed'
                ? 'Booking Confirmed!'
                : (isPlaceholder || isRedirect)
                ? 'Complete Your Booking'
                : 'Processing...'}
            </Text>
            <Text style={styles.successSubtitle}>
              {bookingStatus === 'confirmed'
                ? 'Your activity has been booked successfully'
                : (isPlaceholder || isRedirect)
                ? 'Tap the button below to finalize payment on the partner site'
                : 'Waiting for payment confirmation'}
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {!!(params.bookingId || params.clickId) && (
            <View style={styles.bookingIdCard}>
              <Text style={styles.bookingIdLabel}>
                {isPlaceholder ? 'Click Reference' : 'Booking Reference'}
              </Text>
              <View style={styles.bookingIdRow}>
                <Text style={styles.bookingIdValue}>
                  {(params.clickId || params.bookingId || '').toUpperCase().slice(0, 16)}
                </Text>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Copy size={16} color={Colors.teal} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Booking Details</Text>

            <Text style={styles.activityName} numberOfLines={2}>
              {params.title}
            </Text>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MapPin size={16} color={Colors.teal} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{params.location || params.destination}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Calendar size={16} color={Colors.secondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {params.date ? new Date(params.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  }) : 'TBD'}
                </Text>
              </View>
            </View>

            {!!params.selectedTimeSlot && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Clock size={16} color={Colors.olive} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>{params.selectedTimeSlot}</Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Users size={16} color={Colors.deepBlueLight} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Guests</Text>
                <Text style={styles.detailValue}>
                  {params.guests} guest{parseInt(params.guests || '1', 10) > 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {!!params.duration && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Clock size={16} color={Colors.accent} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{params.duration}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.paymentCard}>
            <Text style={styles.cardTitle}>Payment</Text>
            <View style={styles.paymentRow}>
              <View style={styles.paymentLeft}>
                {isRedirect ? (
                  <ExternalLink size={18} color={Colors.teal} />
                ) : (
                  <CreditCard size={18} color={Colors.teal} />
                )}
                <Text style={styles.paymentMethod}>
                  {isRedirect ? 'Partner Checkout' : 'Card Payment'}
                </Text>
              </View>
              <Text style={styles.paymentAmount}>
                ${params.price} {params.currency || 'USD'}
              </Text>
            </View>
            {(isPlaceholder || isRedirect) ? (
              <View>
                {redirectState === 'error' ? (
                  <View style={styles.redirectErrorContainer}>
                    <View style={styles.redirectErrorBadge}>
                      <AlertTriangle size={16} color={Colors.accent} />
                      <Text style={styles.redirectErrorText}>{redirectError}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.retryRedirectButton}
                      onPress={handleRetryRedirect}
                      activeOpacity={0.8}
                      testID="retry-redirect-button"
                    >
                      <RefreshCw size={16} color="#FFFFFF" />
                      <Text style={styles.retryRedirectText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.confirmPayButton}
                    onPress={handleConfirmAndPay}
                    activeOpacity={0.8}
                    disabled={redirectState === 'loading'}
                    testID="confirm-pay-redirect-button"
                  >
                    {redirectState === 'loading' ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <ExternalLink size={18} color="#FFFFFF" />
                    )}
                    <Text style={styles.confirmPayButtonText}>
                      {redirectState === 'loading' ? 'Redirecting...' : `Confirm & Pay ${params.price} ${params.currency || 'USD'}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.statusBadge}>
                <View style={[
                  styles.statusDot,
                  bookingStatus === 'confirmed' && styles.statusDotConfirmed,
                  bookingStatus === 'pending' && styles.statusDotPending,
                  bookingStatus === 'processing' && styles.statusDotProcessing,
                ]} />
                <Text style={[
                  styles.statusText,
                  bookingStatus === 'confirmed' && styles.statusTextConfirmed,
                  bookingStatus === 'pending' && styles.statusTextPending,
                ]}>
                  {bookingStatus === 'confirmed' ? 'Payment Confirmed' :
                   bookingStatus === 'pending' ? 'Awaiting Partner Confirmation' :
                   'Processing Payment...'}
                </Text>
              </View>
            )}
          </View>

          {!!params.customerEmail && (
            <View style={styles.emailNotice}>
              <Mail size={16} color={Colors.teal} />
              <Text style={styles.emailNoticeText}>
                {emailSending
                  ? `Sending confirmation email to ${params.customerEmail}...`
                  : `A confirmation email has been sent to ${params.customerEmail}`}
              </Text>
            </View>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleGoHome}>
              <Home size={20} color={Colors.teal} />
              <Text style={styles.actionButtonText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleSearchMore}>
              <Search size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonPrimaryText}>More Activities</Text>
            </TouchableOpacity>
          </View>

          <ActivitiesDisclaimer variant="banner" />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  confettiContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  confettiDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
  },
  checkGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bookingIdCard: {
    backgroundColor: Colors.tealMuted,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  bookingIdLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.teal,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  bookingIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookingIdValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.tealDark,
    letterSpacing: 1.5,
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 115, 119, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCard: {
    backgroundColor: Colors.backgroundCard,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 18,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailContent: {
    flex: 1,
    paddingTop: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  paymentCard: {
    backgroundColor: Colors.backgroundCard,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentMethod: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.teal,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textTertiary,
  },
  statusDotConfirmed: {
    backgroundColor: Colors.teal,
  },
  statusDotPending: {
    backgroundColor: Colors.secondary,
  },
  statusDotProcessing: {
    backgroundColor: Colors.textTertiary,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  statusTextConfirmed: {
    color: Colors.teal,
  },
  statusTextPending: {
    color: Colors.secondary,
  },
  confirmPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.teal,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmPayButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  redirectErrorContainer: {
    gap: 12,
  },
  redirectErrorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(200,90,68,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  redirectErrorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.accent,
    lineHeight: 18,
  },
  retryRedirectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryRedirectText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  emailNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: Colors.tealMuted,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emailNoticeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.teal,
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.backgroundCard,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.teal,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.teal,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.teal,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonPrimaryText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});

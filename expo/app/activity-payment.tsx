// Activity Payment Screen
import React, { useState, useCallback, useRef, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Lock,
  Shield,
  CheckCircle,
  ExternalLink,
  CreditCard,
  ChevronRight,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import ActivitiesDisclaimer from '@/components/ActivitiesDisclaimer';

type PaymentState = 'ready' | 'loading_checkout' | 'checkout_open' | 'success' | 'error';

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/cNi14m2YG2528FXeqt5Rm01';

export default function ActivityPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    offerId: string;
    title: string;
    price: string;
    currency: string;
    partnerId: string;
    guests: string;
    date: string;
    destination: string;
    clickId: string;
    quoteId: string;
    customerName: string;
    customerEmail: string;
    imageUrl: string;
    duration: string;
    location: string;
    selectedTimeSlot: string;
  }>();

  const [paymentState, setPaymentState] = useState<PaymentState>('ready');
  const [errorMessage, setErrorMessage] = useState('');
  const [checkoutOpened, setCheckoutOpened] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const price = parseFloat(params.price || '0');
  const guests = parseInt(params.guests || '2', 10);
  const totalPrice = price * guests;
  const serviceFee = Math.round(totalPrice * 0.05);
  const grandTotal = totalPrice + serviceFee;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (paymentState === 'loading_checkout') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [paymentState, pulseAnim]);

  const navigateToConfirmation = useCallback(() => {
    router.push({
      pathname: '/activity-confirmation' as any,
      params: {
        offerId: params.offerId,
        title: params.title,
        price: grandTotal.toString(),
        currency: params.currency || 'USD',
        destination: params.destination,
        date: params.date,
        guests: params.guests,
        bookingType: 'api',
        bookingId: `bk_${Date.now()}`,
        customerName: params.customerName || '',
        customerEmail: params.customerEmail || '',
        imageUrl: params.imageUrl,
        duration: params.duration,
        location: params.location,
        selectedTimeSlot: params.selectedTimeSlot,
        paymentIntentId: '',
      },
    });
  }, [params, grandTotal, router]);

  const handleOpenCheckout = useCallback(async () => {
    try {
      console.log('[ActivityPayment] Opening Stripe Payment Link:', STRIPE_PAYMENT_LINK);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.open(STRIPE_PAYMENT_LINK, '_blank', 'noopener,noreferrer');
        }
      } else {
        const supported = await Linking.canOpenURL(STRIPE_PAYMENT_LINK);
        if (!supported) {
          throw new Error('Cannot open checkout URL');
        }
        await Linking.openURL(STRIPE_PAYMENT_LINK);
      }
      setCheckoutOpened(true);
    } catch (err) {
      console.error('[ActivityPayment] Failed to open checkout:', err);
      setErrorMessage('Unable to open secure checkout. Please try again.');
      setPaymentState('error');
    }
  }, []);

  const handlePaymentComplete = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPaymentState('success');
    setTimeout(navigateToConfirmation, 1500);
  }, [navigateToConfirmation]);

  const handleRetry = useCallback(() => {
    setPaymentState('ready');
    setErrorMessage('');
    setCheckoutOpened(false);
  }, []);

  const renderCheckoutButton = () => (
    <TouchableOpacity
      style={styles.stripeButton}
      onPress={handleOpenCheckout}
      activeOpacity={0.85}
      testID="stripe-payment-link-button"
    >
      <Lock size={18} color="#FFFFFF" />
      <Text style={styles.stripeButtonText}>
        {checkoutOpened ? 'Reopen Secure Checkout' : `Pay ${grandTotal} with Stripe`}
      </Text>
      <ExternalLink size={16} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={paymentState === 'loading_checkout'}
        >
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <Lock size={18} color={Colors.teal} />
      </View>

      {paymentState === 'loading_checkout' ? (
        <View style={styles.processingContainer}>
          <Animated.View style={[styles.processingCircle, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={['#0D7377', '#085355']}
              style={styles.processingGradient}
            >
              <ActivityIndicator size="large" color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.processingTitle}>Setting Up Payment...</Text>
          <Text style={styles.processingSubtitle}>Connecting to secure checkout</Text>
          <View style={styles.securityBadge}>
            <Shield size={14} color={Colors.teal} />
            <Text style={styles.securityText}>Powered by Stripe — PCI Level 1 certified</Text>
          </View>
        </View>
      ) : paymentState === 'success' ? (
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <CheckCircle size={56} color={Colors.teal} />
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>Redirecting to confirmation...</Text>
        </View>
      ) : paymentState === 'error' ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorCircle}>
            <ExternalLink size={56} color={Colors.accent} />
          </View>
          <Text style={styles.errorTitle}>Payment Failed</Text>
          <Text style={styles.errorSubtitle}>
            {errorMessage || 'Something went wrong. Please try again.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View style={[styles.readyContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <Text style={styles.summaryActivity} numberOfLines={2}>{params.title}</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  ${price} × {guests} guest{guests > 1 ? 's' : ''}
                </Text>
                <Text style={styles.summaryValue}>${totalPrice}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service fee</Text>
                <Text style={styles.summaryValue}>${serviceFee}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${grandTotal}</Text>
              </View>
            </View>

            <View style={styles.checkoutSection}>
              <View style={styles.checkoutSectionHeader}>
                <CreditCard size={18} color={Colors.teal} />
                <Text style={styles.checkoutSectionTitle}>Secure Payment</Text>
              </View>
              <Text style={styles.checkoutSectionHint}>
                Complete your purchase using the button below. Stripe handles all payment methods securely.
              </Text>
              {renderCheckoutButton()}
              {checkoutOpened ? (
                <Text style={styles.checkoutOpenedHint} testID="checkout-opened-hint">
                  {'Checkout opened in a new window. Once you complete your payment, tap "I\'ve Completed Payment" below.'}
                </Text>
              ) : null}
            </View>

            <View style={styles.securityNotice}>
              <Shield size={16} color={Colors.teal} />
              <Text style={styles.securityNoticeText}>
                All payments are processed securely by Stripe. Your card details never touch our servers.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.completeButton}
              onPress={handlePaymentComplete}
              activeOpacity={0.8}
              testID="payment-complete-button"
            >
              <CheckCircle size={18} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>{"I've Completed Payment"}</Text>
              <ChevronRight size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <ActivitiesDisclaimer variant="inline" />
          </ScrollView>
        </Animated.View>
      )}
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
  readyContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  orderSummary: {
    backgroundColor: Colors.backgroundCard,
    margin: 16,
    marginBottom: 8,
    borderRadius: 18,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  summaryActivity: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  summaryTotalRow: {
    marginBottom: 0,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
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
  checkoutSection: {
    backgroundColor: Colors.backgroundCard,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 18,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  checkoutSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  checkoutSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  checkoutSectionHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 16,
  },
  stripeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#635BFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: '#635BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  stripeButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  checkoutOpenedHint: {
    marginTop: 12,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    textAlign: 'center' as const,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.tealMuted,
    borderRadius: 12,
  },
  securityNoticeText: {
    flex: 1,
    fontSize: 12,
    color: Colors.tealDark,
    lineHeight: 17,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.teal,
    marginHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 12,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  processingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 24,
  },
  processingGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  processingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 28,
    textAlign: 'center' as const,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.tealMuted,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  securityText: {
    fontSize: 13,
    color: Colors.teal,
    fontWeight: '500' as const,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.tealMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.teal,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(200,90,68,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.accent,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 21,
    marginBottom: 28,
  },
  retryButton: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
});

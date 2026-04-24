import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Mail,
  Globe,
  MessageCircle,
  Shield,
  FileText,
  ExternalLink,
  ChevronRight,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

interface ContactRowProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  testID?: string;
}

function ContactRow({ icon, iconBg, title, subtitle, onPress, testID }: ContactRowProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.contactRow}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        testID={testID}
      >
        <View style={[styles.contactIconWrap, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <View style={styles.contactContent}>
          <Text style={styles.contactTitle}>{title}</Text>
          <Text style={styles.contactSubtitle}>{subtitle}</Text>
        </View>
        <ChevronRight size={16} color={Colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ContactScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const openEmail = useCallback((email: string) => {
    const url = `mailto:${email}`;
    if (Platform.OS === 'web') {
      window.open(url);
    } else {
      void Linking.openURL(url);
    }
  }, []);

  const openUrl = useCallback((url: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      void Linking.openURL(url);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.heroSection}>
            <View style={styles.heroIconWrap}>
              <MessageCircle size={32} color={Colors.teal} />
            </View>
            <Text style={styles.heroTitle}>How can we help?</Text>
            <Text style={styles.heroSubtitle}>
              We're here to assist you with any questions about AndarTravel. Reach out through any of the channels below.
            </Text>
          </View>

          <Text style={styles.sectionLabel}>Get in Touch</Text>

          <View style={styles.card}>
            <ContactRow
              icon={<Mail size={18} color="#FFFFFF" />}
              iconBg={Colors.teal}
              title="General Support"
              subtitle="support@andartravel.com"
              onPress={() => openEmail('support@andartravel.com')}
              testID="contact-support-email"
            />
            <ContactRow
              icon={<Shield size={18} color="#FFFFFF" />}
              iconBg="#059669"
              title="Privacy Inquiries"
              subtitle="privacy@andartravel.com"
              onPress={() => openEmail('privacy@andartravel.com')}
              testID="contact-privacy-email"
            />
            <ContactRow
              icon={<FileText size={18} color="#FFFFFF" />}
              iconBg={Colors.deepBlueLight}
              title="Legal & Terms"
              subtitle="legal@andartravel.com"
              onPress={() => openEmail('legal@andartravel.com')}
              testID="contact-legal-email"
            />
            <ContactRow
              icon={<Globe size={18} color="#FFFFFF" />}
              iconBg={Colors.secondary}
              title="Visit Our Website"
              subtitle="andartravel.com"
              onPress={() => openUrl('https://andartravel.com')}
              testID="contact-website"
            />
          </View>

          <Text style={styles.sectionLabel}>Important Notes</Text>

          <View style={styles.noticeCard}>
            <View style={styles.noticeRow}>
              <ExternalLink size={14} color={Colors.teal} />
              <Text style={styles.noticeText}>
                For booking issues, cancellations, or refunds, please contact the booking provider directly (GetYourGuide, Viator, etc.) as AndarTravel does not process payments or manage bookings.
              </Text>
            </View>
          </View>

          <View style={styles.noticeCard}>
            <View style={styles.noticeRow}>
              <Shield size={14} color={Colors.teal} />
              <Text style={styles.noticeText}>
                To exercise your data privacy rights (access, correction, deletion), email privacy@andartravel.com with your request.
              </Text>
            </View>
          </View>

          <View style={styles.quickLinks}>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => router.push('/privacy-policy' as any)}
              activeOpacity={0.7}
            >
              <Shield size={14} color={Colors.teal} />
              <Text style={styles.quickLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => router.push('/terms-of-service' as any)}
              activeOpacity={0.7}
            >
              <FileText size={14} color={Colors.teal} />
              <Text style={styles.quickLinkText}>Terms of Service</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              AndarTravel is a travel discovery platform. We connect travelers with experiences through our affiliate partners.
            </Text>
            <Text style={styles.copyrightText}>{"\u00A9 2026 AndarTravel. All rights reserved."}</Text>
          </View>
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
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.tealMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginLeft: 26,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  noticeCard: {
    backgroundColor: Colors.tealMuted,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.tealDark,
    lineHeight: 19,
  },
  quickLinks: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
  },
  quickLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.backgroundCard,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  quickLinkText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.teal,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  copyrightText: {
    fontSize: 11,
    color: Colors.textTertiary,
    opacity: 0.6,
  },
});

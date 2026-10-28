// Privacy Policy Screen
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, ExternalLink } from 'lucide-react-native';
import Colors from '@/constants/colors';

const LAST_UPDATED = 'March 28, 2026';

const sections = [
  {
    title: '1. Information We Collect',
    body: `We collect information you provide directly, including:
• Search queries (destinations, dates, guest counts)
• Activity selections and partner redirect clicks
• Language and currency preferences
• Device information and usage analytics

We do NOT collect or store:
• Credit card numbers (we never process payments — bookings are completed on our partners' websites)
• Passwords or authentication credentials
• Precise location data without your consent`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use the information we collect to:
• Provide and improve our travel activity search and partner recommendations
• Track affiliate clicks for commission attribution
• Respond to your support requests
• Personalize your experience (language, currency preferences)
• Analyze usage patterns to improve app performance`,
  },
  {
    title: '3. Information Sharing',
    body: `We share information with:
• Booking partners (such as GetYourGuide and Aviasales) — when you tap through to their websites, subject to their own privacy policies
• Affiliate networks — anonymized click tracking for commission attribution

We do NOT sell your personal information to third parties.`,
  },
  {
    title: '4. Payments',
    body: `AndarTravel does not process payments. When you choose an activity or flight, we redirect you to our partner's website (for example GetYourGuide or Aviasales), where your booking and payment are completed under the partner's terms and privacy policy. Any payment information you provide goes directly to the partner and never passes through our servers.`,
  },
  {
    title: '5. Data Retention',
    body: `We retain your data for as long as necessary to provide our services:
• Click and redirect records: retained for 3 years for commission attribution and legal compliance
• Search history: retained for 12 months for service improvement
• Preferences: retained until you change or delete them`,
  },
  {
    title: '6. Your Rights',
    body: `You have the right to:
• Access your personal data
• Request correction of inaccurate data
• Request deletion of your data
• Opt out of marketing communications
• Export your data in a portable format

To exercise these rights, contact us at privacy@andartravel.com.`,
  },
  {
    title: '7. Cookies and Tracking',
    body: `We use essential cookies and tracking for:
• Session management
• Affiliate click attribution (click_id tracking)
• Analytics to improve our services

You can manage cookie preferences in your device settings.`,
  },
  {
    title: '8. Children\'s Privacy',
    body: `AndarTravel is not intended for children under 13. We do not knowingly collect personal information from children under 13.`,
  },
  {
    title: '9. Changes to This Policy',
    body: `We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy in the app.`,
  },
  {
    title: '10. Contact Us',
    body: `If you have questions about this privacy policy, please contact us:
• Email: privacy@andartravel.com
• Website: https://andartravel.com/privacy`,
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.intro}>
            <Text style={styles.appName}>AndarTravel</Text>
            <Text style={styles.lastUpdated}>Last updated: {LAST_UPDATED}</Text>
            <Text style={styles.introText}>
              Your privacy is important to us. This policy explains how AndarTravel collects, uses, and protects your personal information when you use our mobile application.
            </Text>
          </View>

          {sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.externalLink}
            onPress={() => {
              void Linking.openURL('https://andartravel.com');
            }}
          >
            <ExternalLink size={16} color={Colors.teal} />
            <Text style={styles.externalLinkText}>View Online</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By using AndarTravel, you agree to this privacy policy.
            </Text>
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
  intro: {
    padding: 20,
    paddingBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.teal,
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: 14,
  },
  introText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 23,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  externalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.tealMuted,
    borderRadius: 14,
  },
  externalLinkText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.teal,
  },
  footer: {
    marginHorizontal: 20,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

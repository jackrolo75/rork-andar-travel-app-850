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

const LAST_UPDATED = 'April 10, 2026';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: `By downloading, installing, or using the AndarTravel mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, please do not use the App.`,
  },
  {
    title: '2. Description of Service',
    body: `AndarTravel is a travel activity discovery platform that helps users find tours, activities, and experiences worldwide. We act as an intermediary by aggregating listings from third-party providers and redirecting users to partner websites for booking and payment.

AndarTravel does NOT:
\u2022 Directly sell or provide tours or activities
\u2022 Process payments for bookings
\u2022 Guarantee availability, pricing, or quality of third-party services
\u2022 Act as a travel agent or tour operator`,
  },
  {
    title: '3. Affiliate Relationships',
    body: `AndarTravel earns commissions from partner platforms (including GetYourGuide and Travelpayouts) when users make bookings through our affiliate links. This does not affect the price you pay. All prices displayed are sourced from our partners and may vary at the time of booking.`,
  },
  {
    title: '4. Third-Party Services',
    body: `When you click through to book an activity, you are redirected to a third-party website. Your interaction with that website is governed by their terms of service and privacy policy. AndarTravel is not responsible for:

\u2022 Booking confirmations or cancellations
\u2022 Payment processing or refunds
\u2022 Quality of services provided
\u2022 Changes in pricing or availability
\u2022 Disputes between you and the service provider`,
  },
  {
    title: '5. Pricing Disclaimer',
    body: `Prices displayed in the App are indicative and sourced from our affiliate partners. Final pricing is determined by the booking provider at the time of checkout. AndarTravel does not add any markup or service fees to the prices shown. Currency conversions are approximate.`,
  },
  {
    title: '6. User Responsibilities',
    body: `You agree to:
\u2022 Use the App only for lawful purposes
\u2022 Provide accurate information when using search features
\u2022 Not attempt to reverse-engineer, modify, or disrupt the App
\u2022 Not use automated systems to access the App
\u2022 Comply with all applicable local, national, and international laws`,
  },
  {
    title: '7. Intellectual Property',
    body: `All content in the App, including text, graphics, logos, and software, is the property of AndarTravel or its licensors and is protected by intellectual property laws. Activity images and descriptions are sourced from our partners and remain their property.`,
  },
  {
    title: '8. Limitation of Liability',
    body: `To the maximum extent permitted by law, AndarTravel shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from:

\u2022 Your use of or inability to use the App
\u2022 Any third-party services accessed through the App
\u2022 Unauthorized access to your data
\u2022 Errors or omissions in content
\u2022 Loss of profits, data, or business opportunities`,
  },
  {
    title: '9. Disclaimer of Warranties',
    body: `The App is provided "as is" and "as available" without warranties of any kind. AndarTravel does not warrant that the App will be uninterrupted, error-free, or free of harmful components.`,
  },
  {
    title: '10. Modifications',
    body: `We reserve the right to modify these Terms at any time. Changes will be effective upon posting in the App. Continued use of the App after changes constitutes acceptance of the updated Terms.`,
  },
  {
    title: '11. Termination',
    body: `We may suspend or terminate your access to the App at any time, without notice, for conduct that we believe violates these Terms or is harmful to other users or third parties.`,
  },
  {
    title: '12. Governing Law',
    body: `These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which AndarTravel operates, without regard to conflict of law principles.`,
  },
  {
    title: '13. Contact',
    body: `For questions about these Terms of Service, please contact us:
\u2022 Email: legal@andartravel.com
\u2022 Website: https://andartravel.com/terms`,
  },
];

export default function TermsOfServiceScreen() {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
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
              Please read these Terms of Service carefully before using the AndarTravel mobile application.
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
              void Linking.openURL('https://andartravel.com/terms');
            }}
          >
            <ExternalLink size={16} color={Colors.teal} />
            <Text style={styles.externalLinkText}>View Online</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By using AndarTravel, you agree to these Terms of Service.
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

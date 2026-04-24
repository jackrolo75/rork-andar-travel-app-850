import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Info, ShieldCheck } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { ACTIVITIES_DISCLAIMER } from '@/types/activities';
import { PRICING_NOTICE } from '@/constants/affiliateLinks';

interface ActivitiesDisclaimerProps {
  variant?: 'inline' | 'banner';
}

export default function ActivitiesDisclaimer({ variant = 'inline' }: ActivitiesDisclaimerProps) {
  if (variant === 'banner') {
    return (
      <View>
        <View style={styles.bannerContainer}>
          <View style={styles.bannerIconRow}>
            <Info size={14} color={Colors.textTertiary} />
            <Text style={styles.bannerLabel}>Legal Notice</Text>
          </View>
          <Text style={styles.bannerText}>{ACTIVITIES_DISCLAIMER}</Text>
        </View>
        <View style={styles.pricingContainer}>
          <View style={styles.bannerIconRow}>
            <ShieldCheck size={14} color={Colors.teal} />
            <Text style={styles.pricingLabel}>Pricing Transparency</Text>
          </View>
          <Text style={styles.pricingText}>{PRICING_NOTICE}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.inlineContainer}>
      <Info size={12} color={Colors.textTertiary} />
      <Text style={styles.inlineText}>{ACTIVITIES_DISCLAIMER}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  inlineText: {
    flex: 1,
    fontSize: 10,
    color: Colors.textTertiary,
    lineHeight: 15,
    letterSpacing: 0.1,
  },
  bannerContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  bannerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  bannerText: {
    fontSize: 11,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
  pricingContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.tealMuted,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  pricingLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.teal,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  pricingText: {
    fontSize: 11,
    color: Colors.tealDark,
    lineHeight: 16,
  },
});

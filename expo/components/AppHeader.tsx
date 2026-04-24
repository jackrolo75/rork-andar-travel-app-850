import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const LOGO_URL = 'https://r2-pub.rork.com/generated-images/69f5f244-62ba-44ef-a495-c801c0f8e231.png';

interface AppHeaderProps {
  rightContent?: React.ReactNode;
}

export default function AppHeader({ rightContent }: AppHeaderProps) {
  const router = useRouter();

  const handleLogoPress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)');
  }, [router]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.logoRow}
        onPress={handleLogoPress}
        activeOpacity={0.7}
        testID="app-header-logo"
      >
        <Image
          source={{ uri: LOGO_URL }}
          style={styles.logoIcon}
          contentFit="contain"
          transition={200}
        />
        <Text style={styles.logoText}>AndarTravel</Text>
      </TouchableOpacity>
      {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 48,
    height: 48,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.teal,
    letterSpacing: -0.3,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

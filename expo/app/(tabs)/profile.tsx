import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  FlatList,
  Pressable,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  Heart,
  ChevronRight,
  Bell,
  CreditCard,
  Check,
  X,
  Languages,
  Banknote,
  FileText,
  Shield,
  HelpCircle,
  Globe,
  Camera,
  Home,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useRouter } from 'expo-router';
import OfflineBanner from '@/components/OfflineBanner';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { LANGUAGES } from '@/constants/languages';
import { CURRENCIES } from '@/constants/currencies';
import { AFFILIATE_DISCLOSURE } from '@/constants/affiliateLinks';

type PickerMode = 'language' | 'currency' | null;

const PROFILE_IMAGE_KEY = 'andar_profile_image';

interface SettingsRowProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  testID?: string;
}

function SettingsRow({ icon, iconBg, label, value, onPress, isLast, testID }: SettingsRowProps) {
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
        style={[styles.row, !isLast && styles.rowBorder]}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        testID={testID}
      >
        <View style={[styles.rowIconWrap, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <ChevronRight size={16} color={Colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const { favorites, recentBookings } = useActivities();
  const { t, language, currency, setLanguage, setCurrency, currentLanguage, currentCurrency } = useLocale();
  const router = useRouter();
  const { isConnected, isChecking, checkConnection } = useNetworkStatus();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  useEffect(() => {
    AsyncStorage.getItem(PROFILE_IMAGE_KEY).then((uri) => {
      if (uri) {
        setProfileImage(uri);
        console.log('[Profile] Loaded profile image from storage');
      }
    }).catch((err) => {
      console.error('[Profile] Failed to load profile image:', err);
    });
  }, []);

  const handlePickProfileImage = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please allow access to your photo library to set a profile picture.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setProfileImage(uri);
        await AsyncStorage.setItem(PROFILE_IMAGE_KEY, uri);
        console.log('[Profile] Profile image saved:', uri);
      }
    } catch (err) {
      console.error('[Profile] Image picker error:', err);
      Alert.alert('Error', 'Could not select image. Please try again.');
    }
  }, []);

  const handleGoHome = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)');
  }, [router]);

  const handleOpenFavorites = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/favorites' as any);
  }, [router]);

  const handleOpenPromotions = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/promotions' as any);
  }, [router]);

  const handleOpenLanguagePicker = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPickerMode('language');
  }, []);

  const handleOpenCurrencyPicker = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPickerMode('currency');
  }, []);

  const handleSelectLanguage = useCallback((code: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void setLanguage(code);
    setPickerMode(null);
  }, [setLanguage]);

  const handleSelectCurrency = useCallback((code: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void setCurrency(code);
    setPickerMode(null);
  }, [setCurrency]);

  const handleClosePicker = useCallback(() => {
    setPickerMode(null);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OfflineBanner visible={!isConnected} onRetry={checkConnection} isRetrying={isChecking} />

      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          <TouchableOpacity
            style={styles.profileCard}
            onPress={handleGoHome}
            activeOpacity={0.8}
            testID="profile-go-home"
          >
            <View style={styles.avatarOuter}>
              <TouchableOpacity
                style={styles.avatarTouchable}
                onPress={handlePickProfileImage}
                activeOpacity={0.7}
                testID="profile-avatar-upload"
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <User size={26} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.cameraOverlay}>
                  <Camera size={12} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{t('traveler')}</Text>
              <Text style={styles.profileSub}>{t('explore_world')}</Text>
              <View style={styles.homeLink}>
                <Home size={11} color={Colors.teal} />
                <Text style={styles.homeLinkText}>Go to Homepage</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.statsBar}>
            <View style={styles.statPill}>
              <Text style={styles.statNum}>{recentBookings.length}</Text>
              <Text style={styles.statText}>{t('bookings')}</Text>
            </View>
            <TouchableOpacity
              style={styles.statPill}
              onPress={handleOpenFavorites}
              activeOpacity={0.7}
              testID="profile-favorites-stat"
            >
              <Text style={styles.statNum}>{favorites.length}</Text>
              <Text style={styles.statText}>{t('my_favorites')}</Text>
              <ChevronRight size={12} color={Colors.teal} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeader}>{t('account')}</Text>
          <View style={styles.card}>
            <SettingsRow
              icon={<Heart size={18} color="#FFFFFF" />}
              iconBg={Colors.secondary}
              label={t('my_favorites')}
              value={favorites.length > 0 ? `${favorites.length}` : undefined}
              onPress={handleOpenFavorites}
              testID="settings-favorites"
            />
            <SettingsRow
              icon={<CreditCard size={18} color="#FFFFFF" />}
              iconBg={Colors.teal}
              label={t('payment_methods')}
              testID="settings-payment"
            />
            <SettingsRow
              icon={<Bell size={18} color="#FFFFFF" />}
              iconBg="#F59E0B"
              label={t('notifications')}
              onPress={handleOpenPromotions}
              isLast
              testID="settings-notifications"
            />
          </View>

          <Text style={styles.sectionHeader}>{t('preferences')}</Text>
          <View style={styles.card}>
            <SettingsRow
              icon={<Languages size={18} color="#FFFFFF" />}
              iconBg={Colors.deepBlueLight}
              label={t('select_language')}
              value={`${currentLanguage.flag} ${currentLanguage.nativeLabel}`}
              onPress={handleOpenLanguagePicker}
              testID="settings-language"
            />
            <SettingsRow
              icon={<Banknote size={18} color="#FFFFFF" />}
              iconBg={Colors.olive}
              label={t('select_currency')}
              value={`${currentCurrency.symbol} ${currentCurrency.code}`}
              onPress={handleOpenCurrencyPicker}
              isLast
              testID="settings-currency"
            />
          </View>

          <Text style={styles.sectionHeader}>{t('legal')}</Text>
          <View style={styles.card}>
            <SettingsRow
              icon={<Shield size={18} color="#FFFFFF" />}
              iconBg={Colors.teal}
              label={t('privacy_policy')}
              onPress={() => router.push('/privacy-policy' as any)}
              testID="settings-privacy"
            />
            <SettingsRow
              icon={<FileText size={18} color="#FFFFFF" />}
              iconBg={Colors.deepBlueLight}
              label={t('terms_of_service')}
              onPress={() => router.push('/terms-of-service' as any)}
              testID="settings-terms"
            />
            <SettingsRow
              icon={<HelpCircle size={18} color="#FFFFFF" />}
              iconBg={Colors.textSecondary}
              label={t('help_center')}
              onPress={() => router.push('/contact' as any)}
              testID="settings-help"
            />
            <SettingsRow
              icon={<Globe size={18} color="#FFFFFF" />}
              iconBg={Colors.tealLight}
              label={t('about')}
              value={t('version')}
              isLast
              testID="settings-about"
            />
          </View>

          <View style={styles.affiliateFooter}>
            <Text style={styles.affiliateText}>{AFFILIATE_DISCLOSURE}</Text>
          </View>

          <View style={styles.versionFooter}>
            <Text style={styles.versionText}>AndarTravel v1.0.0</Text>
            <Text style={styles.copyrightText}>{"© 2026 AndarTravel. All rights reserved."}</Text>
          </View>

        </Animated.View>
      </ScrollView>

      <Modal
        visible={pickerMode !== null}
        transparent
        animationType="slide"
        onRequestClose={handleClosePicker}
      >
        <Pressable style={styles.modalOverlay} onPress={handleClosePicker}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {pickerMode === 'language' ? t('select_language') : t('select_currency')}
              </Text>
              <TouchableOpacity onPress={handleClosePicker} style={styles.modalClose}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {pickerMode === 'language' && (
              <FlatList
                data={LANGUAGES}
                keyExtractor={(item) => item.code}
                contentContainerStyle={styles.pickerList}
                renderItem={({ item }) => {
                  const isSelected = item.code === language;
                  return (
                    <TouchableOpacity
                      style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                      onPress={() => handleSelectLanguage(item.code)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pickerFlag}>{item.flag}</Text>
                      <View style={styles.pickerItemContent}>
                        <Text style={[styles.pickerItemLabel, isSelected && styles.pickerItemLabelSelected]}>
                          {item.nativeLabel}
                        </Text>
                        <Text style={styles.pickerItemSub}>{item.label}</Text>
                      </View>
                      {isSelected && (
                        <View style={styles.pickerCheck}>
                          <Check size={18} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            {pickerMode === 'currency' && (
              <FlatList
                data={CURRENCIES}
                keyExtractor={(item) => item.code}
                contentContainerStyle={styles.pickerList}
                renderItem={({ item }) => {
                  const isSelected = item.code === currency;
                  return (
                    <TouchableOpacity
                      style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                      onPress={() => handleSelectCurrency(item.code)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.pickerSymbol}>
                        <Text style={styles.pickerSymbolText}>{item.symbol}</Text>
                      </View>
                      <View style={styles.pickerItemContent}>
                        <Text style={[styles.pickerItemLabel, isSelected && styles.pickerItemLabelSelected]}>
                          {item.code}
                        </Text>
                        <Text style={styles.pickerItemSub}>{item.name}</Text>
                      </View>
                      {isSelected && (
                        <View style={styles.pickerCheck}>
                          <Check size={18} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBar: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarOuter: {
    marginRight: 14,
  },
  avatarTouchable: {
    position: 'relative' as const,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  cameraOverlay: {
    position: 'absolute' as const,
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.backgroundCard,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  profileSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  homeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  homeLinkText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.teal,
  },
  statsBar: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 8,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.teal,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    flex: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginTop: 28,
    marginBottom: 10,
    marginLeft: 6,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  rowValue: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
    marginRight: 6,
  },
  affiliateFooter: {
    paddingHorizontal: 4,
    paddingTop: 24,
    paddingBottom: 4,
  },
  affiliateText: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 14,
    fontStyle: 'italic' as const,
  },
  versionFooter: {
    alignItems: 'center',
    marginTop: 16,
    paddingBottom: 20,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 11,
    color: Colors.textTertiary,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 4,
  },
  pickerItemSelected: {
    backgroundColor: Colors.tealMuted,
  },
  pickerFlag: {
    fontSize: 28,
    marginRight: 14,
  },
  pickerSymbol: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pickerSymbolText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  pickerItemContent: {
    flex: 1,
  },
  pickerItemLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  pickerItemLabelSelected: {
    color: Colors.teal,
  },
  pickerItemSub: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  pickerCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

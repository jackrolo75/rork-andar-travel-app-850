// Activities Search Screen
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  Mountain,
  Landmark,
  Utensils,
  Leaf,
  Heart,
  Waves,
  Moon,
  Ticket,
  Minus,
  Plus,
  Navigation,
  Maximize2,
  CheckCircle,
  ExternalLink,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import SixMonthCalendar from '@/components/SixMonthCalendar';
import ActivitiesDisclaimer from '@/components/ActivitiesDisclaimer';
import { ActivityCategory } from '@/types/activities';
import { resolvePlace, getKnownPlaceNames, getStaticMapUrl } from '@/services/GeocodingService';
import { buildPartnerCategoryUrl, buildPartnerAffiliateUrl, getPartnerNameForCategory } from '@/constants/partnerRouting';

const POPULAR_DESTINATIONS = getKnownPlaceNames().slice(0, 10);

const ACTIVITY_CATEGORIES: { id: ActivityCategory; label: string; icon: React.ComponentType<any>; color: string }[] = [
  { id: 'adventure', label: 'Adventure', icon: Mountain, color: '#E27D60' },
  { id: 'culture', label: 'Culture', icon: Landmark, color: '#1A3A5C' },
  { id: 'food', label: 'Food & Drink', icon: Utensils, color: '#E8A87C' },
  { id: 'nature', label: 'Nature', icon: Leaf, color: '#85A392' },
  { id: 'wellness', label: 'Wellness', icon: Heart, color: '#C85A44' },
  { id: 'water', label: 'Water Sports', icon: Waves, color: '#0D7377' },
  { id: 'nightlife', label: 'Nightlife', icon: Moon, color: '#8B5CF6' },
  { id: 'tickets', label: 'Tickets', icon: Ticket, color: '#2A5A8C' },
];

const RADIUS_PRESETS = [10, 25, 50, 100, 200];

export default function ActivitiesSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guests, setGuests] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(
    (params.category as ActivityCategory) || null
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [strictLocation, setStrictLocation] = useState(true);
  const [radiusKm, setRadiusKm] = useState(50);

  const resolved = useMemo(() => {
    if (!destination || destination.length < 2) return null;
    return resolvePlace(destination);
  }, [destination]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const mapFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (resolved) {
      Animated.timing(mapFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      mapFadeAnim.setValue(0);
    }
  }, [resolved, mapFadeAnim]);

  const filteredDestinations = useMemo(() => {
    if (!destination) return POPULAR_DESTINATIONS.slice(0, 6);
    return POPULAR_DESTINATIONS.filter(d =>
      d.toLowerCase().includes(destination.toLowerCase())
    ).slice(0, 6);
  }, [destination]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!destination) {
      console.log('[ActivitiesSearch] No destination selected');
      Alert.alert('Select a Destination', 'Please choose a destination before searching.');
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    const affiliateUrl = buildPartnerAffiliateUrl({
      destination,
      date: date || new Date().toISOString().split('T')[0],
      endDate: endDate || undefined,
      guests,
      category: selectedCategory || undefined,
    });

    const partnerName = selectedCategory ? getPartnerNameForCategory(selectedCategory) : 'Trip.com';
    console.log('[ActivitiesSearch] Opening partner URL:', { partner: partnerName, url: affiliateUrl });

    try {
      await Linking.openURL(affiliateUrl);
      console.log('[ActivitiesSearch] Affiliate URL opened successfully');
    } catch (err) {
      console.error('[ActivitiesSearch] Failed to open affiliate URL:', err);
      Alert.alert('Error', 'Could not open the booking page. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [destination, date, endDate, guests, selectedCategory]);

  const handleDateSelect = useCallback((selectedDate: string, isReturn?: boolean) => {
    if (isReturn) {
      setEndDate(selectedDate);
    } else {
      setDate(selectedDate);
      if (!endDate) {
        setSelectingEnd(true);
      }
    }
  }, [endDate]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Select date';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleToggleStrict = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStrictLocation(prev => !prev);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.navHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          testID="activities-search-back"
        >
          <View style={styles.backButtonInner}>
            <MapPin size={18} color={Colors.text} />
          </View>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Search Activities</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.heroSection}>
            <LinearGradient
              colors={['#0D7377', '#085355']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <Text style={styles.heroTitle}>Find Activities</Text>
              <Text style={styles.heroSubtitle}>
                Tours, experiences & things to do
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.categoriesSection}>
            <Text style={styles.sectionLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {ACTIVITY_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, isActive && { backgroundColor: cat.color }]}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (destination) {
                        const url = buildPartnerCategoryUrl(cat.id, destination);
                        const partnerName = getPartnerNameForCategory(cat.id);
                        console.log('[ActivitiesSearch] Opening partner category link:', { category: cat.id, city: destination, partner: partnerName, url });
                        Linking.openURL(url).catch((err) => {
                          console.error('[ActivitiesSearch] Failed to open affiliate URL:', err);
                          Alert.alert('Error', 'Could not open the link. Please try again.');
                        });
                      } else {
                        setSelectedCategory(isActive ? null : cat.id);
                        Alert.alert('Select a Destination', 'Choose a destination first to browse ' + cat.label + ' activities.');
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon size={16} color={isActive ? '#FFFFFF' : cat.color} />
                    <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                      {cat.label}
                    </Text>
                    {destination ? <ExternalLink size={12} color={isActive ? '#FFFFFF' : cat.color} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.searchCard}>
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Where</Text>
              <View style={styles.inputWrapperOuter}>
                <View style={styles.inputWrapper}>
                  <MapPin size={18} color={Colors.teal} />
                  <TextInput
                    style={styles.input}
                    placeholder="Search destination..."
                    placeholderTextColor={Colors.textTertiary}
                    value={destination}
                    onChangeText={(text) => {
                      setDestination(text);
                      setShowDestDropdown(true);
                    }}
                    onFocus={() => setShowDestDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
                    testID="activities-destination-input"
                  />
                </View>
                {showDestDropdown && filteredDestinations.length > 0 && (
                  <View style={styles.dropdown}>
                    {filteredDestinations.map((dest, idx) => (
                      <TouchableOpacity
                        key={`dest-${dest}-${idx}`}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setDestination(dest);
                          setShowDestDropdown(false);
                        }}
                      >
                        <MapPin size={14} color={Colors.textSecondary} />
                        <Text style={styles.dropdownText}>{dest}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {resolved && (
              <Animated.View style={[styles.resolvedPlaceCard, { opacity: mapFadeAnim }]}>
                <View style={styles.resolvedPlaceMapContainer}>
                  <Image
                    source={{ uri: getStaticMapUrl(resolved.centroid) }}
                    style={styles.resolvedPlaceMap}
                    contentFit="cover"
                  />
                  <View style={styles.resolvedPlaceMapOverlay}>
                    <Navigation size={14} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.resolvedPlaceInfo}>
                  <View style={styles.resolvedPlaceRow}>
                    <CheckCircle size={13} color={Colors.teal} />
                    <Text style={styles.resolvedPlaceName} numberOfLines={1}>
                      {resolved.displayName}
                    </Text>
                  </View>
                  <Text style={styles.resolvedPlaceCoords}>
                    {resolved.centroid.lat.toFixed(3)}, {resolved.centroid.lon.toFixed(3)} · {resolved.type}
                  </Text>
                </View>
              </Animated.View>
            )}

            <View style={styles.locationControlsSection}>
              <View style={styles.strictToggleRow}>
                <View style={styles.strictToggleLabel}>
                  <Maximize2 size={15} color={strictLocation ? Colors.teal : Colors.textTertiary} />
                  <Text style={[styles.strictToggleText, !strictLocation && styles.strictToggleTextMuted]}>
                    Strict location
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggleTrack, strictLocation && styles.toggleTrackActive]}
                  onPress={handleToggleStrict}
                  activeOpacity={0.7}
                  testID="strict-location-toggle"
                >
                  <Animated.View
                    style={[
                      styles.toggleThumb,
                      strictLocation && styles.toggleThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.strictHint}>
                {strictLocation
                  ? `Only activities within ${radiusKm} km of ${resolved?.name || 'destination'}`
                  : 'Showing activities from nearby areas too'}
              </Text>

              {!strictLocation && (
                <View style={styles.radiusSection}>
                  <Text style={styles.radiusLabel}>Search radius</Text>
                  <View style={styles.radiusPresets}>
                    {RADIUS_PRESETS.map((r) => (
                      <TouchableOpacity
                        key={`radius-${r}`}
                        style={[styles.radiusChip, radiusKm === r && styles.radiusChipActive]}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setRadiusKm(r);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.radiusChipText, radiusKm === r && styles.radiusChipTextActive]}>
                          {r} km
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => { setSelectingEnd(false); setShowCalendar(!showCalendar); }}
              >
                <Calendar size={18} color={Colors.teal} />
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <Text style={[styles.dateValue, !date && styles.datePlaceholder]}>
                    {formatDate(date)}
                  </Text>
                </View>
                <ChevronDown size={16} color={Colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => { setSelectingEnd(true); setShowCalendar(!showCalendar); }}
              >
                <Calendar size={18} color={Colors.secondary} />
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>End Date</Text>
                  <Text style={[styles.dateValue, !endDate && styles.datePlaceholder]}>
                    {formatDate(endDate)}
                  </Text>
                </View>
                <ChevronDown size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {showCalendar && (
              <SixMonthCalendar
                selectedDate={date}
                returnDate={endDate}
                onSelectDate={handleDateSelect}
                selectingReturn={selectingEnd}
              />
            )}

            <View style={styles.guestsSection}>
              <View style={styles.guestsLabel}>
                <Users size={18} color={Colors.teal} />
                <Text style={styles.guestsText}>Guests</Text>
              </View>
              <View style={styles.guestsStepper}>
                <TouchableOpacity
                  style={[styles.stepperBtn, guests <= 1 && styles.stepperBtnDisabled]}
                  onPress={() => {
                    if (guests > 1) {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setGuests(g => g - 1);
                    }
                  }}
                  disabled={guests <= 1}
                >
                  <Minus size={16} color={guests <= 1 ? Colors.textTertiary : Colors.teal} />
                </TouchableOpacity>
                <Text style={styles.guestsCount}>{guests}</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setGuests(g => g + 1);
                  }}
                >
                  <Plus size={16} color={Colors.teal} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.searchButton, (!destination || isSubmitting) && styles.searchButtonDisabled]}
              onPress={handleSearch}
              disabled={!destination || isSubmitting}
              activeOpacity={0.8}
              testID="activities-search-button"
            >
              <Search size={20} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.searchButtonText}>
                {isSubmitting ? 'Searching...' : 'Search Activities'}
              </Text>
            </TouchableOpacity>
          </View>

          <ActivitiesDisclaimer variant="inline" />
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
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {},
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroGradient: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  categoriesSection: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  categoriesScroll: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  searchCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  inputSection: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  inputWrapperOuter: {
    position: 'relative',
    zIndex: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: Colors.text,
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownText: {
    fontSize: 14,
    color: Colors.text,
  },
  resolvedPlaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tealMuted,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  resolvedPlaceMapContainer: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  resolvedPlaceMap: {
    width: 52,
    height: 52,
  },
  resolvedPlaceMapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13,115,119,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolvedPlaceInfo: {
    flex: 1,
    gap: 3,
  },
  resolvedPlaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  resolvedPlaceName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.tealDark,
    flex: 1,
  },
  resolvedPlaceCoords: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  locationControlsSection: {
    marginBottom: 14,
  },
  strictToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  strictToggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strictToggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  strictToggleTextMuted: {
    color: Colors.textTertiary,
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.backgroundTertiary,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: Colors.teal,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  strictHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  radiusSection: {
    marginTop: 6,
  },
  radiusLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  radiusPresets: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radiusChipActive: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  radiusChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  radiusChipTextActive: {
    color: '#FFFFFF',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  datePlaceholder: {
    color: Colors.textTertiary,
    fontWeight: '400' as const,
  },
  guestsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  guestsLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guestsText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  guestsStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.tealMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    backgroundColor: Colors.backgroundTertiary,
  },
  guestsCount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.teal,
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  ExternalLink,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import ActivitiesDisclaimer from '@/components/ActivitiesDisclaimer';
import AppHeader from '@/components/AppHeader';
import { ActivityCategory } from '@/types/activities';
import {
  buildTravelpayoutsSearchUrl,
  buildTravelpayoutsCategoryUrl,
  buildTravelpayoutsDestinationUrl,
} from '@/constants/travelpayoutsLinks';

const POPULAR_DESTINATIONS = [
  'Bangkok', 'Bali', 'Tokyo', 'Singapore', 'Paris',
  'London', 'Dubai', 'Sydney', 'Seoul', 'Barcelona',
  'Cusco', 'Lima', 'Cartagena', 'Buenos Aires',
];

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

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function SearchTab() {
  const _router = useRouter();

  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const filteredDestinations = useMemo(() => {
    if (!destination) return POPULAR_DESTINATIONS.slice(0, 6);
    return POPULAR_DESTINATIONS.filter(d =>
      d.toLowerCase().includes(destination.toLowerCase())
    ).slice(0, 6);
  }, [destination]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = useCallback(async () => {
    const city = destination.trim();
    if (!city) {
      console.log('[Search] No destination selected');
      Alert.alert('Select a Destination', 'Please choose a destination before searching.');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    const startDate = date || new Date().toISOString().split('T')[0];
    console.log('[Search] Building affiliate URL for:', { city, startDate, guests, category: selectedCategory });

    const affiliateUrl = buildTravelpayoutsSearchUrl({
      destination: city,
      date: startDate,
      guests,
      category: selectedCategory || undefined,
    });

    if (!affiliateUrl) {
      console.error('[Search] Failed to build affiliate URL');
      Alert.alert('Error', 'Could not generate the search link. Please try again.');
      setIsSubmitting(false);
      return;
    }

    console.log('[Search] Opening Travelpayouts URL:', affiliateUrl);

    try {
      const canOpen = await Linking.canOpenURL(affiliateUrl);
      if (canOpen) {
        await Linking.openURL(affiliateUrl);
        console.log('[Search] Travelpayouts URL opened successfully for', city);
      } else {
        console.warn('[Search] canOpenURL returned false, trying openURL directly');
        await Linking.openURL(affiliateUrl);
      }
    } catch (err) {
      console.error('[Search] Failed to open Travelpayouts URL:', err);
      Alert.alert('Error', 'Could not open the booking page. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [destination, date, guests, selectedCategory]);

  const handleCategoryPress = useCallback((cat: { id: ActivityCategory; label: string }) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (destination) {
      const url = buildTravelpayoutsCategoryUrl(cat.id, destination);
      console.log('[Search] Opening Travelpayouts category link:', { category: cat.id, city: destination, url });
      Linking.openURL(url).catch((err) => {
        console.error('[Search] Failed to open Travelpayouts URL:', err);
        Alert.alert('Error', 'Could not open the link. Please try again.');
      });
    } else {
      setSelectedCategory(prev => prev === cat.id ? null : cat.id);
      Alert.alert('Select a Destination', 'Choose a destination first to browse ' + cat.label + ' activities.');
    }
  }, [destination]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Select date';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const calendarMonths = useMemo(() => {
    return Array.from({ length: 2 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() + calendarMonthOffset + i);
      d.setDate(1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const firstDay = d.getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const days: (number | null)[] = [];
      for (let j = 0; j < firstDay; j++) days.push(null);
      for (let j = 1; j <= daysInMonth; j++) days.push(j);
      return { year, month, monthName, days };
    });
  }, [calendarMonthOffset]);

  const isPastDate = useCallback((year: number, month: number, day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(year, month, day) < today;
  }, []);

  const handleDayPress = useCallback((year: number, month: number, day: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setDate(dateStr);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Find Activities</Text>
            <Text style={styles.headerSubtitle}>Tours, experiences & things to do</Text>
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
                    style={[styles.categoryChip, isActive && { backgroundColor: cat.color, borderColor: cat.color }]}
                    onPress={() => handleCategoryPress(cat)}
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
                    testID="search-destination-input"
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

            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowCalendar(!showCalendar)}
              activeOpacity={0.7}
            >
              <Calendar size={20} color={Colors.teal} />
              <View style={styles.dateSelectorContent}>
                <Text style={styles.dateSelectorLabel}>When</Text>
                <Text style={[styles.dateSelectorValue, !date && styles.dateSelectorPlaceholder]}>
                  {formatDate(date)}
                </Text>
              </View>
              <ChevronDown size={18} color={Colors.textSecondary} />
            </TouchableOpacity>

            {showCalendar && (
              <View style={styles.calendarContainer}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity
                    style={[styles.calendarNavBtn, calendarMonthOffset === 0 && styles.calendarNavBtnDisabled]}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCalendarMonthOffset(Math.max(0, calendarMonthOffset - 2));
                    }}
                    disabled={calendarMonthOffset === 0}
                  >
                    <ChevronLeft size={20} color={calendarMonthOffset === 0 ? Colors.textTertiary : Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.calendarHeaderTitle}>Select Start Date</Text>
                  <TouchableOpacity
                    style={styles.calendarNavBtn}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCalendarMonthOffset(calendarMonthOffset + 2);
                    }}
                  >
                    <ChevronRight size={20} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.calendarMonthsScroll}
                >
                  {calendarMonths.map((monthData, mIdx) => (
                    <View key={`month-${monthData.year}-${monthData.month}-${mIdx}`} style={styles.calendarMonth}>
                      <Text style={styles.calendarMonthTitle}>{monthData.monthName}</Text>
                      <View style={styles.calendarWeekdays}>
                        {WEEKDAYS.map((wd, wdIdx) => (
                          <Text key={`wd-${monthData.month}-${wdIdx}`} style={styles.calendarWeekdayText}>{wd}</Text>
                        ))}
                      </View>
                      <View style={styles.calendarDaysGrid}>
                        {monthData.days.map((day, dIdx) => {
                          if (day === null) {
                            return <View key={`empty-${monthData.month}-${dIdx}`} style={styles.calendarDayCell} />;
                          }
                          const past = isPastDate(monthData.year, monthData.month, day);
                          const dateStr = `${monthData.year}-${String(monthData.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isSelected = dateStr === date;
                          return (
                            <TouchableOpacity
                              key={`day-${monthData.year}-${monthData.month}-${day}-${dIdx}`}
                              style={[
                                styles.calendarDayCell,
                                isSelected && styles.calendarDayCellSelected,
                                past && styles.calendarDayCellPast,
                              ]}
                              onPress={() => !past && handleDayPress(monthData.year, monthData.month, day)}
                              disabled={past}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.calendarDayText,
                                  isSelected && styles.calendarDayTextSelected,
                                  past && styles.calendarDayTextPast,
                                ]}
                              >
                                {day}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
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
              style={[styles.searchButton, !destination && styles.searchButtonDisabled]}
              onPress={handleSearch}
              disabled={!destination || isSubmitting}
              activeOpacity={0.8}
              testID="search-activities-button"
            >
              <LinearGradient
                colors={[Colors.teal, Colors.tealDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.searchButtonGradient}
              >
                <Search size={20} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.searchButtonText}>{isSubmitting ? 'Opening...' : 'Search Activities'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <ActivitiesDisclaimer variant="inline" />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CALENDAR_MONTH_WIDTH = 280;
const CAL_DAY_SIZE = Math.floor((CALENDAR_MONTH_WIDTH - 16) / 7);

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
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  categoriesSection: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  categoriesScroll: {
    gap: 8,
    paddingBottom: 4,
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
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
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
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: Colors.text,
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
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
    borderBottomColor: Colors.borderLight,
  },
  dropdownText: {
    fontSize: 14,
    color: Colors.text,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    marginBottom: 14,
  },
  dateSelectorContent: {
    flex: 1,
  },
  dateSelectorLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  dateSelectorValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  dateSelectorPlaceholder: {
    color: Colors.textTertiary,
    fontWeight: '400' as const,
  },
  calendarContainer: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calendarNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavBtnDisabled: {
    opacity: 0.4,
  },
  calendarHeaderTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  calendarMonthsScroll: {
    gap: 20,
  },
  calendarMonth: {
    width: CALENDAR_MONTH_WIDTH,
  },
  calendarMonthTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  calendarWeekdays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calendarWeekdayText: {
    width: CAL_DAY_SIZE,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: CAL_DAY_SIZE,
    height: CAL_DAY_SIZE + 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: (CAL_DAY_SIZE + 8) / 2,
    marginVertical: 3,
  },
  calendarDayCellSelected: {
    backgroundColor: Colors.teal,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  calendarDayCellPast: {
    opacity: 0.25,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    minWidth: 26,
    textAlign: 'center' as const,
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800' as const,
    fontSize: 17,
  },
  calendarDayTextPast: {
    color: Colors.textTertiary,
  },
  guestsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 18,
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});

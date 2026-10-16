import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  AlertCircle,
  ArrowLeftRight,
  CalendarDays,
  Minus,
  Plane,
  Plus,
  Search,
  Users,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import PressableScale from '@/components/PressableScale';
import SixMonthCalendar from '@/components/SixMonthCalendar';
import { useTapGuard } from '@/hooks/useTapGuard';
import { openInExternalBrowser } from '@/services/RedirectService';
import { buildFlightAffiliateUrl } from '@/constants/flightLinks';
import { resolveIata, searchCities, type FlightCity } from '@/constants/flightCities';

type TripType = 'oneWay' | 'roundTrip';

function CityField(props: {
  label: string;
  value: string;
  placeholder: string;
  iata: string | null;
  onChange: (text: string) => void;
  onFocusSuggest: () => void;
  suggestions: FlightCity[];
  showSuggestions: boolean;
  onPickSuggestion: (city: FlightCity) => void;
}) {
  const {
    label, value, placeholder, iata, onChange, onFocusSuggest,
    suggestions, showSuggestions, onPickSuggestion,
  } = props;

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        onChangeText={onChange}
        onFocus={onFocusSuggest}
        autoCorrect={false}
        autoCapitalize="words"
        returnKeyType="done"
      />
      <View style={styles.iataBadge}>
        <Text style={[styles.iataText, !iata && { color: Colors.textTertiary }]}>
          {iata ?? '—'}
        </Text>
      </View>
      {showSuggestions && suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {suggestions.map((c) => (
            <PressableScale
              key={`${c.city}-${c.iata}`}
              style={styles.suggestionRow}
              onPress={() => onPickSuggestion(c)}
            >
              <Plane size={14} color={Colors.teal} />
              <Text style={styles.suggestionCity}>{c.city}</Text>
              <Text style={styles.suggestionCountry}>{c.country}</Text>
              <Text style={styles.suggestionIata}>{c.iata}</Text>
            </PressableScale>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function FlightsSearchScreen() {
  const router = useRouter();
  const [origin, setOrigin] = useState('Dubai');
  const [destination, setDestination] = useState('');
  const [tripType, setTripType] = useState<TripType>('roundTrip');
  const [departDate, setDepartDate] = useState<string | undefined>(undefined);
  const [returnDate, setReturnDate] = useState<string | undefined>(undefined);
  const [passengers, setPassengers] = useState(1);
  const [selectingReturn, setSelectingReturn] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [suggestField, setSuggestField] = useState<'origin' | 'destination' | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originIata = useMemo(() => resolveIata(origin), [origin]);
  const destinationIata = useMemo(() => resolveIata(destination), [destination]);

  const originSuggestions = useMemo(() => searchCities(origin), [origin]);
  const destinationSuggestions = useMemo(() => searchCities(destination), [destination]);

  const swapFields = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOrigin(destination);
    setDestination(origin);
  }, [origin, destination]);

  const handleSearch = useTapGuard(
    async () => {
      setError(null);
      if (!originIata || !destinationIata) {
        setError('Pick a city from the suggestions (or type a 3-letter airport code).');
        return;
      }
      if (tripType === 'roundTrip' && !returnDate) {
        setError('Select a return date for round-trip search.');
        return;
      }

      const url = buildFlightAffiliateUrl({
        origin,
        destination,
        departDate,
        returnDate: tripType === 'roundTrip' ? returnDate : undefined,
        passengers,
      });
      if (!url) {
        setError('Could not build that search — check origin and destination.');
        return;
      }

      setIsOpening(true);
      try {
        await openInExternalBrowser(url);
      } finally {
        setTimeout(() => setIsOpening(false), 800);
      }
    },
    800,
  );

  const openCalendar = (isReturn: boolean) => {
    if (isReturn && tripType === 'oneWay') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectingReturn(isReturn);
    setCalendarOpen(true);
  };

  const handleCalendarSelect = (date: string, isReturn?: boolean) => {
    if (isReturn) {
      setReturnDate(date);
      setCalendarOpen(false);
    } else {
      setDepartDate(date);
      // Keep the calendar open for return selection on round trips.
      if (tripType === 'oneWay') setCalendarOpen(false);
      else setSelectingReturn(true);
    }
  };

  const formatDateLabel = (iso?: string) =>
    iso
      ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Flight Deals</Text>
        <Text style={styles.headerSubtitle}>Compare 700+ airlines & agencies</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Trip type toggle */}
        <View style={styles.tripToggle}>
          {(['roundTrip', 'oneWay'] as const).map((t) => (
            <PressableScale
              key={t}
              style={[styles.tripOption, tripType === t && styles.tripOptionActive]}
              onPress={() => setTripType(t)}
              testID={`flights-trip-${t}`}
            >
              <Text style={[styles.tripText, tripType === t && styles.tripTextActive]}>
                {t === 'roundTrip' ? 'Round trip' : 'One way'}
              </Text>
            </PressableScale>
          ))}
        </View>

        {/* Route card */}
        <View style={styles.card}>
          <CityField
            label="FROM"
            value={origin}
            placeholder="City or airport"
            iata={originIata}
            onChange={(t) => { setOrigin(t); setSuggestField('origin'); }}
            onFocusSuggest={() => setSuggestField('origin')}
            suggestions={originSuggestions}
            showSuggestions={suggestField === 'origin'}
            onPickSuggestion={(c) => {
              setOrigin(c.city);
              setSuggestField(null);
            }}
          />

          <View style={styles.divider} />

          <View style={styles.swapWrap}>
            <PressableScale style={styles.swapButton} onPress={swapFields} haptic="medium" testID="flights-swap">
              <ArrowLeftRight size={16} color="#FFFFFF" />
            </PressableScale>
          </View>

          <CityField
            label="TO"
            value={destination}
            placeholder="Where to?"
            iata={destinationIata}
            onChange={(t) => { setDestination(t); setSuggestField('destination'); }}
            onFocusSuggest={() => setSuggestField('destination')}
            suggestions={destinationSuggestions}
            showSuggestions={suggestField === 'destination'}
            onPickSuggestion={(c) => {
              setDestination(c.city);
              setSuggestField(null);
            }}
          />
        </View>

        {/* Dates */}
        <View style={styles.datesRow}>
          <PressableScale style={[styles.dateCard, !departDate && styles.dateCardEmpty]} onPress={() => openCalendar(false)} testID="flights-depart">
            <View style={styles.dateIconWrap}>
              <CalendarDays size={16} color={Colors.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateLabel}>Departure</Text>
              <Text style={[styles.dateValue, !departDate && { color: Colors.textTertiary }]}>
                {formatDateLabel(departDate) ?? 'Select date'}
              </Text>
            </View>
          </PressableScale>

          <PressableScale
            style={[
              styles.dateCard,
              tripType === 'oneWay' && { opacity: 0.4 },
              tripType === 'roundTrip' && !returnDate && styles.dateCardEmpty,
            ]}
            onPress={() => openCalendar(true)}
            testID="flights-return"
          >
            <View style={styles.dateIconWrap}>
              <CalendarDays size={16} color={Colors.warm} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateLabel}>Return</Text>
              <Text style={[styles.dateValue, tripType === 'roundTrip' && !returnDate && { color: Colors.textTertiary }]}>
                {tripType === 'oneWay' ? '—' : (formatDateLabel(returnDate) ?? 'Select date')}
              </Text>
            </View>
          </PressableScale>
        </View>

        {/* Passengers */}
        <View style={styles.cardRow}>
          <View style={styles.passengersLeft}>
            <View style={[styles.dateIconWrap, { backgroundColor: Colors.primaryMuted }]}>
              <Users size={16} color={Colors.teal} />
            </View>
            <Text style={styles.passengersLabel}>Passengers</Text>
          </View>
          <View style={styles.stepper}>
            <PressableScale
              style={[styles.stepButton, passengers <= 1 && { opacity: 0.4 }]}
              onPress={() => setPassengers((p) => Math.max(1, p - 1))}
            >
              <Minus size={16} color={Colors.text} />
            </PressableScale>
            <Text style={styles.stepValue}>{passengers}</Text>
            <PressableScale
              style={[styles.stepButton, passengers >= 9 && { opacity: 0.4 }]}
              onPress={() => setPassengers((p) => Math.min(9, p + 1))}
            >
              <Plus size={16} color={Colors.text} />
            </PressableScale>
          </View>
        </View>

        {error ? (
          <View style={styles.errorRow}>
            <AlertCircle size={14} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* CTA */}
        <PressableScale
          style={[styles.searchButton, isOpening && { opacity: 0.7 }]}
          onPress={() => void handleSearch()}
          haptic="medium"
          testID="flights-search-cta"
        >
          <Search size={18} color="#FFFFFF" />
          <Text style={styles.searchButtonText}>
            {isOpening ? 'Opening Aviasales…' : 'Search flights'}
          </Text>
        </PressableScale>

        <Text style={styles.disclosure}>
          You'll complete your search and booking on our partner's site. AndarTravel may earn a
          commission from bookings made through this link.
        </Text>
      </ScrollView>

      {/* Calendar modal */}
      <Modal visible={calendarOpen} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectingReturn ? 'Select return date' : 'Select departure date'}
            </Text>
            <PressableScale onPress={() => setCalendarOpen(false)}>
              <Text style={styles.modalDone}>Done</Text>
            </PressableScale>
          </View>
          <ScrollView>
            <SixMonthCalendar
              selectedDate={departDate}
              returnDate={returnDate}
              selectingReturn={selectingReturn}
              onSelectDate={handleCalendarSelect}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  tripToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tripOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  tripOptionActive: {
    backgroundColor: Colors.backgroundCard,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tripText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tripTextActive: { color: Colors.teal },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardRow: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldWrap: { position: 'relative' },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  fieldInput: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    paddingVertical: 8,
    paddingRight: 56,
  },
  iataBadge: {
    position: 'absolute',
    right: 0,
    top: 22,
    backgroundColor: Colors.primaryMuted,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  iataText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: Colors.teal,
    letterSpacing: 1,
  },
  suggestions: {
    position: 'absolute',
    top: 76,
    left: -8,
    right: -8,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    zIndex: 10,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  suggestionCity: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  suggestionCountry: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  suggestionIata: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.teal,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  swapWrap: {
    alignItems: 'center',
    marginVertical: -2,
  },
  swapButton: {
    backgroundColor: Colors.teal,
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCard: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateCardEmpty: { borderStyle: 'dashed' as const, borderColor: Colors.borderAccent },
  dateIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryMuted,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 1,
  },
  passengersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  passengersLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
    minWidth: 18,
    textAlign: 'center' as const,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    flex: 1,
  },
  searchButton: {
    backgroundColor: Colors.teal,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    minHeight: 52,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  disclosure: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center' as const,
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalDone: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.teal,
  },
});

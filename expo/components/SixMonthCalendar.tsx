import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CALENDAR_WIDTH = Math.floor((SCREEN_WIDTH - 40) / 2);
const DAY_SIZE = Math.floor((CALENDAR_WIDTH - 12) / 7);

interface SixMonthCalendarProps {
  selectedDate?: string;
  returnDate?: string;
  onSelectDate: (date: string, isReturn?: boolean) => void;
  selectingReturn?: boolean;
  cheapestDates?: string[];
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const generateCheapestDates = (): string[] => {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < 180; i++) {
    if (Math.random() < 0.15) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
  }
  return dates;
};

export default function SixMonthCalendar({
  selectedDate,
  returnDate,
  onSelectDate,
  selectingReturn = false,
  cheapestDates: propCheapestDates,
}: SixMonthCalendarProps) {
  const [startMonthOffset, setStartMonthOffset] = useState(0);
  
  const cheapestDates = useMemo(() => {
    return propCheapestDates || generateCheapestDates();
  }, [propCheapestDates]);

  const getMonthData = useCallback((monthOffset: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthOffset);
    date.setDate(1);
    
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = date.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return {
      year,
      month,
      monthName,
      days,
    };
  }, []);

  const months = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => getMonthData(startMonthOffset + i));
  }, [startMonthOffset, getMonthData]);

  const handlePrevMonths = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStartMonthOffset(Math.max(0, startMonthOffset - 2));
  }, [startMonthOffset]);

  const handleNextMonths = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStartMonthOffset(startMonthOffset + 2);
  }, [startMonthOffset]);

  const handleDayPress = useCallback((year: number, month: number, day: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onSelectDate(dateStr, selectingReturn);
  }, [onSelectDate, selectingReturn]);

  const isDateSelected = useCallback((year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr === selectedDate;
  }, [selectedDate]);

  const isReturnSelected = useCallback((year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr === returnDate;
  }, [returnDate]);

  const isInRange = useCallback((year: number, month: number, day: number) => {
    if (!selectedDate || !returnDate) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr > selectedDate && dateStr < returnDate;
  }, [selectedDate, returnDate]);

  const isCheapest = useCallback((year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return cheapestDates.includes(dateStr);
  }, [cheapestDates]);

  const isPastDate = useCallback((year: number, month: number, day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month, day);
    return checkDate < today;
  }, []);

  const renderMonth = (monthData: ReturnType<typeof getMonthData>, index: number) => {
    return (
      <View key={`month-${monthData.year}-${monthData.month}-${index}`} style={styles.monthContainer}>
        <Text style={styles.monthTitle}>{monthData.monthName}</Text>
        
        <View style={styles.weekdaysRow}>
          {WEEKDAYS.map((day, dayIndex) => (
            <Text key={`weekday-${monthData.month}-${dayIndex}`} style={styles.weekdayText}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {monthData.days.map((day, dayIndex) => {
            if (day === null) {
              return <View key={`empty-${monthData.month}-${dayIndex}`} style={styles.dayCell} />;
            }

            const isSelected = isDateSelected(monthData.year, monthData.month, day);
            const isReturn = isReturnSelected(monthData.year, monthData.month, day);
            const inRange = isInRange(monthData.year, monthData.month, day);
            const cheapest = isCheapest(monthData.year, monthData.month, day);
            const past = isPastDate(monthData.year, monthData.month, day);

            return (
              <TouchableOpacity
                key={`day-${monthData.year}-${monthData.month}-${day}-${dayIndex}`}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isReturn && styles.dayCellReturn,
                  inRange && styles.dayCellInRange,
                  cheapest && !isSelected && !isReturn && styles.dayCellCheapest,
                  past && styles.dayCellPast,
                ]}
                onPress={() => !past && handleDayPress(monthData.year, monthData.month, day)}
                disabled={past}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                    isReturn && styles.dayTextSelected,
                    cheapest && !isSelected && !isReturn && styles.dayTextCheapest,
                    past && styles.dayTextPast,
                  ]}
                >
                  {day}
                </Text>
                {cheapest && !isSelected && !isReturn && (
                  <View style={styles.cheapestDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.navButton, startMonthOffset === 0 && styles.navButtonDisabled]}
          onPress={handlePrevMonths}
          disabled={startMonthOffset === 0}
        >
          <ChevronLeft size={20} color={startMonthOffset === 0 ? Colors.textTertiary : Colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {selectingReturn ? 'Select Return Date' : 'Select Departure Date'}
        </Text>
        
        <TouchableOpacity style={styles.navButton} onPress={handleNextMonths}>
          <ChevronRight size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.teal }]} />
          <Text style={styles.legendText}>Departure</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
          <Text style={styles.legendText}>Return</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4ADE80' }]} />
          <Text style={styles.legendText}>Cheapest</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthsScroll}
        pagingEnabled={false}
        decelerationRate="fast"
        snapToInterval={CALENDAR_WIDTH + 16}
      >
        {months.map((month, index) => renderMonth(month, index))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  monthsScroll: {
    gap: 16,
  },
  monthContainer: {
    width: CALENDAR_WIDTH,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 14,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    width: DAY_SIZE,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE + 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: (DAY_SIZE + 6) / 2,
    marginVertical: 3,
  },
  dayCellSelected: {
    backgroundColor: Colors.teal,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCellReturn: {
    backgroundColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCellInRange: {
    backgroundColor: 'rgba(8,145,178,0.12)',
    borderRadius: 6,
  },
  dayCellCheapest: {
    backgroundColor: 'rgba(74, 222, 128, 0.18)',
  },
  dayCellPast: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    minWidth: 22,
    textAlign: 'center' as const,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800' as const,
    fontSize: 14,
  },
  dayTextCheapest: {
    color: '#16A34A',
    fontWeight: '700' as const,
  },
  dayTextPast: {
    color: Colors.textTertiary,
  },
  cheapestDot: {
    position: 'absolute',
    bottom: 3,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#4ADE80',
  },
});

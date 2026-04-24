import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface DatePickerProps {
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  showPrices?: boolean;
  prices?: Record<string, number>;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DatePicker({
  selectedDate,
  onSelectDate,
  minDate = new Date(),
  maxDate,
  showPrices = false,
  prices = {},
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const goToPreviousMonth = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  }, []);

  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, []);

  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth, getDaysInMonth]);

  const isDateDisabled = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }, [minDate, maxDate]);

  const isDateSelected = useCallback((date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  }, [selectedDate]);

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  const getDateKey = useCallback((date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, []);

  const handleSelectDate = useCallback((date: Date) => {
    if (!isDateDisabled(date)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelectDate(date);
    }
  }, [isDateDisabled, onSelectDate]);

  const canGoPrevious = useMemo(() => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const lastDayPrev = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
    return !minDate || lastDayPrev >= minDate;
  }, [currentMonth, minDate]);

  const canGoNext = useMemo(() => {
    if (!maxDate) return true;
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth <= maxDate;
  }, [currentMonth, maxDate]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goToPreviousMonth}
          disabled={!canGoPrevious}
          style={[styles.navButton, !canGoPrevious && styles.navButtonDisabled]}
        >
          <ChevronLeft
            size={24}
            color={canGoPrevious ? Colors.text : Colors.textTertiary}
          />
        </TouchableOpacity>
        <Text style={styles.monthYear}>
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <TouchableOpacity
          onPress={goToNextMonth}
          disabled={!canGoNext}
          style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
        >
          <ChevronRight
            size={24}
            color={canGoNext ? Colors.text : Colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const disabled = isDateDisabled(date);
          const selected = isDateSelected(date);
          const today = isToday(date);
          const price = showPrices ? prices[getDateKey(date)] : undefined;

          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[
                styles.dayCell,
                today && styles.dayCellToday,
                selected && styles.dayCellSelected,
                disabled && styles.dayCellDisabled,
              ]}
              onPress={() => handleSelectDate(date)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayText,
                  today && styles.dayTextToday,
                  selected && styles.dayTextSelected,
                  disabled && styles.dayTextDisabled,
                ]}
              >
                {date.getDate()}
              </Text>
              {price !== undefined && (
                <Text
                  style={[
                    styles.priceText,
                    selected && styles.priceTextSelected,
                    disabled && styles.priceTextDisabled,
                  ]}
                >
                  ${price}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  dayCellToday: {
    backgroundColor: Colors.tealMuted,
  },
  dayCellSelected: {
    backgroundColor: Colors.teal,
  },
  dayCellDisabled: {
    opacity: 0.4,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  dayTextToday: {
    color: Colors.teal,
  },
  dayTextSelected: {
    color: Colors.textInverse,
  },
  dayTextDisabled: {
    color: Colors.textTertiary,
  },
  priceText: {
    fontSize: 9,
    fontWeight: '500' as const,
    color: Colors.teal,
    marginTop: 2,
  },
  priceTextSelected: {
    color: Colors.textInverse,
  },
  priceTextDisabled: {
    color: Colors.textTertiary,
  },
});

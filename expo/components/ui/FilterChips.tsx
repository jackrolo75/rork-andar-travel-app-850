import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface FilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface FilterChipsProps {
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  multiSelect?: boolean;
  selectedIds?: string[];
  onMultiSelect?: (ids: string[]) => void;
  scrollable?: boolean;
  size?: 'small' | 'medium';
}

function FilterChip({
  option,
  isSelected,
  onPress,
  size,
}: {
  option: FilterOption;
  isSelected: boolean;
  onPress: () => void;
  size: 'small' | 'medium';
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.chip,
          size === 'small' && styles.chipSmall,
          isSelected && styles.chipSelected,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {option.icon && (
          <View style={styles.chipIcon}>
            {React.cloneElement(option.icon as React.ReactElement<{ color: string; size: number }>, {
              color: isSelected ? Colors.textInverse : Colors.textSecondary,
              size: size === 'small' ? 14 : 16,
            })}
          </View>
        )}
        <Text
          style={[
            styles.chipText,
            size === 'small' && styles.chipTextSmall,
            isSelected && styles.chipTextSelected,
          ]}
        >
          {option.label}
        </Text>
        {option.count !== undefined && (
          <View style={[styles.chipCount, isSelected && styles.chipCountSelected]}>
            <Text
              style={[styles.chipCountText, isSelected && styles.chipCountTextSelected]}
            >
              {option.count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function FilterChips({
  options,
  selectedId,
  onSelect,
  multiSelect = false,
  selectedIds = [],
  onMultiSelect,
  scrollable = true,
  size = 'medium',
}: FilterChipsProps) {
  const handleSelect = useCallback(
    (id: string) => {
      if (multiSelect && onMultiSelect) {
        const newSelection = selectedIds.includes(id)
          ? selectedIds.filter((i) => i !== id)
          : [...selectedIds, id];
        onMultiSelect(newSelection);
      } else {
        onSelect(id);
      }
    },
    [multiSelect, onMultiSelect, selectedIds, onSelect]
  );

  const content = (
    <View style={[styles.container, !scrollable && styles.containerWrap]}>
      {options.map((option) => (
        <FilterChip
          key={option.id}
          option={option}
          isSelected={multiSelect ? selectedIds.includes(option.id) : selectedId === option.id}
          onPress={() => handleSelect(option.id)}
          size={size}
        />
      ))}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  containerWrap: {
    flexWrap: 'wrap',
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  chipSmall: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipSelected: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  chipIcon: {
    marginRight: 2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  chipTextSmall: {
    fontSize: 13,
  },
  chipTextSelected: {
    color: Colors.textInverse,
  },
  chipCount: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  chipCountSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  chipCountText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  chipCountTextSelected: {
    color: Colors.textInverse,
  },
});

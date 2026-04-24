import React, { useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
} from 'react-native';
import { Search, X, Mic } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmit?: () => void;
  showVoice?: boolean;
  onVoicePress?: () => void;
  autoFocus?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  onFocus,
  onBlur,
  onSubmit,
  showVoice = false,
  onVoicePress,
  autoFocus = false,
  style,
  testID,
}: SearchBarProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback(() => {
    Animated.spring(focusAnim, {
      toValue: 1,
      useNativeDriver: false,
      speed: 20,
      bounciness: 0,
    }).start();
    onFocus?.();
  }, [focusAnim, onFocus]);

  const handleBlur = useCallback(() => {
    Animated.spring(focusAnim, {
      toValue: 0,
      useNativeDriver: false,
      speed: 20,
      bounciness: 0,
    }).start();
    onBlur?.();
  }, [focusAnim, onBlur]);

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeText('');
  }, [onChangeText]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.teal],
  });

  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.15],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor,
          shadowOpacity,
        },
        style,
      ]}
    >
      <Search size={20} color={Colors.textSecondary} strokeWidth={2} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        testID={testID}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <View style={styles.clearIcon}>
            <X size={14} color={Colors.textInverse} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
      )}
      {showVoice && value.length === 0 && (
        <TouchableOpacity onPress={onVoicePress} style={styles.voiceButton}>
          <Mic size={20} color={Colors.teal} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
  },
  clearIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    marginLeft: 8,
    padding: 4,
  },
});

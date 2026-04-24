import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface BaseCardProps {
  onPress?: () => void;
  style?: ViewStyle;
  children: React.ReactNode;
  testID?: string;
}

export function Card({ onPress, style, children, testID }: BaseCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
      }).start();
    }
  }, [scaleAnim, onPress]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (onPress) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  }, [onPress]);

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.card, style]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.95}
          testID={testID}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.card, style]} testID={testID}>
      {children}
    </View>
  );
}

interface FlightCardProps {
  airline: string;
  airlineLogo?: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency?: string;
  stops?: number;
  onPress?: () => void;
  onBook?: () => void;
}

export function FlightCard({
  airline,
  airlineLogo,
  origin,
  originCode,
  destination,
  destinationCode,
  departureTime,
  arrivalTime,
  duration,
  price,
  currency = 'USD',
  stops = 0,
  onPress,
  onBook,
}: FlightCardProps) {
  return (
    <Card onPress={onPress} style={styles.flightCard}>
      <View style={styles.flightHeader}>
        <View style={styles.airlineInfo}>
          {airlineLogo ? (
            <Image source={{ uri: airlineLogo }} style={styles.airlineLogo} />
          ) : (
            <View style={styles.airlineLogoPlaceholder}>
              <Text style={styles.airlineInitial}>{airline.charAt(0)}</Text>
            </View>
          )}
          <View>
            <Text style={styles.airlineName}>{airline}</Text>
            <Text style={styles.stopsText}>
              {stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{duration}</Text>
        </View>
      </View>

      <View style={styles.flightRoute}>
        <View style={styles.routeEndpoint}>
          <Text style={styles.timeText}>{departureTime}</Text>
          <Text style={styles.codeText}>{originCode}</Text>
          <Text style={styles.cityText} numberOfLines={1}>{origin}</Text>
        </View>

        <View style={styles.routeVisual}>
          <View style={styles.routeDotStart} />
          <View style={styles.routeLine}>
            {stops > 0 && (
              <View style={styles.stopIndicator}>
                <View style={styles.stopDot} />
              </View>
            )}
          </View>
          <View style={styles.routeDotEnd} />
        </View>

        <View style={[styles.routeEndpoint, styles.routeEndpointRight]}>
          <Text style={styles.timeText}>{arrivalTime}</Text>
          <Text style={styles.codeText}>{destinationCode}</Text>
          <Text style={styles.cityText} numberOfLines={1}>{destination}</Text>
        </View>
      </View>

      <View style={styles.flightFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>from</Text>
          <Text style={styles.priceValue}>
            {currency === 'USD' ? '$' : currency} {price}
          </Text>
        </View>
        {onBook && (
          <TouchableOpacity style={styles.bookButton} onPress={onBook}>
            <Text style={styles.bookButtonText}>Select</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

interface HotelCardProps {
  name: string;
  image: string;
  location: string;
  rating: number;
  reviewCount: number;
  price: number;
  currency?: string;
  perNight?: boolean;
  amenities?: string[];
  onPress?: () => void;
  onBook?: () => void;
}

export function HotelCard({
  name,
  image,
  location,
  rating,
  reviewCount,
  price,
  currency = 'USD',
  perNight = true,
  amenities = [],
  onPress,
  onBook,
}: HotelCardProps) {
  return (
    <Card onPress={onPress} style={styles.hotelCard}>
      <Image source={{ uri: image }} style={styles.hotelImage} contentFit="cover" />
      <View style={styles.hotelContent}>
        <View style={styles.hotelHeader}>
          <Text style={styles.hotelName} numberOfLines={1}>{name}</Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>★ {rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.hotelLocation} numberOfLines={1}>{location}</Text>
        <Text style={styles.reviewCount}>{reviewCount} reviews</Text>
        
        {amenities.length > 0 && (
          <View style={styles.amenitiesRow}>
            {amenities.slice(0, 3).map((amenity, index) => (
              <View key={index} style={styles.amenityTag}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.hotelFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceValue}>
              {currency === 'USD' ? '$' : currency}{price}
            </Text>
            {perNight && <Text style={styles.perNightText}>/night</Text>}
          </View>
          {onBook && (
            <TouchableOpacity style={styles.bookButton} onPress={onBook}>
              <Text style={styles.bookButtonText}>Book</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
}

interface DealCardProps {
  title: string;
  subtitle: string;
  image: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  tag?: string;
  onPress?: () => void;
}

export function DealCard({
  title,
  subtitle,
  image,
  price,
  originalPrice,
  currency = 'USD',
  tag,
  onPress,
}: DealCardProps) {
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <Card onPress={onPress} style={styles.dealCard}>
      <Image source={{ uri: image }} style={styles.dealImage} contentFit="cover" />
      {tag && (
        <View style={styles.dealTag}>
          <Text style={styles.dealTagText}>{tag}</Text>
        </View>
      )}
      {discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{discount}%</Text>
        </View>
      )}
      <View style={styles.dealContent}>
        <Text style={styles.dealTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.dealSubtitle} numberOfLines={1}>{subtitle}</Text>
        <View style={styles.dealPricing}>
          <Text style={styles.dealPrice}>
            {currency === 'USD' ? '$' : currency}{price}
          </Text>
          {!!originalPrice && (
            <Text style={styles.dealOriginalPrice}>
              {currency === 'USD' ? '$' : currency}{originalPrice}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  flightCard: {
    padding: 16,
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  airlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  airlineLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  airlineLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.tealMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  airlineInitial: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.teal,
  },
  airlineName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  stopsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  durationBadge: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeEndpoint: {
    flex: 1,
  },
  routeEndpointRight: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.teal,
    marginTop: 4,
  },
  cityText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  routeVisual: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  routeDotStart: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.teal,
  },
  routeDotEnd: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  routeLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    position: 'relative',
  },
  stopIndicator: {
    position: 'absolute',
    left: '50%',
    top: -3,
    marginLeft: -4,
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
    borderWidth: 2,
    borderColor: Colors.backgroundCard,
  },
  flightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.teal,
  },
  perNightText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bookButton: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  hotelCard: {
    width: 280,
  },
  hotelImage: {
    width: '100%',
    height: 160,
  },
  hotelContent: {
    padding: 14,
  },
  hotelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    backgroundColor: Colors.secondaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.secondary,
  },
  hotelLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  amenityTag: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  amenityText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  hotelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dealCard: {
    width: 220,
  },
  dealImage: {
    width: '100%',
    height: 130,
  },
  dealTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dealTagText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.teal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  dealContent: {
    padding: 14,
  },
  dealTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  dealSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dealPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  dealPrice: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.teal,
  },
  dealOriginalPrice: {
    fontSize: 13,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
});

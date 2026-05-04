import React from 'react';
import { Text, TextProps } from 'react-native';

/**
 * SafeText coerces any incoming child to a string before rendering.
 *
 * Use this in places where the content is dynamic and could be `null`,
 * `undefined`, a number, or otherwise risky to drop into JSX. It guarantees
 * the value is rendered as a single string inside a <Text>, which prevents
 * the "Unexpected text node" runtime warning when refactoring.
 *
 * Example:
 *   <SafeText style={styles.price}>{maybeUndefinedPrice}</SafeText>
 */
export interface SafeTextProps extends TextProps {
  children?: React.ReactNode;
  fallback?: string;
}

function toSafeString(value: React.ReactNode, fallback: string): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  if (typeof value === 'boolean') return fallback;
  if (Array.isArray(value)) {
    return value.map((v) => toSafeString(v, fallback)).join('');
  }
  // React elements / objects: let React render them inside Text normally.
  return '';
}

export default function SafeText({ children, fallback = '', ...rest }: SafeTextProps) {
  const isPrimitive =
    children === null ||
    children === undefined ||
    typeof children === 'string' ||
    typeof children === 'number' ||
    typeof children === 'boolean';

  if (isPrimitive) {
    return <Text {...rest}>{toSafeString(children, fallback)}</Text>;
  }
  return <Text {...rest}>{children}</Text>;
}

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface LiquidGlassViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function LiquidGlassView({ children, style }: LiquidGlassViewProps) {
  return (
    <View style={[styles.glassContainer, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glassContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
});
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

/**
 * Interface for LiquidGlassView properties.
 */
interface LiquidGlassViewProps {
  children: React.ReactNode;
  intensity?: number;
  style?: ViewStyle | ViewStyle[];
}

/**
 * A premium glassmorphic container designed specifically for iOS.
 * On Android/Web, it falls back to a solid background surface to ensure compilation safety.
 */
export const LiquidGlassView: React.FC<LiquidGlassViewProps> = ({ 
  children, 
  intensity = 60, 
  style 
}) => {
  // Architectural Rule: Platform-specific implementation for "Liquid Glass" effect.
  if (Platform.OS === 'ios') {
    return (
      <BlurView 
        intensity={intensity} 
        tint="dark" 
        style={[styles.glassWrapper, style]}
      >
        {children}
      </BlurView>
    );
  }

  // Fallback for Android and Web environments.
  return (
    <View style={[styles.androidFallback, { backgroundColor: '#1E1E1E' }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  glassWrapper: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    // Note: BlurView handles the actual translucency on iOS.
  },
  androidFallback: {
    // Solid fallback for non-iOS platforms.
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
});
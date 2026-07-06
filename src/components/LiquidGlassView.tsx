import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface LiquidGlassViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  blurIntensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderColor?: string;
  borderWidth?: number;
}

export const LiquidGlassView: React.FC<LiquidGlassViewProps> = ({ 
  children, 
  style, 
  blurIntensity = 20, 
  tint = 'default', 
  borderColor, 
  borderWidth = 1 
}) => {
  return (
    <View style={[styles.container, style]}>
      <BlurView 
        intensity={blurIntensity} 
        tint={tint} 
        style={[
          styles.blur, 
          { borderColor, borderWidth }
        ]} 
      >
        {children}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  blur: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
});
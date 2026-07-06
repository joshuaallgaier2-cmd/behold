import { Slot } from 'expo-router';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LiquidGlassView = ({ orientation }: { orientation: 'vertical' | 'horizontal' }) => (
  <View style={[styles.glass, orientation === 'vertical' ? styles.sidebar : styles.tabBar]} />
);

export default function RootLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isLandscape = width > height;

  if (isLandscape) {
    return (
      <View style={styles.container}>
        <LiquidGlassView orientation="vertical" />
        <View style={styles.content}>
          <Slot />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.containerColumn}>
      <View style={styles.content}>
        <Slot />
      </View>
      <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
        <LiquidGlassView orientation="horizontal" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  containerColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  content: {
    flex: 1,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  sidebar: {
    width: 240,
    height: '100%',
  },
  tabBar: {
    width: '100%',
    height: 85,
    flexDirection: 'row',
  },
});
import { Slot, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LiquidGlassView } from '../src/components/LiquidGlassView';
import { ThemeProvider, useBeholdTheme } from '../src/context/ThemeContext';

function NavigationLayoutContent() {
  const { width, height } = useWindowDimensions();
  const { colors } = useBeholdTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isLandscape = width > height;
  const isPortraitWeb = Platform.OS === 'web' && !isLandscape;
  const navItems = [
    { id: 'home', label: 'Home', route: '/' as const },
    { id: 'songs', label: 'Songs', route: '/songs' as const },
    { id: 'account', label: 'Account', route: '/account' as const },
  ];

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      <View
        style={isPortraitWeb ? [styles.landscapeWrapper, styles.hidden] : styles.landscapeWrapper}
        accessibilityElementsHidden={isPortraitWeb}
        importantForAccessibility={isPortraitWeb ? 'no-hide-descendants' : 'auto'}
      >
        <LiquidGlassView style={isLandscape ? styles.sidebar : [styles.sidebar, styles.hidden]}>
          <Text style={[styles.brandText, { color: colors.accent }]}>BEHOLD</Text>
          <View style={styles.sidebarNavGroup}>
            {navItems.map((item) => {
              const isActive = pathname === item.route;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(item.route)}
                  style={[
                    styles.sidebarNavItem,
                    isActive && { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 8 },
                  ]}
                >
                  <View style={[styles.activeIndicator, { backgroundColor: isActive ? colors.accent : 'transparent' }]} />
                  <Text style={[styles.navText, { color: colors.text, fontWeight: isActive ? '700' : '400' }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </LiquidGlassView>
        <View style={styles.mainContent}>
          <Slot />
        </View>
      </View>
      {isPortraitWeb && (
        <View style={[styles.orientationPrompt, { backgroundColor: colors.background }]}>
          <Text style={[styles.orientationPromptTitle, { color: colors.accent }]}>Turn your screen sideways</Text>
          <Text style={[styles.orientationPromptBody, { color: colors.text }]}>Rotate your device or widen this window to view your sheet music.</Text>
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationLayoutContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: { flex: 1 },
  landscapeWrapper: { flex: 1, flexDirection: 'row' },
  hidden: { display: 'none' },
  orientationPrompt: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    zIndex: 100,
  },
  orientationPromptTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  orientationPromptBody: { marginTop: 8, fontSize: 14, textAlign: 'center', maxWidth: 360 },
  sidebar: { width: 240, height: '100%', paddingTop: 40, paddingHorizontal: 16 },
  brandText: { fontSize: 24, fontWeight: '900', letterSpacing: 1.5, marginBottom: 40, textAlign: 'center' },
  sidebarNavGroup: { flex: 1 },
  sidebarNavItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, marginVertical: 4 },
  activeIndicator: { width: 4, height: 20, borderRadius: 2, marginRight: 12 },
  navText: { fontSize: 16 },
  mainContent: { flex: 1 },
});

import { Slot, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LiquidGlassView } from '../src/components/LiquidGlassView';
import { ThemeProvider, useBeholdTheme } from '../src/context/ThemeContext';

/**
 * FILE 2: Root Layout Split-Pane Sidebar with Liquid Glass & Theme Provider Interlocking
 * Path: 'app/_layout.tsx'
 */

const SidebarContent = () => {
  const { colors } = useBeholdTheme();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Explore', path: '/explore' },
    { label: 'Songs', path: '/songs' },
    { label: 'Account', path: '/account' },
  ];

  return (
    <View style={styles.sidebarContainer}>
      <Text style={[styles.logoText, { color: colors.accent }]}>BEHOLD</Text>
      <View style={styles.navGroup}>
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          return (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.path as any)}
              style={styles.navItem}
            >
              <Text
                style={[
                  styles.navLabel,
                  { color: isActive ? colors.accent : colors.text },
                  isActive && styles.activeNavLabel,
                ]}
              >
                {item.label}
              </Text>
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: colors.accent }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const MainLayout = () => {
  const { colors } = useBeholdTheme();

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      {/* Left Sidebar Section */}
      <View style={styles.sidebarWrapper}>
        {Platform.OS === 'ios' ? (
          <LiquidGlassView intensity={80} style={styles.sidebarGlass}>
            <SidebarContent />
          </LiquidGlassView>
        ) : (
          <View style={[styles.sidebarSolid, { backgroundColor: colors.surface }]}>
            <SidebarContent />
          </View>
        )}
      </View>

      {/* Right Display Screen Box */}
      <View style={styles.contentCanvas}>
        <Slot />
      </View>
    </View>
  );
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <MainLayout />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarWrapper: {
    width: 240,
    height: '100%',
  },
  sidebarGlass: {
    flex: 1,
  },
  sidebarSolid: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  sidebarContainer: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 40,
  },
  navGroup: {
    gap: 20,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  navLabel: {
    fontSize: 18,
    fontWeight: '500',
  },
  activeNavLabel: {
    fontWeight: '700',
  },
  activeIndicator: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  contentCanvas: {
    flex: 1,
  },
});
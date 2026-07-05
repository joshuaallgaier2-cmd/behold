import { Ionicons } from '@expo/vector-icons';
import { Slot, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LiquidGlassView } from '../src/components/LiquidGlassView';
import { ThemeProvider, useBeholdTheme } from '../src/context/ThemeContext';

/**
 * Sidebar Navigation Layout Component.
 * Implements a permanent split-pane navigation optimized for iPad/Landscape.
 */
const SidebarNavigation = () => {
  const { colors } = useBeholdTheme();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', icon: 'home-outline', route: '/' as const },
    { label: 'Explore', icon: 'search-outline', route: '/explore' as const },
    { label: 'Songs', icon: 'musical-notes-outline', route: '/songs' as const },
    { label: 'Account', icon: 'person-outline', route: '/account' as const },
  ];

  const SidebarContent = (
    <View style={[styles.sidebarInner, { backgroundColor: colors.isDark ? 'transparent' : colors.surface }]}>
      <View style={styles.logoContainer}>
        <Text style={[styles.logoText, { color: colors.accent }]}>BEHOLD</Text>
      </View>

      <View style={styles.navGroup}>
        {navItems.map((item) => {
          const isActive = pathname === item.route || (item.route === '/' && pathname === '/index');
          return (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.route)}
              style={[
                styles.navItem,
                isActive && { backgroundColor: colors.isDark ? 'rgba(255, 215, 0, 0.1)' : 'rgba(212, 175, 55, 0.1)' }
              ]}
            >
              {isActive && <View style={[styles.activeIndicator, { backgroundColor: colors.accent }]} />}
              <Ionicons
                name={item.icon as any}
                size={24}
                color={isActive ? colors.accent : colors.text}
                style={styles.navIcon}
              />
              <Text style={[
                styles.navLabel,
                { color: isActive ? colors.accent : colors.text, fontWeight: isActive ? '700' : '500' }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.text, opacity: 0.5 }]}>v1.0.0</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sidebar Pane */}
      <View style={[styles.sidebarContainer, { borderRightColor: colors.border }]}>
        {Platform.OS === 'ios' ? (
          <LiquidGlassView intensity={80} style={styles.glassSidebar}>
            {SidebarContent}
          </LiquidGlassView>
        ) : (
          SidebarContent
        )}
      </View>

      {/* Main Content Pane */}
      <View style={styles.contentCanvas}>
        <Slot />
      </View>
    </View>
  );
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SidebarNavigation />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarContainer: {
    width: 240,
    height: '100%',
    borderRightWidth: 1,
  },
  glassSidebar: {
    flex: 1,
  },
  sidebarInner: {
    flex: 1,
    paddingVertical: 40,
  },
  logoContainer: {
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  navGroup: {
    flex: 1,
    paddingHorizontal: 15,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 8,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    width: 4,
    height: '60%',
    borderRadius: 2,
  },
  navIcon: {
    marginRight: 15,
  },
  navLabel: {
    fontSize: 16,
  },
  footer: {
    paddingHorizontal: 30,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 12,
  },
  contentCanvas: {
    flex: 1,
  },
});
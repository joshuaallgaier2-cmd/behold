import { Ionicons } from '@expo/vector-icons';
import { Slot, usePathname, useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LiquidGlassView } from '../../src/components/LiquidGlassView';
import { ThemeProvider, useBeholdTheme } from '../../src/context/ThemeContext';
import { heights, interaction, radius, spacing, typography, getElevation } from '../../src/theme/platformDesign';

const isIOS = Platform.OS === 'ios';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', route: '/' as const, icon: 'home' as const },
  { id: 'songs', label: 'Songs', route: '/songs' as const, icon: 'musical-notes' as const },
  { id: 'account', label: 'Account', route: '/account' as const, icon: 'person' as const },
];

function NavigationLayoutContent() {
  const { width, height } = useWindowDimensions();
  const { colors } = useBeholdTheme();
  const router = useRouter();
  const pathname = usePathname();

  const isLandscape = width > height;

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      {isLandscape ? (
        <View style={styles.landscapeWrapper}>
          <LiquidGlassView style={styles.sidebar}>
            <Text style={[styles.brandText, { color: colors.accent }]}>BEHOLD</Text>
            <View style={styles.sidebarNavGroup}>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.route;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(item.route)}
                    android_ripple={
                      interaction.useRipple
                        ? { color: 'rgba(255,255,255,0.08)', borderless: false }
                        : undefined
                    }
                    style={({ pressed }) => [
                      styles.sidebarNavItem,
                      isActive && { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 8 },
                      isIOS && pressed && { opacity: interaction.pressOpacity },
                    ]}
                  >
                    <View style={[styles.activeIndicator, { backgroundColor: isActive ? colors.accent : 'transparent' }]} />
                    <Ionicons
                      name={(isIOS ? `${item.icon}-outline` : `${item.icon}-sharp`) as any}
                      size={20}
                      color={isActive ? colors.accent : colors.onSurfaceVariant}
                      style={{ marginRight: 12 }}
                    />
                    <Text style={[styles.navText, { color: colors.text, fontWeight: isActive ? '700' : '400' }]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </LiquidGlassView>
          <View style={styles.mainContent}>
            <Slot />
          </View>
        </View>
      ) : (
        <View style={styles.portraitWrapper}>
          <View style={styles.mainContent}>
            <Slot />
          </View>
          {/* Platform-Adaptive Bottom Navigation */}
          <View
            style={[
              styles.bottomTabBar,
              {
                height: heights.bottomNav + (isIOS ? 15 : 0),
                paddingBottom: isIOS ? 15 : 0,
                backgroundColor: isIOS ? 'rgba(30, 30, 30, 0.95)' : colors.surfaceContainer,
                borderTopWidth: isIOS ? 0.5 : 0,
                borderTopColor: isIOS ? 'rgba(255,255,255,0.15)' : 'transparent',
                ...getElevation(isIOS ? 0 : 2),
              },
            ]}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.route;
              const iconName = (isIOS ? `${item.icon}-outline` : `${item.icon}-sharp`) as any;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(item.route)}
                  android_ripple={
                    interaction.useRipple
                      ? { color: `${colors.accent}20`, borderless: true, radius: 28 }
                      : undefined
                  }
                  style={({ pressed }) => [
                    styles.bottomTabItem,
                    isIOS && pressed && { opacity: interaction.pressOpacity },
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={item.label}
                >
                  {/* MD3 Active Indicator Pill (Android only) */}
                  {!isIOS && isActive && (
                    <View style={[styles.md3ActivePill, { backgroundColor: `${colors.accent}30` }]} />
                  )}
                  <Ionicons
                    name={isActive ? (item.icon as any) : iconName}
                    size={isIOS ? 24 : 24}
                    color={isActive ? colors.accent : colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      isIOS ? styles.iosTabLabel : styles.md3TabLabel,
                      {
                        color: isActive ? colors.accent : colors.onSurfaceVariant,
                        fontWeight: isActive ? '600' : '400',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {/* iOS Bottom Active Dot */}
                  {isIOS && (
                    <View
                      style={[
                        styles.iosActiveDot,
                        { backgroundColor: isActive ? colors.accent : 'transparent' },
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
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
  rootContainer: {
    flex: 1,
  },
  landscapeWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  portraitWrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  sidebar: {
    width: 240,
    height: '100%',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 40,
    textAlign: 'center',
  },
  sidebarNavGroup: {
    flex: 1,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginVertical: 4,
    overflow: 'hidden',
  },
  activeIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  navText: {
    fontSize: 16,
  },
  mainContent: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isIOS ? 4 : 12,
    flex: 1,
    position: 'relative',
  },
  // MD3: Active indicator pill behind the icon (Android)
  md3ActivePill: {
    position: 'absolute',
    top: isIOS ? 4 : 8,
    width: 64,
    height: 32,
    borderRadius: 16,
    zIndex: -1,
  },
  // iOS: Small label below icon
  iosTabLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: -0.24,
  },
  // MD3: Label below icon (Android)
  md3TabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  // iOS: Active dot indicator below label
  iosActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
});

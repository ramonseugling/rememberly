import { Pressable, View, StyleSheet } from 'react-native';
import { Calendar, Users, Gift, User, House } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import MaskedViewNative from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentType, ReactElement } from 'react';
import type { ViewProps } from 'react-native';
import { DsGradientText, DsText, tokens } from '../../design-system';

// The package types its class component with an older React typing.
const MaskedView = MaskedViewNative as unknown as ComponentType<
  ViewProps & { maskElement: ReactElement }
>;

const items = [
  { name: 'index', label: 'Início', Icon: House },
  { name: 'events', label: 'Eventos', Icon: Calendar },
  { name: 'groups', label: 'Grupos', Icon: Users },
  { name: 'gifts', label: 'Presentes', Icon: Gift },
  { name: 'profile', label: 'Perfil', Icon: User },
];
type BottomTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0];
export const AppTabBar = ({
  state,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) => {
  const active = state.routes[state.index].name;
  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      <View style={styles.bar}>
        {items.map(({ name, label, Icon }) => {
          const selected =
            active === name ||
            (name === 'profile' &&
              [
                'personal',
                'occasions',
                'legal',
                'notifications',
                'account',
              ].includes(active));
          return (
            <Pressable
              key={name}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              style={[styles.tab, selected && styles.tabActive]}
              onPress={() => {
                const route = state.routes.find((route) => route.name === name);
                if (!route) return;
                const event = emitter.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!event.defaultPrevented && active !== name)
                  navigateToTab(route.key);
              }}
            >
              {selected ? (
                <MaskedView
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                  style={styles.iconBox}
                  maskElement={<Icon size={22} color="#000" />}
                >
                  <LinearGradient
                    colors={tokens.actionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconBox}
                  />
                </MaskedView>
              ) : (
                <Icon size={22} color={tokens.colors.textMuted} />
              )}
              {selected ? (
                <DsGradientText
                  role="caption"
                  style={{ fontSize: 12, fontWeight: '700' }}
                >
                  {label}
                </DsGradientText>
              ) : (
                <DsText
                  role="caption"
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: tokens.colors.textMuted,
                  }}
                >
                  {label}
                </DsText>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: 'rgb(108, 39, 77)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 52,
    borderRadius: 26,
  },
  tabActive: { backgroundColor: 'rgba(254, 230, 232, 0.95)' },
  iconBox: { width: 22, height: 22 },
});

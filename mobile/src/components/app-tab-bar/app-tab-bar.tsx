import { Pressable, View, StyleSheet } from 'react-native';
import { Calendar, Users, Gift, User, House } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { DsText, tokens } from '../../design-system';
const items = [
  { name: 'index', label: 'Início', Icon: House },
  { name: 'events', label: 'Eventos', Icon: Calendar },
  { name: 'groups', label: 'Grupos', Icon: Users },
  { name: 'wishes', label: 'Desejos', Icon: Gift },
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
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {items.map(({ name, label, Icon }) => {
        const selected =
          active === name || (name === 'profile' && active === 'occasions');
        return (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            style={styles.tab}
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
            <Icon
              size={22}
              color={selected ? tokens.colors.brand : tokens.colors.textMuted}
              fill={selected && name === 'index' ? tokens.colors.brand : 'none'}
            />
            <DsText
              role="caption"
              style={{
                fontSize: 11,
                color: selected
                  ? tokens.colors.actionText
                  : tokens.colors.textMuted,
              }}
            >
              {label}
            </DsText>
          </Pressable>
        );
      })}
    </View>
  );
};
const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.background,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 48,
  },
});

import { Pressable, View, StyleSheet } from 'react-native';
import { Calendar, Users, Gift, User, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { Text } from '../brand-text/brand-text';
import { useAddAction } from '../../navigation/add-action';
import { theme } from '../../theme';

const items = [
  { name: 'index', label: 'Minhas Datas', Icon: Calendar },
  { name: 'groups', label: 'Grupos', Icon: Users },
  { name: 'occasions', label: 'Comemorativas', Icon: Gift },
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
  const action = useAddAction();
  const active = state.routes[state.index].name;
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {items.map(({ name, label, Icon }, index) => (
        <View
          key={name}
          style={{ flexDirection: 'row', flex: index === 1 ? 2 : 1 }}
        >
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: active === name }}
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
              size={20}
              color={
                active === name ? theme.colors.primary : theme.colors.muted
              }
            />
            <Text
              style={{
                fontSize: 11,
                fontFamily: theme.fonts.bold,
                color:
                  active === name ? theme.colors.primary : theme.colors.muted,
              }}
            >
              {label}
            </Text>
          </Pressable>
          {index === 1 && (
            <View style={styles.tab}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={action?.label ?? 'Adicionar'}
                accessibilityState={{ disabled: !action }}
                disabled={!action}
                onPress={() => action?.run()}
                style={{ marginTop: -24, opacity: action ? 1 : 0.4 }}
              >
                <LinearGradient
                  colors={theme.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.add}
                >
                  <Plus color="#fff" size={26} />
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};
const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 48,
  },
  add: {
    height: 56,
    width: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 6px 18px rgba(235,93,142,0.3)',
  },
});

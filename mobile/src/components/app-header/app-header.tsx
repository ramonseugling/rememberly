import { useState } from 'react';
import { Modal, Pressable, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Menu,
  X,
  Calendar,
  Users,
  Gift,
  User,
  LogOut,
} from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { Text } from '../brand-text/brand-text';
import { logo } from '../../assets/logo';
import { useSession } from '../../session/provider';
import { theme } from '../../theme';

export const AppHeader = () => {
  const { state, controller } = useSession();
  const [open, setOpen] = useState(false);
  const user = state.identity?.user;
  const initials = user?.name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .filter((_, index, all) => index === 0 || index === all.length - 1)
    .join('')
    .toUpperCase();
  return (
    <>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.header}>
        <View style={styles.row}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              flex: 1,
            }}
          >
            <SvgXml xml={logo} width={32} height={32} />
            <Text style={styles.brand}>Rememberly</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Meu perfil"
            style={styles.avatar}
            onPress={() => router.navigate('/(tabs)/profile')}
          >
            <Text style={{ color: '#fff', fontFamily: theme.fonts.bold }}>
              {initials || '?'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            onPress={() => setOpen(true)}
            style={styles.touch}
          >
            <Menu color={theme.colors.foreground} size={22} />
          </Pressable>
        </View>
      </SafeAreaView>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="Fechar menu"
            onPress={() => setOpen(false)}
          />
          <SafeAreaView style={styles.panel}>
            <View style={styles.row}>
              <Text style={styles.brand}>Rememberly</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar menu"
                style={styles.touch}
                onPress={() => setOpen(false)}
              >
                <X color={theme.colors.foreground} />
              </Pressable>
            </View>
            <Text style={{ fontFamily: theme.fonts.bold }}>{user?.name}</Text>
            <Text style={{ color: theme.colors.muted, marginBottom: 16 }}>
              {user?.email}
            </Text>
            {[
              {
                label: 'Meus eventos',
                route: '/(tabs)' as const,
                Icon: Calendar,
              },
              {
                label: 'Grupos',
                route: '/(tabs)/groups' as const,
                Icon: Users,
              },
              {
                label: 'Comemorativas',
                route: '/(tabs)/occasions' as const,
                Icon: Gift,
              },
              {
                label: 'Perfil',
                route: '/(tabs)/profile' as const,
                Icon: User,
              },
            ].map(({ label, route, Icon }) => (
              <Pressable
                key={label}
                style={styles.menuItem}
                accessibilityRole="button"
                onPress={() => {
                  setOpen(false);
                  router.navigate(route);
                }}
              >
                <Icon size={20} color={theme.colors.primary} />
                <Text>{label}</Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.menuItem}
              accessibilityRole="button"
              onPress={() => {
                setOpen(false);
                void controller.logout();
              }}
            >
              <LogOut size={20} color={theme.colors.foreground} />
              <Text>Sair</Text>
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
};
const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  brand: {
    fontFamily: theme.fonts.heading,
    fontSize: 25,
    color: theme.colors.primary,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touch: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: { flex: 1, backgroundColor: '#00000050', alignItems: 'flex-end' },
  panel: {
    height: '100%',
    width: '85%',
    maxWidth: 360,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingVertical: 12,
  },
});

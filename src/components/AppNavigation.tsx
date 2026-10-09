/**
 * Navegação principal com dois formatos:
 *  - celular: barra inferior, com a aba ativa destacada numa "pílula";
 *  - computador (tela larga): menu lateral com logo, contadores e usuário.
 * O Expo Router passa as rotas e o estado; aqui só desenhamos.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { applyFilter } from '@/lib/tasks';
import { useAuth } from '@/providers/AuthProvider';
import { useData } from '@/providers/DataProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { BRAND } from '@/theme/brand';
import { fonts, radius, space, type } from '@/theme/tokens';

import { Avatar } from './ui';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ITEMS: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  index: { label: 'Tarefas', icon: 'checkbox-outline', iconActive: 'checkbox' },
  lists: { label: 'Listas', icon: 'albums-outline', iconActive: 'albums' },
  settings: { label: 'Ajustes', icon: 'settings-outline', iconActive: 'settings' },
};

/** Lógica comum: ir para a aba (respeitando o evento tabPress do React Navigation). */
function useTabPress({ navigation }: BottomTabBarProps) {
  return (routeKey: string, routeName: string, focused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: routeKey, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(routeName);
  };
}

export function BottomBar(props: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const press = useTabPress(props);
  const { state } = props;

  return (
    <View
      role="tablist"
      style={[
        styles.bottom,
        { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, space.sm) },
      ]}
    >
      {state.routes.map((route, i) => {
        const item = ITEMS[route.name];
        if (!item) return null;
        const focused = state.index === i;
        return (
          <Pressable
            key={route.key}
            role="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={item.label}
            onPress={() => press(route.key, route.name, focused)}
            style={styles.bottomItem}
          >
            <View style={[styles.pill, focused && { backgroundColor: colors.primarySoft }]}>
              <Ionicons name={focused ? item.iconActive : item.icon} size={22} color={focused ? colors.link : colors.textMuted} />
            </View>
            <Text style={[type.caption, { fontSize: 12, color: focused ? colors.link : colors.textMuted, fontFamily: focused ? fonts.semibold : fonts.medium }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Sidebar(props: BottomTabBarProps) {
  const { colors } = useTheme();
  const { displayName, session } = useAuth();
  const { tasks } = useData();
  const press = useTabPress(props);
  const { state } = props;
  const todayCount = applyFilter(tasks, 'today').length;

  return (
    <View role="tablist" style={[styles.sidebar, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
      <View style={styles.brand}>
        <View style={[styles.logo, { backgroundColor: BRAND.indigo }]}>
          <Ionicons name="checkmark" size={20} color={BRAND.onBrand} />
        </View>
        <Text style={[type.heading, { color: colors.text, fontFamily: fonts.bold }]}>Tarefas</Text>
      </View>

      <View style={styles.sideItems}>
        {state.routes.map((route, i) => {
          const item = ITEMS[route.name];
          if (!item) return null;
          const focused = state.index === i;
          return (
            <Pressable
              key={route.key}
              role="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={item.label}
              onPress={() => press(route.key, route.name, focused)}
              // `hovered` só existe na web (mouse em cima), por isso o cast.
              style={(state) => [
                styles.sideItem,
                {
                  backgroundColor: focused
                    ? colors.primarySoft
                    : (state as { hovered?: boolean }).hovered
                      ? colors.surfaceAlt
                      : 'transparent',
                },
              ]}
            >
              <Ionicons name={focused ? item.iconActive : item.icon} size={20} color={focused ? colors.link : colors.textMuted} />
              <Text style={[type.small, styles.flex, { color: focused ? colors.link : colors.text, fontFamily: focused ? fonts.semibold : fonts.medium }]}>
                {item.label}
              </Text>
              {route.name === 'index' && todayCount > 0 ? (
                <Text style={[type.caption, { color: focused ? colors.link : colors.textMuted }]}>{todayCount}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.user, { borderTopColor: colors.border }]}>
        <Avatar name={displayName} size={36} />
        <View style={styles.flex}>
          <Text numberOfLines={1} style={[type.small, { color: colors.text, fontFamily: fonts.semibold }]}>
            {displayName}
          </Text>
          <Text numberOfLines={1} style={[type.caption, { color: colors.textMuted }]}>
            {session?.user.email}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  bottom: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.sm },
  bottomItem: { flex: 1, alignItems: 'center', gap: space.xxs },
  pill: { width: 56, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  sidebar: { width: 248, borderRightWidth: StyleSheet.hairlineWidth, paddingVertical: space.xl, paddingHorizontal: space.md },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 2, paddingHorizontal: space.sm, marginBottom: space.xl },
  logo: { width: 32, height: 32, borderRadius: radius.sm + 2, alignItems: 'center', justifyContent: 'center' },
  sideItems: { gap: space.xs, flex: 1 },
  sideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    borderRadius: radius.md,
  },
  user: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 2, paddingTop: space.lg, paddingHorizontal: space.sm, borderTopWidth: StyleSheet.hairlineWidth },
});

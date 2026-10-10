import { Tabs } from 'expo-router';

import { BottomBar, Sidebar } from '@/components/AppNavigation';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { useIsWide } from '@/theme/useLayout';

export default function TabsLayout() {
  const { colors } = useTheme();
  const wide = useIsWide();
  return (
    <Tabs
      tabBar={(props) => (wide ? <Sidebar {...props} /> : <BottomBar {...props} />)}
      screenOptions={{
        tabBarPosition: wide ? 'left' : 'bottom',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {/* As abas desenham o próprio cabeçalho com <PageHeader> (mesmo padrão nas três). */}
      <Tabs.Screen name="index" options={{ title: 'Tarefas', headerShown: false }} />
      <Tabs.Screen name="lists" options={{ title: 'Listas', headerShown: false }} />
      <Tabs.Screen name="settings" options={{ title: 'Ajustes', headerShown: false }} />
    </Tabs>
  );
}

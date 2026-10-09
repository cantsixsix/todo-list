import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/theme/ThemeProvider';

export default function NotFound() {
  const { colors } = useTheme();
  return (
    <Screen style={styles.center}>
      <Stack.Screen options={{ title: 'Ops!' }} />
      <EmptyState icon="compass-outline" title="Página não encontrada" />
      <Link href="/" style={{ color: colors.link, fontSize: 16 }}>
        Voltar ao início
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center' } });

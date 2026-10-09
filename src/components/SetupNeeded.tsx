/** Mostrada quando o .env.local ainda não tem as chaves do Supabase. */
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

import { Card, ThemedText } from './ui';

export function SetupNeeded() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.title}>Falta configurar o banco de dados</ThemedText>
        <Card style={styles.card}>
          <ThemedText>1. Crie um projeto grátis em supabase.com.</ThemedText>
          <ThemedText>2. Rode o SQL de supabase/migrations no SQL Editor do projeto.</ThemedText>
          <ThemedText>3. Copie .env.example para .env.local e preencha a URL e a chave anon.</ThemedText>
          <ThemedText>4. Reinicie o servidor: npx expo start --clear</ThemedText>
        </Card>
        <ThemedText muted>O passo a passo completo está no README do projeto.</ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 24, gap: 16, maxWidth: 640, width: '100%', alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '700' },
  card: { padding: 16, gap: 10 },
});

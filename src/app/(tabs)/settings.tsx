/** Conta, aparência, sobre e exclusão de conta (exigência da Google Play). */
import Constants from 'expo-constants';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { confirm } from '@/components/confirm';
import { Screen } from '@/components/Screen';
import { useSnackbar } from '@/components/Snackbar';
import { Button, Card, Chip, ThemedText } from '@/components/ui';
import { isCompleted } from '@/lib/tasks';
import { useAuth } from '@/providers/AuthProvider';
import { useData } from '@/providers/DataProvider';
import { useTheme, type ThemePreference } from '@/theme/ThemeProvider';

const THEMES: { key: ThemePreference; label: string }[] = [
  { key: 'system', label: 'Automático' },
  { key: 'light', label: 'Claro' },
  { key: 'dark', label: 'Escuro' },
];

export default function SettingsScreen() {
  const { colors, preference, setPreference } = useTheme();
  const { session, signOut, deleteAccount } = useAuth();
  const { tasks } = useData();
  const snack = useSnackbar();
  const [deleting, setDeleting] = useState(false);

  const stats = useMemo(() => {
    const done = tasks.filter(isCompleted).length;
    return { open: tasks.length - done, done };
  }, [tasks]);

  const onDelete = async () => {
    const ok = await confirm(
      'Excluir conta?',
      'Todas as suas tarefas e listas serão apagadas para sempre. Isso não pode ser desfeito.',
      'Excluir conta',
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (e) {
      snack({ text: e instanceof Error ? e.message : 'Não foi possível excluir a conta.', error: true });
      setDeleting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Conta">
          <Card style={styles.card}>
            <ThemedText muted>Conectado como</ThemedText>
            <ThemedText style={styles.strong}>{session?.user.email}</ThemedText>
            <View style={styles.stats}>
              <Stat label="Abertas" value={stats.open} />
              <Stat label="Concluídas" value={stats.done} color={colors.success} />
            </View>
          </Card>
        </Section>

        <Section title="Aparência">
          <View style={styles.row}>
            {THEMES.map((t) => (
              <Chip key={t.key} label={t.label} selected={preference === t.key} onPress={() => setPreference(t.key)} />
            ))}
          </View>
        </Section>

        <Section title="Dicas">
          <Card style={styles.card}>
            <ThemedText>• Digite “hoje” ou “amanhã” no fim da tarefa para definir a data.</ThemedText>
            <ThemedText>• Use “!”, “!!” ou “!!!” (ou !baixa, !media, !alta) para a prioridade.</ThemedText>
            <ThemedText>• Segure uma tarefa para apagá-la (dá para desfazer).</ThemedText>
            <ThemedText>• Abra no computador: tudo sincroniza na hora.</ThemedText>
          </Card>
        </Section>

        <Section title="Sobre">
          <Card style={styles.card}>
            <ThemedText>Tarefas v{Constants.expoConfig?.version ?? '1.0.0'}</ThemedText>
            <Link href="/privacy" style={{ color: colors.primary, fontSize: 16 }}>
              Política de privacidade
            </Link>
          </Card>
        </Section>

        <Button title="Sair" variant="secondary" onPress={signOut} />
        <Button title="Excluir minha conta" variant="danger" onPress={onDelete} loading={deleting} />
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText muted style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText style={[styles.statValue, color ? { color } : null]}>{value}</ThemedText>
      <ThemedText muted style={styles.statLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20, paddingBottom: 48 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { padding: 16, gap: 8 },
  strong: { fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  stats: { flexDirection: 'row', gap: 24, marginTop: 8 },
  stat: { gap: 2 },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 13 },
});

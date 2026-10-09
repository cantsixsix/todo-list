/** Perfil, aparência, ajuda, termos e conta (inclui exclusão, exigida pela Google Play). */
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { confirm } from '@/components/confirm';
import { Screen } from '@/components/Screen';
import { SettingsRow } from '@/components/SettingsRow';
import { useSnackbar } from '@/components/Snackbar';
import { Avatar, Button, Card, TextField, ThemedText } from '@/components/ui';
import { SUPPORT_EMAIL } from '@/lib/config';
import { isCompleted } from '@/lib/tasks';
import { useAuth } from '@/providers/AuthProvider';
import { useData } from '@/providers/DataProvider';
import { useTheme, type ThemePreference } from '@/theme/ThemeProvider';
import { elevation, fonts, radius, space, type } from '@/theme/tokens';

const THEMES: { key: ThemePreference; label: string }[] = [
  { key: 'system', label: 'Automático' },
  { key: 'light', label: 'Claro' },
  { key: 'dark', label: 'Escuro' },
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { session, displayName, signOut, deleteAccount, updateName } = useAuth();
  const { tasks } = useData();
  const snack = useSnackbar();
  const [deleting, setDeleting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(displayName);

  const stats = useMemo(() => {
    const done = tasks.filter(isCompleted).length;
    return { open: tasks.length - done, done };
  }, [tasks]);

  const saveName = async () => {
    if (name.trim().length < 2) return;
    try {
      await updateName(name);
      setEditingName(false);
      snack({ text: 'Nome atualizado' });
    } catch (e) {
      snack({ text: e instanceof Error ? e.message : String(e), error: true });
    }
  };

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
        <Card style={styles.profile}>
          <View style={styles.profileTop}>
            <Avatar name={displayName} size={56} />
            <View style={styles.flex}>
              <ThemedText variant="title" numberOfLines={1}>
                {displayName}
              </ThemedText>
              <ThemedText muted variant="small" numberOfLines={1}>
                {session?.user.email}
              </ThemedText>
            </View>
            {!editingName ? (
              <Button title="Editar" variant="secondary" onPress={() => { setName(displayName); setEditingName(true); }} style={styles.editBtn} />
            ) : null}
          </View>
          {editingName ? (
            <View style={styles.editRow}>
              <View style={styles.flex}>
                <TextField label="Nome" value={name} onChangeText={setName} autoFocus onSubmitEditing={saveName} maxLength={60} />
              </View>
              <Button title="Salvar" onPress={saveName} style={styles.saveBtn} />
            </View>
          ) : null}
          <View style={[styles.stats, { borderTopColor: colors.border }]}>
            <Stat label="Abertas" value={stats.open} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <Stat label="Concluídas" value={stats.done} color={colors.success} />
          </View>
        </Card>

        <Section title="Aparência">
          <ThemeSegmented />
        </Section>

        <Section title="Ajuda">
          <Card>
            <SettingsRow icon="bulb" color="#F59E0B" label="Dicas de uso" onPress={() => router.push('/tips')} />
            <SettingsRow
              icon="chatbubble-ellipses"
              color="#0EA5E9"
              label="Enviar feedback"
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Feedback%20-%20Tarefas`)}
              last
            />
          </Card>
        </Section>

        <Section title="Sobre">
          <Card>
            <SettingsRow icon="shield-checkmark" color="#10B981" label="Política de privacidade" onPress={() => router.push('/privacy')} />
            <SettingsRow icon="document-text" color="#64748B" label="Termos de uso" onPress={() => router.push('/terms')} />
            <SettingsRow icon="information-circle" color="#4F46E5" label="Versão" value={Constants.expoConfig?.version ?? '1.0.0'} last />
          </Card>
        </Section>

        <Section title="Conta">
          <Card>
            <SettingsRow icon="log-out" color="#64748B" label="Sair" onPress={signOut} />
            <SettingsRow icon="trash" color={colors.danger} label={deleting ? 'Excluindo…' : 'Excluir minha conta'} danger onPress={deleting ? undefined : onDelete} last />
          </Card>
        </Section>
      </ScrollView>
    </Screen>
  );
}

function ThemeSegmented() {
  const { colors, preference, setPreference } = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.surfaceAlt }]} accessibilityRole="radiogroup">
      {THEMES.map((t) => {
        const selected = preference === t.key;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => setPreference(t.key)}
            style={[styles.segment, selected && [{ backgroundColor: colors.surface }, elevation(1, colors.shadow)]]}
          >
            <Text style={[type.small, { color: selected ? colors.text : colors.textMuted, fontFamily: selected ? fonts.semibold : fonts.medium }]}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText muted variant="overline" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText variant="title" style={color ? { color } : null}>
        {value}
      </ThemedText>
      <ThemedText muted variant="caption">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  content: { padding: space.lg, gap: space.xl, paddingBottom: space.xxxl },
  profile: { padding: space.lg, gap: space.lg },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  editBtn: { minHeight: 36, paddingHorizontal: space.md },
  editRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  saveBtn: { minHeight: 50 },
  stats: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.md },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: StyleSheet.hairlineWidth },
  section: { gap: space.sm },
  sectionTitle: { paddingHorizontal: space.xs },
  segmented: { flexDirection: 'row', padding: 4, borderRadius: radius.md },
  segment: { flex: 1, alignItems: 'center', paddingVertical: space.sm + 2, borderRadius: radius.sm },
});

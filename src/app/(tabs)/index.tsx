/**
 * Tela principal: saudação, progresso do dia, filtros inteligentes,
 * busca e o campo de adicionar rápido.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { QuickAdd } from '@/components/QuickAdd';
import { Screen } from '@/components/Screen';
import { TaskSectionList } from '@/components/TaskSectionList';
import { Avatar, Button, Card, Chip, ProgressBar, TextField, ThemedText } from '@/components/ui';
import { formatLongDate, greeting, toISODate } from '@/lib/dates';
import { applyFilter, groupByDue, searchTasks, sortTasks, todayProgress } from '@/lib/tasks';
import type { SmartFilter } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useData } from '@/providers/DataProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { useIsWide } from '@/theme/useLayout';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const FILTERS: { key: SmartFilter; label: string; icon: IconName }[] = [
  { key: 'today', label: 'Hoje', icon: 'sunny-outline' },
  { key: 'upcoming', label: 'Próximos', icon: 'calendar-outline' },
  { key: 'all', label: 'Todas', icon: 'layers-outline' },
  { key: 'completed', label: 'Concluídas', icon: 'checkmark-done-outline' },
];

const EMPTY: Record<SmartFilter, { icon: IconName; title: string; subtitle: string }> = {
  today: { icon: 'sunny-outline', title: 'Nada para hoje', subtitle: 'Aproveite o dia — ou adicione algo abaixo.' },
  upcoming: { icon: 'calendar-outline', title: 'Nada agendado', subtitle: 'Tarefas com data futura aparecem aqui.' },
  all: { icon: 'layers-outline', title: 'Nenhuma tarefa', subtitle: 'Dica: digite "Pagar conta amanhã !alta".' },
  completed: { icon: 'trophy-outline', title: 'Nada concluído ainda', subtitle: 'As tarefas que você terminar aparecem aqui.' },
};

/** "sexta-feira, …" → "Sexta-feira, …" (só a primeira letra, como no português). */
const capitalizeFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function TasksScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const wide = useIsWide();
  const { displayName } = useAuth();
  const { tasks, loading, pendingCount, addTask, clearCompleted } = useData();
  const [filter, setFilter] = useState<SmartFilter>('today');
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    const filtered = searchTasks(applyFilter(tasks, filter), query);
    if (filter === 'completed') return filtered.length ? [{ key: 'done', title: 'Concluídas', data: sortTasks(filtered) }] : [];
    return groupByDue(filtered);
  }, [tasks, filter, query]);

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.key, applyFilter(tasks, f.key).length])) as Record<SmartFilter, number>,
    [tasks],
  );
  const progress = useMemo(() => todayProgress(tasks), [tasks]);
  const pct = progress.total ? progress.done / progress.total : 0;
  const firstName = displayName.split(' ')[0];

  const empty = query
    ? { icon: 'search-outline' as const, title: 'Nada encontrado', subtitle: `Nenhuma tarefa com "${query}".` }
    : EMPTY[filter];

  const header = (
    <View style={styles.header}>
      <View style={styles.greetingRow}>
        <View style={styles.flex}>
          <ThemedText muted variant="small">
            {capitalizeFirst(formatLongDate())}
          </ThemedText>
          <ThemedText variant="display" numberOfLines={1}>
            {greeting()}, {firstName}
          </ThemedText>
        </View>
        {!wide ? (
          <Pressable onPress={() => router.navigate('/settings')} accessibilityLabel="Abrir ajustes" hitSlop={8}>
            <Avatar name={displayName} size={42} />
          </Pressable>
        ) : null}
      </View>

      {progress.total > 0 ? (
        <Card style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View style={[styles.progressIcon, { backgroundColor: pct === 1 ? colors.successSoft : colors.primarySoft }]}>
              <Ionicons name={pct === 1 ? 'trophy' : 'flash'} size={18} color={pct === 1 ? colors.success : colors.primary} />
            </View>
            <View style={styles.flex}>
              <ThemedText variant="heading">
                {pct === 1 ? 'Dia concluído!' : `${progress.done} de ${progress.total} ${progress.total === 1 ? "concluída" : "concluídas"} hoje`}
              </ThemedText>
              <ThemedText muted variant="caption">
                {pct === 1 ? 'Tudo feito. Bom trabalho!' : pct >= 0.5 ? 'Mais da metade — continue assim.' : 'Um passo de cada vez.'}
              </ThemedText>
            </View>
            <ThemedText variant="heading" style={{ color: pct === 1 ? colors.success : colors.primary }}>
              {Math.round(pct * 100)}%
            </ThemedText>
          </View>
          <ProgressBar value={pct} color={pct === 1 ? colors.success : undefined} />
        </Card>
      ) : null}

      {pendingCount > 0 ? (
        <View
          style={[styles.offline, { backgroundColor: colors.surfaceAlt }]}
          accessibilityRole="alert"
          accessibilityLabel={`Offline: ${pendingCount} alterações aguardando conexão`}
        >
          <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
          <ThemedText muted variant="caption">
            Offline · {pendingCount} {pendingCount === 1 ? 'alteração aguardando' : 'alterações aguardando'} conexão
          </ThemedText>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            icon={f.icon}
            count={f.key === 'completed' ? undefined : counts[f.key]}
            selected={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </ScrollView>
      <TextField
        icon="search"
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar tarefas"
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel="Buscar tarefas"
      />
      {filter === 'completed' && sections.length ? (
        <Button title="Limpar concluídas" icon="trash-outline" variant="ghost" onPress={clearCompleted} style={styles.clear} />
      ) : null}
    </View>
  );

  return (
    <Screen>
      <KeyboardAvoidingView
        style={[styles.flex, { paddingTop: wide ? space.xl : insets.top + space.sm }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <>
            {header}
            <ActivityIndicator style={styles.loading} color={colors.primary} />
          </>
        ) : (
          <TaskSectionList
            sections={sections}
            showSectionHeaders={filter !== 'completed'}
            ListHeaderComponent={header}
            ListEmptyComponent={<EmptyState {...empty} />}
          />
        )}

        {filter !== 'completed' ? (
          <View style={styles.bottom}>
            <QuickAdd
              onAdd={addTask}
              defaults={filter === 'today' ? { due_date: toISODate(new Date()) } : undefined}
              placeholder={filter === 'today' ? 'Adicionar para hoje' : 'Adicionar tarefa'}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  header: { paddingHorizontal: space.lg, gap: space.lg, paddingBottom: space.xs },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  progressCard: { padding: space.lg, gap: space.md },
  progressTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  progressIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  offline: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.md },
  chips: { gap: space.sm },
  loading: { marginTop: space.xxxl },
  bottom: { paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.md },
  clear: { alignSelf: 'flex-end', minHeight: 36 },
});

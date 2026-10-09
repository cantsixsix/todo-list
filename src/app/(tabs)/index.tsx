/**
 * Tela principal: filtros inteligentes (Hoje, Próximos, Todas, Concluídas),
 * busca e o campo de adicionar rápido.
 */
import { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { QuickAdd } from '@/components/QuickAdd';
import { Screen } from '@/components/Screen';
import { TaskSectionList } from '@/components/TaskSectionList';
import { Button, Chip, TextField } from '@/components/ui';
import { toISODate } from '@/lib/dates';
import { applyFilter, groupByDue, searchTasks, sortTasks } from '@/lib/tasks';
import type { SmartFilter } from '@/lib/types';
import { useData } from '@/providers/DataProvider';
import { useTheme } from '@/theme/ThemeProvider';

const FILTERS: { key: SmartFilter; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: 'upcoming', label: 'Próximos' },
  { key: 'all', label: 'Todas' },
  { key: 'completed', label: 'Concluídas' },
];

const EMPTY: Record<SmartFilter, { icon: 'sunny-outline' | 'calendar-outline' | 'checkbox-outline' | 'trophy-outline'; title: string; subtitle: string }> = {
  today: { icon: 'sunny-outline', title: 'Nada para hoje', subtitle: 'Aproveite o dia — ou adicione algo abaixo.' },
  upcoming: { icon: 'calendar-outline', title: 'Nada agendado', subtitle: 'Tarefas com data futura aparecem aqui.' },
  all: { icon: 'checkbox-outline', title: 'Nenhuma tarefa', subtitle: 'Dica: digite "Pagar conta amanhã !alta".' },
  completed: { icon: 'trophy-outline', title: 'Nada concluído ainda', subtitle: 'As tarefas que você terminar aparecem aqui.' },
};

export default function TasksScreen() {
  const { colors } = useTheme();
  const { tasks, loading, addTask, clearCompleted } = useData();
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

  const empty = query
    ? { icon: 'search-outline' as const, title: 'Nada encontrado', subtitle: `Nenhuma tarefa com "${query}".` }
    : EMPTY[filter];

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={styles.top}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {FILTERS.map((f) => (
              <Chip
                key={f.key}
                label={f.key === 'completed' ? f.label : `${f.label} ${counts[f.key] || ''}`.trim()}
                selected={filter === f.key}
                onPress={() => setFilter(f.key)}
              />
            ))}
          </ScrollView>
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar tarefas"
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Buscar tarefas"
          />
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loading} color={colors.primary} />
        ) : (
          <TaskSectionList
            sections={sections}
            showSectionHeaders={filter !== 'completed'}
            ListEmptyComponent={<EmptyState {...empty} />}
            ListHeaderComponent={
              filter === 'completed' && sections.length ? (
                <Button title="Limpar concluídas" variant="ghost" onPress={clearCompleted} style={styles.clear} />
              ) : undefined
            }
          />
        )}

        {filter !== 'completed' ? (
          <View style={styles.bottom}>
            <QuickAdd
              onAdd={addTask}
              defaults={filter === 'today' ? { due_date: toISODate(new Date()) } : undefined}
              placeholder={filter === 'today' ? 'Adicionar para hoje…' : 'Adicionar tarefa…'}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  chips: { gap: 8 },
  loading: { marginTop: 48 },
  bottom: { padding: 12 },
  clear: { alignSelf: 'flex-end', marginRight: 8 },
});

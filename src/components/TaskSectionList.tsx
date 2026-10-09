/**
 * Lista de tarefas com seções (Atrasadas, Hoje…), puxar-para-atualizar
 * e "segurar para apagar" com opção de desfazer.
 */
import { Platform, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useCallback, useMemo } from 'react';

import type { TaskSection } from '@/lib/tasks';
import type { Task } from '@/lib/types';
import { useData } from '@/providers/DataProvider';
import { useTheme } from '@/theme/ThemeProvider';

import { useSnackbar } from './Snackbar';
import { TaskItem } from './TaskItem';

interface Props {
  sections: TaskSection[];
  ListEmptyComponent?: React.ReactElement;
  ListHeaderComponent?: React.ReactElement;
  showSectionHeaders?: boolean;
  /** Mostra a lista de cada tarefa (desligado dentro da tela de uma lista). */
  showList?: boolean;
}

export function TaskSectionList({
  sections,
  ListEmptyComponent,
  ListHeaderComponent,
  showSectionHeaders = true,
  showList = true,
}: Props) {
  const { colors } = useTheme();
  const { lists, toggleTask, removeTask, restoreTask, refresh, refreshing } = useData();
  const snack = useSnackbar();
  const listById = useMemo(() => Object.fromEntries(lists.map((l) => [l.id, l])), [lists]);

  const onLongPress = useCallback(
    async (task: Task) => {
      const removed = await removeTask(task.id);
      if (removed) snack({ text: 'Tarefa apagada', actionLabel: 'Desfazer', onAction: () => restoreTask(removed) });
    },
    [removeTask, restoreTask, snack],
  );

  return (
    <SectionList
      sections={sections}
      keyExtractor={(t) => t.id}
      renderItem={({ item }) => (
        <TaskItem
          task={item}
          list={showList && item.list_id ? listById[item.list_id] : undefined}
          onToggle={toggleTask}
          onLongPress={onLongPress}
        />
      )}
      renderSectionHeader={
        showSectionHeaders
          ? ({ section }) => (
              <View style={[styles.header, { backgroundColor: colors.background }]}>
                <Text
                  style={[styles.headerText, { color: section.key === 'overdue' ? colors.danger : colors.textMuted }]}
                >
                  {section.title} · {section.data.length}
                </Text>
              </View>
            )
          : undefined
      }
      ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: colors.border }]} />}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      stickySectionHeadersEnabled={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
      refreshControl={
        Platform.OS === 'web' ? undefined : (
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 120 },
  header: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  headerText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 52 },
});

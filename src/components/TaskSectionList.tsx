/**
 * Lista de tarefas com seções (Atrasadas, Hoje…), puxar-para-atualizar
 * e "segurar para apagar" com opção de desfazer.
 */
import { useCallback, useMemo } from 'react';
import { Platform, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import type { TaskSection } from '@/lib/tasks';
import type { Task } from '@/lib/types';
import { useData } from '@/providers/DataProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { space, type } from '@/theme/tokens';

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
      renderItem={({ item, index, section }) => (
        <TaskItem
          task={item}
          list={showList && item.list_id ? listById[item.list_id] : undefined}
          first={index === 0}
          last={index === section.data.length - 1}
          onToggle={toggleTask}
          onLongPress={onLongPress}
        />
      )}
      renderSectionHeader={({ section }) =>
        showSectionHeaders ? (
          <View style={styles.header}>
            <Text style={[type.overline, { color: section.key === 'overdue' ? colors.danger : colors.textMuted }]}>
              {section.title}
            </Text>
            <Text style={[type.overline, { color: colors.textSubtle }]}>{section.data.length}</Text>
          </View>
        ) : (
          <View style={{ height: space.md }} />
        )
      }
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
  content: { paddingBottom: 140 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg + space.xs,
    paddingTop: space.xl,
    paddingBottom: space.sm,
  },
});

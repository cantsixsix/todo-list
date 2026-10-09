/** Uma linha de tarefa: caixa de marcar, título, data, prioridade e lista. */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDueDate } from '@/lib/dates';
import { isCompleted, isOverdue } from '@/lib/tasks';
import type { Task, TaskList } from '@/lib/types';
import { priorityColor } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';

import { success, tap } from './haptics';

interface Props {
  task: Task;
  list?: TaskList;
  onToggle: (id: string) => void;
  onLongPress?: (task: Task) => void;
}

function TaskItemBase({ task, list, onToggle, onLongPress }: Props) {
  const { colors } = useTheme();
  const done = isCompleted(task);
  const overdue = isOverdue(task);
  const pColor = priorityColor(task.priority, colors);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
      onLongPress={() => {
        tap();
        onLongPress?.(task);
      }}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.surfaceAlt : colors.surface }]}
      accessibilityLabel={`${task.title}${done ? ', concluída' : ''}`}
    >
      <Pressable
        hitSlop={12}
        onPress={() => {
          if (!done) success();
          onToggle(task.id);
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? 'Marcar como pendente' : 'Concluir tarefa'}
        style={[
          styles.check,
          { borderColor: task.priority > 0 ? pColor : colors.textMuted },
          done && { backgroundColor: colors.success, borderColor: colors.success },
        ]}
      >
        {done ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
      </Pressable>

      <View style={styles.body}>
        <Text
          numberOfLines={2}
          style={[
            styles.title,
            { color: done ? colors.textMuted : colors.text },
            done && { textDecorationLine: 'line-through' },
          ]}
        >
          {task.title}
        </Text>
        {task.due_date || list || task.notes ? (
          <View style={styles.meta}>
            {task.due_date ? (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={overdue ? colors.danger : colors.textMuted} />
                <Text style={[styles.metaText, { color: overdue ? colors.danger : colors.textMuted }]}>
                  {formatDueDate(task.due_date)}
                </Text>
              </View>
            ) : null}
            {task.notes ? <Ionicons name="document-text-outline" size={13} color={colors.textMuted} /> : null}
            {list ? (
              <View style={styles.metaItem}>
                <View style={[styles.dot, { backgroundColor: list.color }]} />
                <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
                  {list.name}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {task.priority > 0 && !done ? <Ionicons name="flag" size={16} color={pColor} /> : null}
    </Pressable>
  );
}

/** memo: a linha só redesenha quando a própria tarefa muda (listas longas ficam fluidas). */
export const TaskItem = memo(TaskItemBase);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 16 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 160 },
  metaText: { fontSize: 13 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

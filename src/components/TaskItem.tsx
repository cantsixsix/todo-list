/**
 * Uma linha de tarefa. As linhas de uma mesma seção formam um cartão
 * arredondado (`position` diz se é a primeira/última para arredondar).
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { memo, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDueDate } from '@/lib/dates';
import { isCompleted, isOverdue } from '@/lib/tasks';
import type { Task, TaskList } from '@/lib/types';
import { priorityColor } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, space, type } from '@/theme/tokens';

import { success, tap } from './haptics';

interface Props {
  task: Task;
  list?: TaskList;
  first?: boolean;
  last?: boolean;
  onToggle: (id: string) => void;
  onLongPress?: (task: Task) => void;
}

function TaskItemBase({ task, list, first, last, onToggle, onLongPress }: Props) {
  const { colors } = useTheme();
  const done = isCompleted(task);
  const overdue = isOverdue(task);
  const pColor = priorityColor(task.priority, colors);
  // useState com inicializador: cria o valor animado uma única vez.
  const [scale] = useState(() => new Animated.Value(1));

  const toggle = () => {
    if (!done) success();
    // Pequeno "pulo" da caixinha: confirmação visual de que o toque funcionou.
    scale.setValue(0.75);
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 180, useNativeDriver: Platform.OS !== 'web' }).start();
    onToggle(task.id);
  };

  const dueColor = overdue ? colors.danger : colors.textMuted;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
      onLongPress={() => {
        tap();
        onLongPress?.(task);
      }}
      // `hovered` só existe na web (mouse em cima), por isso o cast.
      style={(state) => [
        styles.row,
        {
          backgroundColor: state.pressed || (state as { hovered?: boolean }).hovered ? colors.surfaceAlt : colors.surface,
          borderColor: colors.border,
          borderTopLeftRadius: first ? radius.lg : 0,
          borderTopRightRadius: first ? radius.lg : 0,
          borderBottomLeftRadius: last ? radius.lg : 0,
          borderBottomRightRadius: last ? radius.lg : 0,
          borderTopWidth: first ? StyleSheet.hairlineWidth : 0,
        },
      ]}
      accessibilityLabel={`${task.title}${done ? ', concluída' : ''}`}
    >
      {task.priority > 0 && !done ? <View style={[styles.accent, { backgroundColor: pColor }]} /> : null}

      <Pressable
        hitSlop={12}
        onPress={toggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? 'Marcar como pendente' : 'Concluir tarefa'}
      >
        <Animated.View
          style={[
            styles.check,
            { borderColor: task.priority > 0 ? pColor : colors.textSubtle, transform: [{ scale }] },
            done && { backgroundColor: colors.success, borderColor: colors.success },
          ]}
        >
          {done ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
        </Animated.View>
      </Pressable>

      <View style={styles.body}>
        <Text
          numberOfLines={2}
          style={[
            type.body,
            { color: done ? colors.textSubtle : colors.text },
            done && { textDecorationLine: 'line-through' },
          ]}
        >
          {task.title}
        </Text>
        {task.due_date || list || task.notes || task.recurrence ? (
          <View style={styles.meta}>
            {task.due_date ? (
              <View style={[styles.tag, overdue && { backgroundColor: colors.dangerSoft }]}>
                <Ionicons name="calendar-clear-outline" size={12} color={dueColor} />
                <Text style={[type.caption, { color: dueColor, fontFamily: overdue ? fonts.semibold : fonts.medium }]}>
                  {formatDueDate(task.due_date)}
                </Text>
              </View>
            ) : null}
            {task.recurrence ? (
              <Ionicons name="repeat" size={14} color={colors.textMuted} accessibilityLabel="Tarefa recorrente" />
            ) : null}
            {task.notes ? <Ionicons name="reader-outline" size={13} color={colors.textMuted} /> : null}
            {list ? (
              <View style={styles.tag}>
                <View style={[styles.dot, { backgroundColor: list.color }]} />
                <Text style={[type.caption, { color: colors.textMuted }]} numberOfLines={1}>
                  {list.name}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {task.priority > 0 && !done ? <Ionicons name="flag" size={15} color={pColor} /> : null}
    </Pressable>
  );
}

/** memo: a linha só redesenha quando a própria tarefa muda (listas longas ficam fluidas). */
export const TaskItem = memo(TaskItemBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md + 2,
    marginHorizontal: space.lg,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  accent: { position: 'absolute', left: 0, top: space.md, bottom: space.md, width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: space.xs + 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 2, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: space.xs, maxWidth: 170, borderRadius: radius.sm - 2, paddingHorizontal: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

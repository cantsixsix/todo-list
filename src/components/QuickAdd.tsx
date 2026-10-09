/**
 * Campo fixo para adicionar tarefas rapidamente.
 * Entende atalhos ("Pagar conta amanhã !alta") e mostra, enquanto você
 * digita, o que foi entendido — assim não há surpresa ao criar.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatDueDate } from '@/lib/dates';
import { parseQuickAdd } from '@/lib/tasks';
import type { NewTask } from '@/lib/types';
import { PRIORITY_LABELS, priorityColor } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { elevation, radius, space, type } from '@/theme/tokens';

import { tap } from './haptics';

interface Props {
  onAdd: (task: NewTask) => void;
  /** Valores padrão (ex.: dentro de uma lista, ou "vence hoje" no filtro Hoje). */
  defaults?: Partial<NewTask>;
  placeholder?: string;
}

export function QuickAdd({ onAdd, defaults, placeholder = 'Adicionar tarefa' }: Props) {
  const { colors, scheme } = useTheme();
  const [text, setText] = useState('');
  const parsed = useMemo(() => (text.trim() ? parseQuickAdd(text) : null), [text]);
  const due = parsed?.due_date ?? defaults?.due_date ?? null;
  const priority = parsed?.priority || defaults?.priority || 0;

  const submit = () => {
    if (!parsed) return;
    onAdd({ ...defaults, title: parsed.title, due_date: due, priority });
    tap();
    setText('');
  };

  const canSubmit = !!parsed;

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.surface, borderColor: colors.border },
        elevation(scheme === 'light' ? 2 : 1, colors.shadow),
      ]}
    >
      <View style={styles.row}>
        <Ionicons name="add-circle" size={24} color={colors.primary} />
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          returnKeyType="done"
          submitBehavior="submit"
          maxLength={500}
          style={[styles.input, type.body, { color: colors.text }]}
          accessibilityLabel="Nova tarefa"
        />
        <Pressable
          onPress={submit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel="Adicionar"
          style={({ pressed }) => [
            styles.add,
            { backgroundColor: canSubmit ? colors.primary : colors.surfaceAlt, transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <Ionicons name="arrow-up" size={20} color={canSubmit ? colors.primaryText : colors.textSubtle} />
        </Pressable>
      </View>

      {parsed && (due || priority) ? (
        <View style={styles.preview} accessibilityLiveRegion="polite">
          {due ? (
            <View style={[styles.tag, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="calendar-clear-outline" size={12} color={colors.primary} />
              <Text style={[type.caption, { color: colors.primary }]}>{formatDueDate(due)}</Text>
            </View>
          ) : null}
          {priority ? (
            <View style={[styles.tag, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name="flag" size={12} color={priorityColor(priority, colors)} />
              <Text style={[type.caption, { color: colors.text }]}>{PRIORITY_LABELS[priority]}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, paddingLeft: space.md + 2, paddingRight: space.sm, paddingVertical: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 2 },
  input: { flex: 1, paddingVertical: space.sm, minHeight: 40, outlineStyle: 'none' } as never,
  add: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  preview: { flexDirection: 'row', gap: space.sm, paddingLeft: 34, paddingBottom: space.xs },
  tag: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: radius.pill },
});

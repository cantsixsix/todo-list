/**
 * Campo fixo para adicionar tarefas rapidamente.
 * Entende atalhos: "Pagar conta amanhã !alta".
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { parseQuickAdd } from '@/lib/tasks';
import type { NewTask } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';

import { tap } from './haptics';

interface Props {
  onAdd: (task: NewTask) => void;
  /** Valores padrão (ex.: dentro de uma lista, ou "vence hoje" no filtro Hoje). */
  defaults?: Partial<NewTask>;
  placeholder?: string;
}

export function QuickAdd({ onAdd, defaults, placeholder = 'Adicionar tarefa…' }: Props) {
  const { colors } = useTheme();
  const [text, setText] = useState('');

  const submit = () => {
    if (!text.trim()) return;
    const parsed = parseQuickAdd(text);
    onAdd({
      ...defaults,
      title: parsed.title,
      due_date: parsed.due_date ?? defaults?.due_date ?? null,
      priority: parsed.priority || defaults?.priority || 0,
    });
    tap();
    setText('');
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="done"
        submitBehavior="submit"
        maxLength={500}
        style={[styles.input, { color: colors.text }]}
        accessibilityLabel="Nova tarefa"
      />
      <Pressable
        onPress={submit}
        disabled={!text.trim()}
        accessibilityRole="button"
        accessibilityLabel="Adicionar"
        style={[styles.add, { backgroundColor: colors.primary, opacity: text.trim() ? 1 : 0.4 }]}
      >
        <Ionicons name="arrow-up" size={20} color={colors.primaryText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 8, minHeight: 40 },
  add: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

/**
 * Edição completa de uma tarefa. Salva sozinho: título e notas quando o
 * campo perde o foco; data, prioridade e lista na hora do toque.
 */
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { confirm } from '@/components/confirm';
import { DuePicker } from '@/components/DuePicker';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Button, Card, Chip, TextField, ThemedText } from '@/components/ui';
import { toISODate } from '@/lib/dates';
import { RECURRENCE_LABELS, RECURRENCES } from '@/lib/recurrence';
import type { Priority } from '@/lib/types';
import { useData } from '@/providers/DataProvider';
import { PRIORITY_LABELS, priorityColor } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { tasks, lists, editTask, toggleTask, removeTask } = useData();
  const task = tasks.find((t) => t.id === id);

  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');

  // Se a tarefa mudar em outro aparelho, atualiza só o campo que mudou
  // (para não apagar o que a pessoa está digitando no outro campo).
  // Padrão do React para "ajustar estado quando uma prop muda", sem useEffect.
  const [prevTask, setPrevTask] = useState(task);
  if (task !== prevTask) {
    setPrevTask(task);
    if (task && prevTask) {
      if (task.title !== prevTask.title) setTitle(task.title);
      if (task.notes !== prevTask.notes) setNotes(task.notes);
    }
  }

  if (!task) {
    return (
      <Screen>
        <EmptyState icon="alert-circle-outline" title="Tarefa não encontrada" subtitle="Ela pode ter sido apagada em outro aparelho." />
      </Screen>
    );
  }

  const saveTitle = () => {
    const clean = title.trim();
    if (!clean) setTitle(task.title);
    else if (clean !== task.title) editTask(task.id, { title: clean });
  };
  const saveNotes = () => {
    if (notes !== task.notes) editTask(task.id, { notes });
  };

  const onDelete = async () => {
    if (await confirm('Apagar tarefa?', `"${task.title}" será apagada.`)) {
      await removeTask(task.id);
      router.back();
    }
  };

  const done = task.completed_at !== null;

  return (
    <Screen>
      <Stack.Screen options={{ title: done ? 'Concluída' : 'Tarefa' }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextField
            label="Título"
            value={title}
            onChangeText={setTitle}
            onBlur={saveTitle}
            onSubmitEditing={saveTitle}
            maxLength={500}
            returnKeyType="done"
            style={styles.title}
          />

          <TextField
            label="Notas"
            value={notes}
            onChangeText={setNotes}
            onBlur={saveNotes}
            placeholder="Detalhes, links, observações…"
            multiline
            maxLength={5000}
            style={styles.notes}
            textAlignVertical="top"
          />

          <Field label="Data">
            <DuePicker value={task.due_date} onChange={(due_date) => editTask(task.id, { due_date })} />
          </Field>

          <Field label="Prioridade">
            <View style={styles.row}>
              {PRIORITY_LABELS.map((label, p) => (
                <Chip
                  key={label}
                  label={label}
                  icon={p > 0 ? 'flag' : undefined}
                  color={p > 0 ? priorityColor(p, colors) : undefined}
                  selected={task.priority === p}
                  onPress={() => editTask(task.id, { priority: p as Priority })}
                />
              ))}
            </View>
          </Field>

          <Field label="Repetir">
            <View style={styles.row}>
              <Chip
                label="Não repete"
                selected={task.recurrence === null}
                onPress={() => editTask(task.id, { recurrence: null })}
              />
              {RECURRENCES.map((r) => (
                <Chip
                  key={r}
                  icon="repeat"
                  label={RECURRENCE_LABELS[r]}
                  selected={task.recurrence === r}
                  // Repetição sem data começa hoje, para aparecer em "Hoje".
                  onPress={() =>
                    editTask(task.id, task.due_date ? { recurrence: r } : { recurrence: r, due_date: toISODate(new Date()) })
                  }
                />
              ))}
            </View>
          </Field>

          <Field label="Lista">
            <View style={styles.row}>
              <Chip label="Nenhuma" selected={task.list_id === null} onPress={() => editTask(task.id, { list_id: null })} />
              {lists.map((l) => (
                <Chip
                  key={l.id}
                  label={l.name}
                  color={l.color}
                  selected={task.list_id === l.id}
                  onPress={() => editTask(task.id, { list_id: l.id })}
                />
              ))}
            </View>
          </Field>

          <Button
            icon={done ? 'arrow-undo-outline' : 'checkmark-circle-outline'}
            title={done ? 'Marcar como pendente' : task.recurrence ? 'Concluir e agendar a próxima' : 'Concluir tarefa'} onPress={() => toggleTask(task.id)} />
          <Button title="Apagar tarefa" icon="trash-outline" variant="danger" onPress={onDelete} />

          <ThemedText muted variant="caption" style={styles.meta}>
            Criada em {new Date(task.created_at).toLocaleString('pt-BR')}
            {task.completed_at ? `\nConcluída em ${new Date(task.completed_at).toLocaleString('pt-BR')}` : ''}
          </ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/** Cada grupo de opções fica num cartão com título discreto. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card style={styles.field}>
      <ThemedText muted variant="overline">
        {label}
      </ThemedText>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxxl },
  title: { fontSize: 18 },
  notes: { minHeight: 110 },
  field: { padding: space.lg, gap: space.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  meta: { textAlign: 'center', marginTop: space.sm },
});

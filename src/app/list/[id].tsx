/** Tarefas de uma lista, com opções de renomear, trocar cor e apagar. */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { confirm } from '@/components/confirm';
import { EmptyState } from '@/components/EmptyState';
import { QuickAdd } from '@/components/QuickAdd';
import { Screen } from '@/components/Screen';
import { TaskSectionList } from '@/components/TaskSectionList';
import { Button, Chip, TextField } from '@/components/ui';
import { groupByDue, isCompleted, sortTasks } from '@/lib/tasks';
import { useData } from '@/providers/DataProvider';
import { LIST_COLORS } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';

export default function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { lists, tasks, addTask, editList, removeList } = useData();
  const list = lists.find((l) => l.id === id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list?.name ?? '');
  const [showDone, setShowDone] = useState(false);

  const sections = useMemo(() => {
    const mine = tasks.filter((t) => t.list_id === id);
    const open = groupByDue(mine.filter((t) => !isCompleted(t)));
    const done = sortTasks(mine.filter(isCompleted));
    return showDone && done.length ? [...open, { key: 'done', title: 'Concluídas', data: done }] : open;
  }, [tasks, id, showDone]);

  if (!list) {
    return (
      <Screen>
        <EmptyState icon="alert-circle-outline" title="Lista não encontrada" />
      </Screen>
    );
  }

  const saveName = () => {
    if (name.trim() && name.trim() !== list.name) editList(list.id, { name: name.trim() });
    setEditing(false);
  };

  const onDelete = async () => {
    if (await confirm('Apagar lista?', `"${list.name}" e todas as tarefas dela serão apagadas.`)) {
      router.back();
      await removeList(list.id);
    }
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: list.name,
          headerRight: () => (
            <Pressable
              onPress={() => {
                setName(list.name);
                setEditing((e) => !e);
              }}
              hitSlop={12}
              accessibilityLabel="Editar lista"
              style={styles.headerBtn}
            >
              <Ionicons name={editing ? 'close' : 'create-outline'} size={22} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {editing ? (
          <View style={[styles.edit, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <TextField value={name} onChangeText={setName} onSubmitEditing={saveName} maxLength={60} returnKeyType="done" />
            <View style={styles.colors}>
              {LIST_COLORS.map((c) => (
                <Pressable
                  key={c}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: c === list.color }}
                  onPress={() => editList(list.id, { color: c })}
                  style={[styles.swatch, { backgroundColor: c, borderColor: c === list.color ? colors.text : 'transparent' }]}
                />
              ))}
            </View>
            <View style={styles.editActions}>
              <Button title="Apagar lista" variant="ghost" onPress={onDelete} />
              <Button title="Salvar" onPress={saveName} />
            </View>
          </View>
        ) : null}

        <View style={styles.toggle}>
          <Chip label={showDone ? 'Ocultar concluídas' : 'Mostrar concluídas'} onPress={() => setShowDone((s) => !s)} />
        </View>

        <TaskSectionList
          sections={sections}
          showList={false}
          ListEmptyComponent={<EmptyState icon="list-outline" title="Lista vazia" subtitle="Adicione a primeira tarefa abaixo." />}
        />

        <View style={styles.bottom}>
          <QuickAdd onAdd={addTask} defaults={{ list_id: list.id }} placeholder={`Adicionar em ${list.name}…`} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerBtn: { paddingHorizontal: 12 },
  edit: { margin: 16, padding: 16, gap: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 3 },
  editActions: { flexDirection: 'row', justifyContent: 'space-between' },
  toggle: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8 },
  bottom: { padding: 12 },
});

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
import { Button, Card, Chip, IconBadge, ProgressBar, TextField, ThemedText } from '@/components/ui';
import { groupByDue, isCompleted, sortTasks } from '@/lib/tasks';
import { useData } from '@/providers/DataProvider';
import { LIST_COLORS } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

export default function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { lists, tasks, addTask, editList, removeList } = useData();
  const list = lists.find((l) => l.id === id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list?.name ?? '');
  const [showDone, setShowDone] = useState(false);

  const mineAll = useMemo(() => tasks.filter((t) => t.list_id === id), [tasks, id]);
  const doneCount = mineAll.filter(isCompleted).length;
  const sections = useMemo(() => {
    const mine = mineAll;
    const open = groupByDue(mine.filter((t) => !isCompleted(t)));
    const done = sortTasks(mine.filter(isCompleted));
    return showDone && done.length ? [...open, { key: 'done', title: 'Concluídas', data: done }] : open;
  }, [mineAll, showDone]);

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
          title: '',
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

        <Card style={styles.summary}>
          <View style={styles.summaryTop}>
            <IconBadge name="list" color={list.color} size={40} />
            <View style={styles.flex}>
              <ThemedText variant="title" numberOfLines={1}>
                {list.name}
              </ThemedText>
              <ThemedText muted variant="caption">
                {mineAll.length - doneCount} {mineAll.length - doneCount === 1 ? 'aberta' : 'abertas'} · {doneCount}{' '}
                {doneCount === 1 ? 'concluída' : 'concluídas'}
              </ThemedText>
            </View>
          </View>
          <ProgressBar value={mineAll.length ? doneCount / mineAll.length : 0} color={list.color} height={6} />
        </Card>
        <View style={styles.toggle}>
          <Chip
            icon={showDone ? 'eye-off-outline' : 'eye-outline'}
            label={showDone ? 'Ocultar concluídas' : 'Mostrar concluídas'}
            onPress={() => setShowDone((s) => !s)}
          />
        </View>

        <TaskSectionList
          sections={sections}
          showList={false}
          ListEmptyComponent={<EmptyState icon="list-outline" title="Lista vazia" subtitle="Adicione a primeira tarefa abaixo." />}
        />

        <View style={styles.bottom}>
          <QuickAdd onAdd={addTask} defaults={{ list_id: list.id }} placeholder={`Adicionar em ${list.name}`} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerBtn: { paddingHorizontal: 12 },
  edit: { margin: space.lg, marginBottom: 0, padding: space.lg, gap: space.md, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
  summary: { marginHorizontal: space.lg, marginTop: space.lg, padding: space.lg, gap: space.md },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 3 },
  editActions: { flexDirection: 'row', justifyContent: 'space-between' },
  toggle: { flexDirection: 'row', paddingHorizontal: space.lg, paddingTop: space.md },
  bottom: { paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.md },
});

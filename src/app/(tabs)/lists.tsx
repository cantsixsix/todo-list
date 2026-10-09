/** Listas (ex.: Trabalho, Casa, Mercado) em grade, com progresso de cada uma. */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, Card, IconBadge, ProgressBar, TextField, ThemedText } from '@/components/ui';
import { isCompleted } from '@/lib/tasks';
import type { TaskList } from '@/lib/types';
import { useData } from '@/providers/DataProvider';
import { LIST_COLORS } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { elevation, radius, space } from '@/theme/tokens';
import { useIsWide } from '@/theme/useLayout';

type Cell = TaskList | 'new';

export default function ListsScreen() {
  const { colors, scheme } = useTheme();
  const wide = useIsWide();
  const columns = wide ? 3 : 2;
  const { lists, tasks, addList } = useData();
  const [name, setName] = useState('');
  const [color, setColor] = useState(LIST_COLORS[0]);
  const [creating, setCreating] = useState(false);

  const stats = useMemo(() => {
    const s: Record<string, { open: number; total: number }> = {};
    for (const t of tasks) {
      if (!t.list_id) continue;
      s[t.list_id] ??= { open: 0, total: 0 };
      s[t.list_id].total += 1;
      if (!isCompleted(t)) s[t.list_id].open += 1;
    }
    return s;
  }, [tasks]);

  const cells = useMemo<Cell[]>(() => [...[...lists].sort((a, b) => a.position - b.position), 'new'], [lists]);

  const create = async () => {
    if (!name.trim()) return;
    const list = await addList({ name, color });
    setName('');
    setCreating(false);
    if (list) router.push({ pathname: '/list/[id]', params: { id: list.id } });
  };

  return (
    <Screen>
      <FlatList
        key={columns}
        data={cells}
        numColumns={columns}
        keyExtractor={(c) => (c === 'new' ? 'new' : c.id)}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.gap}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText muted>
              {lists.length ? `${lists.length} ${lists.length === 1 ? 'lista' : 'listas'}` : 'Separe suas tarefas por assunto.'}
            </ThemedText>
            {creating ? (
              <Card style={styles.form}>
                <ThemedText variant="heading">Nova lista</ThemedText>
                <TextField
                  autoFocus
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex.: Trabalho, Casa, Mercado"
                  accessibilityLabel="Nome da lista"
                  maxLength={60}
                  onSubmitEditing={create}
                  returnKeyType="done"
                />
                <View style={styles.colors}>
                  {LIST_COLORS.map((c) => (
                    <Pressable
                      key={c}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: c === color }}
                      accessibilityLabel={`Cor ${c}`}
                      onPress={() => setColor(c)}
                      style={[styles.swatch, { backgroundColor: c, borderColor: c === color ? colors.text : 'transparent' }]}
                    >
                      {c === color ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
                    </Pressable>
                  ))}
                </View>
                <View style={styles.formActions}>
                  <Button title="Cancelar" variant="ghost" onPress={() => setCreating(false)} />
                  <Button title="Criar lista" onPress={create} disabled={!name.trim()} />
                </View>
              </Card>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          if (item === 'new') {
            if (creating) return <View style={styles.cell} />;
            return (
              <Pressable
                onPress={() => setCreating(true)}
                accessibilityRole="button"
                accessibilityLabel="Nova lista"
                style={({ pressed }) => [
                  styles.cell,
                  styles.newCell,
                  { borderColor: colors.border, backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
                ]}
              >
                <View style={[styles.plus, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="add" size={22} color={colors.link} />
                </View>
                <ThemedText variant="small" style={{ color: colors.link }}>
                  Nova lista
                </ThemedText>
              </Pressable>
            );
          }
          const s = stats[item.id] ?? { open: 0, total: 0 };
          const pct = s.total ? (s.total - s.open) / s.total : 0;
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/list/[id]', params: { id: item.id } })}
              accessibilityLabel={`${item.name}, ${s.open} abertas`}
              style={({ pressed }) => [
                styles.cell,
                styles.listCell,
                { backgroundColor: colors.surface, borderColor: colors.border, transform: [{ scale: pressed ? 0.98 : 1 }] },
                scheme === 'light' ? elevation(1, colors.shadow) : null,
              ]}
            >
              <IconBadge name="list" color={item.color} />
              <View style={styles.cellText}>
                <ThemedText variant="heading" numberOfLines={1}>
                  {item.name}
                </ThemedText>
                <ThemedText muted variant="caption">
                  {s.open === 0 ? (s.total ? 'Tudo concluído' : 'Vazia') : `${s.open} ${s.open === 1 ? 'aberta' : 'abertas'}`}
                </ThemedText>
              </View>
              <ProgressBar value={pct} color={item.color} height={6} />
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: space.xxxl, gap: space.md },
  header: { gap: space.lg, marginBottom: space.xs },
  gap: { gap: space.md },
  cell: { flex: 1, minHeight: 148, borderRadius: radius.lg },
  listCell: { padding: space.lg, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'space-between', gap: space.md },
  cellText: { gap: 2 },
  newCell: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  plus: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  form: { padding: space.lg, gap: space.lg },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm + 2 },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm },
});

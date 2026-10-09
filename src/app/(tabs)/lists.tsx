/** Listas (ex.: Trabalho, Casa, Mercado) com contador de tarefas abertas. */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Button, Chip, TextField, ThemedText } from '@/components/ui';
import { countOpenByList } from '@/lib/tasks';
import { useData } from '@/providers/DataProvider';
import { LIST_COLORS } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';

export default function ListsScreen() {
  const { colors } = useTheme();
  const { lists, tasks, addList } = useData();
  const counts = useMemo(() => countOpenByList(tasks), [tasks]);
  const [name, setName] = useState('');
  const [color, setColor] = useState(LIST_COLORS[0]);
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    const list = await addList({ name, color });
    setName('');
    setCreating(false);
    if (list) router.push({ pathname: '/list/[id]', params: { id: list.id } });
  };

  const sorted = useMemo(() => [...lists].sort((a, b) => a.position - b.position), [lists]);

  return (
    <Screen>
      <FlatList
        data={sorted}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListHeaderComponent={
          creating ? (
            <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextField
                autoFocus
                value={name}
                onChangeText={setName}
                placeholder="Nome da lista"
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
                  />
                ))}
              </View>
              <View style={styles.formActions}>
                <Button title="Cancelar" variant="ghost" onPress={() => setCreating(false)} />
                <Button title="Criar" onPress={create} disabled={!name.trim()} />
              </View>
            </View>
          ) : (
            <View style={styles.headerRow}>
              <Chip label="+ Nova lista" selected onPress={() => setCreating(true)} />
            </View>
          )
        }
        ListEmptyComponent={
          creating ? null : (
            <EmptyState icon="folder-open-outline" title="Nenhuma lista" subtitle="Separe suas tarefas por assunto: Trabalho, Casa, Estudos…" />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/list/[id]', params: { id: item.id } })}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: pressed ? colors.surfaceAlt : colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: item.color }]}>
              <Ionicons name="list" size={18} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.name} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <ThemedText muted>{counts[item.id] ?? 0}</ThemedText>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', marginBottom: 12 },
  form: { padding: 16, gap: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16 },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 3 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontWeight: '600' },
});

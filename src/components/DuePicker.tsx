/**
 * Seletor de data que funciona igual no celular e na web:
 * atalhos (Hoje, Amanhã, Próx. semana) + digitação livre ("25/12").
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { addDays, formatDueDate, nextMonday, parseDateInput, toISODate } from '@/lib/dates';

import { Chip, TextField, ThemedText } from './ui';

export function DuePicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const today = new Date();
  const options: { label: string; value: string | null }[] = [
    { label: 'Hoje', value: toISODate(today) },
    { label: 'Amanhã', value: toISODate(addDays(today, 1)) },
    { label: 'Próx. semana', value: toISODate(nextMonday(today)) },
    { label: 'Sem data', value: null },
  ];
  const [text, setText] = useState('');
  const [invalid, setInvalid] = useState(false);

  const commit = () => {
    if (!text.trim()) return;
    const parsed = parseDateInput(text);
    if (parsed) {
      setInvalid(false);
      onChange(parsed);
      setText('');
    } else {
      setInvalid(true);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        {options.map((o) => (
          <Chip key={o.label} label={o.label} selected={value === o.value} onPress={() => {
              setInvalid(false);
              onChange(o.value);
            }} />
        ))}
      </View>
      <TextField
        value={text}
        onChangeText={(t) => {
          setText(t);
          setInvalid(false);
        }}
        onSubmitEditing={commit}
        onBlur={commit}
        placeholder="Outra data (ex.: 25/12)"
        returnKeyType="done"
        accessibilityLabel="Digitar data"
      />
      <ThemedText muted style={styles.hint}>
        {invalid
          ? 'Data não reconhecida. Use dd/mm ou dd/mm/aaaa.'
          : value
            ? `Vence: ${formatDueDate(value)} (${value.split('-').reverse().join('/')})`
            : 'Sem data de vencimento'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { fontSize: 13 },
});

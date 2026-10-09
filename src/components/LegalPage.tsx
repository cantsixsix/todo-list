/** Layout comum das páginas legais (privacidade e termos). */
import { ScrollView, StyleSheet, View } from 'react-native';

import { LEGAL_UPDATED_AT } from '@/lib/config';
import { space } from '@/theme/tokens';

import { Screen } from './Screen';
import { Card, ThemedText } from './ui';

export function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: [string, string][] }) {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <ThemedText variant="display">{title}</ThemedText>
          <ThemedText muted variant="small">
            Última atualização: {LEGAL_UPDATED_AT}
          </ThemedText>
          <ThemedText>{intro}</ThemedText>
        </View>
        {sections.map(([heading, body]) => (
          <Card key={heading} style={styles.card}>
            <ThemedText variant="heading">{heading}</ThemedText>
            <ThemedText muted>{body}</ThemedText>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxxl },
  head: { gap: space.sm, marginBottom: space.sm },
  card: { padding: space.lg, gap: space.sm },
});

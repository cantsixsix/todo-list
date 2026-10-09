/** Dicas de uso: ensina os atalhos que deixam o app mais rápido. */
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card, IconBadge, ThemedText } from '@/components/ui';
import { space } from '@/theme/tokens';

const TIPS: { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; title: string; text: string }[] = [
  { icon: 'flash', color: '#4F46E5', title: 'Datas ao digitar', text: 'Termine com "hoje" ou "amanhã": "Ligar para o banco amanhã".' },
  { icon: 'flag', color: '#EF4444', title: 'Prioridade ao digitar', text: 'Use !, !! ou !!! (ou !baixa, !media, !alta): "Enviar proposta !alta".' },
  { icon: 'repeat', color: '#10B981', title: 'Tarefas que se repetem', text: 'Abra a tarefa e escolha em "Repetir". Ao concluir, ela volta na próxima data.' },
  { icon: 'hand-left', color: '#F59E0B', title: 'Apagar rápido', text: 'Segure uma tarefa para apagá-la. Errou? Toque em "Desfazer".' },
  { icon: 'cloud-offline', color: '#64748B', title: 'Sem internet', text: 'Continue usando normalmente. Tudo é enviado quando a conexão voltar.' },
  { icon: 'desktop', color: '#0EA5E9', title: 'No computador', text: 'Entre pelo navegador com a mesma conta: tudo sincroniza na hora.' },
];

export default function TipsScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {TIPS.map((t) => (
          <Card key={t.title} style={styles.card}>
            <IconBadge name={t.icon} color={t.color} size={38} />
            <View style={styles.text}>
              <ThemedText variant="heading">{t.title}</ThemedText>
              <ThemedText muted variant="small">
                {t.text}
              </ThemedText>
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxxl },
  card: { flexDirection: 'row', gap: space.md, padding: space.lg, alignItems: 'flex-start' },
  text: { flex: 1, gap: space.xs },
});

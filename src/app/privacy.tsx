/**
 * Política de privacidade. Na versão web fica em /privacy — use esse
 * endereço no campo "Política de privacidade" do Google Play Console.
 */
import { ScrollView, StyleSheet } from 'react-native';

import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ui';

const SECTIONS: [string, string][] = [
  [
    'Quais dados coletamos',
    'Apenas o seu e-mail (para login) e o conteúdo que você cria no app: tarefas, notas, datas, prioridades e listas.',
  ],
  [
    'Para que usamos',
    'Exclusivamente para fazer o app funcionar e sincronizar suas tarefas entre seus aparelhos. Não vendemos, não compartilhamos para publicidade e não usamos rastreadores.',
  ],
  [
    'Onde ficam armazenados',
    'Em um banco de dados na nuvem (Supabase), com conexão criptografada (HTTPS). Regras de segurança no banco garantem que só você acessa seus dados. Uma cópia fica salva no seu aparelho para o app abrir sem internet.',
  ],
  [
    'Exclusão',
    'Você pode excluir sua conta a qualquer momento em Ajustes > Excluir minha conta. Isso apaga definitivamente seu e-mail, tarefas e listas dos nossos servidores.',
  ],
  ['Contato', 'Dúvidas sobre privacidade: abra uma issue em github.com/cantsixsix/todo-list.'],
];

export default function PrivacyScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.h1}>Política de Privacidade — Tarefas</ThemedText>
        <ThemedText muted>Última atualização: 9 de outubro de 2026</ThemedText>
        {SECTIONS.map(([title, body]) => (
          <ThemedText key={title}>
            <ThemedText style={styles.h2}>{title}{'\n'}</ThemedText>
            {body}
          </ThemedText>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18, paddingBottom: 48 },
  h1: { fontSize: 22, fontWeight: '800' },
  h2: { fontSize: 17, fontWeight: '700' },
});

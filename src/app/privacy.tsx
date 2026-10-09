/**
 * Política de privacidade (LGPD). Na versão web fica em /privacy — use esse
 * endereço no campo "Política de privacidade" do Google Play Console.
 */
import { LegalPage } from '@/components/LegalPage';
import { APP_NAME, LEGAL_ENTITY, SUPPORT_EMAIL } from '@/lib/config';

export default function PrivacyScreen() {
  return (
    <LegalPage
      title="Privacidade"
      intro={`Esta política explica quais dados o ${APP_NAME} trata, por quê e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).`}
      sections={[
        ['Controlador', `${LEGAL_ENTITY}, responsável pelo app ${APP_NAME}. Contato do encarregado (DPO): ${SUPPORT_EMAIL}.`],
        [
          'Quais dados coletamos',
          'Nome e e-mail (para criar sua conta) e o conteúdo que você cria: tarefas, notas, datas, prioridades, repetições e listas. Não coletamos localização, contatos, fotos nem dados de pagamento.',
        ],
        [
          'Para que usamos (base legal)',
          'Exclusivamente para prestar o serviço que você contratou ao criar a conta (execução de contrato, art. 7º, V da LGPD): guardar e sincronizar suas tarefas entre seus aparelhos. Não vendemos dados, não usamos para publicidade e não fazemos rastreamento entre apps.',
        ],
        [
          'Com quem compartilhamos',
          'Com o provedor de infraestrutura Supabase, que hospeda o banco de dados como operador, sob contrato e com criptografia em trânsito (HTTPS). Não compartilhamos com mais ninguém, salvo ordem judicial.',
        ],
        [
          'Onde e por quanto tempo',
          'Os dados ficam em servidores na nuvem enquanto sua conta existir. Uma cópia fica no seu aparelho para o app funcionar sem internet. Ao excluir a conta, apagamos tudo dos servidores imediatamente.',
        ],
        [
          'Seus direitos',
          `Você pode acessar, corrigir e excluir seus dados a qualquer momento no próprio app (Ajustes). Para outros pedidos previstos no art. 18 da LGPD (como portabilidade), escreva para ${SUPPORT_EMAIL}. Respondemos em até 15 dias.`,
        ],
        [
          'Excluir sua conta',
          `No app: Ajustes > Excluir minha conta. Sem acesso ao app: envie um e-mail para ${SUPPORT_EMAIL} a partir do endereço da conta pedindo a exclusão. Tudo é apagado e não pode ser recuperado.`,
        ],
        ['Crianças', 'O app não é direcionado a menores de 13 anos e não coletamos dados deles de forma intencional.'],
        ['Mudanças', 'Se esta política mudar de forma relevante, avisaremos dentro do app antes de a mudança valer.'],
      ]}
    />
  );
}

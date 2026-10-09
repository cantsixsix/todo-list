/** Termos de uso. Também acessível na web em /terms. */
import { LegalPage } from '@/components/LegalPage';
import { APP_NAME, LEGAL_ENTITY, SUPPORT_EMAIL } from '@/lib/config';

export default function TermsScreen() {
  return (
    <LegalPage
      title="Termos de uso"
      intro={`Ao criar uma conta no ${APP_NAME} você concorda com estes termos. Eles são curtos de propósito.`}
      sections={[
        ['O serviço', `O ${APP_NAME} é um app gratuito de organização de tarefas, oferecido por ${LEGAL_ENTITY}, disponível para Android e navegador.`],
        ['Sua conta', 'Você é responsável por manter sua senha em segurança e pelas informações que cadastra. Use um e-mail válido: é por ele que recuperamos o acesso.'],
        ['Uso permitido', 'Não use o app para atividades ilegais, para enviar spam ou para tentar acessar dados de outras pessoas ou atrapalhar o funcionamento do serviço.'],
        ['Seu conteúdo', 'As tarefas e listas que você cria são suas. Só as armazenamos para prestar o serviço, conforme a Política de Privacidade.'],
        ['Disponibilidade', 'Trabalhamos para manter o app sempre no ar, mas ele é oferecido "no estado em que se encontra", sem garantia de funcionamento ininterrupto. Mantenha cópia do que for crítico.'],
        ['Encerramento', 'Você pode excluir sua conta quando quiser. Podemos suspender contas que violem estes termos.'],
        ['Mudanças', 'Podemos atualizar estes termos; mudanças relevantes serão avisadas no app com antecedência.'],
        ['Contato e foro', `Dúvidas: ${SUPPORT_EMAIL}. Aplicam-se as leis brasileiras, incluindo o Código de Defesa do Consumidor.`],
      ]}
    />
  );
}

# Publicar na Google Play

Passo a passo para colocar o app na Play Store. O build é feito na nuvem pelo **EAS** (da Expo), sem precisar instalar o Android Studio.

## 0. Antes de começar

- [ ] Banco do Supabase configurado e versão web funcionando (veja o README)
- [ ] Versão web publicada, porque a **política de privacidade** precisa de um link público: `https://SEU-SITE/privacy`
- [ ] Conta de desenvolvedor Google Play (taxa única de US$ 25): <https://play.google.com/console/signup>
- [ ] Conta grátis na Expo: <https://expo.dev/signup>

> **Contas pessoais novas** na Play Console precisam fazer um **teste fechado com pelo menos 12 testadores por 14 dias** antes de liberar a produção. Comece cedo.

## 1. Conectar o projeto ao EAS

```bash
npm install -g eas-cli
eas login
eas init          # cria o projeto na Expo e grava o projectId no app.json
```

## 2. Cadastrar as chaves do Supabase no EAS

O build roda na nuvem e não enxerga seu `.env.local`. Cadastre as variáveis lá:

```bash
eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value https://xxxx.supabase.co \
  --environment production --environment preview --visibility plaintext
eas env:set --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value eyJ... \
  --environment production --environment preview --visibility plaintext
```
(Comando conferido no eas-cli 24. Versões antigas usavam `eas env:create`.)

## 3. Testar num celular de verdade (APK)

```bash
eas build --platform android --profile preview
```
Ao terminar, o EAS mostra um link/QR code para instalar o `.apk` direto no Android.

## 4. Gerar o pacote da loja (AAB)

```bash
eas build --platform android --profile production
```
Na primeira vez, deixe o EAS **gerar a chave de assinatura** (keystore). Ele a guarda com segurança e reutiliza nos próximos builds. O `versionCode` sobe sozinho a cada build (`autoIncrement` no `eas.json`).

## 5. Criar o app na Play Console

1. **Criar app** → nome "Tarefas" (ou o que preferir), idioma Português (Brasil), App, Gratuito.
2. Preencha **Configurar seu app** (painel inicial). Respostas para este app:

| Seção | Resposta |
|---|---|
| Política de privacidade | `https://SEU-SITE/privacy` |
| Acesso ao app | "Todas as funcionalidades exigem login". Crie uma conta de teste e informe e-mail e senha para a revisão do Google |
| Anúncios | Não contém anúncios |
| Classificação de conteúdo | Questionário: categoria "Utilitário/Produtividade", sem conteúdo sensível |
| Público-alvo | 13+ (ou 18+); não é direcionado a crianças |
| **Segurança dos dados** | Veja abaixo |
| Exclusão de conta | Sim, dentro do app (Ajustes → Excluir minha conta) e via link: `https://SEU-SITE/privacy` |

### Formulário "Segurança dos dados"
- Coleta dados? **Sim**
  - **Endereço de e-mail**: coletado; finalidade *Funcionalidade do app* e *Gerenciamento de conta*; obrigatório
  - **Outros conteúdos gerados pelo usuário** (as tarefas): coletado; finalidade *Funcionalidade do app*
- Compartilha com terceiros? **Não** (o Supabase atua como provedor de serviço)
- Dados criptografados em trânsito? **Sim** (HTTPS)
- Usuário pode pedir exclusão? **Sim**

## 6. Ficha da loja

- **Ícone 512×512**: exporte `assets/icon.png` em 512 px
- **Imagem de destaque 1024×500**: obrigatória
- **Capturas de tela**: pelo menos 2 de celular. As do teste E2E (`e2e/screenshots/mobile-*.png`) servem de ponto de partida, mas o ideal é capturar do app instalado
- **Descrição curta** (até 80 caracteres): *Suas tarefas organizadas, no celular e no computador, sempre sincronizadas.*
- **Descrição completa**: use a lista de funcionalidades do README

## 7. Enviar o build

Pelo navegador: **Testar e lançar → Teste interno → Criar versão** e envie o `.aab` baixado do EAS.

Ou direto pelo terminal (exige uma conta de serviço do Google Cloud com acesso à Play Console):
```bash
eas submit --platform android --profile production
```
O `eas.json` já envia para a faixa **internal** (teste interno). Depois promova para teste fechado → produção na Play Console.

## 8. Atualizações

- **Mudou só código JS/TS** (telas, lógica): `eas update` publica na hora para quem já tem o app (*over-the-air*), sem passar pela revisão da loja. Requer configurar o `expo-updates` (`npx expo install expo-updates` e `eas update:configure`).
- **Mudou algo nativo** (nova biblioteca nativa, ícone, permissões): aumente `version` no `app.json` e rode o build de produção de novo.
- **Mudou o banco**: crie um novo arquivo em `supabase/migrations/` e aplique no Supabase **antes** de publicar o app que depende dele.

# Tarefas

App de lista de tarefas para **Android (Google Play)** e **web**, com banco de dados online e sincronização em tempo real. Um único código TypeScript gera as duas versões.

<p align="center"><img src="assets/icon.png" width="96" alt="Ícone do app"></p>

## Funcionalidades

- **Conta e login** por e-mail e senha, com recuperação de senha e exclusão de conta
- **Sincronização em tempo real**: marque uma tarefa no celular e ela aparece concluída no computador na hora
- **Funciona offline**: o app abre sem internet e as alterações são enviadas quando a conexão volta
- **Filtros inteligentes**: Hoje (inclui atrasadas), Próximos, Todas, Concluídas, além de busca
- **Listas** coloridas (Trabalho, Casa, Mercado…) com contador
- **Data, prioridade, notas** e **repetição** (todo dia, dias úteis, toda semana, todo mês, todo ano)
- **Atalhos ao digitar**: `Pagar conta amanhã !alta` cria a tarefa já com data e prioridade
- **Desfazer** ao apagar (segure a tarefa para apagar)
- **Tema claro/escuro** automático ou manual; layout adaptado para celular, tablet e computador
- **Acessibilidade**: rótulos para leitores de tela em todos os controles

## Tecnologias

| Camada | Escolha | Por quê |
|---|---|---|
| App | [Expo](https://expo.dev) SDK 57 + React Native + TypeScript | Um código para Android, iOS e web |
| Navegação | Expo Router | Rotas por arquivos (`src/app`), links funcionam na web |
| Banco online | [Supabase](https://supabase.com) (Postgres) | Login, banco, regras de segurança e tempo real prontos; plano grátis |
| Build da loja | EAS Build | Gera o `.aab` da Play Store na nuvem, sem precisar de Android Studio |
| Testes | Jest (lógica) + Playwright (navegador) | Rodam a cada push no GitHub Actions |

## Como rodar

### 1. Pré-requisitos
- [Node.js](https://nodejs.org) 20 ou mais recente
- Uma conta grátis no [Supabase](https://supabase.com)
- (Opcional) O app **Expo Go** no celular, para testar no aparelho

### 2. Criar o banco de dados
1. No Supabase, crie um projeto (**New project**).
2. Abra **SQL Editor** e rode, **em ordem**, os arquivos de [`supabase/migrations/`](supabase/migrations):
   1. `20261009000000_init.sql` (tabelas, segurança, tempo real, exclusão de conta)
   2. `20261009010000_recurrence.sql` (tarefas recorrentes)
3. Em **Authentication → URL Configuration**:
   - **Site URL**: o endereço da sua versão web (ex.: `https://seu-app.vercel.app`). Para testes: `http://localhost:8081`.
   - **Redirect URLs**: adicione `todolist://**` (app) e `http://localhost:8081/**` (desenvolvimento).

> Usa a CLI do Supabase? `supabase link` e depois `supabase db push` aplicam as migrações.

### 3. Configurar o app
```bash
npm install
cp .env.example .env.local
```
Preencha o `.env.local` com os dados de **Project Settings → API** no Supabase:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
A chave *anon* é pública por definição (vai dentro do app). Quem protege os dados são as regras de *Row Level Security* do banco. **Nunca** coloque a chave `service_role` no app.

### 4. Rodar
```bash
npm start        # abre o menu: "w" para web, QR code para o Expo Go no celular
npm run web      # direto no navegador
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm start` | Servidor de desenvolvimento |
| `npm run web` | Abre a versão web |
| `npm run check` | Tipos + lint + testes unitários (rode antes de cada commit) |
| `npm test` | Testes unitários (Jest) |
| `npm run test:e2e` | Build web + teste no navegador com backend simulado |
| `npm run build:web` | Gera a versão web de produção em `dist/` |
| `node scripts/generate-icons.js` | Regera os ícones a partir do SVG |

## Publicar

- **Web**: conecte o repositório na [Vercel](https://vercel.com) ou na [Netlify](https://netlify.com) (os arquivos `vercel.json` e `netlify.toml` já estão prontos) e cadastre as duas variáveis `EXPO_PUBLIC_SUPABASE_*` no painel.
- **Google Play**: siga o passo a passo em [`docs/PUBLICAR_PLAY_STORE.md`](docs/PUBLICAR_PLAY_STORE.md).

## Estrutura

```
src/
  app/            telas (cada arquivo é uma rota)
  components/     peças de interface reutilizáveis
  providers/      estado global: login (Auth) e dados (Data)
  lib/            regras de negócio puras, acesso ao banco, fila offline
  theme/          cores e tema claro/escuro
supabase/migrations/   esquema do banco em SQL
e2e/                   teste no navegador
docs/                  guias
```

A explicação completa do código, arquivo por arquivo, está em [`docs/GUIA_DO_CODIGO.md`](docs/GUIA_DO_CODIGO.md).

## Licença

MIT

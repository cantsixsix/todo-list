# Guia do código

Este documento explica **como o app funciona por dentro**, camada por camada, para quem quer entender, manter ou evoluir o projeto.

---

## 1. A ideia geral

```
┌──────────────────────── seu celular / navegador ────────────────────────┐
│                                                                         │
│  Telas (src/app)  ──usa──▶  Providers (src/providers)  ──usa──▶  lib    │
│   o que você vê            estado global do app             regras puras│
│                                   │                                     │
│                         cache + fila offline                            │
│                          (AsyncStorage)                                 │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │ HTTPS + WebSocket (tempo real)
                          ┌─────────▼──────────┐
                          │      Supabase      │
                          │ Auth · Postgres ·  │
                          │ Realtime · RLS     │
                          └────────────────────┘
```

- **Um único código** (TypeScript + React Native) roda no Android, no iOS e no navegador. Quem faz essa mágica é o **Expo** e, na web, o `react-native-web`, que traduz `<View>` em `<div>`, `<Text>` em texto etc.
- **O servidor é o Supabase**: não escrevemos nenhum backend. Ele oferece login, um banco Postgres, uma API automática para as tabelas e notificações em tempo real.
- **Segurança fica no banco**, não no app. Mesmo que alguém modifique o app, as regras do Postgres (*Row Level Security*) impedem acessar dados de outra pessoa.

### As 4 camadas

| Pasta | Responsabilidade | Pode importar de |
|---|---|---|
| `src/app/` | Telas. Cada arquivo é uma rota (URL) | components, providers, lib, theme |
| `src/components/` | Peças de interface reutilizáveis | providers, lib, theme |
| `src/providers/` | Estado global: quem está logado, quais tarefas existem | lib |
| `src/lib/` | Regras de negócio puras, acesso ao banco | só `lib` |

A regra de ouro: **`lib` não sabe que React existe**. Por isso dá para testar tudo nela com testes rápidos, sem abrir app nenhum.

---

## 2. Banco de dados (`supabase/migrations/`)

Migrações são arquivos SQL aplicados **em ordem**, cada um descrevendo uma mudança no banco. Nunca se edita uma migração já aplicada: cria-se outra.

### `20261009000000_init.sql`

**Tabelas**

```sql
create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  list_id       uuid references public.lists (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 500),
  ...
```

- `user_id ... default auth.uid()`: o banco preenche sozinho com o usuário logado.
- `on delete cascade`: apagar o usuário apaga as listas e tarefas dele; apagar uma lista apaga as tarefas dela.
- `check (...)`: validações no próprio banco (título de 1 a 500 caracteres, cor no formato `#RRGGBB`, prioridade de 0 a 3). Mesmo que o app tenha um bug, dado inválido não entra.
- Os **índices** (`create index`) deixam rápidas as buscas por usuário e por data.
- O **trigger** `set_updated_at` atualiza `updated_at` em toda alteração.

**Row Level Security (RLS)**: o coração da segurança.

```sql
alter table public.tasks enable row level security;
create policy "tasks: dono lê" on public.tasks for select to authenticated
  using ((select auth.uid()) = user_id);
```

Com RLS ligado, **toda** consulta passa por essas regras. "Só pode ler linhas cujo `user_id` é você." Há uma regra para cada operação (ler, criar, alterar, apagar). Na criação e na alteração de tarefas existe uma checagem extra: não é possível colocar uma tarefa numa lista de outra pessoa.

> Por que `(select auth.uid())` em vez de `auth.uid()`? Assim o Postgres calcula o valor uma vez por consulta, não uma vez por linha. É uma recomendação de performance do Supabase.

**Exclusão de conta** (exigida pela Google Play):

```sql
create or replace function public.delete_my_account() ... security definer
  delete from auth.users where id = auth.uid();
```

Um usuário comum não tem permissão para apagar da tabela `auth.users`. A função roda com permissões elevadas (`security definer`), mas só apaga **quem a chamou**. O `set search_path = ''` evita um ataque conhecido em funções desse tipo.

**Tempo real**: `alter publication supabase_realtime add table ...` faz o Postgres avisar os apps conectados sempre que uma linha muda.

### `20261009010000_recurrence.sql`
Acrescenta a coluna `recurrence` (`daily`, `weekdays`, `weekly`, `monthly`, `yearly` ou nulo).

---

## 3. Regras de negócio (`src/lib/`)

### `types.ts`
Os tipos TypeScript espelham as tabelas. `Task` é uma linha de `tasks`; `NewTask` e `TaskPatch` são os campos que o app pode mandar ao criar ou alterar. Se um campo for escrito errado em qualquer lugar do app, o TypeScript acusa antes de rodar.

### `dates.ts`: datas sem dor de cabeça
Datas de vencimento são **datas de calendário** (`'2026-10-09'`), sem horário nem fuso. Isso evita o clássico bug de "a tarefa de hoje aparece como ontem" quando o servidor está em outro fuso.

- `toISODate` / `fromISODate` convertem usando o **fuso do aparelho**.
- `formatDueDate` gera rótulos amigáveis: "Hoje", "Amanhã", "ter", "25 dez".
- `parseDateInput` entende `25/12`, `1/2/27`, `hoje`, `amanhã` e **rejeita datas impossíveis** como 31/02. O JavaScript "rolaria" 31/02 para 3 de março sem avisar.

### `tasks.ts`: filtros, ordenação, agrupamento
- `applyFilter`: "Hoje" inclui as **atrasadas**, para nada ficar esquecido.
- `searchTasks`: ignora acentos e maiúsculas ("joao" encontra "João"), com `normalize('NFD')`, que separa letra e acento, removendo os acentos em seguida.
- `compareTasks`: ordem padrão. Data mais próxima primeiro, depois prioridade, depois sem data, e concluídas no fim.
- `groupByDue`: separa em Atrasadas / Hoje / Amanhã / Próximos 7 dias / Mais tarde / Sem data.
- `parseQuickAdd`: os atalhos de digitação. Lê palavra por palavra; `hoje`, `amanhã`, `!`, `!!`, `!!!`, `!alta`... viram campos, e o resto vira o título.

### `recurrence.ts`: tarefas que se repetem
`nextOccurrence(data, regra)` calcula a próxima data. Cuidados especiais:
- **Mês com menos dias**: 31/jan + 1 mês = 28/fev (e não 3/mar). Depois volta para 31/mar, porque o cálculo sempre parte da data original.
- **Tarefa muito atrasada** pula direto para o futuro, em vez de criar uma fila de ocorrências vencidas.
- **Dias úteis** pula sábado e domingo.

### `outbox.ts`: a fila offline
Cada alteração vira uma **operação** (`Op`): `insertTask`, `updateTask`, `deleteTask` etc. Sem internet, ela vai para uma fila. `enqueue` **compacta** a fila:

| Na fila | Nova operação | Resultado |
|---|---|---|
| criar A | editar A | um único "criar A" já editado |
| criar A | apagar A | nada (A nunca precisou ir ao servidor) |
| editar A (título) | editar A (prioridade) | uma edição com os dois campos |

`isNetworkError` distingue "sem internet" (tentar de novo depois) de "o servidor recusou" (desfazer e avisar).

### `api.ts`: a única porta para o banco
Funções pequenas como `fetchTasks`, `insertTask`, `updateTask`... Elas usam o cliente do Supabase, que transforma `supabase.from('tasks').update(...).eq('id', id)` numa chamada HTTPS para a API do banco.

`runOp(op)` executa uma operação da fila e é **segura para repetir**:
- se um "criar" já tinha chegado ao servidor (a resposta se perdeu), o reenvio dá *chave duplicada* (`23505`), o que significa que já existe, e tratamos como sucesso;
- editar algo que foi apagado em outro aparelho (`PGRST116`) é ignorado.

Isso é importante porque o **id da tarefa é gerado no próprio app** (`uuid.ts`). Assim a tarefa aparece na tela na hora, e o reenvio nunca cria duplicatas.

### `supabase.ts`: o cliente
Cria a conexão com as chaves do `.env.local`. No celular, a sessão (token de login) fica no `AsyncStorage`; na web, no `localStorage`. Também pausa a renovação do token quando o app vai para segundo plano, como recomenda o Supabase. Se as chaves não existirem, `isSupabaseConfigured` é `false` e o app mostra a tela de instruções em vez de quebrar.

---

## 4. Estado global (`src/providers/`)

*Providers* são componentes React que guardam dados e os entregam a qualquer tela via **Context**. Qualquer tela chama `useData()` ou `useAuth()` e recebe os dados atuais; quando eles mudam, a tela redesenha sozinha.

### `AuthProvider.tsx`
- Ao abrir, pergunta ao Supabase se existe sessão salva (`getSession`) e passa a ouvir mudanças (`onAuthStateChange`): login, logout e renovação de token.
- Expõe `signIn`, `signUp`, `resetPassword`, `updatePassword`, `signOut` e `deleteAccount`.
- `translateAuthError` traduz as mensagens do Supabase (em inglês) para português.

### `DataProvider.tsx`: o cérebro do app
Mantém `tasks` e `lists` em memória e cuida de tudo que envolve sincronização.

1. **Abertura instantânea**: lê o cache do aparelho (`data-cache:v1:<usuário>`) e mostra na hora, sem esperar a internet.
2. **Atualização**: em seguida busca no servidor (`refresh`). Antes disso, envia a fila offline; senão, os dados do servidor "desfariam" o que foi feito offline.
3. **Tempo real**: assina o canal do Supabase filtrando `user_id=eq.<você>`. Cada evento (`INSERT`, `UPDATE`, `DELETE`) atualiza a lista local com `upsertById` ou `removeById` (`collection.ts`).
4. **Alterações otimistas** com `mutate(mudança, operação)`:
   ```
   tela muda na hora → tenta o servidor
       ├─ ok ................................ pronto
       ├─ sem internet ...................... vai para a fila (aviso "Sem internet...")
       └─ servidor recusou .................. volta ao estado anterior + mostra o erro
   ```
   Se já existe algo na fila, a nova operação **entra na fila também**, para manter a ordem.
5. **Reenvio da fila**: ao voltar para o app, no evento `online` do navegador e a cada 15 s enquanto houver pendências.

Detalhe importante: `<DataStore key={userId}>`. A `key` faz o React **criar um estado novo** quando outra pessoa entra no mesmo aparelho, então nunca aparecem dados da conta anterior.

`toggleTask` tem a regra das recorrentes: se a tarefa repete, em vez de concluir, ele move a data para `nextOccurrence(...)` e mostra "Feito! Próxima vez: ...".

---

## 5. Telas (`src/app/`): roteamento por arquivos

Com o **Expo Router**, a estrutura de pastas **é** a navegação:

| Arquivo | Endereço (web) | O que é |
|---|---|---|
| `_layout.tsx` | – | Raiz: providers + decide o que mostrar |
| `sign-in.tsx` | `/sign-in` | Entrar / criar conta / recuperar senha |
| `(tabs)/_layout.tsx` | – | Barra de abas inferior |
| `(tabs)/index.tsx` | `/` | Tarefas (filtros, busca, adicionar) |
| `(tabs)/lists.tsx` | `/lists` | Listas |
| `(tabs)/settings.tsx` | `/settings` | Ajustes |
| `task/[id].tsx` | `/task/abc-123` | Editar uma tarefa (`[id]` = parâmetro) |
| `list/[id].tsx` | `/list/abc-123` | Tarefas de uma lista |
| `reset-password.tsx` | `/reset-password` | Nova senha (link do e-mail) |
| `privacy.tsx` | `/privacy` | Política de privacidade (link para a Play Store) |
| `+not-found.tsx` | qualquer outro | Página 404 |

Pastas entre parênteses, como `(tabs)`, **agrupam** telas sem aparecer na URL.

### `_layout.tsx`: quem vê o quê
```tsx
<Stack.Protected guard={loggedIn}>   …telas do app…   </Stack.Protected>
<Stack.Protected guard={!loggedIn}>  <Stack.Screen name="sign-in" />  </Stack.Protected>
```
`Stack.Protected` libera as telas só quando a condição é verdadeira. Ao fazer login ou logout, o roteador redireciona sozinho. A ordem dos providers importa: `Snackbar` por fora (avisos), depois `Auth` (login) e por dentro `Data`, porque os dados dependem de quem está logado.

### `(tabs)/index.tsx`: tela principal
Combina as funções puras de `lib`:
```ts
const filtered = searchTasks(applyFilter(tasks, filter), query);
return groupByDue(filtered);
```
O `useMemo` faz esse cálculo só quando `tasks`, `filter` ou `query` mudam, e não a cada redesenho. No filtro "Hoje", o campo de adicionar já cria a tarefa com a data de hoje.

### `task/[id].tsx`: edição
Salva sozinho: título e notas quando o campo perde o foco; data, prioridade, repetição e lista no toque. Se a mesma tarefa for editada em outro aparelho, só o **campo que mudou** é atualizado, para não apagar o que você está digitando no outro campo.

---

## 6. Componentes (`src/components/`)

| Arquivo | O que faz |
|---|---|
| `ui.tsx` | `Button`, `TextField`, `Chip`, `Card`, `ThemedText`, todos já com as cores do tema e acessibilidade |
| `TaskItem.tsx` | Uma linha de tarefa. Usa `memo`, então só redesenha quando a própria tarefa muda (listas longas ficam fluidas) |
| `TaskSectionList.tsx` | A lista com seções, "puxar para atualizar" e "segurar para apagar" com **Desfazer** |
| `QuickAdd.tsx` | Campo de adicionar com atalhos |
| `DuePicker.tsx` | Seletor de data que funciona igual no celular e na web (botões + digitação) |
| `Snackbar.tsx` | Avisos no rodapé ("Tarefa apagada · Desfazer", erros) |
| `confirm.ts` | Pergunta "Tem certeza?". O `Alert` do React Native não funciona na web, então lá usamos `window.confirm` |
| `haptics.ts` | Vibração leve ao concluir (só no celular) |
| `Screen.tsx` | Centraliza o conteúdo numa coluna de até 720 px em telas grandes |
| `SetupNeeded.tsx` | Instruções quando o `.env.local` não foi configurado |

## 7. Tema (`src/theme/`)
`colors.ts` define as paletas clara e escura com **nomes de função** (`background`, `surface`, `text`, `primary`, `danger`...), nunca cores soltas nas telas. `ThemeProvider` escolhe a paleta (automático, segue o sistema; ou claro/escuro manual, salvo no aparelho), e `useTheme()` entrega as cores para qualquer componente. Trocar a identidade visual do app inteiro é mexer em um arquivo.

---

## 8. Testes

### Unitários (`src/lib/__tests__/`, Jest)
Testam as funções puras com datas fixas (9/10/2026, uma sexta-feira), para darem sempre o mesmo resultado: datas, filtros, ordenação, atalhos, recorrência e a fila offline. Rodam em cerca de 2 segundos: `npm test`.

### Ponta a ponta (`e2e/web.e2e.js`, Playwright)
Abre a versão web num **Chromium de verdade** e faz o que um usuário faria, em tela de celular (tema claro) e de computador (tema escuro):

1. login com senha errada (confere a mensagem) e depois a certa
2. cria tarefas com atalhos (`!alta`, `amanhã`)
3. cria uma lista e uma tarefa dentro dela
4. edita notas, conclui
5. transforma uma tarefa em semanal e confere que a data avançou
6. **derruba a internet**, cria e conclui tarefas, religa e confere que tudo chegou ao servidor
7. abre os Ajustes e sai

O Supabase é **simulado** dentro do teste (o Playwright intercepta as chamadas de rede), então não precisa de conta nem internet. Ao final, o teste confere que os dados chegaram ao "servidor" com os valores certos. Screenshots ficam em `e2e/screenshots/`.

### CI (`.github/workflows/ci.yml`)
A cada push, o GitHub roda: tipos → lint → testes unitários → build web → E2E. Se algo quebrar, aparece um ❌ no commit.

---

## 9. Configuração e publicação

| Arquivo | Para quê |
|---|---|
| `app.json` | Nome, ícone, pacote Android `com.cantsixsix.todolist`, splash, permissões bloqueadas |
| `eas.json` | Perfis de build: `preview` (APK para testar) e `production` (AAB para a loja) |
| `vercel.json` / `netlify.toml` | Hospedagem da versão web (toda URL abre o `index.html`) |
| `.env.example` | Modelo das variáveis do Supabase |
| `scripts/generate-icons.js` | Gera todos os ícones a partir de um SVG |

**Permissões Android**: o app pede só **Internet** e **vibração**. Permissões que bibliotecas incluiriam por padrão (arquivos, desenhar sobre outros apps) são removidas em `blockedPermissions`. Isso facilita a revisão da Play Store e passa confiança ao usuário.

---

## 10. Como evoluir

**Adicionar um campo na tarefa** (ex.: "tempo estimado"):
1. Nova migração em `supabase/migrations/` (`alter table public.tasks add column ...`) e aplicar no Supabase
2. Adicionar o campo em `Task`, `NewTask`/`TaskPatch` (`src/lib/types.ts`)
3. Incluir no `addTask` / `restoreTask` do `DataProvider`
4. Mostrar/editar em `task/[id].tsx` e, se quiser, em `TaskItem.tsx`
5. `npm run check` e `npm run test:e2e`

**Ideias de próximos passos**
- Lembretes com notificação no horário (`expo-notifications` + coluna `due_time`)
- Subtarefas (checklist dentro da tarefa)
- Arrastar para reordenar (a coluna `position` já existe)
- Compartilhar listas com outras pessoas (tabela `list_members` + ajuste nas regras de RLS)
- Login com Google
- Atualizações *over-the-air* com `expo-updates`

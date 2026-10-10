# 💡 Ideia: Tarefas

> Este repositório é uma **ideia em validação**. Mapa completo de todas as ideias: [IDEIAS.md no repo `dev`](https://github.com/cantsixsix/dev/blob/claude/serene-bardeen-1tjfw2/IDEIAS.md).
>
> Estágios: 💡 ideia · 🧪 protótipo · 🚀 no ar · ✅ validada · 🗄️ arquivada.
> Regra: antes de escrever mais código, rodar o **teste** de uma variação. Sem reação em 2 semanas → 🗄️.

## P1 · Tarefas — `todo-list` 🧪

App de tarefas com listas, recorrência e offline (Expo + Supabase).
- **P1.a Tarefas pessoais** — o app como está. *Teste:* build web + 10 pessoas por 1 semana.
- **P1.b Listas compartilhadas** — mercado/casa para casal ou família. *Teste:* 5 casais.
- **P1.c Rotinas recorrentes** — usar o motor de recorrência que já existe (`recurrence.ts`) para hábitos diários. *Teste:* landing "rotina sem esquecer".
- **P1.d Task AI** — IA quebra um objetivo em passos (case `Beaqme/new/cases/task-ai.html`). *Teste:* botão "quebrar em passos" no P1.a e medir uso.

<!-- validacao:inicio -->

## 🧪 Como validar

Teste de 7 dias. Resultados vão na [Bancada de Ideias](https://claude.ai/artifact/Y4H9MCxyvwwLDmhL812znj).

### P1 · Tarefas

**Em uma frase:** Um app de tarefas simples que funciona sem internet e lembra das coisas que se repetem.

- **Problema:** Apps de tarefa ou são complicados demais (Notion, Todoist cheio de recurso) ou perdem tudo sem internet. Tarefas que se repetem (pagar conta, regar planta) acabam esquecidas.
- **Para quem:** Pessoas comuns que hoje usam bloco de notas do celular ou WhatsApp consigo mesmas para lembrar de coisas.
- **Como funciona:** Você cria listas, adiciona tarefas com data e repetição (todo dia, toda segunda, todo mês). Funciona offline e sincroniza quando volta a internet.
- **Como ganha dinheiro:** Grátis para uso pessoal; plano de R$ 9,90/mês para listas compartilhadas e lembretes no WhatsApp.

| Teste | |
|---|---|
| Tipo | Colocar pessoas usando |
| Página | https://validar-ideias.netlify.app/p1/ |
| Onde divulgar | Seus contatos do WhatsApp + grupos de produtividade no Facebook |
| Preço testado | R$ 9,90/mês |
| Meta em 7 dias | **10 pessoas usando por 7 dias seguidos** |

<!-- validacao:fim -->

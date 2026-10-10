# Marca: Tarefas

## Logo

| Arquivo | Quando usar |
|---|---|
| `assets/brand/logo-horizontal.svg` | Padrão, sobre fundo claro (site, documentos) |
| `assets/brand/logo-horizontal-on-dark.svg` | Sobre fundo escuro ou foto escura |
| `assets/brand/logo-mark.svg` | Só o símbolo: avatar de redes sociais, favicon, espaços quadrados |
| `assets/brand/logo-mono.svg` | Uma cor só: carimbo, gravação, impressão em preto |
| `assets/brand/wordmark.svg` | Só o nome, quando o símbolo já aparece por perto |

O nome está **convertido em vetor**, então o logo aparece igual em qualquer computador, sem precisar da fonte instalada.

**Regras de uso**
- Área de respiro: deixe livre, ao redor do logo, pelo menos a metade da altura do símbolo.
- Tamanho mínimo: 24 px de altura para o logo horizontal; 16 px para o símbolo.
- Não fazer: mudar as cores, esticar, girar, adicionar sombra ou contorno, colocar sobre fundo poluído ou de baixo contraste.

No app, o símbolo é desenhado pelo componente `src/components/BrandMark.tsx`, o mesmo em todas as telas. Os ícones do app são gerados por `node scripts/generate-icons.js`.

## Cores

**Cor da marca** (fixa, não muda com o tema), definida em `src/theme/brand.ts`:

| Nome | Hex | Uso |
|---|---|---|
| Índigo | `#4F46E5` | Logo, botões principais, destaque |
| Índigo escuro | `#3730A3` | Final do degradê do ícone |
| Branco | `#FFFFFF` | Texto e símbolo sobre o índigo |

**Interface**: tons neutros (cinzas levemente azulados) na maior parte da tela. Cor só onde carrega informação:
- **Prioridade**: azul (baixa), âmbar (média) e vermelho (alta), mostrada só na cor do círculo.
- **Estados**: vermelho (erro ou excluir) e verde (sucesso).
- **Listas**: a cor que o próprio usuário escolheu.

A paleta completa, clara e escura, está em `src/theme/colors.ts`. Textos em destaque usam o token `link`, que garante contraste de leitura (≥ 4,5:1) nos dois temas.

## Tipografia

**Inter**, em todos os tamanhos. A escala fica em `src/theme/tokens.ts`:

| Estilo | Uso |
|---|---|
| display (30, ExtraBold) | Título das telas principais |
| title (22, Bold) | Títulos de cartões e perfil |
| heading (17, SemiBold) | Subtítulos e itens importantes |
| body (16, Regular) | Texto corrido e tarefas |
| small / caption (14 e 13, Medium) | Informações secundárias |
| overline (12, SemiBold, maiúsculas) | Rótulos de seção |

## Tom de voz

Direto, gentil e prático. Frases curtas, sem jargão técnico, tratando a pessoa por "você".

| Assim sim | Assim não |
|---|---|
| "Tarefa apagada · Desfazer" | "A operação de exclusão foi concluída com êxito." |
| "Sem internet. Suas alterações serão enviadas quando a conexão voltar." | "Erro de rede: falha ao sincronizar." |
| "Nada para hoje. Aproveite o dia." | "Nenhum registro encontrado." |

## Consistência nas telas

- Telas principais: sempre com o `PageHeader` (linha de apoio pequena + título grande).
- Cartões: só borda fina, sem sombra. Sombra apenas no que flutua (campo de adicionar e avisos).
- Cada informação aparece uma vez só, sem repetir o mesmo dado com ícone, cor e texto ao mesmo tempo.

## Nome

"Tarefas" é um nome genérico: não dá para registrar no INPI e é difícil de destacar na busca da Play Store. Antes de publicar, vale escolher um nome próprio e manter "tarefas" como palavra-chave do título na loja (ex.: "Feito: lista de tarefas").

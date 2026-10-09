/**
 * Teste ponta a ponta (E2E) da versão web.
 *
 * Abre o app num navegador de verdade (Chromium) e simula um usuário:
 * login, criar tarefas com atalhos, criar lista, editar, concluir e sair —
 * em tela de celular (tema claro) e de computador (tema escuro).
 *
 * O Supabase é SIMULADO aqui dentro (respostas falsas de login e banco),
 * então o teste não precisa de internet nem de conta real.
 *
 * Uso: npm run test:e2e   (screenshots ficam em e2e/screenshots/)
 */
const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');

const DIST = path.resolve(process.argv[2] ?? 'dist-e2e');
const OUT = path.resolve(process.argv[3] ?? path.join(__dirname, 'screenshots'));
fs.mkdirSync(OUT, { recursive: true });

// Servidor estático com fallback de SPA.
const server = http.createServer((req, res) => {
  let p = path.join(DIST, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(DIST, 'index.html');
  const ext = path.extname(p);
  const types = { '.js': 'application/javascript', '.html': 'text/html', '.ttf': 'font/ttf', '.png': 'image/png', '.ico': 'image/x-icon' };
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const USER = { id: '11111111-1111-4111-8111-111111111111', email: 'eden@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
const exp = Math.floor(Date.now() / 1000) + 3600;
const TOKEN = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: USER.id, exp, role: 'authenticated', aud: 'authenticated', email: USER.email })}.sig`;
const db = { tasks: [], lists: [] };
const log = [];
let offline = false;

function matchFilter(row, url) {
  for (const [k, v] of url.searchParams) {
    if (['select', 'order'].includes(k)) continue;
    if (v.startsWith('eq.') && String(row[k]) !== v.slice(3)) return false;
    if (v === 'not.is.null' && row[k] === null) return false;
  }
  return true;
}

async function handle(route) {
  const req = route.request();
  const url = new URL(req.url());
  const method = req.method();
  const json = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body), headers: { 'access-control-allow-origin': '*' } });
  if (method === 'OPTIONS') return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
  if (offline && url.pathname.startsWith('/rest/')) return route.abort('internetdisconnected');
  log.push(`${method} ${url.pathname}${url.search}`);

  if (url.pathname === '/auth/v1/token') {
    const body = req.postDataJSON();
    if (body.password !== 'segredo123') return json(400, { error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials', code: 'invalid_credentials' });
    return json(200, { access_token: TOKEN, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'r1', user: USER });
  }
  if (url.pathname === '/auth/v1/user') return json(200, USER);
  if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204 });

  const m = url.pathname.match(/^\/rest\/v1\/(tasks|lists)$/);
  if (m) {
    const table = db[m[1]];
    const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    if (method === 'GET') return json(200, table.filter((r) => matchFilter(r, url)));
    if (method === 'POST') {
      const now = new Date().toISOString();
      const input = req.postDataJSON();
      const row = m[1] === 'tasks'
        ? { user_id: USER.id, list_id: null, notes: '', due_date: null, priority: 0, recurrence: null, completed_at: null, position: 0, created_at: now, updated_at: now, ...input }
        : { user_id: USER.id, color: '#4F46E5', position: 0, created_at: now, updated_at: now, ...input };
      table.push(row);
      return json(201, single ? row : [row]);
    }
    if (method === 'PATCH') {
      const patch = req.postDataJSON();
      const rows = table.filter((r) => matchFilter(r, url));
      rows.forEach((r) => Object.assign(r, patch, { updated_at: new Date().toISOString() }));
      return json(200, single ? rows[0] : rows);
    }
    if (method === 'DELETE') {
      const keep = table.filter((r) => !matchFilter(r, url));
      db[m[1]] = keep;
      return route.fulfill({ status: 204 });
    }
  }
  if (url.pathname === '/rest/v1/rpc/delete_my_account') return route.fulfill({ status: 204 });
  return route.abort();
}

(async () => {
  await new Promise((r) => server.listen(8089, r));
  const browser = await chromium.launch(
    // Em ambientes com o Chromium já instalado num caminho fixo.
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  const errors = [];
  const shot = async (page, name) => page.screenshot({ path: `${OUT}/${name}.png` });

  for (const [label, viewport, scheme] of [['mobile', { width: 390, height: 844 }, 'light'], ['desktop', { width: 1280, height: 800 }, 'dark']]) {
    db.tasks = []; db.lists = [];
    const ctx = await browser.newContext({ viewport, colorScheme: scheme, locale: 'pt-BR' });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${label} pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/websocket|realtime|ERR_FAILED/i.test(m.text())) errors.push(`${label} console: ${m.text()}`); });
    await page.route('https://mock.supabase.co/**', handle);
    page.on('dialog', (d) => d.accept());

    await page.goto('http://localhost:8089/');
    await page.getByText('Bem-vindo de volta').filter({ visible: true }).first().waitFor();
    await shot(page, `${label}-01-login`);

    // Senha errada → mensagem traduzida
    await page.getByLabel('E-mail').fill('eden@example.com');
    await page.getByLabel('Senha').fill('errada1');
    await page.getByRole('button', { name: 'Entrar' }).filter({ visible: true }).first().click();
    await page.getByText('E-mail ou senha incorretos.').filter({ visible: true }).first().waitFor();

    await page.getByLabel('Senha').fill('segredo123');
    await page.getByRole('button', { name: 'Entrar' }).filter({ visible: true }).first().click();
    await page.getByText('Nada para hoje').filter({ visible: true }).first().waitFor();
    await shot(page, `${label}-02-vazio`);

    // Adicionar rápido com atalhos
    const add = page.getByLabel('Nova tarefa');
    await add.fill('Pagar conta de luz !alta');
    await add.press('Enter');
    await add.fill('Ligar para o dentista amanhã !!');
    await add.press('Enter');
    await add.fill('Comprar café');
    await add.press('Enter');
    await page.getByText('Pagar conta de luz').filter({ visible: true }).first().waitFor();
    await page.getByRole('button', { name: /Todas/ }).filter({ visible: true }).first().click();
    await page.getByText('Ligar para o dentista').filter({ visible: true }).first().waitFor();
    await shot(page, `${label}-03-tarefas`);

    // Lista
    await page.getByRole('tab', { name: /Listas/ }).or(page.getByRole('link', { name: /Listas/ })).first().click();
    await page.getByText('+ Nova lista').filter({ visible: true }).first().click();
    await page.getByPlaceholder('Nome da lista').fill('Trabalho');
    await page.getByRole('button', { name: 'Criar' }).filter({ visible: true }).first().click();
    const inList = page.getByPlaceholder('Adicionar em Trabalho…');
    await inList.fill('Enviar relatório !!! hoje');
    await inList.press('Enter');
    await page.getByText('Enviar relatório').filter({ visible: true }).first().waitFor();
    await shot(page, `${label}-04-lista`);

    // Detalhe da tarefa
    await page.getByText('Enviar relatório').filter({ visible: true }).first().click();
    await page.getByPlaceholder('Detalhes, links, observações…').waitFor();
    await page.getByPlaceholder('Detalhes, links, observações…').fill('Mandar para a diretoria até 18h');
    await page.getByLabel('Título').click();
    await shot(page, `${label}-05-detalhe`);
    await page.getByRole('button', { name: 'Concluir tarefa' }).filter({ visible: true }).first().click();
    await page.getByRole('button', { name: 'Marcar como pendente' }).waitFor();

    // Tarefa recorrente: concluir avança a data em vez de concluir
    await page.goto('http://localhost:8089/');
    await page.getByRole('button', { name: /Todas/ }).filter({ visible: true }).first().click();
    await page.getByText('Comprar café').filter({ visible: true }).first().click();
    await page.getByRole('button', { name: 'Toda semana' }).filter({ visible: true }).first().click();
    await page.getByRole('button', { name: 'Concluir e agendar a próxima' }).filter({ visible: true }).first().click();
    await page.getByText(/Próxima vez:/).filter({ visible: true }).first().waitFor();
    await shot(page, `${label}-05b-recorrente`);
    const cafe = db.tasks.find((x) => x.title === 'Comprar café');
    const todayIso = new Date().toLocaleDateString('sv-SE');
    if (!cafe || cafe.recurrence !== 'weekly' || cafe.completed_at || !cafe.due_date || cafe.due_date <= todayIso)
      errors.push(`${label}: recorrência não aplicada: ${JSON.stringify(cafe)}`);

    // Concluir pela caixinha na tela principal
    await page.goto('http://localhost:8089/');
    await page.getByText('Pagar conta de luz').filter({ visible: true }).first().waitFor();
    await page.getByRole('checkbox', { name: 'Concluir tarefa' }).first().click();
    await page.getByRole('button', { name: /Concluídas/ }).filter({ visible: true }).first().click();
    await page.getByText('Pagar conta de luz').filter({ visible: true }).first().waitFor();
    await shot(page, `${label}-06-concluidas`);

    // Modo offline: alterações vão para a fila e sincronizam quando a internet volta
    await page.getByRole('button', { name: /Todas/ }).filter({ visible: true }).first().click();
    offline = true;
    const add2 = page.getByLabel('Nova tarefa');
    await add2.fill('Tarefa criada offline');
    await add2.press('Enter');
    await page.getByText(/Suas alterações serão enviadas/).filter({ visible: true }).first().waitFor();
    await page.getByRole('checkbox', { name: 'Concluir tarefa' }).filter({ visible: true }).first().click();
    await page.getByText(/Offline · 2 alterações/).filter({ visible: true }).first().waitFor();
    await shot(page, `${label}-06b-offline`);
    if (db.tasks.some((x) => x.title === 'Tarefa criada offline')) errors.push(`${label}: chegou ao servidor estando offline?`);
    offline = false;
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.getByText(/Tudo sincronizado/).filter({ visible: true }).first().waitFor();
    if (!db.tasks.some((x) => x.title === 'Tarefa criada offline')) errors.push(`${label}: tarefa offline não sincronizou`);

    // Ajustes
    await page.getByRole('tab', { name: /Ajustes/ }).or(page.getByRole('link', { name: /Ajustes/ })).first().click();
    await page.getByText('eden@example.com').filter({ visible: true }).first().waitFor();
    await shot(page, `${label}-07-ajustes`);

    // Persistência no servidor (simulado)
    const t = db.tasks.find((x) => x.title === 'Enviar relatório');
    if (!t || t.notes !== 'Mandar para a diretoria até 18h' || t.priority !== 3 || !t.completed_at || !t.list_id) errors.push(`${label}: dados não persistiram: ${JSON.stringify(t)}`);
    const d = db.tasks.find((x) => x.title === 'Ligar para o dentista');
    if (!d || d.priority !== 2 || !d.due_date) errors.push(`${label}: atalhos não aplicados: ${JSON.stringify(d)}`);

    await page.getByRole('button', { name: 'Sair' }).filter({ visible: true }).first().click();
    await page.getByText('Bem-vindo de volta').filter({ visible: true }).first().waitFor();
    await ctx.close();
  }

  await browser.close();
  server.close();
  console.log('requests:', log.length);
  // O 400 (senha errada) e a queda de internet são simulados de propósito.
  const real = errors.filter((e) => !/status of 400|ERR_INTERNET_DISCONNECTED/.test(e));
  if (real.length) {
    console.error('ERROS:\n' + real.join('\n'));
    process.exit(1);
  }
  console.log(`OK — fluxo completo passou em celular e desktop (${log.length} requisições). Screenshots em ${OUT}`);
})().catch((e) => {
  console.error('FALHOU:', e.message);
  process.exit(1);
});

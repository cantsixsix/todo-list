/**
 * Gera todos os ícones do app a partir de um desenho em SVG
 * (renderizado pelo Chromium do Playwright).
 *
 * Uso: node scripts/generate-icons.js
 *
 * Android usa "ícone adaptativo": uma camada de fundo + uma de frente.
 * Cada fabricante recorta num formato (círculo, quadrado arredondado...),
 * por isso o desenho da frente fica na "zona segura" central (66%).
 */
const { chromium } = require('playwright');
const path = require('path');

const INDIGO = '#4F46E5';
const INDIGO_DARK = '#3730A3';

// Marca de "concluído", centralizada visualmente.
const checks = (color, scale = 1) => `
  <g transform="translate(512 512) scale(${scale}) translate(-512 -512)" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M292 532 L442 682 L732 392" stroke-width="104"/>
  </g>`;

const gradient = `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${INDIGO}"/>
      <stop offset="1" stop-color="${INDIGO_DARK}"/>
    </linearGradient>
  </defs>`;

const svg = (size, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${body}</svg>`;

const ICONS = [
  // Ícone geral (loja, iOS, web): fundo cheio — a loja aplica o arredondamento.
  ['icon.png', 1024, svg(1024, `${gradient}<rect width="1024" height="1024" fill="url(#g)"/>${checks('#FFFFFF')}`)],
  // Android adaptativo
  ['android-icon-background.png', 512, svg(512, `${gradient}<rect width="1024" height="1024" fill="url(#g)"/>`)],
  ['android-icon-foreground.png', 512, svg(512, checks('#FFFFFF', 0.62))],
  ['android-icon-monochrome.png', 432, svg(432, checks('#000000', 0.62))],
  // Tela de abertura e favicon
  ['splash-icon.png', 1024, svg(1024, `${gradient}<rect x="112" y="112" width="800" height="800" rx="200" fill="url(#g)"/>${checks('#FFFFFF', 0.78)}`)],
  ['favicon.png', 48, svg(48, `${gradient}<rect width="1024" height="1024" rx="220" fill="url(#g)"/>${checks('#FFFFFF')}`)],
];

(async () => {
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  const page = await browser.newPage();
  for (const [file, size, markup] of ICONS) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${markup}</body></html>`,
    );
    await page.locator('svg').screenshot({ path: path.join(__dirname, '..', 'assets', file), omitBackground: true });
    console.log('gerado', file, `${size}x${size}`);
  }
  await browser.close();
})();

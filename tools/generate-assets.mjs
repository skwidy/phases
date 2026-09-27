// Generates every raster asset from the SVG sources. Run from the repo root:
//   npm i -D playwright @fontsource/nunito && npx playwright install chromium
//   node tools/generate-assets.mjs
// To switch logo: edit apps/mobile/assets/brand/*.svg, rerun.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const brand = (f) => fs.readFileSync(path.join(root, 'apps/mobile/assets/brand', f), 'utf8');
const out = (p) => { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); return path.join(root, p); };

let fontCss = '';
try {
  const dir = path.dirname(require.resolve('@fontsource/nunito/package.json'));
  for (const w of [400, 600, 700, 800, 900]) {
    const b64 = fs.readFileSync(path.join(dir, `files/nunito-latin-${w}-normal.woff2`)).toString('base64');
    fontCss += `@font-face{font-family:Nunito;font-weight:${w};src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
  }
} catch { console.warn('Nunito not installed: falling back to system fonts'); }

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();

async function svgToPng(svg, size, file, transparent = false) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: out(file), omitBackground: transparent });
}

// ---- iOS app icon (1024, full-bleed: iOS applies the rounded mask) ----
await svgToPng(brand('icon-light.svg'), 1024, 'apps/mobile/assets/icon.png');
await svgToPng(brand('icon-dark.svg'), 1024, 'apps/mobile/assets/icon-dark.png', true);
await svgToPng(brand('icon-tinted.svg'), 1024, 'apps/mobile/assets/icon-tinted.png', true);
// ---- splash (centered mark on transparent; background colour set in app.json) ----
await svgToPng(brand('splash.svg'), 1024, 'apps/mobile/assets/splash-icon.png', true);
await svgToPng(brand('splash-dark.svg'), 1024, 'apps/mobile/assets/splash-icon-dark.png', true);
// ---- web ----
fs.writeFileSync(out('apps/web/assets/favicon.svg'), brand('logo-rounded.svg'));
await svgToPng(brand('icon-light.svg'), 180, 'apps/web/assets/apple-touch-icon.png');

// ---- social card 1200x630 (FR + EN) ----
async function og(file, line1, line2, sub) {
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<style>${fontCss}body{margin:0;width:1200px;height:630px;background:#FAF6F0;color:#1C1A22;font-family:Nunito,ui-rounded,system-ui,sans-serif;display:flex;align-items:center;gap:64px;padding:0 96px;box-sizing:border-box}body>svg{width:260px;height:260px;flex-shrink:0}.w>svg{height:48px;width:auto;display:block}.h{font-size:66px;line-height:1.05;font-weight:900;letter-spacing:-2px;margin-top:10px}.h span{color:#5E4B8B}.s{font-size:26px;color:#6E6A75;margin-top:18px;font-weight:700}</style>${brand('logo-rounded.svg')}<div><div class="w">${brand('wordmark.svg')}</div><div class="h">${line1}<br><span>${line2}</span></div><div class="s">${sub}</div></div>`);
  await page.screenshot({ path: out(file) });
}
await og('apps/web/assets/og.png', 'Ce genre de chose devrait être gratuit.', 'Et privé.', 'Le cycle de ta partenaire, les bons rappels. App iPhone.');
await og('apps/web/assets/og-en.png', 'Some things should be free.', 'And private.', "Your partner's cycle, the right reminders. iPhone app.");

// ---- App Store screenshots: 6.9" display, 1320x2868 ----
const SHOTS = [
  { key: '1-aujourdhui', bg: '#FAF6F0', fr: ['Sache où elle en est.', 'En un coup d’œil.'], en: ['Know where she’s at.', 'At a glance.'] },
  { key: '2-rappels', bg: '#1C1A22', dark: true, screenBg: '#0E0D12', fr: ['Prévenu la veille.', '3 rappels, pas un de plus.'], en: ['A heads-up the day before.', '3 reminders, not one more.'] },
  { key: '3-guide', bg: '#EDE8F7', fr: ['Chaque phase,', 'son mode d’emploi.'], en: ['Every phase,', 'with a user manual.'] },
  { key: '4-sync', bg: '#E8F2EC', fr: ['À deux,', 'sans cloud.'], en: ['In sync,', 'without the cloud.'] },
  { key: '5-bienvenue', bg: '#FAF6F0', fr: ['Gratuit. Et privé.', 'Rien ne quitte ton iPhone.'], en: ['Free. And private.', 'Nothing leaves your iPhone.'] },
];
const W = 1320, H = 2868;
for (const lang of ['fr', 'en']) {
  for (const s of SHOTS) {
    const screen = fs.readFileSync(path.join(root, 'tools/screens', `${s.key}.${lang}.html`), 'utf8');
    const [a, b] = s[lang];
    const ink = s.dark ? '#F3F0EA' : '#1C1A22', accent = s.dark ? '#A193F0' : '#5E4B8B';
    await page.setViewportSize({ width: W, height: H });
    await page.setContent(`<style>${fontCss}
      html,body{margin:0}
      body{width:${W}px;height:${H}px;background:${s.bg};font-family:Nunito,ui-rounded,system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;overflow:hidden}
      .t{margin-top:170px;text-align:center;font-weight:900;font-size:104px;line-height:1.05;letter-spacing:-3px;color:${ink}}
      .t span{display:block;color:${accent}}
      .phone{margin-top:110px;width:1030px;height:2229px;border-radius:150px;background:#1C1A22;padding:26px;box-sizing:border-box;box-shadow:0 0 0 6px ${s.dark ? '#3A3544' : '#E3DDD3'}}
      .scr{width:978px;height:2177px;border-radius:126px;overflow:hidden;background:${s.screenBg || "#FAF6F0"}}
      .scr>div{transform:scale(2.5077);transform-origin:0 0}
      .scr *{font-family:Nunito,ui-rounded,system-ui,sans-serif !important}
    </style><div class="t">${a}<span>${b}</span></div><div class="phone"><div class="scr"><div>${screen}</div></div></div>`);
    await page.screenshot({ path: out(`apps/mobile/store/screenshots/${lang}/${s.key}.png`) });
  }
}
await browser.close();
console.log('assets generated');

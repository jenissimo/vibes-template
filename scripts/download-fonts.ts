#!/usr/bin/env bun
/**
 * Скачать локально нужные шрифты с Google Fonts (css2) и сгенерить fonts.css
 * Bun/TypeScript. Не требует сторонних сервисов.
 *
 * По умолчанию тянет только latin-глифы (если доступны отдельные сабсеты).
 * Поддерживаемые флаги:
 *   --out=DIR         каталог вывода (по умолчанию src/assets/fonts)
 *   --subset=NAME     latin | latin-ext | cyrillic | greek | all (по умолчанию latin)
 *   --text=STRING     ограничить набор глифов (Google вернёт урезанный файл)
 *   --force           перекачать даже если файл существует
 *   --dry-run         ничего не качать, только показать план
 *   --manual          показать инструкции по ручной загрузке
 */

import { mkdir, writeFile, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------- Конфиг нужных семейств и весов ----------
type FontCfg = { family: string; weights: number[]; styles?: ('normal'|'italic')[] };

const FONT_CONFIG: FontCfg[] = [
  { family: 'Orbitron', weights: [400, 700, 900] },
  { family: 'Exo 2',    weights: [400, 600, 700] },
  { family: 'Rajdhani', weights: [400, 600, 700] },
];

// ---------- CLI-параметры ----------
const argv = process.argv.slice(2);
const getArg = (name: string, def?: string) => {
  const hit = argv.find(a => a.startsWith(`--${name}=`));
  if (hit) return hit.split('=')[1];
  return argv.includes(`--${name}`) ? 'true' : def;
};

const OUT_DIR = getArg('out', join(process.cwd(), 'src', 'assets', 'fonts'))!;
const SUBSET = (getArg('subset', 'latin') || 'latin').toLowerCase(); // latin | latin-ext | cyrillic | greek | all
const TEXT_PARAM = getArg('text'); // строка для &text=
const FORCE = getArg('force') === 'true';
const DRY = getArg('dry-run') === 'true';

if (argv.includes('--manual')) {
  console.log(`
🔗 Ручное скачивание:
  1) Открой https://fonts.google.com/
  2) Выбери семейства и веса:
     - Orbitron (400, 700, 900)
     - Exo 2 (400, 600, 700)
     - Rajdhani (400, 600, 700)
  3) Скачай и положи *.woff2 в ${OUT_DIR}
  4) Сгенерируй @font-face (или используй fonts.css, который делает этот скрипт).
`);
  process.exit(0);
}

// ---------- Утилиты ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function buildCssUrl(cfg: FontCfg[], text?: string) {
  const families = cfg.map(c => {
    const styles = (c.styles && c.styles.length ? c.styles : ['normal']);
    // Google css2 для italic требует "ital,wght@0,400;0,700;1,400;1,700" — здесь оставим normal
    const weights = c.weights.join(';');
    return `family=${encodeURIComponent(c.family)}:wght@${weights}`;
  }).join('&');
  const display = 'swap';
  const textParam = text ? `&text=${encodeURIComponent(text)}` : '';
  return `https://fonts.googleapis.com/css2?${families}&display=${display}${textParam}`;
}

// Простейший детектор сабсетов по unicode-range
function detectSubset(unicodeRange: string): string {
  const u = unicodeRange.replace(/\s+/g, '').toUpperCase();
  // very rough mapping
  if (/U\+0000-00FF|U\+000-00FF|U\+000-05FF/.test(u)) return 'latin';
  if (/U\+0100-024F|U\+1E00-1EFF/.test(u)) return 'latin-ext';
  if (/U\+0400-04FF|U\+0500-052F|U\+2DE0-2DFF|U\+A640-A69F/.test(u)) return 'cyrillic';
  if (/U\+0370-03FF|U\+1F00-1FFF/.test(u)) return 'greek';
  return 'unknown';
}

function subsetAllowed(found: string): boolean {
  if (SUBSET === 'all') return true;
  if (found === SUBSET) return true;
  // Если просим latin, а у шрифта только unknown — всё равно возьмём (бывает монолит)
  if (SUBSET === 'latin' && found === 'unknown') return true;
  return false;
}

type Face = {
  family: string;
  style: 'normal' | 'italic';
  weight: number;
  unicodeRange: string;
  url: string; // woff2
  subset: string; // latin | latin-ext | ...
  fileName: string;
};

// Парсер CSS от Google Fonts (css2)
function parseGoogleCss(css: string): Face[] {
  const faces: Face[] = [];
  const blocks = css.match(/@font-face\s*{[^}]+}/g) || [];
  for (const block of blocks) {
    const fam = /font-family:\s*'([^']+)'/i.exec(block)?.[1];
    const style = /font-style:\s*(normal|italic)/i.exec(block)?.[1] as 'normal'|'italic'|undefined;
    const weightStr = /font-weight:\s*(\d{3})/i.exec(block)?.[1];
    
    // Ищем woff2 в src, если нет - берем первый URL
    let srcUrl = /src:\s*url\(([^)]+\.woff2)\)/i.exec(block)?.[1];
    if (!srcUrl) {
      // Если нет woff2, ищем любой URL и конвертируем в woff2
      const anyUrl = /src:\s*url\(([^)]+)\)/i.exec(block)?.[1];
      if (anyUrl) {
        srcUrl = anyUrl.replace(/\.(ttf|woff)$/, '.woff2');
      }
    }
    
    const ur = /unicode-range:\s*([^;]+);/i.exec(block)?.[1] || '';

    if (!fam || !style || !weightStr || !srcUrl) continue;

    const subset = detectSubset(ur);
    const weight = Number(weightStr);
    const familySlug = slug(fam);
    const styleSuffix = style === 'italic' ? '-italic' : '';
    const subsetSuffix = subset !== 'unknown' ? `-${subset}` : '';
    const fileName = `${familySlug}${subsetSuffix}-${weight}${styleSuffix}.woff2`;

    faces.push({ family: fam, style, weight, unicodeRange: ur, url: srcUrl, subset, fileName });
  }
  return faces;
}

async function ensureDir(dir: string) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

async function fileExists(p: string) {
  try { await access(p); return true; } catch { return false; }
}

async function download(url: string, toPath: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/css,*/*;q=0.1',
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await ensureDir(dirname(toPath));
  await writeFile(toPath, buf);
  return buf.byteLength;
}

// Генерация локального fonts.css
function makeLocalCss(faces: Face[], outRelBase = '.') {
  const lines: string[] = [];
  for (const f of faces) {
    lines.push(
`@font-face {
  font-family: '${f.family}';
  font-style: ${f.style};
  font-weight: ${f.weight};
  font-display: swap;
  src: url('${outRelBase}/${f.fileName}') format('woff2');
}`
    );
  }
  return lines.join('\n\n') + '\n';
}

// ---------- Основной флоу ----------
async function main() {
  console.log(`🚀 Качаю шрифты → ${OUT_DIR} (subset=${SUBSET}${TEXT_PARAM ? `, text=${TEXT_PARAM.length} chars` : ''})`);

  await ensureDir(OUT_DIR);

  const cssUrl = buildCssUrl(FONT_CONFIG, TEXT_PARAM);
  console.log(`🌐 CSS: ${cssUrl}`);

  const cssRes = await fetch(cssUrl, {
    headers: { 'User-Agent': UA, 'Accept': 'text/css,*/*;q=0.1' }
  });
  if (!cssRes.ok) {
    throw new Error(`Не удалось получить CSS: HTTP ${cssRes.status} ${cssRes.statusText}`);
  }
  const cssText = await cssRes.text();

  const facesAll = parseGoogleCss(cssText);

  // Фильтрация по нужным семействам/весам/стилям и сабсетам
  const wanted = new Map<string, true>();
  for (const c of FONT_CONFIG) {
    const styles = c.styles?.length ? c.styles : ['normal'];
    for (const w of c.weights) for (const s of styles)
      wanted.set(`${c.family}|${s}|${w}`, true);
  }

  let faces = facesAll.filter(f => wanted.has(`${f.family}|${f.style}|${f.weight}`) && subsetAllowed(f.subset));

  // Убираем дубль по ключу family/style/weight (если пришло несколько сабсетов, а пользователь хотел один)
  const dedup = new Map<string, Face>();
  for (const f of faces) {
    const key = `${f.family}|${f.style}|${f.weight}`;
    if (!dedup.has(key)) dedup.set(key, f);
    else {
      // Предпочтем subset == запрошенному
      const cur = dedup.get(key)!;
      if (f.subset === SUBSET && cur.subset !== SUBSET) dedup.set(key, f);
    }
  }
  faces = Array.from(dedup.values());

  if (faces.length === 0) {
    console.warn('⚠️ Нечего качать (возможно, фильтр subset слишком строгий). Попробуй --subset=all');
  }

  // Скачивание файлов
  const results: { face: Face; saved: boolean; size?: number }[] = [];
  for (const face of faces) {
    const dest = join(OUT_DIR, face.fileName);
    if (!FORCE && await fileExists(dest)) {
      console.log(`⏭️ Уже есть: ${face.fileName}`);
      results.push({ face, saved: false });
      continue;
    }
    if (DRY) {
      console.log(`🧪 [dry] Скачал бы ${face.url} → ${face.fileName}`);
      results.push({ face, saved: false });
      continue;
    }
    try {
      const size = await download(face.url, dest);
      console.log(`✅ ${face.fileName} (${Math.round(size/1024)} KB)`);
      // Немного паузы, чтобы быть вежливыми к CDN
      await sleep(80);
      results.push({ face, saved: true, size });
    } catch (e) {
      console.error(`❌ Ошибка: ${face.fileName}`, e);
    }
  }

  // Генерим локальный CSS
  const localCss = makeLocalCss(faces, '.');
  const cssOut = join(OUT_DIR, 'fonts.css');
  if (!DRY) {
    await writeFile(cssOut, localCss, 'utf8');
    console.log(`\n📝 Сгенерирован ${cssOut}`);
  } else {
    console.log('\n🧪 [dry] Сгенерировал бы fonts.css:\n');
    console.log(localCss);
  }

  console.log(`\n🎉 Готово! Всего шрифтов: ${faces.length}. Каталог: ${OUT_DIR}`);
  console.log(`💡 Подключай в проекте:  import "./assets/fonts/fonts.css";`);
}

main().catch(err => {
  console.error('💥 Критическая ошибка:', err);
  console.log('\n💡 Можно попробовать: --subset=all или --manual');
});

/**
 * Пост-обработка out/ после `next build`.
 * Цель: out/index.html открывается двойным кликом (file://) без сервера и при этом
 * остаётся быстрым на хостинге. Скрипт идемпотентный: повторный запуск ничего не ломает.
 *
 * 1. Относительные пути. "/_next/…" → "./_next/…" в HTML, в данных React (RSC) и в рантайме
 *    Turbopack (базовый путь чанков); корневые href/src → "./…".
 * 2. Шрифты для file://. Chrome не отдаёт @font-face с диска по CORS (происхождение null), поэтому
 *    собирается _next/static/fonts-offline.css с теми же @font-face, но шрифтами в data:-URI.
 *    Он подключается только при file://. Предзагрузка шрифтов (<link rel=preload> и подсказки React
 *    «HL») переносится в маленький скрипт, который работает только на http(s).
 * 3. Гидрация после первого кадра. Весь текст и фото уже есть в HTML, поэтому скрипты React
 *    подключаются сразу после первой отрисовки, а не конкурируют с ней за сеть и процессор.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../out/', import.meta.url));
const OFFLINE_CSS = join(OUT, '_next/static/fonts-offline.css');

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const files = [...walk(OUT)];

/* ---------- офлайн-CSS со шрифтами ---------- */
const faces = [];
for (const file of files.filter((f) => f.endsWith('.css') && f !== OFFLINE_CSS)) {
  const css = readFileSync(file, 'utf8');
  for (const face of css.match(/@font-face\{[^}]*\}/g) ?? []) {
    faces.push(
      face.replace(/url\(([^)]+\.woff2)\)/g, (_, url) => {
        const font = readFileSync(join(dirname(file), url));
        return `url(data:font/woff2;base64,${font.toString('base64')})`;
      }),
    );
  }
}
if (faces.length) writeFileSync(OFFLINE_CSS, faces.join('\n'));

const inject = (id, code) => `<script id="${id}">${code}</script>`;

function prepareHtml(html, prefix) {
  let out = html
    .replace(/(["'(,\s])\/_next\//g, `$1${prefix}_next/`)
    .replace(/\\"\/_next\//g, `\\"${prefix}_next/`)
    .replace(/(href|src)="\/(?!\/|_next\/)([^"]*)"/g, `$1="${prefix}$2"`)
    .replace(/\\"(href|src)\\":\\"\/(?!\/|_next\/)/g, `\\"$1\\":\\"${prefix}`);

  if (!out.includes('id="font-loader"')) {
    const fonts = [];
    out = out
      .replace(/<link rel="preload" href="([^"]+\.woff2)" as="font"[^>]*>/g, (_, href) => {
        fonts.push(href);
        return '';
      })
      .replace(/:HL\[\\"[^"]*?\.woff2\\",\\"font\\",\{[^}]*\}\]\\n/g, '');
    const loader = inject(
      'font-loader',
      `if(location.protocol!=="file:")for(const h of ${JSON.stringify(fonts)})document.head.append(Object.assign(document.createElement("link"),{rel:"preload",as:"font",type:"font/woff2",crossOrigin:"",href:h}))`,
    );
    const offline = existsSync(OFFLINE_CSS)
      ? inject(
          'font-offline',
          `if(location.protocol==="file:")document.head.append(Object.assign(document.createElement("link"),{rel:"stylesheet",href:${JSON.stringify(`${prefix}_next/static/fonts-offline.css`)}}))`,
        )
      : '';
    out = out.replace('<head>', `<head>${loader}`).replace('</head>', `${offline}</head>`);
  }

  if (!out.includes('id="deferred-boot"')) {
    const scripts = [];
    out = out
      .replace(/<script src="([^"]+\.js)"(?: id="([^"]*)")? async=""><\/script>/g, (_, src, id) => {
        scripts.push([src, id ?? '']);
        return '';
      })
      .replace(/<link rel="preload" as="script"[^>]*>/g, '');
    const boot = inject(
      'deferred-boot',
      // ждём событие первой отрисовки (paint); запасной таймер — для браузеров без Paint Timing
      `(()=>{let done=0;const boot=()=>{if(done++)return;for(const[s,i]of ${JSON.stringify(scripts)}){const e=document.createElement("script");e.src=s;if(i)e.id=i;document.body.append(e)}};` +
        `try{new PerformanceObserver(l=>{if(l.getEntriesByName("first-contentful-paint").length)setTimeout(boot)}).observe({type:"paint",buffered:true})}catch(_){}setTimeout(boot,1500)})()`,
    );
    if (scripts.length) out = out.replace('</body>', `${boot}</body>`);
  }
  return out;
}

let changed = 0;
for (const file of files) {
  if (!file.endsWith('.html') && !file.endsWith('.js')) continue;
  const before = readFileSync(file, 'utf8');
  let after;
  if (file.endsWith('.js')) {
    after = before
      .replace(/TURBOPACK_CHUNK_BASE_PATH:"\/_next\/"/g, 'TURBOPACK_CHUNK_BASE_PATH:"./_next/"')
      .replace(/"\/_next\/static\/media\//g, '"./_next/static/media/');
  } else {
    const rel = relative(dirname(file), OUT);
    after = prepareHtml(before, rel ? `${rel}/` : './');
  }
  if (after !== before) {
    writeFileSync(file, after);
    changed++;
  }
}

console.log(
  `prepare-static: обновлено файлов — ${changed}, шрифтов для file:// — ${faces.length}. Откройте out/index.html двойным кликом.`,
);

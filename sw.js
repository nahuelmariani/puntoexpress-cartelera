// ==========================================================
// Service Worker: permite que la cartelera arranque y funcione sin internet.
//
//   - Código (HTML, CSS, JS, tipografías, logo): primero internet; si no hay
//     (o tarda), lo último guardado. Así los cambios al código llegan solos.
//   - Videos: se guardan completos y desde ahí se sirven siempre, por partes
//     (Range), que es como los pide el navegador.
//   - Fotos de Drive: se guardan la primera vez que se muestran.
//   - La planilla no pasa por acá: data.js ya guarda su última versión.
//
// Si se reemplaza un video MANTENIENDO el mismo nombre de archivo, subir
// VERSION_MEDIA para que el TV descargue el nuevo. Si cambia el nombre, no hace falta.
// ==========================================================
const VERSION_MEDIA = 1;

const CACHE_APP = 'app';
const CACHE_MEDIA = `media-v${VERSION_MEDIA}`;
const CACHE_IMAGES = 'imagenes';
const MAX_IMAGES = 150;
const NETWORK_TIMEOUT_MS = 5000;

// Archivos de la página que se guardan apenas se instala el Service Worker, así ya
// la primera vez queda todo lo necesario para arrancar sin internet.
// Si se agrega un archivo de código, sumarlo acá.
const APP_FILES = [
  './',
  'index.html',
  'css/styles.css',
  'js/config.js',
  'js/data.js',
  'js/render.js',
  'js/cycle.js',
  'js/main.js',
  'js/sample.js',
  'vendor/papaparse.min.js',
  'fonts/PlayfairDisplay-variable.woff2',
  'fonts/Barlow-400.woff2',
  'fonts/Barlow-600.woff2',
  'fonts/Barlow-800.woff2',
  'media/logo.svg',
];

const inflight = new Map(); // descargas de videos en curso, para no bajar dos veces el mismo

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_APP);
    // cache: 'reload' evita guardar una copia vieja que tenga el navegador
    await cache.addAll(APP_FILES.map((path) => new Request(path, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [CACHE_APP, CACHE_MEDIA, CACHE_IMAGES];
    for (const key of await caches.keys()) {
      if (!keep.includes(key)) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'precache-media') event.waitUntil(precacheMedia(event.data.urls));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(url.pathname.endsWith('.mp4') ? serveMedia(request) : networkFirst(request));
  } else if (url.hostname === 'lh3.googleusercontent.com') {
    event.respondWith(cacheFirstImage(request));
  }
});

const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

// ---------- Código ----------
async function networkFirst(request) {
  const cache = await caches.open(CACHE_APP);
  try {
    const response = await Promise.race([fetch(request), timeout(NETWORK_TIMEOUT_MS)]);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (err) {
    // La página puede abrirse con distintos parámetros (?debug=1, ?rotar=90): da igual cuál quedó guardada.
    const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
    if (cached) return cached;
    throw err;
  }
}

// ---------- Videos ----------
function ensureMediaCached(cache, url) {
  if (!inflight.has(url)) {
    const download = (async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status} en ${url}`);
      await cache.put(url, response);
    })().finally(() => inflight.delete(url));
    inflight.set(url, download);
  }
  return inflight.get(url);
}

async function serveMedia(request) {
  const cache = await caches.open(CACHE_MEDIA);
  let cached = await cache.match(request.url);
  if (!cached) {
    try {
      await ensureMediaCached(cache, request.url);
      cached = await cache.match(request.url);
    } catch {
      return fetch(request); // no se pudo guardar: se pide de forma normal
    }
  }
  return rangeResponse(request, cached);
}

// Responde la parte del video que pidió el navegador (cabecera Range) a partir del archivo completo.
async function rangeResponse(request, response) {
  const blob = await response.blob();
  const size = blob.size;
  const headers = {
    'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
    'Accept-Ranges': 'bytes',
  };

  const match = /^bytes=(\d*)-(\d*)$/.exec((request.headers.get('Range') || '').trim());
  if (!match || (match[1] === '' && match[2] === '')) {
    return new Response(blob, { status: 200, headers: { ...headers, 'Content-Length': String(size) } });
  }

  let start;
  let end;
  if (match[1] === '') {
    // "bytes=-500": los últimos 500 bytes
    start = Math.max(0, size - Number(match[2]));
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
  }
  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      ...headers,
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
    },
  });
}

// La página manda la lista de videos de config.js: se descargan los que falten
// (de a uno, para no saturar el Wi-Fi) y se borran los que ya no se usan.
async function precacheMedia(paths) {
  const cache = await caches.open(CACHE_MEDIA);
  const wanted = paths.map((path) => new URL(path, self.registration.scope).href);

  for (const request of await cache.keys()) {
    if (!wanted.includes(request.url)) await cache.delete(request);
  }
  for (const url of wanted) {
    if (await cache.match(url)) continue;
    try {
      await ensureMediaCached(cache, url);
    } catch (err) {
      console.warn('No se pudo guardar el video:', url, err);
    }
  }
}

// ---------- Fotos de Drive ----------
async function cacheFirstImage(request) {
  const cache = await caches.open(CACHE_IMAGES);
  const cached = await cache.match(request.url);
  if (cached) return cached;

  const response = await fetch(request);
  // Solo se guardan respuestas CORS normales: las "opacas" ocupan muchísimo lugar en el navegador.
  if (response.ok && response.type !== 'opaque') {
    await cache.put(request.url, response.clone());
    await trimImages(cache);
  }
  return response;
}

// Evita que las fotos viejas se acumulen para siempre: se conservan las últimas MAX_IMAGES.
async function trimImages(cache) {
  const keys = await cache.keys();
  for (const request of keys.slice(0, Math.max(0, keys.length - MAX_IMAGES))) {
    await cache.delete(request);
  }
}

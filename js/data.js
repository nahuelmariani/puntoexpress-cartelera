// ==========================================================
// Datos: descarga del CSV, normalización, caché y sincronización.
// ==========================================================
import { CONFIG } from './config.js';
import { SAMPLE_ITEMS } from './sample.js';

// Encabezados de la planilla (normalizados) → campo interno
const COLUMNS = {
  activo: 'active',
  producto: 'name',
  detalle: 'detail',
  precio: 'price',
  preciooferta: 'offerPrice',
  imagen: 'image',
};
const TRUTHY = new Set(['true', 'verdadero', 'si', '1', 'x']);
const FETCH_TIMEOUT_MS = 15000;

let current = null;   // { items, source, text } en pantalla
let pending = null;   // datos nuevos que se aplican en el próximo ciclo
let lastSync = null;

// "Precio Oferta" → "preciooferta", "Sí" → "si"
function normalizeKey(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Acepta "$ 38.500", "38500", "38.500,00", "$38,500.00", "1.250.000". Devuelve null si no hay precio.
export function parsePrice(raw) {
  let s = String(raw ?? '').replace(/[^\d.,]/g, '');
  if (!/\d/.test(s)) return null;

  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  let decimalSep = null;
  if (lastDot >= 0 && lastComma >= 0) {
    decimalSep = lastDot > lastComma ? '.' : ',';
  } else if (lastDot >= 0 || lastComma >= 0) {
    const sep = lastDot >= 0 ? '.' : ',';
    const parts = s.split(sep);
    // "38.500" o "1.250.000" son miles; "38,5" o "38.50" son decimales
    const isThousands = parts.length > 2 || parts[parts.length - 1].length === 3;
    if (!isThousands) decimalSep = sep;
  }

  if (decimalSep) {
    const thousandsSep = decimalSep === '.' ? ',' : '.';
    s = s.split(thousandsSep).join('').replace(decimalSep, '.');
  } else {
    s = s.replace(/[.,]/g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Convierte un link de compartir de Google Drive en una URL de imagen directa y redimensionada.
export function imageUrl(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  const drive = s.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([\w-]{20,})/);
  if (drive) return `https://lh3.googleusercontent.com/d/${drive[1]}=w${CONFIG.anchoImagen}`;
  if (/^https?:\/\//i.test(s)) return s;
  return null;
}

function toItem(row) {
  const name = (row.name ?? '').trim();
  if (!name || !TRUTHY.has(normalizeKey(row.active))) return null;

  const price = parsePrice(row.price);
  let offerPrice = parsePrice(row.offerPrice);
  if (offerPrice !== null && price !== null && offerPrice >= price) offerPrice = null;

  return {
    name,
    detail: (row.detail ?? '').trim(),
    price,
    offerPrice,
    image: imageUrl(row.image),
  };
}

// Devuelve la lista de ítems activos, o null si el CSV no tiene las columnas esperadas
// (por ejemplo, si Google devolvió una página de error en vez del CSV).
export function parseItems(csvText) {
  const { data, meta } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => COLUMNS[normalizeKey(h)] ?? normalizeKey(h),
  });
  if (!meta.fields?.includes('name') || !meta.fields.includes('active')) return null;
  return data.map(toItem).filter(Boolean);
}

async function fetchCsv() {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(CONFIG.csvUrl, { cache: 'no-store', signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function readCache() {
  try { return localStorage.getItem(CONFIG.claveCache); } catch { return null; }
}

function writeCache(text) {
  try { localStorage.setItem(CONFIG.claveCache, text); } catch { /* sin almacenamiento: se sigue igual */ }
}

// Pide las imágenes por adelantado para que estén en la caché del navegador.
function warmImages(items) {
  for (const item of items) {
    if (!item.image) continue;
    const img = new Image();
    img.crossOrigin = 'anonymous'; // igual que en render.js, para reutilizar la misma respuesta
    img.src = item.image;
  }
}

export async function loadInitial() {
  if (!CONFIG.csvUrl) {
    current = { items: SAMPLE_ITEMS, source: 'ejemplo', text: null };
    return current;
  }

  try {
    const text = await fetchCsv();
    const items = parseItems(text);
    if (items === null) throw new Error('El CSV no tiene las columnas esperadas');
    lastSync = new Date();
    writeCache(text);
    current = { items, source: 'planilla', text };
    return current;
  } catch (err) {
    console.warn('No se pudo leer la planilla, se usa la caché:', err);
  }

  const cached = readCache();
  const items = cached ? parseItems(cached) : null;
  // Sin planilla ni caché: lista vacía, la cartelera muestra solo los videos institucionales.
  current = { items: items ?? [], source: items ? 'caché' : 'sin datos', text: cached };
  return current;
}

export function startPolling() {
  if (!CONFIG.csvUrl) return;
  setInterval(async () => {
    try {
      const text = await fetchCsv();
      const items = parseItems(text);
      if (items === null) throw new Error('El CSV no tiene las columnas esperadas');
      lastSync = new Date();
      if (text === (pending ?? current)?.text) return;
      writeCache(text);
      pending = { items, source: 'planilla', text };
      warmImages(items);
    } catch (err) {
      console.warn('Sincronización fallida, se mantienen los datos actuales:', err);
    }
  }, CONFIG.minutosEntreSincronizaciones * 60_000);
}

// Aplica los datos pendientes (si los hay) y devuelve los vigentes.
export function takeUpdate() {
  if (pending) {
    current = pending;
    pending = null;
  }
  return current;
}

export function dataStatus() {
  return {
    source: current?.source ?? '-',
    items: current?.items.length ?? 0,
    pending: Boolean(pending),
    lastSync,
  };
}

// ==========================================================
// Arranque: escalado/rotación del escenario, datos y ciclo.
//
// Parámetros de URL:
//   ?rotar=90|180|270  gira el contenido (TV que no rota solo)
//   ?debug=1           muestra el estado en pantalla
//   ?rapido=1          tiempos cortos para probar el ciclo
//   ?sin-offline=1     desactiva el modo offline y borra todo lo guardado (emergencia)
// ==========================================================
import { CONFIG } from './config.js';
import { loadInitial, startPolling, dataStatus } from './data.js';
import { runCycle, cycleStatus } from './cycle.js';

const STAGE_W = 1080;
const STAGE_H = 1920;

const params = new URLSearchParams(location.search);
const rotation = [90, 180, 270].includes(Number(params.get('rotar'))) ? Number(params.get('rotar')) : 0;
const fast = params.has('rapido');

const timing = {
  pageMs: (fast ? 2.5 : CONFIG.segundosPorPagina) * 1000,
  institutionalMaxMs: (fast ? 4 : CONFIG.segundosMaxInstitucional) * 1000,
};

const frame = document.getElementById('screen');
const stage = document.getElementById('stage');
const dom = {
  slots: [...document.querySelectorAll('.page')],
  bgVideo: document.getElementById('bg-video'),
  inst: document.getElementById('institutional'),
  instVideo: document.getElementById('inst-video'),
};

function fitStage() {
  const sideways = rotation % 180 !== 0;
  const w = sideways ? STAGE_H : STAGE_W;
  const h = sideways ? STAGE_W : STAGE_H;
  const scale = Math.min(frame.clientWidth / w, frame.clientHeight / h);
  stage.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
}

function startDebug() {
  const box = document.getElementById('debug');
  box.hidden = false;
  const time = (d) => (d ? d.toLocaleTimeString('es-AR') : '-');
  setInterval(() => {
    const data = dataStatus();
    box.textContent = [
      `estado:   ${cycleStatus.state}`,
      `página:   ${cycleStatus.page}/${cycleStatus.pages}`,
      `video:    ${cycleStatus.video}`,
      `datos:    ${data.source} (${data.items} ítems)${data.pending ? ' + cambios pendientes' : ''}`,
      `sync:     ${time(data.lastSync)}`,
      `offline:  ${navigator.serviceWorker?.controller ? 'activo' : 'inactivo'}`,
    ].join('\n');
  }, 500);
}

// Modo offline (sw.js): guarda código, videos y fotos en el TV para poder arrancar sin internet.
async function setupOffline() {
  if (!('serviceWorker' in navigator)) return;
  try {
    if (params.has('sin-offline')) {
      const controlled = Boolean(navigator.serviceWorker.controller);
      for (const reg of await navigator.serviceWorker.getRegistrations()) await reg.unregister();
      for (const key of await caches.keys()) await caches.delete(key);
      // Esta carga todavía pasa por el Service Worker: se recarga una vez para quedar limpia.
      if (controlled) location.reload();
      return;
    }
    await navigator.serviceWorker.register('sw.js');
    const reg = await navigator.serviceWorker.ready;
    reg.active.postMessage({
      type: 'precache-media',
      urls: [CONFIG.videoFondo, ...CONFIG.videosInstitucionales],
    });
  } catch (err) {
    console.warn('Modo offline no disponible:', err);
  }
}

async function main() {
  fitStage();
  addEventListener('resize', fitStage);

  document.getElementById('footer-text').textContent = CONFIG.textoPie;
  dom.inst.classList.toggle('sin-logo', !CONFIG.logoEnInstitucional);
  dom.bgVideo.src = CONFIG.videoFondo;
  dom.bgVideo.play().catch(() => {});

  if (params.has('debug')) startDebug();
  setupOffline();

  await Promise.all([loadInitial(), document.fonts.ready]);
  startPolling();
  runCycle(dom, timing);
}

main();

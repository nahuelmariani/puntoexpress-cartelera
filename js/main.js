// ==========================================================
// Arranque: escalado/rotación del escenario, datos y ciclo.
//
// Parámetros de URL:
//   ?rotar=90|180|270  gira el contenido (TV que no rota solo)
//   ?debug=1           muestra el estado en pantalla
//   ?rapido=1          tiempos cortos para probar el ciclo
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
  const scale = Math.min(innerWidth / w, innerHeight / h);
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
    ].join('\n');
  }, 500);
}

async function main() {
  fitStage();
  addEventListener('resize', fitStage);

  document.getElementById('footer-text').textContent = CONFIG.textoPie;
  dom.inst.classList.toggle('sin-logo', !CONFIG.logoEnInstitucional);
  dom.bgVideo.src = CONFIG.videoFondo;
  dom.bgVideo.play().catch(() => {});

  if (params.has('debug')) startDebug();

  await Promise.all([loadInitial(), document.fonts.ready]);
  startPolling();
  runCycle(dom, timing);
}

main();

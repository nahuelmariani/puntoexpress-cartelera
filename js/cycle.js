// ==========================================================
// Máquina de estados: CATÁLOGO → INSTITUCIONAL → CATÁLOGO …
// Un único bucle async maneja todos los tiempos, así nunca
// quedan timers duplicados ni cruzados.
// ==========================================================
import { CONFIG } from './config.js';
import { fillPage, paginate } from './render.js';
import { takeUpdate } from './data.js';

const FADE_MS = 1000;
const RETRY_MS = 5000;
const PLAY_TIMEOUT_MS = 8000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const once = (target, event) => new Promise((resolve) => target.addEventListener(event, resolve, { once: true }));

export const cycleStatus = { state: 'iniciando', page: 0, pages: 0, video: '-' };

export async function runCycle(dom, timing) {
  let activeSlot = 0;
  let videoIndex = 0;
  let pages = [];

  const hiddenSlot = () => dom.slots[1 - activeSlot];

  // Muestra el contenedor oculto (ya preparado) y oculta el visible.
  function swap({ instant = false } = {}) {
    const next = hiddenSlot();
    const prev = dom.slots[activeSlot];
    next.classList.toggle('instant', instant);
    prev.classList.toggle('instant', instant);
    next.classList.add('active');
    prev.classList.remove('active');
    activeSlot = 1 - activeSlot;
  }

  async function showPage(items, opts) {
    await fillPage(hiddenSlot(), items);
    swap(opts);
  }

  function refreshPages() {
    pages = paginate(takeUpdate().items, CONFIG.itemsPorPagina);
  }

  const videos = CONFIG.videosInstitucionales;
  const nextVideoUrl = () => videos[videoIndex % videos.length];

  // Asigna el próximo video para que se vaya cargando antes de necesitarlo.
  function preloadVideo() {
    if (!videos.length) return;
    const url = nextVideoUrl();
    if (!dom.instVideo.src.endsWith(url)) dom.instVideo.src = url;
  }

  async function institutional() {
    let visible = false;

    for (;;) {
      let playing = false;
      if (videos.length) {
        preloadVideo();
        cycleStatus.video = nextVideoUrl();
        videoIndex++;
        dom.instVideo.currentTime = 0;
        try {
          await Promise.race([
            dom.instVideo.play(),
            sleep(PLAY_TIMEOUT_MS).then(() => { throw new Error('el video tardó demasiado en arrancar'); }),
          ]);
          playing = true;
        } catch (err) {
          console.warn('No se pudo reproducir el video institucional:', err);
        }
      }

      if (playing && !visible) {
        cycleStatus.state = 'institucional';
        dom.inst.classList.add('active');
        visible = true;
        await sleep(FADE_MS);
        dom.bgVideo.pause();
      }

      // Mientras corre el video se aplican los datos nuevos y se deja lista la primera página.
      refreshPages();
      if (pages.length) await showPage(pages[0], { instant: true });

      if (playing) {
        await Promise.race([
          once(dom.instVideo, 'ended'),
          once(dom.instVideo, 'error'),
          sleep(timing.institutionalMaxMs),
        ]);
      }
      if (pages.length) break;
      // Sin productos: se queda en modo institucional y pasa al siguiente video.
      if (!playing) await sleep(RETRY_MS);
    }

    dom.bgVideo.play().catch(() => {});
    dom.inst.classList.remove('active');
    await sleep(FADE_MS);
    dom.instVideo.pause();
    preloadVideo();
  }

  refreshPages();
  if (pages.length) await showPage(pages[0], { instant: true });
  preloadVideo();

  for (;;) {
    try {
      cycleStatus.state = 'catálogo';
      cycleStatus.pages = pages.length;
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) await showPage(pages[i]);
        cycleStatus.page = i + 1;
        await sleep(timing.pageMs);
      }
      await institutional();
    } catch (err) {
      console.error('Error en el ciclo, se reintenta:', err);
      await sleep(RETRY_MS);
    }
  }
}

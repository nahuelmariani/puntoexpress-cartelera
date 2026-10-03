# Software Design Document (SDD)
## Sistema de Cartelería Digital Dinámica Vertical para Vinoteca

---

### 1. Resumen Ejecutivo y Objetivos

* **Propósito:** Proveer una cartelera digital desatendida, autónoma y de alto impacto visual para una vinoteca comercial sobre un Smart TV Noblex 43" (Android TV).
* **Orientación:** Pantalla Vertical (Portrait 9:16 - 1080 x 1920 px).
* **Objetivos Clave:**
  * Actualización de precios y stock en tiempo real mediante Google Sheets sin costo de infraestructura.
  * Transición fluida entre ciclo de catálogo de productos (con fondo de viñedo atmosférico oscurecido/desenfocado) y ciclo institucional a pantalla completa (video nítido).
  * Rendimiento a 60 FPS sin saturación de GPU/CPU ni consumo desmedido de memoria RAM.
  * Resiliencia offline contra microcortes de conectividad Wi-Fi en el local.

---

### 2. Arquitectura de Hardware y Software

```
+-----------------------------------------------------------+
|                   GOOGLE SHEETS (Nube)                    |
|   Planilla de productos (Solo Lectura - Salida CSV Web)   |
+-----------------------------------------------------------+
                             |
                   Polling HTTP (GET CSV)
                             v
+-----------------------------------------------------------+
|                   GITHUB PAGES / VERCEL                   |
|           Single Page Application (Static Web)            |
+-----------------------------------------------------------+
                             |
                    Carga vía WebView
                             v
+-----------------------------------------------------------+
|           SMART TV NOBLEX DV43X7180 (Android TV)          |
|  - App: Fully Kiosk Browser (Autostart + Kiosk Mode)       |
|  - Orientación forzada: 1080x1920 (Portrait)              |
|  - Aceleración gráfica por hardware (GPU Mali)            |
+-----------------------------------------------------------+
```

#### Componentes Técnicos
1. **Frontend:** Single-page Vanilla HTML5, CSS3 y JavaScript moderno (ES6+). Cero frameworks pesados para garantizar compatibilidad y bajo footprint de memoria.
2. **Librerías de Terceros (CDN):**
   * **PapaParse (v5.4.1):** Parser CSV rápido y liviano para convertir la salida del Sheet a objetos JS.
   * **Swiper.js (v11):** Motor de slider acelerado por hardware para transiciones y autoplay.
3. **Plataforma de Ejecución:** Fully Kiosk Browser en Android TV, configurado con recarga periódica de seguridad (cada 4 horas) para depurar la memoria caché del WebView.

---

### 3. Modelo de Datos (Google Sheets)

La hoja de cálculo debe contener una pestaña dedicada (ej. `PantallaTV`) con las siguientes columnas exactas:

| Columna | Tipo de Dato | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `id` | String / Int | Identificador único | `001` |
| `nombre` | String | Nombre comercial del vino | `Gran Reserva Malbec` |
| `bodega` | String | Bodega productora | `Catena Zapata` |
| `cepa` | String | Varietal o tipo | `Malbec 2021` |
| `precio` | String | Precio regular de venta | `$ 38.500` |
| `precio_oferta` | String | Precio promocional | `$ 32.900` |
| `en_oferta` | Booleano (Checkbox) | `TRUE` si aplica estilo y badge de promo | `TRUE` |
| `imagen_url` | String (URL) | Link directo de la botella (PNG transparente) | `https://res.cloudinary.com/.../malbec.png` |
| `activo` | Booleano (Checkbox) | `TRUE` para incluir en la rotación | `TRUE` |

* **Publicación Web:** *Archivo > Compartir > Publicar en la web > Formato: Valores separados por comas (.csv)*.

---

### 4. Ciclo de Estados de Pantalla

La experiencia visual opera mediante una máquina de estados de tiempo:

```
[ Estado 1: CATÁLOGO ] (Duración: N productos * 8s)
  - Video de viñedo en bucle con clase .blur-active (brillo reducido, desenfoque).
  - Carrusel Swiper activo pasando diapositivas de productos.
  - Distinción visual para registros con en_oferta == TRUE.
         |
         | Al completar el carrusel de productos
         v
[ Estado 2: INSTITUCIONAL ] (Duración: 10s - 12s)
  - Swiper oculta contenedor de tarjetas (opacity: 0, scale: 0.95).
  - Video de viñedo remueve clase .blur-active (video nítido y luminoso).
  - Superposición de isotipo/logo de la vinoteca y lema institucional.
         |
         | Cumplidos los 10 segundos
         v
  Retorno a [ Estado 1: CATÁLOGO ] con actualización de datos si hubo cambios en el Sheet.
```

---

### 5. Optimizaciones Críticas para Noblex 43" (1GB-1.5GB RAM)

1. **Evitar `backdrop-filter: blur()`:** Esta propiedad en tiempo real destruye el framerate en GPUs integradas. El desenfoque se aplica mediante CSS simple con `filter: blur(10px)` directamente sobre la capa `<video>`, o idealmente utilizando dos pistas de video pre-renderizadas/optimizadas.
2. **Dimensionamiento de Medios:**
   * Imágenes de botellas: Formato WebP o PNG optimizado, máx. 800px de altura vertical con `object-fit: contain`.
   * Video de fondo: Codificación H.264 / MP4 en 1080x1920 a 30 FPS, bitrate menor a 4 Mbps, mudo (`muted`).
3. **Resiliencia Offline (`localStorage`):** Cada petición exitosa a Google Sheets guarda el array de productos en el almacenamiento local. Si la conexión Wi-Fi del comercio cae, el sistema continúa operando con el último set de datos sin mostrar pantallas de error.

---

### 6. Boilerplate Funcional Completo (`index.html`)

A continuación se presenta el código completo en un único archivo, listo para subir a GitHub Pages:
```

```markdown:Código Fuente Base:index.html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1080, height=1920, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Cartelera Digital Vinoteca</title>

  <!-- Google Fonts & Swiper CSS -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Montserrat:wght@300;400;600;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />

  <style>
    :root {
      --bg-dark: #0a0808;
      --gold-primary: #d4af37;
      --gold-light: #f3e5ab;
      --red-promo: #c02626;
      --text-main: #f9f9f9;
      --text-muted: #a8a29e;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
    }

    body, html {
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      background-color: var(--bg-dark);
      font-family: 'Montserrat', sans-serif;
      color: var(--text-main);
    }

    /* Contenedor Raíz */
    #viewport {
      position: relative;
      width: 1080px;
      height: 1920px;
      overflow: hidden;
    }

    /* Video de Fondo Atmosférico */
    .bg-video-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      overflow: hidden;
    }

    #bg-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scale(1.05) translateZ(0);
      transition: filter 1.2s ease, transform 1.2s ease;
      will-change: filter, transform;
    }

    /* Clases de estado para el video */
    #bg-video.mode-catalog {
      filter: blur(14px) brightness(0.35);
    }

    #bg-video.mode-institutional {
      filter: blur(0px) brightness(0.85);
      transform: scale(1) translateZ(0);
    }

    /* Superposición de degradado para contraste */
    .bg-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, rgba(10,8,8,0.2) 0%, rgba(10,8,8,0.85) 100%);
      z-index: 2;
      pointer-events: none;
    }

    /* Capa Institucional (Logo y Marca) */
    #institutional-layer {
      position: absolute;
      inset: 0;
      z-index: 5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 80px;
      opacity: 0;
      transform: scale(0.95);
      transition: opacity 1s ease, transform 1s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    }

    #institutional-layer.active {
      opacity: 1;
      transform: scale(1);
    }

    .inst-badge {
      font-family: 'Cinzel', serif;
      letter-spacing: 6px;
      font-size: 26px;
      color: var(--gold-primary);
      text-transform: uppercase;
      margin-bottom: 24px;
    }

    .inst-title {
      font-family: 'Cinzel', serif;
      font-size: 78px;
      line-height: 1.1;
      margin-bottom: 30px;
      text-shadow: 0 10px 30px rgba(0,0,0,0.8);
    }

    .inst-subtitle {
      font-size: 32px;
      font-weight: 300;
      color: var(--gold-light);
      max-width: 780px;
      line-height: 1.5;
    }

    /* Capa de Catálogo / Swiper */
    #catalog-layer {
      position: absolute;
      inset: 0;
      z-index: 10;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 100px 70px;
      transition: opacity 0.8s ease;
    }

    #catalog-layer.hidden {
      opacity: 0;
      pointer-events: none;
    }

    /* Header de Catálogo */
    .catalog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(212, 175, 55, 0.3);
      padding-bottom: 30px;
    }

    .store-name {
      font-family: 'Cinzel', serif;
      font-size: 36px;
      color: var(--gold-primary);
      letter-spacing: 4px;
    }

    .curator-tag {
      font-size: 20px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-muted);
    }

    /* Swiper Styling */
    .swiper {
      width: 100%;
      height: 1400px;
    }

    .swiper-slide {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    /* Tarjeta de Producto */
    .product-card {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }

    /* Badge de Oferta */
    .promo-tag {
      display: none;
      background: linear-gradient(135deg, var(--red-promo), #800e0e);
      color: #fff;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 3px;
      padding: 14px 38px;
      border-radius: 50px;
      text-transform: uppercase;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px rgba(192, 38, 38, 0.4);
      animation: pulseGlow 2.5s infinite ease-in-out;
    }

    .is-promo .promo-tag {
      display: inline-block;
    }

    @keyframes pulseGlow {
      0%, 100% { transform: scale(1); box-shadow: 0 10px 30px rgba(192,38,38,0.4); }
      50% { transform: scale(1.05); box-shadow: 0 12px 40px rgba(192,38,38,0.7); }
    }

    /* Imagen de la Botella */
    .bottle-box {
      width: 100%;
      height: 780px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 40px;
    }

    .bottle-img {
      max-height: 100%;
      max-width: 650px;
      object-fit: contain;
      filter: drop-shadow(0 25px 35px rgba(0,0,0,0.7));
    }

    /* Datos del Producto */
    .product-info {
      text-align: center;
      max-width: 880px;
    }

    .winery-name {
      font-size: 26px;
      letter-spacing: 5px;
      text-transform: uppercase;
      color: var(--gold-primary);
      margin-bottom: 12px;
      font-weight: 600;
    }

    .wine-title {
      font-family: 'Cinzel', serif;
      font-size: 54px;
      line-height: 1.15;
      margin-bottom: 16px;
      font-weight: 700;
    }

    .grape-tag {
      font-size: 24px;
      color: var(--text-muted);
      margin-bottom: 30px;
      font-weight: 300;
    }

    /* Precios */
    .price-wrapper {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 24px;
    }

    .regular-price {
      font-size: 68px;
      font-weight: 800;
      color: #fff;
    }

    .is-promo .regular-price {
      font-size: 44px;
      text-decoration: line-through;
      color: var(--text-muted);
      font-weight: 400;
    }

    .offer-price {
      display: none;
      font-size: 80px;
      font-weight: 800;
      color: var(--gold-light);
      text-shadow: 0 0 30px rgba(212, 175, 55, 0.4);
    }

    .is-promo .offer-price {
      display: inline-block;
    }

    /* Footer */
    .catalog-footer {
      text-align: center;
      font-size: 20px;
      color: var(--text-muted);
      letter-spacing: 2px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 25px;
    }
  </style>
</head>
<body>

  <div id="viewport">
    <!-- Video de fondo vertical (H.264) -->
    <div class="bg-video-wrapper">
      <video id="bg-video" class="mode-catalog" autoplay muted loop playsinline preload="auto">
        <source src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-vineyard-4841-large.mp4" type="video/mp4" />
      </video>
    </div>
    
    <div class="bg-overlay"></div>

    <!-- Capa 1: Slider de Productos -->
    <section id="catalog-layer">
      <header class="catalog-header">
        <span class="store-name">CAVA & BODEGA</span>
        <span class="curator-tag">Selección Destacada</span>
      </header>

      <div class="swiper">
        <div class="swiper-wrapper" id="slides-container">
          <!-- Render dinámico vía JS -->
        </div>
      </div>

      <footer class="catalog-footer">
        PRECIOS SUJETOS A DISPONIBILIDAD DE STOCK
      </footer>
    </section>

    <!-- Capa 2: Presentación Institucional -->
    <section id="institutional-layer">
      <span class="inst-badge">Terruños de Origen</span>
      <h1 class="inst-title">Pasión por las Cosechas Excepcionales</h1>
      <p class="inst-subtitle">Descubra nuestra cava de etiquetas selectas y asesoramiento exclusivo en mesa.</p>
    </section>
  </div>

  <!-- Dependencias CDN -->
  <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>

  <script>
    // ==========================================
    // CONFIGURACIÓN PRINCIPAL
    // ==========================================
    const CONFIG = {
      // Reemplazar con la URL pública generada por Google Sheets en formato .csv:
      csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTplaceholder_sheet_id/pub?output=csv',
      slideDurationMs: 8000,          // 8 segundos por vino
      institutionalDurationMs: 10000, // 10 segundos de vista viñedo
      syncIntervalMs: 180000,          // Consulta de actualización cada 3 minutos
      storageKey: 'vinoteca_catalog_cache'
    };

    // Datos semilla para arranque offline inicial si el Sheet aún no está configurado
    const FALLBACK_PRODUCTS = [
      {
        id: '1',
        bodega: 'Catena Zapata',
        nombre: 'Adrianna Vineyard Malbec',
        cepa: 'Gualtallary, Valle de Uco',
        precio: '$ 95.000',
        precio_oferta: '$ 84.900',
        en_oferta: 'TRUE',
        imagen_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=700&q=80',
        activo: 'TRUE'
      },
      {
        id: '2',
        bodega: 'Rutini Wines',
        nombre: 'Single Vineyard Cabernet Franc',
        cepa: 'Tupungato, Mendoza',
        precio: '$ 42.000',
        precio_oferta: '',
        en_oferta: 'FALSE',
        imagen_url: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?auto=format&fit=crop&w=700&q=80',
        activo: 'TRUE'
      }
    ];

    let swiperInstance = null;
    let productsList = [];
    let stateTimeout = null;

    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    const bgVideo = document.getElementById('bg-video');
    const catalogLayer = document.getElementById('catalog-layer');
    const institutionalLayer = document.getElementById('institutional-layer');
    const slidesContainer = document.getElementById('slides-container');

    // ==========================================
    // DATA FETCHING & PARSING
    // ==========================================
    async function loadCatalog() {
      try {
        const response = await fetch(CONFIG.csvUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('Network error fetching CSV');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const valid = results.data.filter(item => 
              item.activo && item.activo.trim().toUpperCase() === 'TRUE'
            );
            if (valid.length > 0) {
              productsList = valid;
              localStorage.setItem(CONFIG.storageKey, JSON.stringify(valid));
              updateSliderDOM();
            }
          }
        });
      } catch (err) {
        console.warn('Operando en modo offline o caché:', err);
        const cached = localStorage.getItem(CONFIG.storageKey);
        productsList = cached ? JSON.parse(cached) : FALLBACK_PRODUCTS;
        updateSliderDOM();
      }
    }

    // ==========================================
    // SLIDER DOM RENDER
    // ==========================================
    function updateSliderDOM() {
      if (swiperInstance) {
        swiperInstance.destroy(true, true);
      }

      slidesContainer.innerHTML = productsList.map(prod => {
        const isOffer = prod.en_oferta && prod.en_oferta.trim().toUpperCase() === 'TRUE';
        return `
          <div class="swiper-slide">
            <div class="product-card ${isOffer ? 'is-promo' : ''}">
              <div class="promo-tag">Selección Especial</div>
              <div class="bottle-box">
                <img src="${prod.imagen_url}" alt="${prod.nombre}" class="bottle-img" loading="eager" />
              </div>
              <div class="product-info">
                <p class="winery-name">${prod.bodega}</p>
                <h2 class="wine-title">${prod.nombre}</h2>
                <p class="grape-tag">${prod.cepa}</p>
                <div class="price-wrapper">
                  <span class="regular-price">${prod.precio}</span>
                  ${isOffer ? `<span class="offer-price">${prod.precio_oferta}</span>` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      initSwiper();
    }

    // ==========================================
    // SWIPER & STATE MACHINE INITIALIZATION
    // ==========================================
    function initSwiper() {
      swiperInstance = new Swiper('.swiper', {
        effect: 'fade',
        fadeEffect: { crossFade: true },
        speed: 900,
        autoplay: {
          delay: CONFIG.slideDurationMs,
          disableOnInteraction: false
        },
        loop: false, // Desactivado para interceptar el fin de ciclo
        on: {
          reachEnd: () => {
            // Cuando finaliza la última botella, se transiciona al modo institucional
            setTimeout(transitionToInstitutional, CONFIG.slideDurationMs);
          }
        }
      });
    }

    // ==========================================
    // STATE MACHINE TRANSITIONS
    // ==========================================
    function transitionToInstitutional() {
      // Detener autoplay y ocultar catálogo
      if (swiperInstance && swiperInstance.autoplay) {
        swiperInstance.autoplay.stop();
      }

      catalogLayer.classList.add('hidden');
      institutionalLayer.classList.add('active');

      // Video nítido a pantalla completa
      bgVideo.className = 'mode-institutional';

      // Esperar tiempo institucional y regresar a catálogo
      clearTimeout(stateTimeout);
      stateTimeout = setTimeout(transitionToCatalog, CONFIG.institutionalDurationMs);
    }

    function transitionToCatalog() {
      // Restaurar video difuso y mostrar catálogo
      bgVideo.className = 'mode-catalog';
      institutionalLayer.classList.remove('active');
      catalogLayer.classList.remove('hidden');

      if (swiperInstance) {
        swiperInstance.slideTo(0, 0);
        swiperInstance.autoplay.start();
      }
    }

    // ==========================================
    // BOOTSTRAP & SYNC
    // ==========================================
    window.addEventListener('DOMContentLoaded', () => {
      loadCatalog();
      // Polling periódico silencioso para actualizar precios
      setInterval(loadCatalog, CONFIG.syncIntervalMs);
    });
  </script>
</body>
</html>
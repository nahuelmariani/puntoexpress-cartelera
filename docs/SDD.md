# SDD v2 — Cartelera Digital Punto Express

> Versión 2. Reemplaza al documento inicial ([docs/referencia/sdd-v1-gemini.md](referencia/sdd-v1-gemini.md)), que queda como referencia histórica.

## Cambios respecto de v1

| Tema | v1 | v2 | Motivo |
| :--- | :--- | :--- | :--- |
| Productos | Ficha de vino (bodega, cepa) | Ítem genérico: texto, detalle, precio | Hay licores, combos y promos, no solo vinos |
| Layout | 1 producto por pantalla | 3 ítems por página | Mejor uso de un TV de 43" y ciclos más cortos |
| Slider | Swiper.js | Fundido propio en JS/CSS | Evita conflictos con la máquina de estados |
| Desenfoque | `filter: blur()` en vivo | Video pre-renderizado (desenfocado y oscurecido) | Rendimiento en la GPU del TV |
| Institucional | 1 video + texto | Rotación de N videos de viñedo a pantalla completa | Variedad visual |
| Precios | Texto libre (`$ 38.500`) | Número, formateado por la app | Consistencia |
| Oferta | Checkbox `en_oferta` + precio | Hay oferta si `Precio oferta` tiene valor | Una columna menos y un error menos posible |
| Datos | Re-renderiza cada 3 min | Se aplican al empezar un ciclo y solo si cambiaron | Sin cortes visuales |
| Recursos | CDN externos y video de terceros | Todo alojado en el repo | Estabilidad y funcionamiento offline |

---

## 1. Objetivo

Cartelera digital vertical, desatendida y autónoma para la vinoteca **Punto Express**. Muestra los productos y promociones cargados en una planilla de Google, alternados con videos institucionales de viñedos.

**Prioridades, en orden:**
1. **Fluidez:** transiciones suaves, sin tirones ni pantallas en negro.
2. **Facilidad de carga:** el dueño actualiza todo desde el celular con Google Sheets.
3. **Autonomía:** arranca sola, no muestra errores y sigue funcionando si se corta internet.
4. **Costo cero de infraestructura:** Google Sheets + GitHub Pages. Solo se paga la licencia de Fully Kiosk Plus.

---

## 2. Arquitectura

```
Google Sheets (pestaña "Pantalla", publicada como CSV — solo lectura)
        │  fetch periódico (cada 1 min)
        ▼
GitHub Pages — sitio estático (HTML + CSS + JS, sin build)
        │  carga web
        ▼
Smart TV Noblex DV43X7180 — Fully Kiosk Browser Plus (kiosk + autoarranque)
```

- **Frontend:** HTML5, CSS3 y JavaScript ES6+ en módulos nativos, sin frameworks y sin paso de build.
- **Dependencias:** solo **PapaParse** (parser CSV), alojado en `/vendor`. Nada se carga desde CDN.
- **Tipografías:** alojadas en el repo (`/fonts`).

---

## 3. Hardware y kiosko

- **TV:** Noblex DV43X7180, montado en vertical. Hay que verificar en el equipo real: sistema operativo, si se puede instalar Fully Kiosk, si soporta rotación de pantalla y su rendimiento con video. *Pendiente: el TV todavía no está disponible.*
- **Fully Kiosk Browser Plus:** autoarranque al encender, modo kiosko, pantalla siempre encendida y recarga programada diaria (en horario sin público) para liberar memoria.
- **Rotación:** la app se diseña en 1080×1920 (9:16). Si el sistema del TV no rota la imagen, la app gira el contenido por CSS:
  - `?rotar=90` (o `270`) en la URL rota el escenario dentro de una pantalla horizontal de 1920×1080.
  - Sin parámetro, se muestra vertical.

---

## 4. Modelo de datos (Google Sheets)

Una planilla **dedicada exclusivamente** a la cartelera, con una pestaña `Pantalla`. Cada fila es un ítem. **El orden de las filas es el orden en pantalla.**

| Columna | Tipo | Obligatoria | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `Activo` | Casilla de verificación | Sí | Si está tildada, el ítem se muestra | ☑ |
| `Producto` | Texto | Sí | Texto principal | `Catena Zapata Malbec` |
| `Detalle` | Texto | No | Línea secundaria | `750 ml · Mendoza` |
| `Precio` | Número | No | Precio normal. Si está vacío, no se muestra precio | `38500` |
| `Precio oferta` | Número | No | Si tiene valor, el ítem se muestra en oferta (precio normal tachado) | `32900` |
| `Imagen` | Link | No | Link de Google Drive de la foto. Sin imagen, la tarjeta se muestra solo con texto | `https://drive.google.com/file/d/…` |

**Ejemplos de uso:**
- **Vino:** `Producto` = "Rutini Cabernet Franc", `Detalle` = "750 ml", `Precio` = 42000.
- **Combo:** `Producto` = "Combo Fernet + 2 Cocas", `Precio` = 15900.
- **Promo sin precio:** `Producto` = "Martes 2x1 en espumantes", `Detalle` = "Todo el día".

**Reglas de lectura (la app es tolerante a errores de carga):**
- Los nombres de columna se normalizan: no importan mayúsculas, espacios ni tildes.
- Los precios se limpian: `$ 38.500`, `38500` y `38.500,00` se leen todos como `38500`. Se muestran con formato argentino (`$ 38.500`) usando `Intl.NumberFormat('es-AR')`.
- Se ignoran las filas sin `Producto` y las que no tienen `Activo` tildado.
- Si `Precio oferta` es mayor o igual a `Precio`, se ignora la oferta.

**Publicación:** *Archivo → Compartir → Publicar en la web → pestaña `Pantalla` → formato CSV.*

---

## 5. Flujo de carga para el dueño

Todo desde el celular, con la app de Google Sheets y la de Google Drive.

1. **Preparar la foto:** se saca una foto del producto y se pasa por un chat de IA con el prompt estándar del Anexo A. El resultado es una imagen cuadrada, con fondo blanco liso y el producto centrado.
   - ⚠️ Revisar que la IA no haya alterado el texto de la etiqueta.
2. **Subirla a Drive:** a la carpeta compartida `Cartelera – Imágenes`, con acceso "Cualquier persona con el enlace: Lector".
3. **Copiar el link:** desde Drive (*Compartir → Copiar enlace*) y pegarlo en la columna `Imagen`.
4. **Completar la fila:** tildar `Activo`. La pantalla se actualiza sola en unos minutos.

**Notas técnicas:**
- La app convierte el link de Drive a una URL de imagen directa redimensionada por Google (`https://lh3.googleusercontent.com/d/<ID>=w800`), así las fotos pesadas del celular no se descargan completas.
- **Riesgo:** este formato de URL no está documentado oficialmente por Google. Funciona (validado en la Fase 2), pero si Google lo cambia, la alternativa es Cloudinary (plan gratuito). Mientras tanto, si una imagen no carga, la tarjeta pasa a modo solo texto.
- **Demora:** la app consulta la planilla cada 1 minuto y aplica los cambios al empezar la siguiente vuelta del catálogo. En la práctica, un cambio se ve en 1–3 minutos. Google puede demorar algunos minutos más en publicar un cambio, pero en las pruebas fue casi inmediato.

---

## 6. Ciclo de pantalla (máquina de estados)

```
┌───────────────────────────────────────────────┐
│ CATÁLOGO                                       │
│  Fondo: video de viñedo pre-desenfocado, loop  │
│  Páginas de 3 ítems, ~10 s cada una, fundido   │
└──────────────────────┬────────────────────────┘
                       │ terminó la última página
                       ▼
┌───────────────────────────────────────────────┐
│ INSTITUCIONAL                                  │
│  Video N de viñedo, nítido, pantalla completa  │
│  Se reproduce una vez (~10 s), logo opcional   │
└──────────────────────┬────────────────────────┘
                       │ evento "ended" del video
                       │ (con timeout de seguridad)
                       ▼
     N = siguiente video (rotación 1 → 2 → 3 → 1 …)
     Si hay datos nuevos, se aplican acá
     Vuelve a CATÁLOGO
```

**Detalles:**
- **Timer único:** un solo controlador maneja todos los tiempos, y siempre cancela el timer anterior antes de programar otro.
- **Casos borde:**
  - Con 1 o 2 ítems, se muestra una sola página.
  - Con 0 ítems, se usan los datos guardados de la última carga. Si tampoco hay, se pasa directo a modo institucional (nunca se ve una pantalla vacía).
- **Precarga:**
  - Antes de mostrar una página, sus imágenes ya están cargadas (`img.decode()`).
  - El siguiente video institucional se precarga en un `<video>` secundario, para que el cambio sea un fundido sin cuadros negros.

---

## 7. Diseño visual

- **Marca:** Punto Express. Logo negro sobre gris `#8f8f8f`. El logo se vectorizó a SVG (`media/logo.svg`) a partir del JPG de la web; si aparece un SVG oficial, se reemplaza.
- **Tipografías:** *Playfair Display* (serif de estilo clásico, para los nombres) y *Barlow* (sans parecida a las letras del logo, para precios y detalles). Ambas alojadas en el repo con el subset latino completo (tildes, ñ, ¿¡).
- **Etiqueta blanca:** el catálogo va sobre un gran rectángulo blanco, como una etiqueta de vino, apoyado sobre el video desenfocado. Se dibuja con CSS (no está en el video): cuesta lo mismo para la GPU y permite cambiar el diseño sin re-editar el video. Las fotos con fondo blanco se funden con la etiqueta.
- **Encabezado:** franja gris de la marca con el logo negro. Respeta los colores reales del logo y contrasta con el fondo oscuro.
- **Tarjetas de ítem:** 3 por página, apiladas en vertical. Cada tarjeta tiene:
  - **Imagen:** cuadrado blanco a la izquierda. Coincide con el fondo blanco de las fotos normalizadas, así no se ven "recortes".
  - **Texto, a la derecha:** `Producto` grande, `Detalle` más chico y el precio destacado.
  - **Oferta:** badge "OFERTA", badge con el porcentaje de descuento calculado automáticamente (ej. `-12%`, redondeado), precio normal tachado y precio de oferta resaltado.
  - **Sin imagen:** la tarjeta ocupa todo el ancho con el texto centrado. Sirve para promos como "Martes 2x1".
- **Pie:** leyenda "Precios sujetos a disponibilidad de stock" (configurable).
- **Legibilidad:** tamaños pensados para leer a 2–4 m de distancia. El precio es el elemento más grande de cada tarjeta.

---

## 8. Rendimiento

Reglas obligatorias para la GPU y la memoria limitadas del TV:

1. **Nada de `filter: blur()` ni `backdrop-filter` en tiempo real.** El desenfoque y el oscurecimiento van en el video desde la edición.
2. **Solo se animan `opacity` y `transform`.** Nunca `box-shadow`, `filter`, `width`/`height` ni propiedades que generen relayout.
3. **Videos:**
   - Formato H.264 MP4, sin audio, con los fps originales (convertir 24 → 30 fps genera tirones).
   - **Institucionales:** 1080×1920. Los actuales (generados con IA, 4.5–8 Mbps) se usan sin recomprimir, solo se les quita el audio (`tools/preparar-videos.sh limpiar`).
   - **Fondo del catálogo:** 360×640 (paneo suave por la parra con racimos y sol entre las hojas, generado con IA; original `fondo3.mp4`). Al estar desenfocado se ve igual que en 1080×1920 y el TV decodifica 9 veces menos píxeles. Se arma en "ida y vuelta" para que el loop no tenga saltos.
4. **Imágenes:** se piden a 800 px de ancho como máximo, y se liberan las que no están en el DOM.
5. **DOM estable:** cada página se arma una sola vez por ciclo. No se destruye ni recrea nada mientras se ve.

---

## 9. Actualización de datos y resiliencia

- **Polling:** cada 1 min se descarga el CSV en segundo plano (~1 KB).
  - Si cambió (comparando el texto), queda como **pendiente** y se aplica al empezar el siguiente ciclo de catálogo.
  - Antes de aplicarlo, se precargan sus imágenes.
- **Caché de datos:** el último CSV válido se guarda en `localStorage`. Al arrancar sin conexión se usa ese. Si no existe (primer arranque sin internet), se muestran solo los videos institucionales: nunca productos de ejemplo en el local.
- **Respuesta inválida:** si Google devuelve algo que no tiene las columnas esperadas (por ejemplo una página de error), se descarta y se mantienen los datos actuales. Si la planilla es válida pero no tiene ítems activos, se muestran solo los videos.
- **Errores:** nunca se muestran en pantalla, solo en la consola.
- **Service Worker (Fase 3):** cachea la app, las tipografías, los videos y las imágenes de productos. Así, ante cortes de Wi-Fi y reinicios, la cartelera sigue funcionando completa y sin descargas durante la reproducción.
  - **Nota técnica:** los videos requieren soportar peticiones `Range` desde la caché.

---

## 10. Seguridad

- **La URL del CSV publicado es de solo lectura.** No permite editar ni lleva al link de edición de la planilla.
- **Permisos de la planilla:** compartida solo con cuentas específicas (dueño y desarrollador), con permiso de editor. Nunca "Cualquier persona con el enlace puede editar".
- **Datos públicos:** el contenido publicado es legible por cualquiera. La planilla no debe contener datos internos (costos, proveedores, stock real).
- **Repositorio público:** requisito de GitHub Pages en el plan gratuito. No contiene secretos.
- **Contenido escapado:** los textos de la planilla se insertan como texto (`textContent`), nunca como HTML.
- **Carpeta de Drive:** compartida como "Lector" con cualquiera que tenga el enlace. Solo debe contener las imágenes de la cartelera.

---

## 11. Estructura del repositorio y desarrollo

```
/
├── index.html
├── css/styles.css
├── js/
│   ├── config.js        # URL del CSV, tiempos, lista de videos, textos fijos
│   ├── data.js          # descarga, parseo, normalización, caché
│   ├── render.js        # armado de páginas y tarjetas
│   ├── cycle.js         # máquina de estados y timers
│   └── main.js
├── vendor/papaparse.min.js
├── fonts/
├── media/
│   ├── logo.svg
│   ├── fondo-catalogo.mp4
│   └── institucional-1.mp4, -2.mp4, -3.mp4
├── sw.js                # Fase 3
├── tools/preparar-videos.sh  # ffmpeg: recorte 9:16, desenfoque del fondo
└── docs/
```

- **Modo desarrollo:** el escenario de 1080×1920 se escala con `transform: scale()` para entrar en la ventana del navegador. En la PC se ve vertical en cualquier monitor.
- **Parámetros de URL:**
  - `?rotar=90`: rota el contenido.
  - `?debug=1`: muestra un overlay con el estado actual, el tiempo y la última sincronización.
  - `?rapido=1`: tiempos acortados para probar el ciclo completo.
- **Servidor local:** `python3 -m http.server`. Los módulos ES no funcionan abriendo el archivo directamente.

---

## 12. Plan de trabajo

| Fase | Entregable | Criterio de éxito |
| :--- | :--- | :--- |
| **1. Base** | Repo, estructura, ciclo completo con datos de ejemplo, escalado 9:16 en la PC | El ciclo catálogo → institucional → catálogo corre sin cortes en el navegador |
| **2. Datos reales** | Planilla real, conversión de links de Drive, formato de precios, actualización sin cortes | El dueño carga un ítem desde el celular y aparece solo |
| **3. Videos y diseño final** | Videos editados, logo y colores reales, ajuste visual | Aprobación del dueño |
| **4. Offline** | Service Worker | Con el Wi-Fi cortado y la app recargada, sigue funcionando completa |
| **5. Instalación** | Configuración de Fully Kiosk, rotación, prueba de rendimiento en el TV | 48 h corriendo sin intervención |

> Recomendación: apenas el TV esté disponible, aunque sea antes de la fase 5, probar una página mínima con video para confirmar el sistema, la rotación y la fluidez.

---

## 13. Decisiones abiertas

- [x] Tiempo por página: 10 s, 3 ítems por página (ambos configurables en `js/config.js`).
- [x] Logo en los videos institucionales: la app puede superponerlo (`logoEnInstitucional`). Está apagado porque los videos actuales ya traen la marca integrada.
- [x] Logo y colores: logo vectorizado, gris `#8f8f8f`.
- [x] Tipografías: Playfair Display + Barlow.
- [ ] ¿Los ítems en oferta van en página propia, más grandes, o mezclados con el resto? (hoy: mezclados, con badge)
- [x] Videos institucionales: 4 videos de 10 s generados con IA.
- [x] Video de fondo: generado con IA, desenfocado por script.
- [x] URL directa de imágenes de Drive (`lh3.googleusercontent.com/d/<ID>=w800`): validada con la planilla real (Fase 2).

---

## Anexo A — Prompt para normalizar fotos de productos

> Tomá el producto principal de esta foto y generá una imagen nueva con estas condiciones: formato cuadrado (1:1), fondo blanco liso y uniforme, producto centrado y ocupando aproximadamente el 80 % del alto, iluminación pareja de estudio, sombra suave debajo. No modifiques la etiqueta, el texto, los colores ni la forma del envase. No agregues texto, logos ni otros objetos.

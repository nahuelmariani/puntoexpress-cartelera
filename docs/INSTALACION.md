# Guía de instalación — Cartelera Punto Express

Instalar la cartelera en el TV Noblex DV43X7180 con Fully Kiosk Browser y dejarla funcionando sola.

> Los nombres de los menús de Fully Kiosk y del TV pueden variar un poco según la versión. Si alguno no coincide, buscar la opción equivalente.

---

## 0. Antes de ir al local

- [ ] **Cartelera publicada:** se ve bien en <https://nahuelmariani.github.io/puntoexpress-cartelera/> (o en la URL nueva, si se migró: ver la [sección 7](#7-migración-de-cuentas-qué-cambia-y-qué-tocar)).
- [ ] **Planilla:** tiene los productos reales.
- [ ] **Datos del local:** el nombre y la contraseña del Wi-Fi.
- [ ] **Licencia:** la de Fully Kiosk Plus, comprada o a mano para comprarla en el momento (~USD 10, pago único por dispositivo).
- [ ] **Hardware:** el control remoto del TV. Un teclado o mouse USB ayuda mucho para escribir URLs, aunque es opcional.

---

## 1. Preparar el TV (configuración de Android TV)

1. **Conectar al Wi-Fi** del local.
2. **Actualizar** (Configuración → Preferencias del dispositivo → Acerca de → Actualización del sistema). Después, desde Play Store, actualizar **Android System WebView** y **Chrome** si aparecen: Fully Kiosk usa ese motor para mostrar la página.
3. **Desactivar todo lo que apague o tape la pantalla.** Es clave: muchos TV se apagan solos después de unas horas sin tocar el control.
   - **Protector de pantalla / Modo ambiente:** *Nunca*.
   - **Apagado automático por inactividad** (suele llamarse *Auto standby*, *Apagado automático* o estar en *Ahorro de energía*): **desactivado**.
   - **Temporizador de apagado:** desactivado.
4. **Encendido:** si el TV tiene la opción *Al encender: última aplicación / último origen*, elegirla.

---

## 2. Instalar Fully Kiosk Browser

1. Buscar **Fully Kiosk Browser** en Play Store del TV e instalarlo.
2. Si no aparece (algunas versiones no lo muestran en TV):
   1. Instalar la app **Downloader** (de AFTVnews) desde Play Store.
   2. En Downloader, ir a `https://www.fully-kiosk.com` y descargar el APK para Android.
   3. Autorizar la instalación desde orígenes desconocidos cuando el TV lo pida.
3. Abrir Fully Kiosk y aceptar los permisos que pida.
4. **Activar la licencia Plus:** desde el menú de Fully Kiosk (*Fully Plus / License*). Se compra por dispositivo y queda asociada al TV.

---

## 3. Configurar Fully Kiosk

Abrir el menú de configuración. En el TV suele abrirse con la tecla *Menú* del control o deslizando desde el borde izquierdo.

### Web Content Settings
- **Start URL:** `https://nahuelmariani.github.io/puntoexpress-cartelera/?debug=1`. El `?debug=1` es **solo para la prueba inicial**; se saca en el paso 6.
- **Autoplay Videos:** activado.
- **Enable JavaScript:** activado (viene así).

### Web Auto Reload
- **Auto Reload after Page Error:** activado (por ejemplo, cada 60 s). Es una red de seguridad extra, aunque el modo offline ya debería evitar errores.
- **Recarga programada diaria:** una vez por día, en horario sin público (por ejemplo, 6:00). Libera memoria del TV. Según la versión puede aparecer como *Scheduled Reload* o como una recarga por horario.

### Device Management
- **Keep Screen On:** activado.
- **Launch on Boot:** activado (abre la cartelera cuando el TV arranca).
- **Screen Orientation:** probar **Portrait**. Ver el paso 4.

### Kiosk Mode (Plus)
- **Enable Kiosk Mode:** activado, con un **PIN** que solo sepan ustedes. Así nadie del local sale de la cartelera tocando el control.
- **Usar Fully como launcher (pantalla de inicio):** aceptar si lo ofrece. Es importante: cuando el TV vuelve del modo de espera, Android TV muestra su pantalla de inicio, no la última app. Siendo launcher, vuelve directo a la cartelera.

### Opcional: Remote Administration (Plus)
Permite recargar la página, ver una captura de la pantalla o cambiar la URL desde el celular, conectado al mismo Wi-Fi del local. Útil para no tener que ir con el control.

---

## 4. Orientación vertical

El TV va colgado en vertical. Hay dos caminos:

1. **Que gire el TV:** con *Screen Orientation → Portrait* en Fully Kiosk. Si la cartelera se ve derecha y ocupando toda la pantalla, listo.
2. **Si el TV ignora la orientación** (es común en Android TV) y la cartelera se ve acostada, la gira la propia página. Agregar al final de la Start URL:
   - `?rotar=90` o `?rotar=270`, según hacia qué lado esté colgado el TV. Probar uno; si queda cabeza abajo, usar el otro.
   - Combinado con el diagnóstico: `?rotar=90&debug=1`.

---

## 5. Prueba en el TV (15–20 minutos)

Con `?debug=1` aparece un recuadro verde arriba a la izquierda con el estado. Revisar:

| Qué mirar | Esperado |
| :--- | :--- |
| `datos:` | `planilla (N ítems)` |
| `offline:` | `activo`. La primera vez puede decir `inactivo`: recargar una vez. |
| Fundidos entre páginas | Suaves, sin saltos ni parpadeos negros |
| Video de fondo | Se mueve continuo detrás de la etiqueta |
| Videos institucionales | Entran y salen con fundido; van rotando 1 → 2 → 3 → 4 |
| Fotos de productos | Todas cargan; ninguna tarjeta queda con hueco |
| Textos | Se leen bien a 3–4 metros |

**Pruebas de resistencia:**
1. **Cambio en la planilla:** cambiar un precio. Debe verse solo en 5–6 minutos como máximo, sin tocar nada.
2. **Sin Wi-Fi:** desconectar el router (o el Wi-Fi del TV) y apagar y prender el TV. La cartelera tiene que arrancar igual, con los últimos datos y los videos.
3. **Reconexión:** volver a conectar el Wi-Fi. A los pocos minutos debe decir `sync:` con una hora nueva.
4. **Modo de espera:** apagar con el control y volver a prender. Tiene que volver directo a la cartelera.

**Si algo tironea** (fundidos entrecortados o videos con saltos), sacar una foto de la pantalla con el recuadro de debug y anotar en qué momento pasa. Hay ajustes previstos, de menor a mayor impacto visual:

1. Sacar la sombra de la etiqueta blanca.
2. Hacer que el encabezado gris sea opaco en vez de semitransparente.
3. Bajar la resolución de los videos institucionales a 720×1280.
4. Alargar o simplificar los fundidos.

---

## 6. Dejarlo en producción

1. Sacar `debug=1` de la Start URL. Si se usa rotación, debe quedar solo `?rotar=90` (o `270`).
2. Activar el modo kiosco con PIN, si no se hizo antes.
3. Dejarlo corriendo **48 horas** sin tocar y revisar que siga funcionando.

---

## 7. Migración de cuentas: qué cambia y qué tocar

Hoy todo está en las cuentas de Nahuel. Si se pasa a las cuentas del dueño de la vinoteca:

### Planilla de Google Sheets
- **Opción recomendada: transferir la propiedad del mismo archivo** (*Compartir* → agregar al dueño como editor → en su nombre, *Transferir propiedad*). El archivo mantiene su ID, así que **el link publicado no cambia** y no hay que tocar nada en el código.
- **Si se crea una planilla nueva o una copia:** el link CSV cambia. Hay que publicarla de nuevo (*Archivo → Compartir → Publicar en la web → pestaña `Pantalla` → CSV*) y reemplazar `csvUrl` en [`js/config.js`](../js/config.js).
- **Link publicado actual:** `https://docs.google.com/spreadsheets/d/e/2PACX-1vT2J0w-MOCUC3KAAJKDQQQNRNN7qFuUUu5i9v_DC3IP93SSmZXALY1a9vDP6tZJv2Qo4JkE8oqo1HE2/pub?gid=1702977947&single=true&output=csv`

### Fotos en Google Drive
- **Si se transfiere la propiedad** de la carpeta o de los archivos, los links siguen funcionando.
- **Si el dueño vuelve a subir las fotos a su Drive,** cada foto tiene un link nuevo y hay que reemplazarlo en la columna `Imagen` de la planilla. No hay que tocar código.
- **En cualquier caso,** las fotos tienen que quedar compartidas como **"Cualquier persona con el enlace" → Lector**. Si no, la tarjeta sale sin foto.

### Repositorio y GitHub Pages
- **Hoy:** repo `nahuelmariani/puntoexpress-cartelera`, publicado en `https://nahuelmariani.github.io/puntoexpress-cartelera/`.
- **Si se transfiere el repo a otra cuenta de GitHub,** la URL pasa a `https://<cuenta-nueva>.github.io/puntoexpress-cartelera/`. Hay que:
  1. Revisar que GitHub Pages siga activo en el repo transferido (*Settings → Pages*, rama `main`).
  2. Cambiar la **Start URL** en Fully Kiosk.
  3. Tener en cuenta que el modo offline arranca de cero con la URL nueva: en la primera carga, el TV necesita internet.

### Videos originales
Los videos originales generados con IA están solo en la PC de desarrollo (`videos-originales/`, no se suben a GitHub). Conviene guardar una copia en Drive.

### Resumen

| Si cambia… | Tocar… |
| :--- | :--- |
| Planilla (archivo nuevo) | `csvUrl` en `js/config.js` |
| Planilla (propiedad transferida) | Nada |
| Fotos (subidas de nuevo) | Columna `Imagen` de la planilla |
| Fotos (propiedad transferida) | Nada (revisar permisos de enlace) |
| Cuenta de GitHub | Start URL de Fully Kiosk |

---

## 8. Mantenimiento

- **Productos, precios, ofertas y fotos:** desde la planilla. La pestaña *Instrucciones* explica cada columna.
- **Textos fijos** (pie de página), **tiempos** y **lista de videos:** en [`js/config.js`](../js/config.js).
- **Videos:**
  - Se preparan con `tools/preparar-videos.sh` (ver el [README](../README.md)).
  - Si se reemplaza un video **manteniendo el nombre de archivo**, subir `VERSION_MEDIA` en [`sw.js`](../sw.js). Si no, el TV sigue mostrando el viejo.
- **Si la pantalla queda en un estado raro:** abrir una vez la Start URL con `?sin-offline=1` agregado. Borra todo lo guardado y arranca limpio. Después volver a la URL normal.

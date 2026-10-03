# Cartelera Punto Express

Cartelera digital vertical (1080×1920) para la vinoteca Punto Express. Lee los productos de una planilla de Google Sheets publicada como CSV y alterna el catálogo con videos institucionales.

Diseño completo y decisiones: [docs/SDD.md](docs/SDD.md).

## Correr en la PC

```bash
python3 -m http.server 8000
```

Abrir <http://localhost:8000>. La pantalla se escala para entrar en la ventana manteniendo el formato vertical.

| Parámetro | Efecto |
| :--- | :--- |
| `?debug=1` | Muestra estado, página, video y origen de los datos |
| `?rapido=1` | Tiempos cortos para ver el ciclo completo rápido |
| `?rotar=90` | Gira el contenido (para un TV que no rota la imagen solo) |

Se pueden combinar: `?debug=1&rapido=1`.

## Configuración

Todo lo ajustable (URL de la planilla, tiempos, videos, texto del pie) está en [js/config.js](js/config.js). Sin `csvUrl` se usan datos de ejemplo.

## Videos

```bash
tools/preparar-videos.sh limpiar original.mp4 media/institucional-1.mp4   # ya es 1080x1920: solo quita el audio
tools/preparar-videos.sh fondo original.mp4 media/fondo-catalogo.mp4
```

Los originales van en `videos-originales/` (no se sube a GitHub).

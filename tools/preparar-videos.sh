#!/usr/bin/env bash
# Prepara videos de stock (Pexels, Pixabay, etc.) para la cartelera.
#
# Uso:
#   tools/preparar-videos.sh institucional <entrada.mp4> <salida.mp4> [segundos]
#       Video nítido 1080x1920, recortado al centro, sin audio. Duración opcional (default: 10 s).
#   tools/preparar-videos.sh fondo <entrada.mp4> <salida.mp4> [segundos]
#       Video desenfocado y algo oscurecido para el fondo del catálogo (default: 20 s).
#
# Ambos salen en H.264 30 fps, sin audio y con "faststart" para que arranquen rápido en el navegador.
set -euo pipefail

if [[ $# -lt 3 ]]; then
  sed -n '2,10p' "$0"
  exit 1
fi

modo=$1 entrada=$2 salida=$3

# Escala para cubrir 1080x1920 y recorta el centro (sirve para videos horizontales o verticales)
cubrir='scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30'
comunes=(-c:v libx264 -profile:v high -pix_fmt yuv420p -an -movflags +faststart)

case $modo in
  institucional)
    segundos=${4:-10}
    ffmpeg -y -i "$entrada" -t "$segundos" -vf "$cubrir" \
      "${comunes[@]}" -b:v 3M -maxrate 4M -bufsize 8M "$salida"
    ;;
  fondo)
    segundos=${4:-20}
    # El desenfoque se hace en baja resolución: es más rápido y queda más suave.
    ffmpeg -y -i "$entrada" -t "$segundos" \
      -vf "$cubrir,scale=270:480,gblur=sigma=10,eq=brightness=-0.06:saturation=1.1,scale=1080:1920" \
      "${comunes[@]}" -b:v 1M -maxrate 1.5M -bufsize 3M "$salida"
    ;;
  *)
    echo "Modo desconocido: $modo (usar 'institucional' o 'fondo')" >&2
    exit 1
    ;;
esac

ls -lh "$salida"

#!/usr/bin/env bash
# Prepara videos para la cartelera.
#
# Uso:
#   tools/preparar-videos.sh limpiar <entrada.mp4> <salida.mp4>
#       Para videos que ya son 1080x1920 H.264: quita el audio y deja el video listo para web,
#       SIN recomprimir (no pierde calidad).
#   tools/preparar-videos.sh institucional <entrada.mp4> <salida.mp4> [segundos]
#       Para videos de otro tamaño u orientación: los lleva a 1080x1920 recortando al centro.
#   tools/preparar-videos.sh fondo <entrada.mp4> <salida.mp4> [segundos]
#       Fondo del catálogo: desenfocado, 360x640 (al estar desenfocado no hace falta más)
#       y en "ida y vuelta" para que el loop no tenga saltos. Duración final: el doble.
#
# Se mantienen los fps originales (convertir 24 → 30 fps hace que el movimiento se vea a saltitos).
set -euo pipefail

if [[ $# -lt 3 ]]; then
  sed -n '2,15p' "$0"
  exit 1
fi

modo=$1 entrada=$2 salida=$3

# Escala para cubrir el tamaño pedido y recorta el centro (sirve para videos horizontales o verticales)
cubrir() { echo "scale=$1:$2:force_original_aspect_ratio=increase,crop=$1:$2"; }
comunes=(-c:v libx264 -profile:v high -pix_fmt yuv420p -an -movflags +faststart)

case $modo in
  limpiar)
    ffmpeg -y -i "$entrada" -map 0:v:0 -c:v copy -an -movflags +faststart "$salida"
    ;;
  institucional)
    segundos=${4:-10}
    ffmpeg -y -i "$entrada" -t "$segundos" -vf "$(cubrir 1080 1920)" \
      "${comunes[@]}" -crf 20 -maxrate 6M -bufsize 12M "$salida"
    ;;
  fondo)
    segundos=${4:-10}
    ffmpeg -y -i "$entrada" -t "$segundos" -filter_complex \
      "[0:v]$(cubrir 360 640),gblur=sigma=9,eq=brightness=-0.04,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]" \
      -map "[v]" "${comunes[@]}" -b:v 700k -maxrate 1M -bufsize 2M "$salida"
    ;;
  *)
    echo "Modo desconocido: $modo (usar 'limpiar', 'institucional' o 'fondo')" >&2
    exit 1
    ;;
esac

ls -lh "$salida"

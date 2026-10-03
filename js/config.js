// ==========================================================
// Configuración de la cartelera. Todo lo ajustable está acá.
// ==========================================================
export const CONFIG = {
  // URL del CSV publicado (Archivo → Compartir → Publicar en la web → pestaña "Pantalla" → CSV).
  // Vacía = usa los datos de ejemplo de sample.js.
  csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT2J0w-MOCUC3KAAJKDQQQNRNN7qFuUUu5i9v_DC3IP93SSmZXALY1a9vDP6tZJv2Qo4JkE8oqo1HE2/pub?gid=1702977947&single=true&output=csv',

  itemsPorPagina: 3,
  segundosPorPagina: 10,
  // Cada cuánto se consulta la planilla. Los cambios se aplican al empezar la siguiente vuelta del catálogo.
  minutosEntreSincronizaciones: 5,

  videoFondo: 'media/fondo-catalogo.mp4',
  // Se reproduce uno por cada vuelta del catálogo, en este orden.
  videosInstitucionales: [
    'media/institucional-1.mp4',
    'media/institucional-2.mp4',
    'media/institucional-3.mp4',
    'media/institucional-4.mp4',
  ],
  // Los videos actuales ya traen la marca integrada, por eso el logo superpuesto está apagado.
  logoEnInstitucional: false,
  // Corte de seguridad por si un video nunca avisa que terminó.
  segundosMaxInstitucional: 30,

  textoPie: 'Precios sujetos a disponibilidad de stock',

  // Ancho en px con el que se piden las imágenes de Google Drive.
  anchoImagen: 800,
  claveCache: 'puntoexpress:csv',
};

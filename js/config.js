// ==========================================================
// Configuración de la cartelera. Todo lo ajustable está acá.
// ==========================================================
export const CONFIG = {
  // URL del CSV publicado (Archivo → Compartir → Publicar en la web → pestaña "Pantalla" → CSV).
  // Vacía = usa los datos de ejemplo de sample.js.
  csvUrl: '',

  itemsPorPagina: 3,
  segundosPorPagina: 10,
  minutosEntreSincronizaciones: 5,

  videoFondo: 'media/fondo-catalogo.mp4',
  // Se reproduce uno por cada vuelta del catálogo, en este orden.
  videosInstitucionales: [
    'media/institucional-1.mp4',
    'media/institucional-2.mp4',
    'media/institucional-3.mp4',
  ],
  logoEnInstitucional: true,
  // Corte de seguridad por si un video nunca avisa que terminó.
  segundosMaxInstitucional: 30,

  textoPie: 'Precios sujetos a disponibilidad de stock',

  // Ancho en px con el que se piden las imágenes de Google Drive.
  anchoImagen: 800,
  claveCache: 'puntoexpress:csv',
};

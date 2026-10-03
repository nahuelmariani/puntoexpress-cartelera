// ==========================================================
// Armado de páginas y tarjetas. Todo el texto de la planilla
// se inserta con textContent, nunca como HTML.
// ==========================================================
const DECODE_TIMEOUT_MS = 4000;

const priceFormat = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatPrice = (n) => priceFormat.format(n);

function el(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildItem(item) {
  const isOffer = item.offerPrice !== null;
  const node = el('article', 'item');
  node.classList.toggle('oferta', isOffer);
  node.classList.toggle('sin-imagen', !item.image);

  if (item.image) {
    const box = el('div', 'item-img');
    const img = new Image();
    img.alt = '';
    img.decoding = 'async';
    img.src = item.image;
    box.append(img);
    node.append(box);
  }

  const body = el('div', 'item-body');
  if (isOffer) body.append(el('span', 'badge', 'Oferta'));
  body.append(el('h2', 'item-name', item.name));
  if (item.detail) body.append(el('p', 'item-detail', item.detail));

  const prices = el('div', 'item-prices');
  if (isOffer && item.price !== null) prices.append(el('span', 'price-old', formatPrice(item.price)));
  const shown = isOffer ? item.offerPrice : item.price;
  if (shown !== null) prices.append(el('span', 'price', formatPrice(shown)));
  if (prices.childElementCount) body.append(prices);

  node.append(body);
  return node;
}

// Si la imagen no carga, la tarjeta pasa a modo solo texto.
function dropImage(img) {
  const item = img.closest('.item');
  img.parentElement.remove();
  item.classList.add('sin-imagen');
}

const settleWithin = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]);

// Llena un contenedor de página y espera a que sus imágenes estén decodificadas.
export async function fillPage(slot, items) {
  slot.replaceChildren(...items.map(buildItem));
  const imgs = [...slot.querySelectorAll('img')];
  await Promise.all(imgs.map((img) =>
    settleWithin(img.decode().catch(() => dropImage(img)), DECODE_TIMEOUT_MS)));
}

export function paginate(items, perPage) {
  const pages = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));
  return pages;
}

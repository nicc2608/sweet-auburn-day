// Paste the registration link here and every RSVP button on the page will use it.
const RSVP_URL = 'https://www.eventbrite.com/e/sweet-auburn-day-tickets-2005031068901?aff=oddtdtcreator';

const motion = document.documentElement.classList.contains('motion');

/* RSVP buttons */
const toast = document.querySelector('.toast');
let toastTimer;
document.querySelectorAll('[data-rsvp]').forEach((link) => {
  if (RSVP_URL) {
    link.href = RSVP_URL;
    link.target = '_blank';
    link.rel = 'noopener';
    return;
  }
  link.addEventListener('click', (event) => {
    event.preventDefault();
    toast.textContent = 'RSVP link coming soon.';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  });
});

/* Mobile menu */
const toggle = document.querySelector('.menu-toggle');
const links = document.querySelector('.nav-links');
const setMenu = (open) => {
  links.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
links.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && links.classList.contains('open')) {
    setMenu(false);
    toggle.focus();
  }
});

/* Menu turns solid once the page leaves the top */
const nav = document.querySelector('.nav');
const setNav = () => nav.classList.toggle('solid', window.scrollY > 8);
setNav();
window.addEventListener('scroll', setNav, { passive: true });

/* Info tooltips: hover and focus open them via CSS; a tap toggles them, and a tap elsewhere or Esc closes. */
document.querySelectorAll('.tip').forEach((tip) => {
  const btn = tip.querySelector('.tip-btn');
  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = !tip.classList.contains('open');
    document.querySelectorAll('.tip.open').forEach((t) => { t.classList.remove('open'); t.querySelector('.tip-btn').setAttribute('aria-expanded', 'false'); });
    tip.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  });
});
document.addEventListener('click', (event) => {
  if (event.target.closest('.tip')) return;
  document.querySelectorAll('.tip.open').forEach((t) => { t.classList.remove('open'); t.querySelector('.tip-btn').setAttribute('aria-expanded', 'false'); });
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') document.querySelectorAll('.tip.open').forEach((t) => { t.classList.remove('open'); t.querySelector('.tip-btn').setAttribute('aria-expanded', 'false'); });
});

/* Scroll reveals */
if (motion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  /* Mural parallax, desktop layout only */
  const photo = document.querySelector('[data-parallax]');
  const hero = document.querySelector('.hero');
  const desktop = matchMedia('(min-width: 1181px)');
  let ticking = false;
  const update = () => {
    ticking = false;
    const offset = desktop.matches ? Math.min(window.scrollY, hero.offsetHeight) * 0.04 : 0;
    photo.style.setProperty('--parallax', `${offset.toFixed(1)}px`);
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  desktop.addEventListener('change', update);

  /* Mural follows the pointer a little, on devices with a mouse or trackpad */
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const movePhoto = (x = 0, y = 0) => {
    photo.style.setProperty('--mx', `${x.toFixed(1)}px`);
    photo.style.setProperty('--my', `${y.toFixed(1)}px`);
  };
  hero.addEventListener('pointermove', (event) => {
    if (!desktop.matches || !finePointer.matches) return;
    const box = hero.getBoundingClientRect();
    movePhoto(((event.clientX - box.left) / box.width - 0.5) * 24, ((event.clientY - box.top) / box.height - 0.5) * 16);
  });
  hero.addEventListener('pointerleave', () => movePhoto());
}

/* Event map: MapLibre with free OpenFreeMap tiles, loaded only when the section gets close.
   Locations are approximate until HDDC confirms them. Offsets (in pixels) keep the close pins apart. */
const MAP_PLACES = [
  // Coffee Was Black / AKAZI shares 364 Auburn Ave NE with Haugabrooks (Suite 2); pins are offset so both show.
  // Edgewood Ave stops are placed from their street numbers; the links open the exact address.
  { n: 1, name: 'Coffee Was Black / AKAZI ATL Gallery (passport pick up + drop off)', query: 'Coffee Was Black, 364 Auburn Ave NE Suite 2, Atlanta, GA 30312', url: 'https://maps.app.goo.gl/wnTWb2xQXyA9SAuaA', lng: -84.37572, lat: 33.75567, offset: [24, -22] },
  { n: 2, name: 'Municipal Market', query: 'Sweet Auburn Municipal Market, 209 Edgewood Ave SE, Atlanta, GA', lng: -84.37970, lat: 33.75432, offset: [0, 0] },
  { n: 3, name: 'Little Loaf Deli', query: 'Little Loaf Deli, 381 Edgewood Ave SE, Atlanta, GA', lng: -84.37390, lat: 33.75438, offset: [0, 0] },
  { n: 4, name: 'Historic Fire Station No. 6', query: '450 Auburn Avenue NE, Atlanta, GA 30312', lng: -84.37310, lat: 33.75562, offset: [0, 0] },
  { n: 5, name: 'Sweet Me Good', query: 'Sweet Me Good, 321 Edgewood Ave SE, Atlanta, GA', lng: -84.37555, lat: 33.75436, offset: [0, 0] },
  { n: 6, name: 'Madam C.J. Walker Museum', query: 'Madam C.J. Walker Museum, 54 Hilliard St NE, Atlanta, GA', lng: -84.37672, lat: 33.75578, offset: [-16, -14] },
  { n: 7, name: 'Haugabrooks Gallery + Events', query: 'Haugabrooks Gallery, 364 Auburn Ave NE, Atlanta, GA', lng: -84.37572, lat: 33.75567, offset: [20, 6] },
  { n: 8, name: 'Front Porch on Auburn', query: 'Front Porch on Auburn, 348 Auburn Ave NE, Atlanta, GA', lng: -84.37617, lat: 33.75559, offset: [-6, 18] },
];
const MAPLIBRE = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl';

const brandMap = (map) => {
  const css = getComputedStyle(document.documentElement);
  const color = (name) => css.getPropertyValue(name).trim();
  const paint = (id, prop, value) => { if (map.getLayer(id)) map.setPaintProperty(id, prop, value); };
  const layers = map.getStyle().layers;

  paint('background', 'background-color', color('--white'));
  paint('park', 'fill-color', color('--gold'));
  paint('park', 'fill-opacity', 0.35);
  paint('water', 'fill-color', color('--gold'));
  paint('water', 'fill-opacity', 0.5);
  paint('landuse_residential', 'fill-color', color('--white'));
  paint('building', 'fill-color', color('--gold'));
  paint('building', 'fill-opacity', 0.25);
  layers.forEach(({ id, type }) => {
    if (type === 'line' && /^highway_(minor|major)/.test(id)) {
      paint(id, 'line-color', color('--ink'));
      paint(id, 'line-opacity', 0.14);
    }
    if (type === 'line' && /motorway.*inner|motorway_subtle/.test(id)) paint(id, 'line-color', color('--white'));
    if (type === 'line' && /motorway.*casing/.test(id)) paint(id, 'line-color', color('--gold'));
    if (type === 'symbol') paint(id, 'text-color', color('--ink'));
  });

  const firstLabel = layers.find(({ type }) => type === 'symbol');
  map.addLayer({
    id: 'auburn-avenue',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation_name',
    filter: ['==', ['index-of', 'Auburn Avenue', ['get', 'name']], 0],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': color('--brown'), 'line-width': 5 },
  }, firstLabel && firstLabel.id);
};

const startMap = (container) => {
  const lngs = MAP_PLACES.map((place) => place.lng);
  const lats = MAP_PLACES.map((place) => place.lat);
  const map = new maplibregl.Map({
    container,
    style: 'https://tiles.openfreemap.org/styles/positron',
    bounds: [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
    fitBoundsOptions: { padding: { top: 60, right: 60, bottom: 100, left: 60 } },
    minZoom: 12,
    maxZoom: 18,
    cooperativeGestures: true,
    dragRotate: false,
    pitchWithRotate: false,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
  map.once('style.load', () => brandMap(map));

  MAP_PLACES.forEach(({ n, name, query, url, lng, lat, offset }) => {
    const pin = document.createElement('a');
    pin.className = 'map-pin';
    pin.href = url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    pin.target = '_blank';
    pin.rel = 'noopener';
    pin.setAttribute('aria-label', `${n}. ${name}, open in Google Maps`);
    pin.innerHTML = `<span aria-hidden="true">${n}</span>`;
    new maplibregl.Marker({ element: pin, offset }).setLngLat([lng, lat]).addTo(map);
  });
};

const mapContainer = document.getElementById('map');
const hideMap = () => { mapContainer.closest('.map-card').hidden = true; };
const loadMap = () => {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = `${MAPLIBRE}.css`;
  document.head.append(style);
  const script = document.createElement('script');
  script.src = `${MAPLIBRE}.js`;
  script.onload = () => {
    try {
      startMap(mapContainer);
    } catch {
      hideMap();
    }
  };
  script.onerror = hideMap;
  document.head.append(script);
};
new IntersectionObserver((entries, observer) => {
  if (!entries.some((entry) => entry.isIntersecting)) return;
  observer.disconnect();
  loadMap();
}, { rootMargin: '600px 0px' }).observe(mapContainer);

/* Sticky RSVP on phones: shows after the hero, hides once the final RSVP is reached */
const sticky = document.querySelector('.sticky-rsvp');
const heroSection = document.querySelector('.hero');
const finalRsvp = document.getElementById('final-rsvp');
let pastHero = false;
let atFinal = false;
const stickyObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.target === heroSection) pastHero = !entry.isIntersecting;
    // Stays hidden from the final RSVP to the end of the page (sponsors and footer), not only while it's on screen.
    if (entry.target === finalRsvp) atFinal = entry.isIntersecting || entry.boundingClientRect.top < 0;
  });
  const show = pastHero && !atFinal;
  sticky.classList.toggle('show', show);
  sticky.setAttribute('aria-hidden', String(!show));
  sticky.tabIndex = show ? 0 : -1;
});
stickyObserver.observe(heroSection);
stickyObserver.observe(finalRsvp);

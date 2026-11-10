// Paste the registration link here and every RSVP button on the page will use it.
const RSVP_URL = '';

const motion = document.documentElement.classList.contains('motion');

/* RSVP buttons */
const toast = document.querySelector('.toast');
let toastTimer;
document.querySelectorAll('[data-rsvp]').forEach((link) => {
  if (RSVP_URL) {
    link.href = RSVP_URL;
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
  { n: 1, name: 'Oakland Cemetery Visitors Center', query: 'Oakland Cemetery Visitors Center, Atlanta, GA', lng: -84.3742, lat: 33.7487, offset: [0, 0] },
  { n: 2, name: 'Haugabrooks Gallery', query: 'Haugabrooks Gallery, 364 Auburn Ave NE, Atlanta, GA', lng: -84.37572, lat: 33.75567, offset: [20, 6] },
  { n: 3, name: 'Front Porch on Auburn', query: 'Front Porch on Auburn, 348 Auburn Ave NE, Atlanta, GA', lng: -84.37617, lat: 33.75559, offset: [-6, 18] },
  { n: 4, name: 'Madam C.J. Walker Museum', query: 'Madam C.J. Walker Museum, 54 Hilliard St NE, Atlanta, GA', lng: -84.37672, lat: 33.75578, offset: [-16, -14] },
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

  MAP_PLACES.forEach(({ n, name, query, lng, lat, offset }) => {
    const pin = document.createElement('a');
    pin.className = 'map-pin';
    pin.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
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

/* Sticky RSVP on phones: shows after the hero, hides once the final RSVP is on screen */
const sticky = document.querySelector('.sticky-rsvp');
const heroSection = document.querySelector('.hero');
const finalRsvp = document.getElementById('final-rsvp');
let pastHero = false;
let atFinal = false;
const stickyObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.target === heroSection) pastHero = !entry.isIntersecting;
    if (entry.target === finalRsvp) atFinal = entry.isIntersecting;
  });
  const show = pastHero && !atFinal;
  sticky.classList.toggle('show', show);
  sticky.setAttribute('aria-hidden', String(!show));
  sticky.tabIndex = show ? 0 : -1;
});
stickyObserver.observe(heroSection);
stickyObserver.observe(finalRsvp);

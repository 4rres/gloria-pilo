import "@fontsource-variable/bodoni-moda/opsz.css";
import "@fontsource-variable/bodoni-moda/opsz-italic.css";
import "@fontsource-variable/space-grotesk/wght.css";
import "./styles.css";
import { WHATSAPP_NUMBER, WHATSAPP_TEXT } from "./config.js";

// I reveal partono solo se il JS gira: senza, il contenuto resta visibile.
document.documentElement.classList.add("js");

const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_TEXT)}`;

for (const el of document.querySelectorAll("[data-wa]")) {
  el.setAttribute("href", waHref);
  el.setAttribute("target", "_blank");
  el.setAttribute("rel", "noopener noreferrer");
}

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduce) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );

  for (const el of document.querySelectorAll("[data-reveal]")) {
    io.observe(el);
  }
} else {
  for (const el of document.querySelectorAll("[data-reveal]")) {
    el.classList.add("is-in");
  }
}

/* ============================================================
   Pannello accessibilita
   ============================================================ */

const KEY = "gp-a11y";
const TOGGLES = ["big", "spaced", "calm", "still"];

const panel = document.getElementById("a11y-panel");
const scrim = document.getElementById("a11y-scrim");
const openBtn = document.getElementById("a11y-btn");

// I font alternativi pesano ~200KB: li scarico solo se qualcuno li sceglie.
const FONT_LOADERS = {
  hyper: () => Promise.all([
    import("@fontsource/atkinson-hyperlegible/400.css"),
    import("@fontsource/atkinson-hyperlegible/700.css"),
  ]),
  dyslexic: () => Promise.all([
    import("@fontsource/opendyslexic/400.css"),
    import("@fontsource/opendyslexic/700.css"),
  ]),
};

const loaded = new Set();

function loadFont(name) {
  if (name === "default" || loaded.has(name) || !FONT_LOADERS[name]) return;
  loaded.add(name);
  FONT_LOADERS[name]().catch(() => loaded.delete(name));
}

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function write(prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Modalita privata o storage pieno: le preferenze valgono per questa visita.
  }
}

function apply(prefs) {
  const root = document.documentElement;
  const font = prefs.font || "default";

  loadFont(font);
  root.setAttribute("data-font", font);

  for (const name of TOGGLES) {
    if (prefs[name]) {
      root.setAttribute(`data-${name}`, "on");
    } else {
      root.removeAttribute(`data-${name}`);
    }
  }
}

function sync(prefs) {
  const font = prefs.font || "default";
  const radio = panel.querySelector(`input[name="a11y-font"][value="${font}"]`);
  if (radio) radio.checked = true;

  for (const box of panel.querySelectorAll("[data-a11y-toggle]")) {
    box.checked = Boolean(prefs[box.dataset.a11yToggle]);
  }
}

let prefs = read();
apply(prefs);
sync(prefs);

function save() {
  write(prefs);
  apply(prefs);
}

for (const radio of panel.querySelectorAll('input[name="a11y-font"]')) {
  radio.addEventListener("change", () => {
    if (!radio.checked) return;
    prefs.font = radio.value;
    save();
  });

  // Il font parte a scaricare al primo hover: quando clicca e' gia' pronto.
  radio.closest(".a11y-radio").addEventListener("pointerenter", () => loadFont(radio.value), { once: true });
}

for (const box of panel.querySelectorAll("[data-a11y-toggle]")) {
  box.addEventListener("change", () => {
    prefs[box.dataset.a11yToggle] = box.checked;
    save();
  });
}

document.getElementById("a11y-reset").addEventListener("click", () => {
  prefs = {};
  save();
  sync(prefs);
});

/* --- Apertura, chiusura, focus --- */

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
let lastFocus = null;

function isOpen() {
  return !panel.hidden;
}

function open() {
  lastFocus = document.activeElement;
  panel.hidden = false;
  scrim.hidden = false;
  openBtn.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
  panel.querySelector(FOCUSABLE)?.focus();
}

function close() {
  panel.hidden = true;
  scrim.hidden = true;
  openBtn.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
  (lastFocus instanceof HTMLElement ? lastFocus : openBtn).focus();
}

openBtn.addEventListener("click", () => (isOpen() ? close() : open()));
document.getElementById("a11y-close").addEventListener("click", close);
scrim.addEventListener("click", close);

document.addEventListener("keydown", (e) => {
  if (!isOpen()) return;

  if (e.key === "Escape") {
    close();
    return;
  }

  // Il focus resta dentro al pannello finche' e' aperto.
  if (e.key !== "Tab") return;

  const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
  if (!items.length) return;

  const first = items[0];
  const last = items[items.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

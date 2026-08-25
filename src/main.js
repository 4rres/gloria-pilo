import "@fontsource-variable/bodoni-moda/opsz.css";
import "@fontsource-variable/bodoni-moda/opsz-italic.css";
import "@fontsource-variable/space-grotesk/wght.css";
import "./styles.css";
import { WHATSAPP_NUMBER, WHATSAPP_TEXT } from "./config.js";

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

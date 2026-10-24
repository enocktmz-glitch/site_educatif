/* ============================================
   script.js — RévisionBAC (toutes pages)
   ============================================ */

// ─── NAVBAR SCROLL ─────────────────────────
const navbar = document.getElementById("navbar");

if (navbar) {
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
  });
}

// ─── BURGER MENU ───────────────────────────
const burger   = document.getElementById("burger");
const navLinks = document.getElementById("nav-links");

if (burger && navLinks) {
  burger.addEventListener("click", () => {
    burger.classList.toggle("open");
    navLinks.classList.toggle("open");
  });

  navLinks.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      burger.classList.remove("open");
      navLinks.classList.remove("open");
    });
  });
}

// ─── REVEAL AU SCROLL ──────────────────────
// Cible TOUS les éléments .reveal (hero, fiches, compteur…)
const revealEls = document.querySelectorAll(".reveal");

if (revealEls.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealEls.forEach(el => revealObserver.observe(el));
}

// ─── TILT EFFECT (fiches) ──────────────────
// Cible les .fiche-item directement (plus les ul li qui n'existent pas)
document.querySelectorAll(".fiche-item").forEach(card => {
  card.addEventListener("mousemove", e => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width  / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);

    card.style.transform =
      `perspective(800px) rotateX(${-dy * 3}deg) rotateY(${dx * 3}deg) translateX(6px)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

// ─── PROGRESS BARS (page planning) ─────────
// Déclenche l'animation des barres quand elles entrent dans le viewport
const fills = document.querySelectorAll(".prog-fill");

if (fills.length) {
  const barObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el  = entry.target;
          const pct = el.dataset.pct || "0";
          el.style.width = pct + "%";
          barObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.4 }
  );

  fills.forEach(f => barObserver.observe(f));
}

// ─── LOADER (page d'accueil uniquement) ────
const loader = document.querySelector(".loader");

if (loader) {
  window.addEventListener("load", () => {
    setTimeout(() => loader.classList.add("hidden"), 600);
  });
}

/* ============================================
   script.js — RévisionBAC (toutes pages)
   ============================================ */

// ─── LOADER (accueil seulement) ────────────
const loader = document.getElementById("loader");
if (loader) {
  window.addEventListener("load", () => {
    setTimeout(() => loader.classList.add("hidden"), 800);
  });
}

// ─── NAVBAR SCROLL ─────────────────────────
const navbar = document.getElementById("navbar");
if (navbar) {
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
    updateActiveLink();
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

// ─── ACTIVE NAV LINK (accueil seulement) ───
function updateActiveLink() {
  const sections = document.querySelectorAll("section[id]");
  if (!sections.length) return;
  const navItems = document.querySelectorAll(".nav-link");
  let currentId  = "";
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) currentId = sec.id;
  });
  navItems.forEach(link => {
    link.classList.toggle(
      "active",
      link.getAttribute("href") === `#${currentId}`
    );
  });
}

// ─── SCROLL REVEAL (toutes les pages) ──────
const revealEls = document.querySelectorAll(".reveal");

if (revealEls.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Stagger selon position dans le parent
          const siblings = [
            ...entry.target.parentElement.querySelectorAll(".reveal")
          ];
          const index = siblings.indexOf(entry.target);
          entry.target.style.transitionDelay = `${index * 0.1}s`;
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach(el => revealObserver.observe(el));
}

// ─── COUNT-UP (accueil seulement) ──────────
const counters = document.querySelectorAll(".count");
if (counters.length) {
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = +el.dataset.target;
        const step   = Math.max(1, Math.ceil(target / 60));
        let current  = 0;
        const tick = () => {
          current = Math.min(current + step, target);
          el.textContent = current + (target >= 100 ? "+" : "");
          if (current < target) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        countObserver.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach(c => countObserver.observe(c));
}

// ─── PARTICULES CANVAS (accueil seulement) ─
const canvas = document.getElementById("particles-canvas");
if (canvas) {
  (function initParticles() {
    const ctx = canvas.getContext("2d");
    let W, H, particles = [];

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x     = Math.random() * W;
        this.y     = Math.random() * H;
        this.r     = Math.random() * 2 + 0.5;
        this.vx    = (Math.random() - 0.5) * 0.3;
        this.vy    = (Math.random() - 0.5) * 0.3;
        this.alpha = Math.random() * 0.5 + 0.1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(82, 183, 136, ${this.alpha})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < 80; i++) particles.push(new Particle());

    function connectNearby() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(82,183,136,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth   = 0.6;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => { p.update(); p.draw(); });
      connectNearby();
      requestAnimationFrame(animate);
    }
    animate();
  })();
}

// ─── TILT FEATURE CARDS (accueil) ──────────
document.querySelectorAll(".feature-card").forEach(card => {
  card.addEventListener("mousemove", e => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width  / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    card.style.transform =
      `perspective(600px) rotateX(${-dy * 5}deg) rotateY(${dx * 5}deg) translateY(-8px)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

// ─── TILT FICHE ITEMS (pages fiches) ───────
document.querySelectorAll(".fiche-item").forEach(card => {
  card.addEventListener("mousemove", e => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width  / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    card.style.transform =
      `perspective(800px) rotateX(${-dy * 2}deg) rotateY(${dx * 2}deg) translateX(6px)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

// ─── PROGRESS BARS (planning) ──────────────
const fills = document.querySelectorAll(".prog-fill");
if (fills.length) {
  const barObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el  = entry.target;
          el.style.width = (el.dataset.pct || "0") + "%";
          barObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.4 }
  );
  fills.forEach(f => barObserver.observe(f));
}

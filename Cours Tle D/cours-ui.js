/* ============================================
   cours-ui.js : petits outils communs aux pages de cours
   (aucun innerHTML : tout passe par textContent)
   ============================================ */
(function () {
  "use strict";

  const SLUG_RE = /^[a-z0-9-]+$/;
  const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
  const YT_RE = /^[A-Za-z0-9_-]{11}$/;
  const DUR_RE = /^\d{1,2}(:\d{2}){1,2}$/;
  const SVG_NS = "http://www.w3.org/2000/svg";

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  // « de SVT » mais « d'Anglais » (élision devant une voyelle)
  function de(nom) {
    return /^[AEIOUYHÀÂÉÈÊÎÔÛ]/i.test(nom || "") ? "d'" + nom : "de " + nom;
  }

  function colorOrDefault(c) {
    return COLOR_RE.test(c || "") ? c : "#52b788";
  }

  // Carte cliquable d'une vidéo YouTube (ouverte dans un nouvel onglet)
  function buildVideoCard(v) {
    if (!YT_RE.test(v.youtube_id || "")) return null; // identifiant inattendu : on n'affiche rien

    const card = el("a", "video-card reveal");
    card.href = "https://www.youtube.com/watch?v=" + v.youtube_id;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    const thumb = el("div", "video-thumb");
    const img = document.createElement("img");
    img.src = "https://img.youtube.com/vi/" + v.youtube_id + "/hqdefault.jpg";
    img.alt = v.titre || "";
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    thumb.appendChild(img);

    const play = el("div", "play-btn");
    const icon = el("div", "play-icon");
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", "M8 5v14l11-7z");
    svg.appendChild(path);
    icon.appendChild(svg);
    play.appendChild(icon);
    thumb.appendChild(play);

    if (v.duree && DUR_RE.test(v.duree)) thumb.appendChild(el("span", "video-duration", v.duree));
    card.appendChild(thumb);

    const info = el("div", "video-info");
    info.appendChild(el("p", "video-title", v.titre));
    info.appendChild(el("p", "video-meta", v.chaine || "YouTube"));
    card.appendChild(info);
    return card;
  }

  // script.js n'observe que ce qui existe au chargement : on lance l'apparition nous-mêmes
  function animateIn(root) {
    const nodes = Array.from(root.querySelectorAll(".reveal"));
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        nodes.forEach((n, i) => {
          n.style.transitionDelay = Math.min(i, 12) * 0.05 + "s";
          n.classList.add("visible");
        })
      )
    );
  }

  function showStatus(zone, text, onRetry) {
    zone.replaceChildren();
    zone.appendChild(el("p", "cours-status", text));
    if (onRetry) {
      const btn = el("button", "cours-retry", "Réessayer");
      btn.type = "button";
      btn.addEventListener("click", onRetry);
      zone.appendChild(btn);
    }
  }

  window.CoursUI = { SLUG_RE, COLOR_RE, el, de, colorOrDefault, buildVideoCard, animateIn, showStatus };
})();

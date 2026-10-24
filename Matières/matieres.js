/* ============================================
   matieres.js : affiche les matières depuis Supabase
   (aucun innerHTML : tout passe par textContent)
   ============================================ */
(function () {
  "use strict";

  const sb = window.sb;
  const list = document.getElementById("matieres-list");
  if (!list) return;

  // Formats stricts : on ne fait confiance ni au slug ni à la couleur reçus
  const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
  const SLUG_RE = /^[a-z0-9-]+$/;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function showStatus(text, withRetry) {
    list.replaceChildren();
    list.appendChild(el("p", "matieres-status", text));
    if (withRetry) {
      const btn = el("button", "matieres-retry", "Réessayer");
      btn.type = "button";
      btn.addEventListener("click", load);
      list.appendChild(btn);
    }
  }

  function buildRow(m, index) {
    const row = el("div", "matiere-row reveal");

    row.appendChild(el("div", "matiere-num", String(index + 1).padStart(2, "0")));

    const icon = el("div", "matiere-icon", m.emoji || "📘");
    icon.style.setProperty("--card-color", COLOR_RE.test(m.couleur || "") ? m.couleur : "#52b788");
    row.appendChild(icon);

    const info = el("div", "matiere-info");
    info.appendChild(el("h3", null, m.nom));
    if (m.description) info.appendChild(el("p", null, m.description));
    row.appendChild(info);

    const tags = el("div", "matiere-tags");
    if (m.categorie) tags.appendChild(el("span", "tag", m.categorie));
    row.appendChild(tags);

    if (SLUG_RE.test(m.slug || "")) {
      const link = el("a", "matiere-btn", "Ouvrir →");
      link.href = "matiere.html?m=" + m.slug;
      row.appendChild(link);
    }
    return row;
  }

  async function load() {
    showStatus("Chargement des matières…", false);
    try {
      const { data, error } = await sb
        .from("matieres")
        .select("nom, slug, emoji, description, categorie, couleur")
        .order("ordre", { ascending: true });
      if (error) throw error;

      if (!data || data.length === 0) {
        showStatus("Aucune matière disponible pour le moment.", false);
        return;
      }

      list.replaceChildren();
      const rows = data.map(buildRow);
      rows.forEach((r) => list.appendChild(r));

      // script.js n'observe que les éléments présents au chargement :
      // on déclenche donc l'animation d'apparition nous-mêmes
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          rows.forEach((r, i) => {
            r.style.transitionDelay = i * 0.06 + "s";
            r.classList.add("visible");
          })
        )
      );
    } catch (err) {
      console.error(err);
      showStatus("Impossible de charger les matières. Vérifie ta connexion puis réessaie.", true);
    }
  }

  if (!sb) {
    showStatus("Configuration manquante : vérifie supabase-config.js.", false);
  } else {
    load();
  }
})();

/* ============================================
   fiches-index.js : liste des matières (Fiches/index.html)
   + recherche instantanée. Aucun innerHTML.
   ============================================ */
(function () {
  "use strict";

  const sb = window.sb;
  const grid = document.getElementById("fiches-grid");
  const input = document.getElementById("search-input");
  const noRes = document.getElementById("no-results");
  if (!grid) return;

  const SLUG_RE = /^[a-z0-9-]+$/;
  const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

  // Recherche sans tenir compte des accents ni des majuscules
  const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function showStatus(text, withRetry) {
    grid.replaceChildren();
    grid.appendChild(el("p", "fiches-status", text));
    if (withRetry) {
      const btn = el("button", "fiches-retry", "Réessayer");
      btn.type = "button";
      btn.addEventListener("click", load);
      grid.appendChild(btn);
    }
  }

  function buildCard(m, nbFiches) {
    const card = el("a", "subject-card reveal");
    card.href = "matiere.html?m=" + m.slug;
    card.dataset.name = norm([m.nom, m.slug, m.categorie].join(" "));

    const icon = el("div", "card-icon-wrap", m.emoji || "📘");
    icon.style.setProperty("--card-color", COLOR_RE.test(m.couleur || "") ? m.couleur : "#52b788");
    card.appendChild(icon);

    const body = el("div", "card-body");
    body.appendChild(el("h3", null, m.nom));
    if (m.description) body.appendChild(el("p", null, m.description));
    if (nbFiches !== null) {
      body.appendChild(
        el("span", "card-meta",
          nbFiches > 0 ? nbFiches + (nbFiches > 1 ? " fiches" : " fiche") : "Bientôt disponible")
      );
    }
    card.appendChild(body);

    card.appendChild(el("span", "card-arrow", "→"));
    return card;
  }

  async function load() {
    showStatus("Chargement des matières…", false);
    try {
      const { data, error } = await sb
        .from("matieres")
        .select("id, nom, slug, emoji, description, categorie, couleur")
        .order("ordre", { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) {
        showStatus("Aucune matière disponible pour le moment.", false);
        return;
      }

      // Nombre de fiches par matière. Si cette requête échoue, on affiche quand même
      // les matières, simplement sans le compteur (counts reste à null).
      let counts = null;
      const { data: lignes, error: errCount } = await sb
        .from("fiches")
        .select("matiere_id")
        .eq("publie", true);
      if (!errCount && Array.isArray(lignes)) {
        counts = {};
        lignes.forEach((l) => { counts[l.matiere_id] = (counts[l.matiere_id] || 0) + 1; });
      }

      grid.replaceChildren();
      const cards = data
        .filter((m) => SLUG_RE.test(m.slug || ""))
        .map((m) => buildCard(m, counts ? counts[m.id] || 0 : null));
      cards.forEach((c) => grid.appendChild(c));

      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          cards.forEach((c, i) => {
            c.style.transitionDelay = i * 0.05 + "s";
            c.classList.add("visible");
          })
        )
      );
      applyFilter();
    } catch (err) {
      console.error(err);
      showStatus("Impossible de charger les matières. Vérifie ta connexion puis réessaie.", true);
    }
  }

  function applyFilter() {
    const q = norm(input.value.trim());
    const cards = grid.querySelectorAll(".subject-card");
    let found = 0;
    cards.forEach((card) => {
      const match = q === "" || (card.dataset.name || "").includes(q);
      card.classList.toggle("hidden", !match);
      if (match) found++;
    });
    noRes.classList.toggle("hidden", cards.length === 0 || found > 0);
  }

  input.addEventListener("input", applyFilter);

  if (!sb) {
    showStatus("Configuration manquante : vérifie supabase-config.js.", false);
  } else {
    load();
  }
})();

/* ============================================
   hub.js : page d'une matière (Matières/matiere.html?m=maths)
   Propose les différentes ressources : cours vidéo, fiches,
   exercices, documents. Aucun innerHTML.
   ============================================ */
(function () {
  "use strict";

  const sb = window.sb;
  const zone = document.getElementById("hub-zone");
  if (!zone) return;

  const SLUG_RE = /^[a-z0-9-]+$/;
  const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
  const slug = new URLSearchParams(window.location.search).get("m") || "";

  // Pour ajouter une rubrique plus tard : une ligne ici (et une table si besoin).
  // « table » = où compter les éléments ; « lien » = page de la rubrique (null = pas encore créée).
  const RUBRIQUES = [
    { icone: "🎬", titre: "Cours vidéo", texte: "Des vidéos YouTube sélectionnées", table: "cours_videos", unite: ["vidéo", "vidéos"],
      lien: (s) => "../Cours Tle D/matiere.html?m=" + s },
    { icone: "📚", titre: "Fiches de cours", texte: "Les leçons en PDF", table: "fiches", unite: ["fiche", "fiches"],
      lien: (s) => "../Fiches/matiere.html?m=" + s },
    { icone: "✏️", titre: "Exercices", texte: "S'entraîner avec des corrigés", table: null, lien: null },
    { icone: "📁", titre: "Documents", texte: "Annales, sujets et documents utiles", table: null, lien: null },
  ];

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function showStatus(text, withRetry) {
    zone.replaceChildren();
    zone.appendChild(el("p", "matieres-status", text));
    if (withRetry) {
      const btn = el("button", "matieres-retry", "Réessayer");
      btn.type = "button";
      btn.addEventListener("click", load);
      zone.appendChild(btn);
    }
  }

  async function compter(table, matiereId) {
    const { count, error } = await sb
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("matiere_id", matiereId)
      .eq("publie", true);
    if (error) throw error;
    return count || 0;
  }

  function buildCard(r, m, nb) {
    const actif = r.lien && nb > 0;
    const card = el(actif ? "a" : "div", "subject-card reveal" + (actif ? "" : " is-soon"));
    if (actif) card.href = r.lien(m.slug);

    const icon = el("div", "card-icon-wrap", r.icone);
    icon.style.setProperty("--card-color", COLOR_RE.test(m.couleur || "") ? m.couleur : "#52b788");
    card.appendChild(icon);

    const body = el("div", "card-body");
    body.appendChild(el("h3", null, r.titre));
    body.appendChild(el("p", null, r.texte));
    const meta = actif ? nb + " " + (nb > 1 ? r.unite[1] : r.unite[0]) : "Bientôt disponible";
    body.appendChild(el("span", "card-meta", meta));
    card.appendChild(body);

    card.appendChild(el("span", "card-arrow", "→"));
    return card;
  }

  async function load() {
    if (!SLUG_RE.test(slug)) {
      showStatus("Matière introuvable. Retourne à la liste des matières.", false);
      return;
    }
    showStatus("Chargement…", false);
    try {
      const { data: m, error } = await sb
        .from("matieres")
        .select("id, nom, slug, emoji, description, couleur")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!m) {
        showStatus("Matière introuvable. Retourne à la liste des matières.", false);
        return;
      }

      const nombres = await Promise.all(RUBRIQUES.map((r) => (r.table ? compter(r.table, m.id) : 0)));

      document.title = m.nom + " — Révision Tle D";
      const tag = document.getElementById("matiere-tag");
      tag.textContent = (m.emoji ? m.emoji + " " : "") + m.nom;
      if (COLOR_RE.test(m.couleur || "")) tag.style.setProperty("--tag-color", m.couleur);
      document.getElementById("matiere-nom").textContent = m.nom;
      document.getElementById("matiere-desc").textContent = m.description || "Toutes les ressources de cette matière.";

      zone.replaceChildren();
      const grid = el("div", "cards-grid");
      const cards = RUBRIQUES.map((r, i) => buildCard(r, m, nombres[i]));
      cards.forEach((c) => grid.appendChild(c));
      zone.appendChild(grid);

      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          cards.forEach((c, i) => {
            c.style.transitionDelay = i * 0.06 + "s";
            c.classList.add("visible");
          })
        )
      );
    } catch (err) {
      console.error(err);
      showStatus("Impossible de charger la matière. Vérifie ta connexion puis réessaie.", true);
    }
  }

  if (!sb) showStatus("Configuration manquante : vérifie supabase-config.js.", false);
  else load();
})();

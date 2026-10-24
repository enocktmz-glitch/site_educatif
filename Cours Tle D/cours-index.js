/* ============================================
   cours-index.js : page « Cours Tle D »
   Une section par matière, avec ses premières vidéos.
   ============================================ */
(function () {
  "use strict";

  const sb = window.sb;
  const zone = document.getElementById("cours-zone");
  const U = window.CoursUI;
  if (!zone || !U) return;

  const MAX_PAR_MATIERE = 4; // au-delà, un lien « Voir les N cours » mène à la page de la matière

  function buildSection(m, videos) {
    const section = U.el("section", "matiere-section reveal");

    const head = U.el("div", "matiere-section-title");
    const icon = U.el("div", "matiere-section-icon", m.emoji || "📘");
    icon.style.setProperty("--card-color", U.colorOrDefault(m.couleur));
    const h2 = U.el("h2", null, m.nom);
    if (m.description) h2.appendChild(U.el("span", null, m.description));
    head.appendChild(icon);
    head.appendChild(h2);
    head.appendChild(U.el("div", "matiere-section-line"));
    if (videos.length > MAX_PAR_MATIERE) {
      const more = U.el("a", "section-link", "Voir les " + videos.length + " cours →");
      more.href = "matiere.html?m=" + m.slug;
      head.appendChild(more);
    }
    section.appendChild(head);

    const cards = videos.slice(0, MAX_PAR_MATIERE).map(U.buildVideoCard).filter(Boolean);
    if (cards.length === 0) {
      const empty = U.el("div", "video-card-empty");
      empty.appendChild(U.el("span", null, "🎬"));
      empty.appendChild(U.el("p", null, "Les vidéos " + U.de(m.nom) + " arrivent bientôt."));
      section.appendChild(empty);
    } else {
      const grid = U.el("div", "videos-grid");
      cards.forEach((c) => grid.appendChild(c));
      section.appendChild(grid);
    }
    return section;
  }

  async function load() {
    U.showStatus(zone, "Chargement des cours…");
    try {
      const { data: matieres, error: e1 } = await sb
        .from("matieres")
        .select("id, nom, slug, emoji, description, couleur")
        .order("ordre", { ascending: true });
      if (e1) throw e1;
      if (!matieres || matieres.length === 0) {
        U.showStatus(zone, "Aucune matière disponible pour le moment.");
        return;
      }

      const { data: videos, error: e2 } = await sb
        .from("cours_videos")
        .select("id, matiere_id, titre, chaine, duree, youtube_id")
        .eq("publie", true)
        .order("ordre", { ascending: true })
        .order("id", { ascending: true });
      if (e2) throw e2;

      const parMatiere = {};
      (videos || []).forEach((v) => { (parMatiere[v.matiere_id] = parMatiere[v.matiere_id] || []).push(v); });

      zone.replaceChildren();
      matieres
        .filter((m) => U.SLUG_RE.test(m.slug || ""))
        .forEach((m) => zone.appendChild(buildSection(m, parMatiere[m.id] || [])));
      U.animateIn(zone);
    } catch (err) {
      console.error(err);
      U.showStatus(zone, "Impossible de charger les cours. Vérifie ta connexion puis réessaie.", load);
    }
  }

  if (!sb) U.showStatus(zone, "Configuration manquante : vérifie supabase-config.js.");
  else load();
})();

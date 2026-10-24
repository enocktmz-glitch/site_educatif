/* ============================================
   cours-matiere.js : toutes les vidéos d'une matière
   (Cours Tle D/matiere.html?m=maths)
   ============================================ */
(function () {
  "use strict";

  const sb = window.sb;
  const zone = document.getElementById("cours-zone");
  const U = window.CoursUI;
  if (!zone || !U) return;

  const slug = new URLSearchParams(window.location.search).get("m") || "";

  function setHeader(m, count) {
    document.title = m.nom + " — Cours vidéo Tle D";
    const tag = document.getElementById("matiere-tag");
    tag.textContent = (m.emoji ? m.emoji + " " : "") + m.nom;
    tag.style.setProperty("--tag-color", U.colorOrDefault(m.couleur));
    document.getElementById("matiere-nom").textContent = m.nom;
    document.getElementById("matiere-desc").textContent =
      count > 0
        ? count + " cours vidéo" + (m.description ? " · " + m.description : "")
        : m.description || "Les cours vidéo de cette matière.";
  }

  async function load() {
    if (!U.SLUG_RE.test(slug)) {
      U.showStatus(zone, "Matière introuvable. Retourne à la liste des cours.");
      return;
    }
    U.showStatus(zone, "Chargement des cours…");
    try {
      const { data: m, error: e1 } = await sb
        .from("matieres")
        .select("id, nom, emoji, description, couleur")
        .eq("slug", slug)
        .maybeSingle();
      if (e1) throw e1;
      if (!m) {
        U.showStatus(zone, "Matière introuvable. Retourne à la liste des cours.");
        return;
      }

      const { data: videos, error: e2 } = await sb
        .from("cours_videos")
        .select("id, titre, chaine, duree, youtube_id")
        .eq("matiere_id", m.id)
        .eq("publie", true)
        .order("ordre", { ascending: true })
        .order("id", { ascending: true });
      if (e2) throw e2;

      const cards = (videos || []).map(U.buildVideoCard).filter(Boolean);
      setHeader(m, cards.length);

      zone.replaceChildren();
      if (cards.length === 0) {
        const empty = U.el("div", "video-card-empty");
        empty.appendChild(U.el("span", null, "🎬"));
        empty.appendChild(U.el("p", null, "Les vidéos " + U.de(m.nom) + " arrivent bientôt. Reviens vite !"));
        zone.appendChild(empty);
      } else {
        const grid = U.el("div", "videos-grid");
        cards.forEach((c) => grid.appendChild(c));
        zone.appendChild(grid);
      }
      U.animateIn(zone);
    } catch (err) {
      console.error(err);
      U.showStatus(zone, "Impossible de charger les cours. Vérifie ta connexion puis réessaie.", load);
    }
  }

  if (!sb) U.showStatus(zone, "Configuration manquante : vérifie supabase-config.js.");
  else load();
})();

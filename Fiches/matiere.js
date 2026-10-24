/* ============================================
   matiere.js : page d'une matière (Fiches/matiere.html?m=svt)
   Lit les fiches dans Supabase et ouvre les PDF via des liens
   temporaires (le dossier de stockage est privé).
   Aucun innerHTML : tout passe par textContent.
   ============================================ */
(function () {
  "use strict";

  const sb = window.sb;
  const zone = document.getElementById("fiches-zone");
  if (!zone) return;

  const SLUG_RE = /^[a-z0-9-]+$/;
  const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
  const BUCKET = "fiches";
  const LINK_TTL = 3600; // les liens PDF expirent après 1 heure

  const slug = new URLSearchParams(window.location.search).get("m") || "";

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function showStatus(text, withRetry) {
    zone.replaceChildren();
    zone.appendChild(el("p", "fiches-status", text));
    if (withRetry) {
      const btn = el("button", "fiches-retry", "Réessayer");
      btn.type = "button";
      btn.addEventListener("click", load);
      zone.appendChild(btn);
    }
  }

  function setHeader(matiere, count) {
    document.title = matiere.nom + " — Révision Tle D";
    document.getElementById("matiere-tag").textContent =
      (matiere.emoji ? matiere.emoji + " " : "") + matiere.nom;
    document.getElementById("matiere-nom").textContent = matiere.nom;
    if (COLOR_RE.test(matiere.couleur || "")) {
      document.getElementById("matiere-tag").style.setProperty("--tag-color", matiere.couleur);
    }
    document.getElementById("matiere-desc").textContent =
      count > 0
        ? count + (count > 1 ? " cours disponibles" : " cours disponible") + " · Terminale"
        : "Les ressources de cours disponibles pour cette matière.";
  }

  function buildItem(fiche, index, url) {
    const ok = typeof url === "string" && url.startsWith("https://");
    const item = el(ok ? "a" : "div", "fiche-item reveal" + (ok ? "" : " is-unavailable"));
    if (ok) {
      item.href = url;
      item.target = "_blank";
      item.rel = "noopener noreferrer";
    }
    item.appendChild(el("div", "fiche-num", fiche.numero || String(index + 1)));

    const info = el("div", "fiche-info");
    info.appendChild(el("h3", null, fiche.titre));
    if (fiche.description) info.appendChild(el("p", null, fiche.description));
    item.appendChild(info);

    item.appendChild(el("span", "fiche-pdf", ok ? "PDF ↗" : "Indisponible"));
    return item;
  }

  function animateIn(nodes) {
    // script.js n'observe que ce qui existe au chargement : on lance l'apparition nous-mêmes
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        nodes.forEach((n, i) => {
          n.style.transitionDelay = i * 0.05 + "s";
          n.classList.add("visible");
        })
      )
    );
  }

  async function load() {
    if (!SLUG_RE.test(slug)) {
      showStatus("Matière introuvable. Retourne à la liste des fiches.", false);
      return;
    }
    showStatus("Chargement des fiches…", false);
    try {
      const { data: matiere, error: e1 } = await sb
        .from("matieres")
        .select("id, nom, emoji, couleur")
        .eq("slug", slug)
        .maybeSingle();
      if (e1) throw e1;
      if (!matiere) {
        showStatus("Matière introuvable. Retourne à la liste des fiches.", false);
        return;
      }

      const { data: fiches, error: e2 } = await sb
        .from("fiches")
        .select("numero, titre, description, fichier_path, ordre")
        .eq("matiere_id", matiere.id)
        .eq("publie", true)
        .order("ordre", { ascending: true });
      if (e2) throw e2;

      const liste = fiches || [];
      setHeader(matiere, liste.length);

      if (liste.length === 0) {
        zone.replaceChildren();
        const empty = el("div", "fiche-empty reveal");
        empty.appendChild(el("div", "empty-icon", "📭"));
        empty.appendChild(el("h3", null, "Aucune fiche disponible pour l'instant"));
        const de = /^[AEIOUYHÀÂÉÈÊÎÔÛ]/i.test(matiere.nom) ? "d'" : "de ";
        empty.appendChild(el("p", null, "Les fiches " + de + matiere.nom + " seront ajoutées prochainement. Reviens bientôt !"));
        zone.appendChild(empty);
        animateIn([empty]);
        return;
      }

      // Liens temporaires vers les PDF privés (une seule requête pour toute la liste)
      const urls = {};
      const chemins = liste.map((f) => f.fichier_path).filter(Boolean);
      if (chemins.length) {
        const { data: signed, error: e3 } = await sb.storage
          .from(BUCKET)
          .createSignedUrls(chemins, LINK_TTL);
        if (!e3 && Array.isArray(signed)) {
          signed.forEach((s) => { if (!s.error && s.signedUrl) urls[s.path] = s.signedUrl; });
        }
      }

      zone.replaceChildren();
      const count = el("div", "fiche-count reveal");
      count.appendChild(el("span", null, liste.length + (liste.length > 1 ? " documents" : " document")));
      zone.appendChild(count);

      const list = el("div", "fiche-list");
      const items = liste.map((f, i) => buildItem(f, i, urls[f.fichier_path]));
      items.forEach((it) => list.appendChild(it));
      zone.appendChild(list);
      animateIn([count].concat(items));
    } catch (err) {
      console.error(err);
      showStatus("Impossible de charger les fiches. Vérifie ta connexion puis réessaie.", true);
    }
  }

  if (!sb) {
    showStatus("Configuration manquante : vérifie supabase-config.js.", false);
  } else {
    load();
  }
})();

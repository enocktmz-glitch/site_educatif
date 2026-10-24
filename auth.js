/* ============================================
   auth.js : fonctions communes (toutes les pages)
   ============================================
   ⚠️ Cette vérification côté navigateur sert à l'affichage (UX).
   La vraie protection des données, ce sont les règles RLS de la base.
   ============================================ */
(function () {
  "use strict";

  const sb = window.sb;

  async function getSession() {
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session;
  }

  // Vérifie auprès de Supabase que la session est réellement valide
  async function requireAuth(loginUrl) {
    if (!sb) return null;
    const { data, error } = await sb.auth.getUser();
    if (error || !data.user) {
      window.location.replace(loginUrl || "connexion.html");
      return null;
    }
    return data.user;
  }

  // Remplace le lien "Connexion" de la barre de navigation par "Déconnexion"
  async function updateNav() {
    const link = document.getElementById("auth-link");
    if (!link || !sb) return;
    const session = await getSession();
    if (!session) return;
    link.textContent = "Déconnexion";
    link.setAttribute("href", "#");
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      await sb.auth.signOut();
      window.location.reload();
    });
  }

  window.RevAuth = { getSession, requireAuth, updateNav };
  document.addEventListener("DOMContentLoaded", updateNav);
})();

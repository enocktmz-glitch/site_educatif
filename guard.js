/* ============================================
   guard.js : à ajouter sur les pages réservées aux élèves connectés
   (Matières, Fiches, Planning, Cours Tle D…)

   <script src="../guard.js" data-login="../connexion.html"></script>

   Il doit venir APRÈS supabase-config.js et auth.js.
   ============================================ */
(function () {
  "use strict";

  const tag = document.querySelector("script[data-login]");
  const loginUrl = tag ? tag.dataset.login : "connexion.html";

  // On cache la page le temps de vérifier la connexion
  document.body.style.visibility = "hidden";

  if (!window.RevAuth) {
    window.location.replace(loginUrl);
    return;
  }
  window.RevAuth.requireAuth(loginUrl).then((user) => {
    if (user) document.body.style.visibility = "visible";
  });
})();

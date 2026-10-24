/* ============================================
   supabase-config.js : connexion à Supabase
   ============================================
   1. Supabase > Project Settings > API (ou "API Keys")
   2. Copie l'URL du projet et la clé PUBLIQUE
      (appelée "anon public" ou "publishable" selon ton tableau de bord).
   ⚠️ JAMAIS la clé "service_role" ni la clé "secret" ici :
      ce fichier est visible par tous les visiteurs du site.
   ============================================ */
(function () {
  "use strict";

  const SUPABASE_URL = "https://qxipsckszzaplisgdzhv.supabase.co";
  const SUPABASE_PUBLIC_KEY = "sb_publishable_Iu2oyOyJumvwKe2fRazqFQ_Uigv9iwD";

  if (!window.supabase || !window.supabase.createClient) {
    console.error("La librairie Supabase n'est pas chargée (vérifie la balise <script>).");
    return;
  }

  // Client partagé par toutes les pages
  window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
})();

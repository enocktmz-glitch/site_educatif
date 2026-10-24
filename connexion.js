/* ============================================
   connexion.js : inscription, connexion,
   mot de passe oublié, nouveau mot de passe
   ============================================ */
(function () {
  "use strict";

  const sb = window.sb;
  const $ = (id) => document.getElementById(id);

  const msg = $("auth-msg");
  const tabsBar = document.querySelector(".auth-tabs");
  const tabs = document.querySelectorAll(".auth-tab");
  const forms = {
    login: $("form-login"),
    signup: $("form-signup"),
    forgot: $("form-forgot"),
    reset: $("form-reset"),
  };

  // Page vers laquelle Supabase renvoie après un clic sur un lien d'e-mail
  const PAGE_URL = window.location.origin + window.location.pathname;
  const hash = window.location.hash;
  const isRecovery = hash.includes("type=recovery");

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---------- Affichage ---------- */
  // Les messages sont toujours écrits avec textContent (jamais innerHTML)
  function showMsg(text, type) {
    msg.textContent = text;
    msg.className = "auth-msg " + type;
    msg.hidden = false;
  }
  function clearMsg() {
    msg.hidden = true;
    msg.textContent = "";
  }
  function showMode(mode) {
    clearMsg();
    Object.keys(forms).forEach((k) => { forms[k].hidden = k !== mode; });
    tabsBar.hidden = mode === "forgot" || mode === "reset";
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
  }

  /* ---------- Validation ---------- */
  function passwordProblem(pw) {
    if (pw.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
    if (pw.length > 72) return "Le mot de passe est trop long (72 caractères maximum).";
    if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) {
      return "Le mot de passe doit contenir au moins une lettre et un chiffre.";
    }
    return null;
  }

  /* ---------- Erreurs Supabase ---------- */
  function isNetworkError(error) {
    return error && (error.name === "AuthRetryableFetchError" || error.status === 0);
  }
  function isRateLimited(error) {
    return error && (error.status === 429 || /rate_limit/.test(error.code || ""));
  }
  const MSG_RATE = "Trop de tentatives. Patiente quelques minutes avant de réessayer.";
  const MSG_DOWN = "Le service est momentanément indisponible. Réessaie dans un instant.";

  /* ---------- Bouton désactivé pendant l'envoi ---------- */
  async function withBusy(form, task) {
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      await task();
    } catch (err) {
      console.error(err);
      showMsg(MSG_DOWN, "error");
    } finally {
      btn.disabled = false;
    }
  }

  /* ---------- Connexion ---------- */
  forms.login.addEventListener("submit", (e) => {
    e.preventDefault();
    withBusy(forms.login, async () => {
      clearMsg();
      const email = $("login-email").value.trim().toLowerCase();
      const password = $("login-password").value;
      if (!EMAIL_RE.test(email) || !password) {
        showMsg("Renseigne ton adresse e-mail et ton mot de passe.", "error");
        return;
      }
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        if (isNetworkError(error)) showMsg(MSG_DOWN, "error");
        else if (isRateLimited(error)) showMsg(MSG_RATE, "error");
        else if (error.code === "email_not_confirmed") {
          showMsg("Confirme d'abord ton adresse e-mail avec le lien reçu par mail.", "error");
        } else {
          // Message volontairement identique que l'e-mail ou le mot de passe soit faux
          showMsg("Adresse e-mail ou mot de passe incorrect.", "error");
        }
        return;
      }
      window.location.replace("index.html");
    });
  });

  /* ---------- Inscription ---------- */
  forms.signup.addEventListener("submit", (e) => {
    e.preventDefault();
    withBusy(forms.signup, async () => {
      clearMsg();
      const nom = $("signup-nom").value.trim().replace(/\s+/g, " ");
      const email = $("signup-email").value.trim().toLowerCase();
      const password = $("signup-password").value;
      const password2 = $("signup-password2").value;

      if (nom.length < 2 || nom.length > 100) {
        showMsg("Entre ton nom complet (2 à 100 caractères).", "error");
        return;
      }
      if (!EMAIL_RE.test(email)) {
        showMsg("Cette adresse e-mail n'est pas valide.", "error");
        return;
      }
      const problem = passwordProblem(password);
      if (problem) { showMsg(problem, "error"); return; }
      if (password !== password2) {
        showMsg("Les deux mots de passe ne sont pas identiques.", "error");
        return;
      }

      const { error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { nom_complet: nom }, emailRedirectTo: PAGE_URL },
      });
      if (error) {
        if (isNetworkError(error)) showMsg(MSG_DOWN, "error");
        else if (isRateLimited(error)) showMsg(MSG_RATE, "error");
        else if (error.code === "weak_password") {
          showMsg("Ce mot de passe est trop faible. Choisis-en un plus long et moins courant.", "error");
        } else {
          showMsg("Inscription impossible pour le moment. Vérifie tes informations et réessaie.", "error");
        }
        return;
      }
      forms.signup.reset();
      showMode("login");
      // Même message si l'adresse existe déjà : on ne révèle pas qui est inscrit
      showMsg(
        "Presque fini ! Si cette adresse peut être utilisée, un e-mail de confirmation vient d'être envoyé. " +
        "Clique sur le lien qu'il contient, puis connecte-toi.",
        "ok"
      );
    });
  });

  /* ---------- Mot de passe oublié ---------- */
  forms.forgot.addEventListener("submit", (e) => {
    e.preventDefault();
    withBusy(forms.forgot, async () => {
      clearMsg();
      const email = $("forgot-email").value.trim().toLowerCase();
      if (!EMAIL_RE.test(email)) {
        showMsg("Cette adresse e-mail n'est pas valide.", "error");
        return;
      }
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: PAGE_URL });
      if (isNetworkError(error)) { showMsg(MSG_DOWN, "error"); return; }
      if (isRateLimited(error)) { showMsg(MSG_RATE, "error"); return; }
      forms.forgot.reset();
      showMsg("Si un compte existe avec cette adresse, un e-mail de réinitialisation vient d'être envoyé.", "ok");
    });
  });

  /* ---------- Nouveau mot de passe (après le lien reçu par mail) ---------- */
  forms.reset.addEventListener("submit", (e) => {
    e.preventDefault();
    withBusy(forms.reset, async () => {
      clearMsg();
      const password = $("reset-password").value;
      const password2 = $("reset-password2").value;
      const problem = passwordProblem(password);
      if (problem) { showMsg(problem, "error"); return; }
      if (password !== password2) {
        showMsg("Les deux mots de passe ne sont pas identiques.", "error");
        return;
      }
      const { error } = await sb.auth.updateUser({ password });
      if (error) {
        if (isNetworkError(error)) showMsg(MSG_DOWN, "error");
        else if (error.code === "same_password") {
          showMsg("Choisis un mot de passe différent de l'ancien.", "error");
        } else if (error.code === "weak_password") {
          showMsg("Ce mot de passe est trop faible. Choisis-en un plus long et moins courant.", "error");
        } else {
          showMsg("Impossible de modifier le mot de passe. Refais une demande de réinitialisation.", "error");
        }
        return;
      }
      await sb.auth.signOut();
      history.replaceState(null, "", window.location.pathname);
      forms.reset.reset();
      showMode("login");
      showMsg("Mot de passe modifié. Tu peux te connecter.", "ok");
    });
  });

  /* ---------- Navigation entre les formulaires ---------- */
  tabs.forEach((t) => t.addEventListener("click", () => showMode(t.dataset.mode)));
  $("link-forgot").addEventListener("click", () => showMode("forgot"));
  document.querySelectorAll("[data-back]").forEach((b) =>
    b.addEventListener("click", () => showMode("login"))
  );

  /* ---------- Démarrage ---------- */
  if (!sb) {
    showMsg("Configuration manquante : vérifie supabase-config.js et la balise <script> de Supabase.", "error");
    Object.values(forms).forEach((f) => f.querySelectorAll("button, input").forEach((el) => { el.disabled = true; }));
    return;
  }

  // Lien d'e-mail expiré ou déjà utilisé
  if (hash.includes("error_code=") || hash.includes("error=")) {
    history.replaceState(null, "", window.location.pathname);
    showMsg("Ce lien n'est plus valide (expiré ou déjà utilisé). Refais ta demande.", "error");
  }

  sb.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") showMode("reset");
  });

  if (isRecovery) {
    showMode("reset");
  } else {
    sb.auth.getSession().then(({ data }) => {
      // Déjà connecté (ou e-mail de confirmation cliqué) : direction l'accueil
      if (data.session) window.location.replace("index.html");
    });
  }
})();

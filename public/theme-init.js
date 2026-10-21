/* Appliqué avant l'affichage pour éviter un flash de thème. Clair par défaut.
   Fichier externe et non inline, pour respecter la CSP. */
(function () {
  var root = document.documentElement;
  var pref = 'light';
  var lang = null;
  try {
    pref = localStorage.getItem('zetsu-theme') || 'light';
    lang = localStorage.getItem('zetsu-lang');
  } catch {
    /* stockage indisponible : on garde les valeurs par défaut */
  }
  var dark =
    pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.pref = pref;
  if (lang === 'fr' || lang === 'en') root.lang = lang;
})();

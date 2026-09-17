/* ============================================================
   VEKTRA - ALTERNADOR DE TEMA
   Botão sol/lua da barra de navegação.
   A leitura inicial acontece em theme-init.js (no <head>).
   ============================================================ */
(function () {
  'use strict';

  var btn  = document.getElementById('themeBtn');
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!btn) return;

  function aplicar(tema) {
    document.documentElement.setAttribute('data-theme', tema);

    // Cor da barra do navegador no celular
    if (meta) meta.setAttribute('content', tema === 'light' ? '#FFFFFF' : '#0B0E10');

    // O rótulo anuncia a ação, não o estado atual
    btn.setAttribute('aria-label', tema === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro');

    try { localStorage.setItem('vektra-theme', tema); } catch (e) {}
  }

  aplicar(document.documentElement.getAttribute('data-theme') || 'dark');

  btn.addEventListener('click', function () {
    var atual = document.documentElement.getAttribute('data-theme');
    aplicar(atual === 'light' ? 'dark' : 'light');
  });
})();

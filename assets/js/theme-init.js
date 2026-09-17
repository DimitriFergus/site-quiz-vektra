/* ============================================================
   VEKTRA - INICIALIZAÇÃO DO TEMA

   ATENÇÃO: este arquivo precisa continuar sendo carregado de
   forma SÍNCRONA dentro do <head>, ANTES do CSS renderizar.
   Não coloque "defer" nem "async" nele.

   Motivo: ele define o tema antes da primeira pintura da tela.
   Se rodasse depois, o visitante no modo claro veria a página
   piscar escura por uma fração de segundo.
   ============================================================ */
(function () {
  /* Segurança contra clickjacking: ninguém pode colocar o site dentro de
     um <iframe> de outro endereço e enganar o visitante com cliques por
     cima. O GitHub Pages não deixa enviar o cabeçalho X-Frame-Options,
     então a proteção fica aqui, no primeiro script que roda. */
  if (window.top !== window.self) {
    var mesmoSite = false;
    try { mesmoSite = window.top.location.hostname === window.location.hostname; } catch (e) {}
    if (!mesmoSite) {
      document.documentElement.style.visibility = 'hidden';
      try { window.top.location = window.self.location.href; } catch (e) {}
      return;
    }
  }

  try {
    var t = localStorage.getItem('vektra-theme');

    // Sem preferência salva? Segue a configuração do sistema operacional.
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    // localStorage pode estar bloqueado (navegação anônima, data: URL).
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

/* ============================================================
   VEKTRA QUIZ - RASTREAMENTO (Meta Pixel + Google Ads)

   Fica em arquivo porque a política de segurança (CSP) não permite
   script escrito dentro do HTML. Os IDs vêm do config.js.

   Eventos enviados à Meta:
     PageView               ao abrir a página
     ViewContent            ao começar o quiz
     QuizPergunta (custom)  a cada resposta, com o número da pergunta
     Contact                ao clicar no WhatsApp do resultado

   Os quatro abaixo só disparam na última tela (o resultado), juntos,
   para contar apenas quem chegou até o fim:
     QuizConcluido (custom) questionário finalizado, com índice e faixa
     CompleteRegistration   cadastro do cliente concluído
     Lead                   o mesmo cadastro, no evento padrão de lead
     LeadQualificado        só para leads de faixa A ou B. Use este
                            evento como otimização da campanha para a
                            Meta buscar mais gente parecida com eles.
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.VEKTRA || {};

  /* ---------- Meta Pixel ---------- */
  if (cfg.metaPixelId) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', cfg.metaPixelId);
    window.fbq('track', 'PageView');
  }

  /* ---------- Google Ads ---------- */
  if (cfg.googleAdsId) {
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + cfg.googleAdsId;
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', cfg.googleAdsId);
  }

  /* Um ponto só para o quiz disparar eventos nas duas plataformas.
     padrao = true usa um evento padrão da Meta (track), senão trackCustom. */
  window.vkTrack = function (nome, dados, padrao) {
    dados = dados || {};
    try {
      if (window.fbq) window.fbq(padrao ? 'track' : 'trackCustom', nome, dados);
    } catch (e) {}
    try {
      if (window.gtag) window.gtag('event', 'quiz_' + nome.toLowerCase(), dados);
    } catch (e) {}
  };
})();

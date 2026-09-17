/* ============================================================
   VEKTRA QUIZ - CONFIGURAÇÃO

   >>> TUDO QUE VOCÊ PRECISA TROCAR FICA AQUI. <<<
   ============================================================ */
window.VEKTRA = {

  /* WhatsApp comercial: 55 + DDD + número, só dígitos.
     Hoje: (85) 98992-9146 (o mesmo do site principal) */
  whatsapp: '5585989929146',

  /* ID do Pixel da Meta (Gerenciador de Eventos > Fontes de dados).
     Só números, ex.: '123456789012345'. Vazio = pixel desligado. */
  metaPixelId: '1067843952522851',

  /* Conta do Google Ads (a mesma do site principal). Vazio = desligado. */
  googleAdsId: 'AW-18455568117',

  /* Endereço que recebe cada lead em JSON (POST).
     Serve um Google Apps Script (planilha), Make, Zapier, n8n ou CRM.
     Vazio = o lead segue só pelo WhatsApp.
     ATENÇÃO: o domínio precisa estar liberado no connect-src
     do Content-Security-Policy, no <head> do index.html. */
  webhookUrl: '',

  /* Endereço do site principal (link do rodapé) */
  siteUrl: 'https://vektracontabil.com.br',

  email: 'contato@vektracontabil.com.br',

  link: function (texto) {
    return 'https://wa.me/' + this.whatsapp + '?text=' + encodeURIComponent(texto || '');
  },

  reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

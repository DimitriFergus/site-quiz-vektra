/* ============================================================
   VEKTRA QUIZ - RECEBEDOR DE LEADS (Google Apps Script)

   Cole este código em Extensões > Apps Script da planilha,
   implante como App da Web (acesso: Qualquer pessoa) e copie
   a URL para webhookUrl no assets/js/config.js.
   Este arquivo NÃO é carregado pelo site.
   ============================================================ */
function doPost(e) {
  var lead = JSON.parse(e.postData.contents);
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads')
         || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Leads');

  if (aba.getLastRow() === 0) {
    var cab = ['Data', 'Faixa', 'Índice', 'Nível', 'Nome', 'WhatsApp', 'E-mail', 'Empresa', 'Cargo', 'Pontos'];
    for (var i = 1; i <= 10; i++) cab.push('P' + i);
    cab.push('utm_source', 'utm_campaign', 'utm_content', 'Página');
    aba.appendRow(cab);
    aba.setFrozenRows(1);
  }

  var o = lead.origem || {};
  var linha = [
    new Date(lead.data), lead.faixa, lead.indice, lead.nivel,
    lead.nome, lead.whatsapp, lead.email, lead.empresa, lead.cargo,
    (lead.pontos || []).join('; ')
  ];
  (lead.respostas || []).forEach(function (r) { linha.push(r.resposta); });
  linha.push(o.utm_source || '', o.utm_campaign || '', o.utm_content || '', lead.pagina || '');

  aba.appendRow(linha);
  return ContentService.createTextOutput('ok');
}

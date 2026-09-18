/* ============================================================
   VEKTRA QUIZ - LÓGICA DO DIAGNÓSTICO

   Cada opção carrega dois números:
     risco -> quanto a resposta indica margem em perigo (vira o
              "índice de atenção" que o visitante vê)
     fit   -> quanto a resposta indica um bom cliente para a Vektra
              (vira a faixa A/B/C/D, que só a Vektra vê: vai no
              webhook, na mensagem do WhatsApp e no Pixel)
   e, quando for o caso, um "ponto" de atenção para o resultado.

   Para mudar uma pergunta, mexa só na lista PERGUNTAS.
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.VEKTRA;

  /* ---------- Pontos de atenção (texto do resultado) ----------
     prioridade: quanto maior, mais para cima aparece. */
  var PONTOS = {
    custo: {
      p: 90, tag: 'Margem',
      t: 'Margem por obra invisível',
      d: 'Sem custo apurado por obra, a obra boa paga o prejuízo da obra ruim e ninguém percebe. Fica impossível saber onde a margem está indo embora.'
    },
    simplesTeto: {
      p: 100, tag: 'Enquadramento',
      t: 'Faturamento acima do teto do Simples',
      d: 'O Simples Nacional tem limite de R$ 4,8 milhões por ano. Acima disso, a permanência no regime gera risco de exclusão e cobrança retroativa.'
    },
    regime: {
      p: 80, tag: 'Tributação',
      t: 'Regime tributário sem comparação',
      d: 'Presumido, Real e RET dão resultados bem diferentes para a mesma obra. Sem comparar os números, a escolha do regime é feita no escuro.'
    },
    ret: {
      p: 85, tag: 'Incorporação',
      t: 'RET pode estar ficando de fora',
      d: 'Incorporações com patrimônio de afetação podem optar pelo RET, com tributação unificada sobre a receita. Quando ele fica de fora, a carga pode ser bem maior.'
    },
    retencao: {
      p: 88, tag: 'INSS',
      t: 'Retenção de 11% virando custo',
      d: 'O INSS retido na nota de serviço é crédito a compensar, não despesa. Quando não é compensado todo mês, vira dinheiro parado no caixa da Receita.'
    },
    cno: {
      p: 75, tag: 'Obrigações',
      t: 'Pendências no CNO das obras',
      d: 'Obra sem Cadastro Nacional de Obras regular ou sem baixa no encerramento gera divergência na Receita e pode travar a certidão negativa.'
    },
    contador: {
      p: 60, tag: 'Gestão',
      t: 'Contabilidade sem foco em obra',
      d: 'Construção civil tem regras próprias de INSS, ISS, retenções e regimes. Uma contabilidade generalista nem sempre acompanha esses detalhes.'
    },
    urgencia: {
      p: 50, tag: 'Gestão',
      t: 'Contabilidade em transição',
      d: 'Trocar de contador no meio das obras é o momento em que mais se perde informação. Vale organizar custo, CNO e retenções já na passagem.'
    }
  };

  /* ---------- As 10 perguntas ---------- */
  var PERGUNTAS = [
    {
      id: 'perfil', cat: 'Perfil da empresa',
      q: 'Qual destas opções descreve melhor a sua empresa?',
      op: [
        { t: 'Construtora', fit: 2 },
        { t: 'Incorporadora', fit: 2 },
        { t: 'Construtora e incorporadora', fit: 3 },
        { t: 'Empreiteira ou prestadora de serviços de obra', fit: 1 },
        { t: 'Atuo em outro ramo', fit: 0, fora: true }
      ]
    },
    {
      id: 'obras', cat: 'Perfil da empresa', duas: true,
      q: 'Quantas obras você tem em andamento hoje?',
      op: [
        { t: 'Nenhuma no momento', fit: 0 },
        { t: '1 a 2 obras', fit: 1 },
        { t: '3 a 5 obras', fit: 2 },
        { t: '6 a 10 obras', fit: 3 },
        { t: 'Mais de 10 obras', fit: 3 }
      ]
    },
    {
      id: 'faturamento', cat: 'Perfil da empresa',
      q: 'Qual é o faturamento anual aproximado da empresa?',
      ajuda: 'Uma faixa aproximada já basta. Ela muda quais regimes fazem sentido para você.',
      op: [
        { t: 'Até R$ 1,5 milhão', fit: 0 },
        { t: 'R$ 1,5 a 4,8 milhões', fit: 2 },
        { t: 'R$ 4,8 a 15 milhões', fit: 3, alto: true },
        { t: 'R$ 15 a 50 milhões', fit: 4, alto: true },
        { t: 'Acima de R$ 50 milhões', fit: 4, alto: true }
      ]
    },
    {
      id: 'regime', cat: 'Tributação',
      q: 'Em qual regime tributário a empresa está hoje?',
      op: [
        { t: 'Simples Nacional', risco: 1, simples: true },
        { t: 'Lucro Presumido', risco: 1 },
        { t: 'Lucro Real', risco: 1 },
        { t: 'RET / Patrimônio de afetação', risco: 0 },
        { t: 'Não sei informar', risco: 3, ponto: 'regime' }
      ]
    },
    {
      id: 'custo', cat: 'Custo por obra',
      q: 'Hoje você sabe exatamente qual obra dá lucro e qual dá prejuízo?',
      op: [
        { t: 'Sim, tenho relatório de custo por obra todo mês', risco: 0 },
        { t: 'Tenho uma ideia, mas sem números confiáveis', risco: 2, ponto: 'custo' },
        { t: 'Não, os custos ficam todos misturados', risco: 3, ponto: 'custo' }
      ]
    },
    {
      id: 'afetacao', cat: 'Tributação',
      q: 'Suas incorporações usam patrimônio de afetação e o RET?',
      ajuda: 'O RET é um regime especial para incorporações, com tributação unificada sobre a receita.',
      op: [
        { t: 'Sim, em todas as incorporações', risco: 0 },
        { t: 'Em algumas', risco: 2, ponto: 'ret' },
        { t: 'Não usamos', risco: 2, ponto: 'ret' },
        { t: 'Não sei o que é isso', risco: 3, ponto: 'ret' },
        { t: 'Não fazemos incorporação', risco: 0 }
      ]
    },
    {
      id: 'retencao', cat: 'INSS e retenções',
      q: 'O INSS retido nas suas notas de serviço (11%) é compensado?',
      op: [
        { t: 'Sim, compensamos todo mês', risco: 0 },
        { t: 'Às vezes, quando lembramos', risco: 2, ponto: 'retencao' },
        { t: 'Não, acaba virando custo', risco: 3, ponto: 'retencao' },
        { t: 'Não sei dizer', risco: 3, ponto: 'retencao' },
        { t: 'Não emitimos nota com retenção', risco: 0 }
      ]
    },
    {
      id: 'cno', cat: 'Obrigações',
      q: 'Suas obras estão com o CNO aberto e baixado corretamente?',
      ajuda: 'CNO é o Cadastro Nacional de Obras, o registro da obra na Receita Federal.',
      op: [
        { t: 'Sim, todas em dia', risco: 0 },
        { t: 'Existe alguma pendência', risco: 2, ponto: 'cno' },
        { t: 'Não sei dizer', risco: 3, ponto: 'cno' }
      ]
    },
    {
      id: 'contabilidade', cat: 'Gestão',
      q: 'Como é feita a sua contabilidade hoje?',
      op: [
        { t: 'Contador especializado em construção civil', risco: 0, fit: 0 },
        { t: 'Contador que atende todo tipo de empresa', risco: 2, fit: 1, ponto: 'contador' },
        { t: 'Equipe interna, sem apoio especializado', risco: 2, fit: 1, ponto: 'contador' },
        { t: 'Estou sem contador ou trocando de contador', risco: 3, fit: 2, ponto: 'urgencia' }
      ]
    },
    {
      id: 'momento', cat: 'Próximo passo',
      q: 'Se o diagnóstico apontar ganho, quando você quer resolver?',
      op: [
        { t: 'Agora, nos próximos 30 dias', fit: 3, sub: 'Quero falar com um especialista' },
        { t: 'Nos próximos 3 meses', fit: 2 },
        { t: 'Ainda estou só pesquisando', fit: 0 }
      ]
    }
  ];

  var TOTAL = PERGUNTAS.length;
  var LETRAS = 'ABCDE';

  /* ---------- Estado ---------- */
  var respostas = new Array(TOTAL);   // índice da opção escolhida
  var atual = 0;
  var travado = false;
  var resultado = null;

  /* ---------- Origem do anúncio (UTM / fbclid) ---------- */
  var origem = {};
  try {
    var qs = new URLSearchParams(window.location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid']
      .forEach(function (k) { if (qs.get(k)) origem[k] = qs.get(k); });
  } catch (e) {}

  /* ---------- Atalhos ---------- */
  function $(id) { return document.getElementById(id); }
  var elPergunta = $('pergunta');

  function mostrarTela(id) {
    document.querySelectorAll('.tela').forEach(function (t) {
      t.classList.toggle('ativa', t.id === id);
    });
    window.scrollTo(0, 0);
  }

  function dois(n) { return (n < 10 ? '0' : '') + n; }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* O fundo acompanha o avanço no quiz, como a rolagem no site principal */
  function moverFundo(frac) {
    document.documentElement.style.setProperty('--sp', String(frac));
  }

  /* ============================================================
     Perguntas
     ============================================================ */
  function desenhar(direcao) {
    var p = PERGUNTAS[atual];
    var html =
      '<p class="eyebrow">' + esc(p.cat) + '</p>' +
      '<h2 id="qTitulo">' + esc(p.q) + '</h2>' +
      (p.ajuda ? '<p class="ajuda">' + esc(p.ajuda) + '</p>' : '') +
      '<ul class="opcoes' + (p.duas ? ' duas' : '') + '" role="radiogroup" aria-labelledby="qTitulo">';

    p.op.forEach(function (o, i) {
      var sel = respostas[atual] === i;
      html +=
        '<li><button type="button" class="opcao' + (sel ? ' sel' : '') + '" role="radio" aria-checked="' + sel + '" data-i="' + i + '">' +
          '<span class="letra" aria-hidden="true">' + LETRAS[i] + '</span>' +
          '<span class="txt">' + esc(o.t) + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</span>' +
          '<span class="check" aria-hidden="true"><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M2.5 8.5l3.5 3.5 7.5-8" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
        '</button></li>';
    });
    html += '</ul>';

    elPergunta.innerHTML = html;
    elPergunta.classList.remove('sai', 'entra', 'volta');
    void elPergunta.offsetWidth;                       // reinicia a animação
    elPergunta.classList.add('entra');
    if (direcao === 'volta') elPergunta.classList.add('volta');

    $('progNum').textContent = 'Pergunta ' + dois(atual + 1) + ' de ' + dois(TOTAL);
    $('progFill').style.width = (atual / TOTAL * 100) + '%';
    $('progBar').setAttribute('aria-valuenow', String(atual));
    $('btnVoltar').hidden = atual === 0;
    moverFundo(atual / TOTAL);

    var primeiro = elPergunta.querySelector('.opcao');
    if (primeiro && direcao) primeiro.focus({ preventScroll: true });
  }

  function trocar(novo, direcao) {
    if (CFG.reduced) { atual = novo; desenhar(direcao); travado = false; return; }
    elPergunta.classList.remove('entra', 'volta');
    elPergunta.classList.add('sai');
    setTimeout(function () {
      atual = novo;
      desenhar(direcao);
      travado = false;
    }, 260);
  }

  function escolher(i) {
    if (travado) return;
    var p = PERGUNTAS[atual];
    if (!p.op[i]) return;
    travado = true;
    respostas[atual] = i;

    elPergunta.querySelectorAll('.opcao').forEach(function (b, k) {
      b.classList.toggle('sel', k === i);
      b.setAttribute('aria-checked', String(k === i));
    });
    $('progFill').style.width = ((atual + 1) / TOTAL * 100) + '%';

    setTimeout(function () {
      if (atual < TOTAL - 1) {
        trocar(atual + 1, 'vai');
      } else {
        travado = false;
        analisar();
      }
    }, CFG.reduced ? 120 : 380);
  }

  elPergunta.addEventListener('click', function (ev) {
    var b = ev.target.closest('.opcao');
    if (b) escolher(Number(b.getAttribute('data-i')));
  });

  $('btnVoltar').addEventListener('click', function () {
    if (atual > 0 && !travado) { travado = true; trocar(atual - 1, 'volta'); }
  });

  /* Teclado: A-E ou 1-5 respondem; setas navegam entre as opções */
  document.addEventListener('keydown', function (ev) {
    if (!$('telaQuiz').classList.contains('ativa')) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var k = ev.key.toUpperCase();
    var i = LETRAS.indexOf(k);
    if (i < 0 && /^[1-5]$/.test(k)) i = Number(k) - 1;
    if (i >= 0 && k.length === 1) { ev.preventDefault(); escolher(i); return; }

    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      var ops = Array.prototype.slice.call(elPergunta.querySelectorAll('.opcao'));
      var pos = ops.indexOf(document.activeElement);
      var prox = ev.key === 'ArrowDown' ? pos + 1 : pos - 1;
      if (ops[prox]) { ev.preventDefault(); ops[prox].focus(); }
    }
  });

  /* ============================================================
     Cálculo
     ============================================================ */
  /* Cada pergunta que pesa no índice pertence a uma área. É isso que
     vira o gráfico de barras do resultado. */
  var AREAS = {
    regime: 'Tributação', afetacao: 'Tributação',
    custo: 'Custo por obra',
    retencao: 'INSS e retenções',
    cno: 'Obrigações',
    contabilidade: 'Gestão'
  };

  function calcular() {
    var risco = 0, riscoMax = 0, fit = 0, fora = false, simples = false, alto = false;
    var chaves = {};
    var lista = [];
    var porArea = {};   // nome da área -> { soma, max }

    PERGUNTAS.forEach(function (p, n) {
      var o = p.op[respostas[n]];
      var maxP = Math.max.apply(null, p.op.map(function (x) { return x.risco || 0; }));
      riscoMax += maxP;
      risco += o.risco || 0;
      fit += o.fit || 0;

      var area = AREAS[p.id];
      if (area) {
        if (!porArea[area]) porArea[area] = { soma: 0, max: 0 };
        porArea[area].soma += o.risco || 0;
        porArea[area].max += maxP;
      }
      if (o.fora) fora = true;
      if (o.simples) simples = true;
      if (o.alto) alto = true;
      if (o.ponto) chaves[o.ponto] = true;
      lista.push({ id: p.id, pergunta: p.q, resposta: o.t });
    });

    /* Simples com faturamento acima do teto é o ponto mais grave */
    if (simples && alto) {
      chaves.simplesTeto = true;
      risco += 3;
      porArea['Tributação'].soma += 3;
      porArea['Tributação'].max += 3;
    }

    /* Barras do gráfico: a área com mais atenção aparece em cima */
    var areas = Object.keys(porArea).map(function (nome) {
      return { nome: nome, pct: Math.round(porArea[nome].soma / porArea[nome].max * 100) };
    }).sort(function (a, b) { return b.pct - a.pct; });

    var indice = Math.min(100, Math.round(risco / riscoMax * 100));
    var nivel = indice >= 55 ? 'alto' : indice >= 30 ? 'moderado' : 'baixo';

    var pontos = Object.keys(chaves)
      .map(function (k) { return PONTOS[k]; })
      .sort(function (a, b) { return b.p - a.p; })
      .slice(0, 3);

    /* Faixa do lead (máximo possível: 3 + 3 + 4 + 2 + 3 = 15) */
    var obrasZero = respostas[1] === 0;
    var faixa = fora ? 'D' : fit >= 9 && !obrasZero ? 'A' : fit >= 5 ? 'B' : 'C';

    return {
      indice: indice, nivel: nivel, pontos: pontos, areas: areas,
      fit: fit, faixa: faixa, fora: fora, respostas: lista
    };
  }

  /* ============================================================
     Tela "analisando"
     ============================================================ */
  function analisar() {
    resultado = calcular();
    $('progFill').style.width = '100%';
    moverFundo(1);
    mostrarTela('telaAnalise');

    var itens = document.querySelectorAll('#analiseLista li');
    itens.forEach(function (li) { li.classList.remove('feito'); });
    var passo = CFG.reduced ? 150 : 650;
    itens.forEach(function (li, k) {
      setTimeout(function () { li.classList.add('feito'); }, passo * (k + 1));
    });

    setTimeout(function () {
      var n = resultado.pontos.length;
      $('capQtd').textContent = n === 0 ? 'poucos pontos' : n === 1 ? '1 ponto' : n + ' pontos';
      mostrarTela('telaCaptura');
    }, passo * (itens.length + 1) + 200);
  }

  /* ============================================================
     Formulário
     ============================================================ */
  var form = $('leadForm');
  var whats = $('f-whats');
  var status = $('formStatus');

  whats.addEventListener('input', function () {
    var v = whats.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) {
      var corte = v.length > 10 ? 7 : 6;
      whats.value = '(' + v.slice(0, 2) + ') ' + v.slice(2, corte) + '-' + v.slice(corte);
    } else if (v.length > 2) {
      whats.value = '(' + v.slice(0, 2) + ') ' + v.slice(2);
    } else if (v.length > 0) {
      whats.value = '(' + v;
    } else {
      whats.value = '';
    }
  });

  function marcarErro(el, tem) { el.closest('.field').classList.toggle('err', tem); }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (!resultado) return;

    var f = form;
    var lgpd = $('f-lgpd');
    var ok = true;

    [[f.nome, f.nome.value.trim().length < 2],
     [f.whatsapp, f.whatsapp.value.replace(/\D/g, '').length < 10],
     [f.email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())],
     [f.empresa, f.empresa.value.trim().length < 2],
     [f.cargo, !f.cargo.value]].forEach(function (par) {
      marcarErro(par[0], par[1]);
      if (par[1]) ok = false;
    });

    status.classList.remove('ok');
    if (!lgpd.checked) {
      status.textContent = 'É necessário autorizar o contato para continuar.';
      ok = false;
    } else if (!ok) {
      status.textContent = 'Confira os campos destacados e tente novamente.';
    }
    if (!ok) {
      var erro = form.querySelector('.field.err input, .field.err select');
      if (erro) erro.focus();
      return;
    }

    var lead = {
      data: new Date().toISOString(),
      nome: f.nome.value.trim(),
      whatsapp: f.whatsapp.value.trim(),
      email: f.email.value.trim(),
      empresa: f.empresa.value.trim(),
      cargo: f.cargo.value,
      indice: resultado.indice,
      nivel: resultado.nivel,
      faixa: resultado.faixa,
      fit: resultado.fit,
      pontos: resultado.pontos.map(function (p) { return p.t; }),
      areas: resultado.areas.map(function (a) { return a.nome + ' ' + a.pct + '%'; }),
      respostas: resultado.respostas,
      origem: origem,
      pagina: window.location.href
    };
    resultado.lead = lead;

    enviarWebhook(lead);

    status.classList.add('ok');
    status.textContent = 'Tudo certo, ' + lead.nome.split(' ')[0] + '! Gerando seu diagnóstico…';
    setTimeout(mostrarResultado, CFG.reduced ? 50 : 500);
  });

  function enviarWebhook(lead) {
    if (!CFG.webhookUrl) return;
    try {
      /* text/plain evita o preflight de CORS (o Apps Script não responde a ele) */
      fetch(CFG.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(lead)
      }).catch(function () {});
    } catch (e) {}
  }

  /* ============================================================
     Resultado
     ============================================================ */
  var TEXTOS = {
    alto: {
      t: 'Sua margem está exposta em <span class="hl">pontos importantes.</span>',
      d: 'Pelas suas respostas, há sinais claros de dinheiro saindo sem precisar, seja em tributo, retenção ou custo sem controle. São pontos que costumam custar caro quando aparecem no balanço.'
    },
    moderado: {
      t: 'Há pontos que <span class="hl">merecem decisão.</span>',
      d: 'A base está razoável, mas alguns detalhes podem estar comprometendo parte da sua margem. Vale olhar com calma antes que virem passivo.'
    },
    baixo: {
      t: 'Sua gestão está <span class="hl">bem encaminhada.</span>',
      d: 'Suas respostas mostram bom controle. Ainda assim, uma revisão por obra costuma revelar ajustes finos de tributação que fazem diferença no fim do ano.'
    }
  };

  /* Eventos de conversao. Ficam aqui, na ultima tela, para contar so
     quem realmente chegou ao fim: questionario respondido, cadastro
     enviado e diagnostico na frente do usuario. */
  var eventosFinaisEnviados = false;

  function dispararEventosFinais(r) {
    if (eventosFinaisEnviados || !r || !r.lead) return;
    eventosFinaisEnviados = true;

    var dadosPixel = {
      content_name: 'Diagnostico Construtora',
      lead_tier: r.faixa,
      value: { A: 300, B: 120, C: 30, D: 0 }[r.faixa],
      currency: 'BRL'
    };

    /* Questionario finalizado */
    window.vkTrack && window.vkTrack('QuizConcluido', { indice: r.indice, faixa: r.faixa });

    /* Inscricao: o cadastro do cliente */
    window.vkTrack && window.vkTrack('CompleteRegistration', dadosPixel, true);
    if (r.faixa === 'A' || r.faixa === 'B') {
      window.vkTrack && window.vkTrack('LeadQualificado', dadosPixel);
    }
  }

  function mostrarResultado() {
    var r = resultado;
    var txt = TEXTOS[r.nivel];
    var nome = r.lead.nome.split(' ')[0];

    $('resEyebrow').textContent = 'Diagnóstico de ' + nome;
    $('resTitulo').innerHTML = txt.t;
    $('resTexto').textContent = txt.d;

    var nivelEl = $('resNivel');
    nivelEl.className = 'nivel ' + r.nivel;
    nivelEl.textContent = { alto: 'Atenção alta', moderado: 'Atenção moderada', baixo: 'Atenção baixa' }[r.nivel];

    var pontos = r.pontos.length ? r.pontos : [{
      tag: 'Otimização', t: 'Revisão fina do regime por obra',
      d: 'Mesmo com tudo em dia, comparar Presumido, Real e RET obra a obra costuma revelar economia que passa despercebida.'
    }];
    /* Barras por área. Uma cor só: o número ao lado é que dá o tamanho. */
    $('resBarras').innerHTML = r.areas.map(function (a, k) {
      return '<li class="barra" style="--v:' + a.pct + '%;--d:' + (k * 120) + 'ms">' +
               '<span class="barra-topo"><span>' + esc(a.nome) + '</span><b>' + a.pct + '%</b></span>' +
               '<span class="barra-trilho"><i></i></span>' +
             '</li>';
    }).join('');

    $('resPontos').innerHTML = pontos.map(function (p) {
      return '<li class="ponto"><h4>' + esc(p.t) + '</h4><p>' + esc(p.d) +
             '<br><span class="tag">' + esc(p.tag) + '</span></p></li>';
    }).join('');

    /* Quem não é da construção civil recebe um fechamento diferente */
    if (r.fora) {
      $('ctaTitulo').textContent = 'A Vektra é dedicada à construção civil.';
      $('ctaTexto').textContent = 'Nosso trabalho é exclusivo para construtoras, incorporadoras e empreiteiras. Se a sua empresa tem relação com obras, fale com a gente e avaliamos o seu caso.';
    }

    var msg =
      'Olá, Vektra! Fiz o diagnóstico da construtora e quero falar com um especialista.\n\n' +
      '• Nome: ' + r.lead.nome + '\n' +
      '• Empresa: ' + r.lead.empresa + '\n' +
      '• Cargo: ' + r.lead.cargo + '\n' +
      '• Índice de atenção: ' + r.indice + '/100 (' + r.nivel + ')\n' +
      '• Por área: ' + r.areas.map(function (a) { return a.nome + ' ' + a.pct + '%'; }).join(', ') + '\n' +
      (r.pontos.length ? '• Pontos: ' + r.pontos.map(function (p) { return p.t; }).join('; ') + '\n' : '') +
      '\nMinhas respostas:\n' +
      r.respostas.map(function (x, n) { return (n + 1) + '. ' + x.resposta; }).join('\n');
    $('btnWhats').href = CFG.link(msg);

    mostrarTela('telaResultado');
    dispararEventosFinais(r);

    /* Animações do anel, do número e dos pontos */
    var alvo = r.indice;
    var valor = $('gaugeValor');
    var num = $('gaugeNum');
    valor.style.strokeDashoffset = '100';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { valor.style.strokeDashoffset = String(100 - alvo); });
    });

    if (CFG.reduced) {
      num.textContent = alvo;
    } else {
      var ini = null, dur = 1600;
      var passo = function (ts) {
        if (!ini) ini = ts;
        var k = Math.min(1, (ts - ini) / dur);
        num.textContent = Math.round(alvo * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    }

    document.querySelectorAll('#resPontos .ponto').forEach(function (li, k) {
      setTimeout(function () { li.classList.add('in'); }, (CFG.reduced ? 0 : 400) + k * 180);
    });

    /* Marcador da escala e barras entram junto com o anel */
    $('escalaPinNum').textContent = alvo;
    setTimeout(function () {
      $('escalaPin').style.left = alvo + '%';
      document.querySelectorAll('#resBarras .barra').forEach(function (li) { li.classList.add('in'); });
    }, CFG.reduced ? 0 : 300);
  }

  /* ============================================================
     Início
     ============================================================ */
  $('btnComecar').addEventListener('click', function () {
    atual = 0;
    mostrarTela('telaQuiz');
    desenhar();
  });

  if ($('ano')) $('ano').textContent = new Date().getFullYear();
  if ($('linkSite') && CFG.siteUrl) $('linkSite').href = CFG.siteUrl;
})();

# Vektra Quiz - Diagnóstico da Construtora

Página de captação de leads para os anúncios do Meta Ads. Usa os mesmos tokens,
tipografia (Poppins), cores e componentes do site principal (`SITE VEKTRA`).

## Estrutura

```
index.html              página única: abertura > 10 perguntas > análise > formulário > resultado
assets/css/tokens.css   cores (cópia do site principal)
assets/css/base.css     reset, aurora, grão, tipografia (cópia)
assets/css/layout.css   nav e rodapé (cópia)
assets/css/components.css  botões, campos, form-card (cópia)
assets/css/quiz.css     estilos exclusivos do quiz
assets/js/config.js     >>> WhatsApp, Pixel, Google Ads e webhook <<<
assets/js/tracking.js   Meta Pixel + Google Ads
assets/js/quiz.js       perguntas, pontuação, formulário e resultado
google-apps-script.js   código para salvar os leads numa planilha Google
```

## Antes de subir os anúncios

1. **Pixel da Meta**: já instalado, ID `1067843952522851` (fica em `metaPixelId`,
   no `assets/js/config.js`). O código do pixel mora em `assets/js/tracking.js`,
   e não dentro do HTML, porque a política de segurança da página (CSP) não
   permite script escrito no HTML. O efeito é exatamente o mesmo.
2. **Planilha de leads** (recomendado):
   1. Crie uma planilha no Google Sheets.
   2. Menu *Extensões > Apps Script*, cole o conteúdo de `google-apps-script.js` e salve.
   3. *Implantar > Nova implantação > App da Web*: executar como **você**, acesso **Qualquer pessoa**.
   4. Copie a URL gerada (`https://script.google.com/macros/s/.../exec`) para `webhookUrl` no `config.js`.
   Se preferir Make, Zapier ou outro CRM, cole a URL deles e libere o domínio em
   `connect-src` no `<head>` do `index.html` (Make e Zapier já estão liberados).
3. **Publicar**: é um site estático. Serve GitHub Pages, Netlify ou Vercel,
   de preferência num subdomínio, ex.: `diagnostico.vektracontabil.com.br`.
4. Nos anúncios, use a URL com UTMs, ex.:
   `?utm_source=meta&utm_medium=pago&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`
   Elas seguem junto com o lead para a planilha.

## Qualificação dos leads

Cada lead recebe uma **faixa** (só a Vektra vê):

| Faixa | Quem é |
|---|---|
| A | Construção civil, com obras ativas, faturamento alto e querendo resolver logo |
| B | Construção civil com bom potencial |
| C | Pequeno porte ou só pesquisando |
| D | Não é da construção civil |

Eventos enviados ao Pixel: `PageView`, `ViewContent` (começou o quiz), `QuizPergunta`,
`QuizConcluido`, `Lead` (com `lead_tier` e valor), `LeadQualificado` (só faixas A e B)
e `Contact` (clique no WhatsApp).

**Dica de campanha**: depois de juntar alguns eventos, crie uma conversão personalizada
com `LeadQualificado` e otimize a campanha por ela. Assim a Meta procura mais pessoas
parecidas com os leads bons, e não só quem preenche formulário.

## Gráficos do resultado

O card do índice traz, além da nota de 0 a 100:

- uma **escala** Baixo / Moderado / Alto com um marcador na posição do resultado
  (as faixas são as mesmas do `quiz.js`: até 30 baixo, até 55 moderado, acima disso alto);
- um **gráfico de barras com a porcentagem por área** (Tributação, Custo por obra,
  INSS e retenções, Obrigações, Gestão), da área mais crítica para a menos crítica.

As áreas são definidas na lista `AREAS` do `assets/js/quiz.js`, que liga cada
pergunta a um tema. As porcentagens também vão para a planilha e para a mensagem
do WhatsApp.

## Editar perguntas

Tudo fica na lista `PERGUNTAS` do `assets/js/quiz.js`. Cada opção tem `risco`
(pesa no índice que o visitante vê), `fit` (pesa na faixa do lead) e, se quiser,
`ponto` (um dos textos de `PONTOS`, que aparece no resultado).

## Testar localmente

```
python -m http.server 8765
```
e abra http://127.0.0.1:8765

/* Botão flutuante do WhatsApp — monta o botão, a mensagem pronta e o balão.
   Número provisório: trocar WA_PHONE pelo número oficial. [CONFIRMAR] */
(() => {
  const WA_PHONE = '5521999999999';      // [CONFIRMAR] número oficial com DDI + DDD
  const BUBBLE_DELAY = 8000;             // ms até o balão aparecer (1x por visita)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // mensagem pronta conforme a página
  const msg = (() => {
    const custom = document.body.dataset.waMsg;
    if (custom) return custom;
    const designer = document.querySelector('.designer, .card-info .designer');
    const piece = document.querySelector('.piece');
    if (designer && piece) {
      const code = [...document.querySelectorAll('td')].find(td => /^4PF-/.test(td.textContent.trim()));
      return `Oi! Tenho interesse na peça ${designer.textContent.trim()} — ${piece.textContent.trim()}${code ? ` (código ${code.textContent.trim()})` : ''}.`;
    }
    return 'Oi! Vim pelo site da 4PASTFWRD.';
  })();
  const href = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`;
  const isProduct = /interesse na peça/.test(msg);

  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';

  // botão
  const fab = document.createElement('a');
  fab.className = 'wa-fab';
  fab.href = href; fab.target = '_blank'; fab.rel = 'noopener';
  fab.setAttribute('aria-label', isProduct ? 'Perguntar sobre esta peça no WhatsApp' : 'Falar com a 4PASTFWRD no WhatsApp');
  fab.innerHTML = `<span class="wa-fab__icon">${ICON}<span class="wa-fab__dot"></span></span><span class="wa-fab__label">${isProduct ? 'Perguntar sobre a peça' : 'Fale com a gente'}</span>`;

  // balão
  const bubble = document.createElement('div');
  bubble.className = 'wa-bubble';
  bubble.setAttribute('role', 'status');
  bubble.innerHTML = `<b>4PASTFWRD · WhatsApp</b>${isProduct ? 'Quer mais fotos ou medidas desta peça? A gente responde por aqui.' : 'Dúvida sobre uma peça, aluguel ou venda? A gente responde por aqui.'}<button type="button" class="wa-bubble__close" aria-label="Fechar mensagem">×</button>`;

  document.body.append(bubble, fab);

  // entrada
  setTimeout(() => fab.classList.add('in'), reduce ? 0 : 900);

  // balão: uma vez por visita
  const seen = () => { try { return sessionStorage.getItem('4pf-wa-bubble') === '1'; } catch { return false; } };
  const mark = () => { try { sessionStorage.setItem('4pf-wa-bubble', '1'); } catch {} };
  const hide = () => { bubble.classList.remove('on'); fab.classList.remove('has-msg'); mark(); };
  if (!seen()) setTimeout(() => { if (!seen()) { bubble.classList.add('on'); fab.classList.add('has-msg'); } }, BUBBLE_DELAY);
  bubble.querySelector('.wa-bubble__close').addEventListener('click', e => { e.stopPropagation(); hide(); });
  bubble.addEventListener('click', () => { hide(); fab.click(); });   // usa o link real (funciona onde window.open é bloqueado)
  fab.addEventListener('click', hide);
  addEventListener('keydown', e => { if (e.key === 'Escape' && bubble.classList.contains('on')) hide(); });
})();

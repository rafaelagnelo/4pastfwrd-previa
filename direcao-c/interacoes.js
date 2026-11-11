/* Direção C — interações de demonstração.
   No tema Shopify, isto vira JS pequeno por componente (sem framework). */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. logo pequeno aparece quando o letreiro gigante sai da tela.
        Usa IntersectionObserver (não mede scroll a cada pixel) e o cabeçalho
        tem altura fixa, então nada "pula" nem trava ao rolar. */
  const top = $('#top'), big = $('#wm-big');
  if (top && big && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => top.classList.toggle('shrunk', !e.isIntersecting), { threshold: 0 }).observe(big);
  } else if (top && big) {
    top.classList.add('shrunk');
  }

  /* 2. revelar ao rolar */
  const io = 'IntersectionObserver' in window && !reduce
    ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' })
    : null;
  $$('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  /* 3. menu em tela cheia */
  const overlay = $('#overlay');
  const openBtns = $$('[data-open-menu]');
  const closeBtn = $('[data-close-menu]');
  const setMenu = open => {
    if (!overlay) return;
    overlay.classList.toggle('open', open);
    overlay.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    $$('.overlay-groups a', overlay).forEach((a, i) => { a.style.transitionDelay = open && !reduce ? `${120 + i * 35}ms` : '0ms'; });
    if (open) closeBtn?.focus(); else openBtns[0]?.focus();
  };
  openBtns.forEach(b => b.addEventListener('click', () => setMenu(true)));
  closeBtn?.addEventListener('click', () => setMenu(false));
  addEventListener('keydown', e => { if (e.key === 'Escape' && overlay?.classList.contains('open')) setMenu(false); });

  /* 4. favoritar (sem navegar) */
  $$('.prod .fav').forEach(b => b.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on));
    b.textContent = on ? '♥' : '♡';
  }));

  /* 5. tirinha de condição: tocar num nível mostra a definição */
  const defs = {
    'Impecável': 'Nova ou sem nenhum sinal de uso; pode ter etiqueta.',
    'Excelente': 'Usada poucas vezes, sem marcas visíveis.',
    'Muito bom': 'Sinais leves de uso, só percebidos de perto.',
    'Bom': 'Sinais de uso visíveis, sem afetar a estrutura.',
    'Com marcas': 'Desgaste evidente, descrito e fotografado.',
    'Como está': 'Vendida no estado, com defeitos relevantes descritos.'
  };
  $$('.cond').forEach(c => {
    const segs = $$('.cond-scale span', c), labels = $$('.cond-labels span', c), out = $('.cond-def', c);
    if (!out) return;
    const show = i => { out.textContent = `${labels[i].textContent}: ${defs[labels[i].textContent] || ''}`; };
    segs.forEach((s, i) => { s.addEventListener('mouseenter', () => show(i)); s.addEventListener('click', () => show(i)); });
    labels.forEach((l, i) => { l.style.cursor = 'pointer'; l.addEventListener('click', () => show(i)); });
    c.addEventListener('mouseleave', () => { out.textContent = ''; });
  });

  /* 6. barra fixa de compra no celular */
  const buy = $('#buy-main'), bar = $('#buybar');
  if (buy && bar && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => bar.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0)).observe(buy);
  }

  /* 7. editor de seções (demonstração do editor de temas do Shopify) */
  const main = $('#sections'), panel = $('#editor'), list = $('#editor-list'), toggle = $('#editor-toggle');
  if (!main || !panel) return;
  const KEY = '4pf-dir-c-sections';
  const sections = () => $$(':scope > [data-section]', main);
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(sections().map(s => ({ id: s.dataset.section, v: s.dataset.variant || '', h: s.dataset.hidden || '0' })))); } catch {}
  };
  const load = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!Array.isArray(saved)) return;
      saved.forEach(({ id, v, h }) => {
        const s = $(`:scope > [data-section="${id}"]`, main);
        if (!s) return;
        if (v) s.dataset.variant = v;
        s.dataset.hidden = h;
        main.appendChild(s);
      });
    } catch {}
  };
  const render = () => {
    list.innerHTML = '';
    sections().forEach((s, i, all) => {
      const li = document.createElement('li');
      const vs = (s.dataset.variants || '').split(',').filter(Boolean);
      li.innerHTML = `<span>${s.dataset.name}</span>` +
        (vs.length ? `<select aria-label="Layout de ${s.dataset.name}">${vs.map(v => `<option ${v === s.dataset.variant ? 'selected' : ''}>${v}</option>`).join('')}</select>` : '<span></span>') +
        `<button class="mv" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>↑</button>` +
        `<button class="mv" aria-label="Descer" ${i === all.length - 1 ? 'disabled' : ''}>↓</button>` +
        `<input type="checkbox" aria-label="Mostrar ${s.dataset.name}" ${s.dataset.hidden === '1' ? '' : 'checked'}>`;
      const [sel] = $$('select', li), [up, down] = $$('button', li), chk = $('input', li);
      sel?.addEventListener('change', () => { s.dataset.variant = sel.value; save(); });
      up.addEventListener('click', () => { main.insertBefore(s, s.previousElementSibling); save(); render(); s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); });
      down.addEventListener('click', () => { main.insertBefore(s.nextElementSibling, s); save(); render(); s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); });
      chk.addEventListener('change', () => { s.dataset.hidden = chk.checked ? '0' : '1'; save(); });
      list.appendChild(li);
    });
  };
  load(); render();
  toggle.addEventListener('click', () => { const o = panel.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(o)); });
  $('#editor-reset')?.addEventListener('click', () => { try { localStorage.removeItem(KEY); } catch {} location.reload(); });
})();

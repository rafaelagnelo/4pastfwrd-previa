/* Venda conosco — fluxo do pack (prévia).
   Tudo fica em memória: nada é enviado. No site real, o envio vai para o
   painel da curadoria (Supabase) e as fotos para um armazenamento de arquivos. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const MAX = 60;
  const DEFS = {
    'Impecável': 'Nova ou sem nenhum sinal de uso; pode ter etiqueta.',
    'Excelente': 'Usada poucas vezes, sem marcas visíveis.',
    'Muito bom': 'Sinais leves de uso, só percebidos de perto.',
    'Bom': 'Sinais de uso visíveis, sem afetar a estrutura.',
    'Com marcas': 'Desgaste evidente; descreva e fotografe.',
    'Como está': 'Defeitos relevantes; descreva com detalhe.'
  };

  let pack = [];          // peças do pack
  let photos = {};        // fotos da peça em edição: { frente: dataURL, ... }
  let cond = '';          // condição da peça em edição
  let editing = null;     // id da peça sendo editada

  /* ---------- navegação entre etapas ---------- */
  const views = $$('.vc-view');
  const go = v => {
    views.forEach(s => { s.hidden = s.dataset.view !== v; });
    if (v === 'lista') renderList();
    if (v === 'form' && editing === null) resetForm();
    window.scrollTo({ top: 0 });
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-go]');
    if (b) { e.preventDefault(); if (b.id === 'vc-again') { pack = []; updateCount(); } go(b.dataset.go); }
  });
  $('#vc-pack-link').addEventListener('click', e => { e.preventDefault(); go('lista'); });

  /* ---------- toast ---------- */
  let tt;
  const toast = msg => { const t = $('#vc-toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2200); };

  /* ---------- fotos: lê, reduz para no máx. 900px e mostra no quadro ---------- */
  const shrink = file => new Promise((ok, fail) => {
    const r = new FileReader();
    r.onerror = fail;
    r.onload = () => {
      const img = new Image();
      img.onerror = fail;
      img.onload = () => {
        const k = Math.min(1, 900 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        ok(c.toDataURL('image/jpeg', 0.82));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
  const paintSlots = () => $$('.vc-slot').forEach(s => {
    const u = photos[s.dataset.slot];
    s.classList.toggle('has', !!u);
    s.style.backgroundImage = u ? `url("${u}")` : '';
  });
  $$('.vc-slot input').forEach(inp => inp.addEventListener('change', async () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    try { photos[inp.closest('.vc-slot').dataset.slot] = await shrink(f); paintSlots(); progress(); }
    catch { toast('Não consegui abrir essa imagem. Tente outra foto.'); }
    inp.value = '';
  }));

  /* ---------- condição (tirinha selecionável) ---------- */
  const condBtns = $$('#vc-cond .cond-scale button');
  const condLabels = $$('#vc-cond .cond-labels span');
  const setCond = v => {
    cond = v;
    condBtns.forEach((b, i) => { const on = b.dataset.v === v; b.setAttribute('aria-checked', String(on)); condLabels[i].classList.toggle('on', on); });
    $('#vc-cond-def').textContent = v ? `${v}: ${DEFS[v]}` : 'Toque no nível que melhor descreve a peça.';
    progress();
  };
  condBtns.forEach((b, i) => {
    b.setAttribute('aria-label', b.dataset.v);
    b.addEventListener('click', () => setCond(b.dataset.v));
    b.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = condBtns[(i + d + condBtns.length) % condBtns.length];
      n.focus(); setCond(n.dataset.v);
    });
  });
  condLabels.forEach((l, i) => { l.style.cursor = 'pointer'; l.addEventListener('click', () => setCond(condBtns[i].dataset.v)); });

  /* ---------- progresso e validação ---------- */
  const val = id => $(id).value.trim();
  const progress = () => {
    const done = [Object.keys(photos).length > 0, !!val('#f-marca'), !!val('#f-cat'), !!cond].filter(Boolean).length;
    $('#vc-progress').style.width = (done / 4 * 100) + '%';
  };
  ['#f-marca', '#f-cat'].forEach(id => $(id).addEventListener('input', progress));
  const showErr = (el, msg) => { el.textContent = msg; el.hidden = !msg; };

  /* ---------- formulário da peça ---------- */
  const resetForm = () => {
    $('#vc-piece').reset(); photos = {}; editing = null; paintSlots(); setCond('');
    showErr($('#vc-error'), '');
    $('#vc-form-eyebrow').textContent = `Peça ${pack.length + 1}`;
    $('#vc-form-title').textContent = 'Adicione uma peça';
    $('#vc-add').textContent = 'Adicionar ao pack';
    $('#vc-cancel').hidden = true;
    progress();
  };
  $('#vc-cancel').addEventListener('click', () => { editing = null; go('lista'); });

  $('#vc-piece').addEventListener('submit', e => {
    e.preventDefault();
    const miss = [];
    if (!Object.keys(photos).length) miss.push('ao menos uma foto');
    if (!val('#f-marca')) miss.push('a marca');
    if (!val('#f-cat')) miss.push('a categoria');
    if (!cond) miss.push('a condição');
    if (miss.length) { showErr($('#vc-error'), `Falta ${miss.join(', ').replace(/, ([^,]*)$/, ' e $1')}.`); return; }
    if (editing === null && pack.length >= MAX) { showErr($('#vc-error'), `Um pack aceita até ${MAX} peças. Envie este e monte outro.`); return; }
    const piece = {
      id: editing ?? Date.now(), photos: { ...photos }, marca: val('#f-marca'), cat: val('#f-cat'),
      tam: val('#f-tam'), era: val('#f-era'), cond, obs: val('#f-obs'), min: val('#f-min'), hist: val('#f-hist')
    };
    if (editing !== null) { pack = pack.map(p => p.id === editing ? piece : p); toast('Peça atualizada'); editing = null; updateCount(); go('lista'); return; }
    pack.push(piece); updateCount();
    toast(`Peça adicionada · ${pack.length} no pack`);
    resetForm(); window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const edit = id => {
    const p = pack.find(x => x.id === id); if (!p) return;
    go('form');
    editing = id; photos = { ...p.photos }; paintSlots();
    $('#f-marca').value = p.marca; $('#f-cat').value = p.cat; $('#f-tam').value = p.tam; $('#f-era').value = p.era;
    $('#f-obs').value = p.obs; $('#f-min').value = p.min; $('#f-hist').value = p.hist; setCond(p.cond);
    $('#vc-form-eyebrow').textContent = `Editando peça ${pack.indexOf(p) + 1}`;
    $('#vc-form-title').textContent = p.marca;
    $('#vc-add').textContent = 'Salvar alterações';
    $('#vc-cancel').hidden = false; $('#vc-see').hidden = true;
  };

  /* ---------- lista do pack ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const updateCount = () => {
    $('#vc-badge').textContent = pack.length;
    $('#vc-see-n').textContent = pack.length;
    $('#vc-see').hidden = pack.length === 0 || editing !== null;
  };
  const renderList = () => {
    const n = pack.length;
    $('#vc-list-title').textContent = `${n} ${n === 1 ? 'peça' : 'peças'}`;
    $('#vc-empty').hidden = n > 0;
    $('#vc-contact').hidden = n === 0;
    $('#vc-cards').innerHTML = pack.map((p, i) => {
      const first = Object.values(p.photos)[0];
      return `<article class="vc-card">
        <div class="thumb" style="background-image:url('${first}')"><span class="n">${i + 1}</span><span class="cnd">${esc(p.cond)}</span></div>
        <div class="info"><b>${esc(p.marca)}</b><span>${esc(p.cat)}${p.tam ? ' · ' + esc(p.tam) : ''}</span>
          <span class="m">${Object.keys(p.photos).length} foto(s)${p.min ? ' · mín. R$ ' + esc(p.min) : ''}</span></div>
        <div class="acts"><button type="button" data-edit="${p.id}">Editar</button><button type="button" data-del="${p.id}">Remover</button></div>
      </article>`;
    }).join('');
  };
  $('#vc-cards').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
    if (ed) edit(Number(ed.dataset.edit));
    if (dl) { pack = pack.filter(p => p.id !== Number(dl.dataset.del)); updateCount(); renderList(); toast('Peça removida'); }
  });

  /* ---------- envio do pack ---------- */
  $('#vc-contact').addEventListener('submit', e => {
    e.preventDefault();
    const miss = [];
    if (!val('#c-nome')) miss.push('seu nome');
    if (val('#c-zap').replace(/\D/g, '').length < 10) miss.push('um WhatsApp com DDD');
    if (!$('#c-ok').checked) miss.push('aceitar as condições');
    if (miss.length) { showErr($('#vc-error2'), `Falta ${miss.join(', ').replace(/, ([^,]*)$/, ' e $1')}.`); return; }
    showErr($('#vc-error2'), '');
    const n = pack.length, entrega = ($('input[name=entrega]:checked') || {}).value || '';
    const code = 'PACK-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    $('#vc-ok-text').textContent = `Recebemos ${n} ${n === 1 ? 'peça' : 'peças'}, ${val('#c-nome').split(' ')[0]}. A curadoria responde pelo WhatsApp em até [X] dias úteis, peça por peça.`;
    $('#vc-ok-code').textContent = `Código do pack: ${code} · Entrega preferida: ${entrega}`;
    go('ok');
  });

  updateCount(); progress();
})();

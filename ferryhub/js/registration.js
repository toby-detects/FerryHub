(() => {
  const B = FH.load();
  if (!B || !B.counts || !B.from) { location.replace('booking.html'); return; }
  B.passengers = FH.sync(B.counts, B.passengers || []);
  if (!B.passengers.length) { location.replace('booking.html'); return; }
  const P = B.passengers, form = document.getElementById('pform'), FIELDS = ['name', 'age', 'cls', 'addr', 'id'];
  const persist = () => FH.save(B);
  const card = i => form.querySelector(`.pcard[data-i="${i}"]`);
  const fld = (i, f) => card(i).querySelector(`[data-f="${f}"]`);

  const check = p => {
    const e = {}, n = p.name.trim(), a = Number(p.age);
    if (n.length < 2) e.name = n ? 'err.name' : 'err.required';
    if (p.age === '') e.age = 'err.required';
    else if (!Number.isInteger(a) || a < 1 || a > 120) e.age = 'err.age';
    else if (p.cat === 'senior' && a < 60) e.age = 'err.senior';
    else if (p.cat === 'child' && a > 11) e.age = 'err.child';
    if (!p.cls) e.cls = 'err.cls';
    if (p.addr.trim().length < 5) e.addr = p.addr.trim() ? 'err.addr' : 'err.required';
    if (!p.idName) e.id = 'err.id';
    return e;
  };

  const err = (i, f, show = true) => FH.setErr(fld(i, f), show ? check(P[i])[f] || null : null);

  const refresh = i => {
    const ok = !Object.keys(check(P[i])).length, b = card(i).querySelector('.badge');
    card(i).classList.toggle('done', ok);
    b.dataset.i18n = ok ? 'reg.completed' : 'reg.incomplete'; b.textContent = FH.t(b.dataset.i18n);
    const done = P.filter(p => !Object.keys(check(p)).length).length;
    document.getElementById('done').textContent = done;
    document.getElementById('bar').style.width = (done / P.length * 100) + '%';
  };

  const drawFile = i => {
    const w = fld(i, 'id'), has = !!P[i].idName, bt = w.querySelector('[data-pick]');
    w.querySelector('.fname').textContent = P[i].idName || '';
    w.querySelector('.ok').hidden = !has;
    bt.dataset.i18n = has ? 'reg.replace' : 'reg.upload'; bt.textContent = FH.t(bt.dataset.i18n);
  };

  const fieldHtml = (i, p) => {
    const n = i + 1, id = k => `${k}${i}`;
    return `
    <details class="pcard" data-i="${i}" open>
      <summary><img src="../assets/icons/${FH.ICON[p.cat]}.png" alt="">
        <span class="ptitle"><b><span data-i18n="reg.passenger"></span> ${n}</b><span class="pcat" data-i18n="cat.${p.cat}"></span></span>
        <span class="badge" data-i18n="reg.incomplete"></span></summary>
      <div class="pbody">
        <div class="field" data-f="name"><label for="${id('n')}">${'<span data-i18n="reg.name"></span>'} <i>*</i></label>
          <input id="${id('n')}" type="text" autocomplete="off" data-i18n-ph="reg.namePh" value=""><p class="err" hidden></p></div>
        <div class="field" data-f="age"><label for="${id('a')}"><span data-i18n="reg.age"></span> <i>*</i></label>
          <input id="${id('a')}" type="number" min="1" max="120" inputmode="numeric" data-i18n-ph="reg.agePh"><p class="err" hidden></p></div>
        <div class="field ro"><label><span data-i18n="reg.cat"></span></label><div class="chip" data-i18n="cat.${p.cat}"></div></div>
        <div class="field" data-f="cls"><label for="${id('c')}"><span data-i18n="reg.cls"></span> <i>*</i></label>
          <select id="${id('c')}"><option value="" data-i18n="reg.select"></option>
            <option value="local" data-i18n="reg.local"></option><option value="tourist" data-i18n="reg.tourist"></option></select><p class="err" hidden></p></div>
        <div class="field wide" data-f="addr"><label for="${id('d')}"><span data-i18n="reg.addr"></span> <i>*</i></label>
          <textarea id="${id('d')}" rows="2" data-i18n-ph="reg.addrPh"></textarea><p class="err" hidden></p></div>
        <div class="field wide" data-f="id"><label><span data-i18n="reg.id"></span> <i>*</i> <small>(${n} · <span data-i18n="cat.${p.cat}"></span>)</small></label>
          <div class="drop"><input type="file" id="${id('f')}" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" hidden>
            <button type="button" class="btn-line" data-pick data-i18n="reg.upload"></button>
            <span class="fname"></span><span class="ok" hidden data-i18n="reg.uploaded"></span></div>
          <small class="help" data-i18n="reg.idHelp"></small><p class="err" hidden></p></div>
      </div>
    </details>`;
  };

  form.querySelector('#cards').innerHTML = P.map((p, i) => fieldHtml(i, p)).join('');
  P.forEach((p, i) => {
    fld(i, 'name').querySelector('input').value = p.name;
    fld(i, 'age').querySelector('input').value = p.age;
    fld(i, 'cls').querySelector('select').value = p.cls;
    fld(i, 'addr').querySelector('textarea').value = p.addr;
    drawFile(i); refresh(i);
  });
  document.getElementById('tot').textContent = P.length;

  const key = { name: 'name', age: 'age', cls: 'cls', addr: 'addr' };
  const target = e => { const c = e.target.closest('.pcard'), w = e.target.closest('.field'); return c && w && w.dataset.f ? [Number(c.dataset.i), w.dataset.f, w] : null; };

  form.addEventListener('input', e => {
    const t = target(e); if (!t || !key[t[1]]) return;
    P[t[0]][t[1]] = e.target.value; persist();
    if (t[2].classList.contains('bad')) err(t[0], t[1]);
    refresh(t[0]);
  });
  form.addEventListener('change', e => {
    const t = target(e); if (!t) return;
    const [i, f, w] = t;
    if (f === 'cls') { P[i].cls = e.target.value; err(i, f); }
    if (f === 'id' && e.target.type === 'file') {
      const file = e.target.files[0]; if (!file) return;
      const ok = /^(image\/(jpeg|png)|application\/pdf)$/.test(file.type) && file.size <= 5 * 1048576;
      if (!ok) { e.target.value = ''; FH.setErr(w, 'err.file'); return; }
      P[i].idName = file.name; drawFile(i); err(i, 'id');
    }
    persist(); refresh(i);
  });
  form.addEventListener('focusout', e => { const t = target(e); if (t && key[t[1]]) err(t[0], t[1]); });
  form.addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (b) b.closest('.drop').querySelector('input').click(); });

  const note = (k, bad) => { const n = document.getElementById('result'); n.hidden = false; n.className = 'note ' + (bad ? 'bad' : 'good'); n.dataset.i18n = k; n.textContent = FH.t(k); n.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
  form.addEventListener('submit', e => {
    e.preventDefault();
    let first = null;
    P.forEach((p, i) => {
      const er = check(p);
      FIELDS.forEach(f => { FH.setErr(fld(i, f), er[f] || null); if (er[f] && !first) first = [i, f]; });
      refresh(i);
    });
    if (first) {
      card(first[0]).open = true;
      const el = fld(first[0], first[1]);
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.querySelector('input:not([hidden]),select,textarea,button')?.focus({ preventScroll: true });
      const n = document.getElementById('result'); n.hidden = false; n.className = 'note bad'; n.dataset.i18n = 'reg.fix'; n.textContent = FH.t('reg.fix');
    } else note('reg.success', false);
  });

  // Trip summary
  const sum = () => {
    document.getElementById('trip').innerHTML =
      `<b>${B.from} → ${B.to}</b><span>${FH.fmtDate(B.date)}, ${B.time}</span>` +
      FH.CATS.filter(c => B.counts[c]).map(c => `<span class="chip"><span data-i18n="cat.${c}"></span> × ${B.counts[c]}</span>`).join('');
  };
  sum();
  document.addEventListener('fh:lang', () => { sum(); document.querySelectorAll('#trip [data-i18n]').forEach(e => { e.textContent = FH.t(e.dataset.i18n); }); });
  FH.apply();
})();

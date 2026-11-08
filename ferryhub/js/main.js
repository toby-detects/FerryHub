const FH = {
  CATS: ['regular', 'student', 'senior', 'pwd', 'child'],
  ICON: { regular: 'regular', student: 'student', senior: 'elderly-senior', pwd: 'pwd', child: 'child' },
  root: document.body.dataset.root || '',
  lang() { try { return localStorage.getItem('fh_lang') || 'en'; } catch (e) { return 'en'; } },
  t(k) { return (I18N[FH.lang()] || {})[k] || I18N.en[k] || k; },
  load() { try { return JSON.parse(sessionStorage.getItem('fh_booking')); } catch (e) { return null; } },
  save(b) { try { sessionStorage.setItem('fh_booking', JSON.stringify(b)); } catch (e) {} },
  fmtDate(d) { return new Date(d + 'T00:00').toLocaleDateString(FH.lang() === 'tl' ? 'fil-PH' : 'en-PH', { dateStyle: 'long' }); },
  hasData: p => !!(p.name || p.age || p.cls || p.addr || p.idName),
  // Build the passenger list from category counts, keeping entries already filled in.
  sync(counts, old) {
    const out = [];
    FH.CATS.forEach(c => {
      const ex = (old || []).filter(p => p.cat === c);
      for (let i = 0; i < counts[c]; i++) out.push(ex[i] || { cat: c, name: '', age: '', cls: '', addr: '', idName: '' });
    });
    return out;
  },
  wouldDrop(counts, old) {
    return FH.CATS.some(c => (old || []).filter(p => p.cat === c).slice(counts[c]).some(FH.hasData));
  },
  setErr(w, key) {
    const p = w.querySelector('.err');
    w.classList.toggle('bad', !!key);
    if (key) { p.dataset.i18n = key; p.textContent = FH.t(key); p.hidden = false; }
    else { p.hidden = true; delete p.dataset.i18n; }
  },
  apply() {
    document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = FH.t(e.dataset.i18n); });
    document.querySelectorAll('[data-i18n-ph]').forEach(e => { e.placeholder = FH.t(e.dataset.i18nPh); });
    document.querySelectorAll('[data-i18n-aria]').forEach(e => { e.setAttribute('aria-label', FH.t(e.dataset.i18nAria)); });
    document.documentElement.lang = FH.lang() === 'tl' ? 'fil' : 'en';
    document.title = FH.t(document.body.dataset.title) + ' | FerryHub';
    document.dispatchEvent(new Event('fh:lang'));
  },
  toast(key) {
    const t = document.getElementById('toast');
    t.textContent = FH.t(key); t.classList.add('show');
    clearTimeout(FH.tt); FH.tt = setTimeout(() => t.classList.remove('show'), 2800);
  }
};

(() => {
  const r = FH.root, scene = document.querySelector('.scene');
  scene.insertAdjacentHTML('afterbegin', `
    <header class="hdr">
      <a class="logo" href="${r}index.html"><img src="${r}assets/images/logo.png" alt="FerryHub"></a>
      <nav class="nav" aria-label="Main">
        <a href="${r}index.html" data-i18n="nav.home"></a>
        <button type="button" data-soon data-i18n="nav.ann"></button>
        <button type="button" data-soon data-i18n="nav.contact"></button>
      </nav>
      <select class="lang" id="lang" aria-label="Language / Wika">
        <option value="en">EN</option><option value="tl">TL</option>
      </select>
      <a class="btn btn-y" href="${r}pages/booking.html" data-i18n="nav.register"></a>
    </header>`);
  scene.insertAdjacentHTML('beforeend', `
    <footer class="ftr">
      <span data-i18n="foot.text"></span>
      <span class="ftr-links"><span data-i18n="foot.route"></span>
        <button type="button" data-soon data-i18n="nav.ann"></button>
        <button type="button" data-soon data-i18n="nav.contact"></button></span>
    </footer>
    <div id="toast" role="status" aria-live="polite"></div>`);
  const sel = document.getElementById('lang');
  sel.value = FH.lang();
  sel.onchange = () => { try { localStorage.setItem('fh_lang', sel.value); } catch (e) {} FH.apply(); };
  document.addEventListener('click', e => { if (e.target.closest('[data-soon]')) FH.toast('soon'); });
})();

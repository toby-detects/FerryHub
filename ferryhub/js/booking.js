(() => {
  const PORTS = ['Mabini (Anilao) Port', 'Tingloy Port'];
  const TIMES = ['05:30 AM', '07:00 AM', '08:30 AM', '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'];
  const MAX = 20;
  const $ = s => document.querySelector(s);
  const saved = FH.load() || {};
  const S = {
    from: saved.from || '', to: saved.to || '', date: saved.date || '', time: saved.time || '',
    counts:  {
    regular: 0,
    student: 0,
    senior: 0,
    pwd: 0,
    child: 0
  }
};
  const total = () => FH.CATS.reduce((a, c) => a + S.counts[c], 0);
  const wrap = f => $(`[data-f="${f}"]`);
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

  const fill = (sel, list, val, key) => {
    sel.innerHTML = `<option value="" data-i18n="${key}">${FH.t(key)}</option>` +
      list.map(p => `<option${p === val ? ' selected' : ''}>${p}</option>`).join('');
  };
  const drawPorts = () => {
    if (S.to === S.from) S.to = '';
    fill($('#from'), PORTS, S.from, 'book.port');
    fill($('#to'), PORTS.filter(p => p !== S.from), S.to, 'book.port');
  };
  drawPorts();
  fill($('#time'), TIMES, S.time, 'book.selTime');  
  $('#date').min = today; $('#date').value = S.date;

  // Passenger selector
  const list = $('#paxList');
  list.innerHTML = FH.CATS.map(c => `
    <li><img src="../assets/icons/${FH.ICON[c]}.png" alt=""><span data-i18n="cat.${c}"></span>
      <button type="button" class="step" data-c="${c}" data-d="-1" aria-label="−">−</button>
      <output id="n-${c}">0</output>
      <button type="button" class="step plus" data-c="${c}" data-d="1" aria-label="+">+</button></li>`).join('');
  const drawPax = () => {
    FH.CATS.forEach(c => { $('#n-' + c).textContent = S.counts[c]; });
    $('#paxTotal').textContent = total(); $('#paxTotal2').textContent = total();
    list.querySelectorAll('.step').forEach(b => {
      b.disabled = b.dataset.d === '-1' ? S.counts[b.dataset.c] <= 0 : total() >= MAX;
    });
  };
  list.onclick = e => {
    const b = e.target.closest('.step'); if (!b || b.disabled) return;
    S.counts[b.dataset.c] += Number(b.dataset.d);
    drawPax(); FH.setErr(wrap('pax'), null);
  };
  const pop = $('#paxPop'), btn = $('#paxBtn');
  btn.onclick = () => { pop.hidden = !pop.hidden; btn.setAttribute('aria-expanded', String(!pop.hidden)); };
  document.addEventListener('click', e => { if (!e.target.closest('.pax')) { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') pop.hidden = true; });

  $('#from').onchange = e => { S.from = e.target.value; drawPorts(); FH.setErr(wrap('from'), null); };
  $('#to').onchange = e => { S.to = e.target.value; FH.setErr(wrap('to'), null); };
  $('#date').onchange = e => { S.date = e.target.value; FH.setErr(wrap('date'), null); };
  $('#time').onchange = e => { S.time = e.target.value; FH.setErr(wrap('time'), null); };
  $('#swap').onclick = () => {
    [S.from, S.to] = [S.to, S.from]; drawPorts(); FH.apply();
  };

  $('#go').onclick = () => {
    const errs = [
      ['from', !S.from && 'err.from'], ['to', !S.to && 'err.to'],
      ['date', !S.date ? 'err.date' : S.date < today ? 'err.datepast' : null],
      ['time', !S.time && 'err.time'], ['pax', !total() && 'err.pax']
    ];
    errs.forEach(([f, k]) => FH.setErr(wrap(f), k || null));
    const bad = errs.find(e => e[1]);
    if (bad) { const el = wrap(bad[0]); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.querySelector('select,input,button')?.focus({ preventScroll: true }); return; }
    const old = saved.passengers || [];
    if (FH.wouldDrop(S.counts, old) && !confirm(FH.t('book.confirmDrop'))) return;
    FH.save({ ...S, passengers: FH.sync(S.counts, old) });
    location.href = 'registration-form.html';
  };

  FH.apply();
  drawPax();  
})();

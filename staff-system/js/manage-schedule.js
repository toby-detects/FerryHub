(() => {
  const $ = id => document.getElementById(id), pad = n => String(n).padStart(2, '0');
  const today = Time.today(); let sel = today, [vy, vm] = today.split('-').map((x, i) => i === 1 ? +x - 1 : +x);
  const rem = s => Math.max(0, s.capacity - s.count);

  function drawCal() {
    $('mt').textContent = new Date(Date.UTC(vy, vm, 1)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' });
    const first = new Date(Date.UTC(vy, vm, 1)).getUTCDay(), n = new Date(Date.UTC(vy, vm + 1, 0)).getUTCDate();
    let h = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => `<div class="dow" aria-hidden="true">${d}</div>`).join('') + '<div class="blank"></div>'.repeat(first);
    for (let d = 1; d <= n; d++) {
      const key = `${vy}-${pad(vm + 1)}-${pad(d)}`, live = ScheduleAPI.getDay(key).filter(s => s.status !== 'cancelled');
      const c = !live.length ? 'none' : live.every(s => s.status === 'full') ? 'full' : '';
      const txt = !live.length ? 'all slots cancelled' : c === 'full' ? 'all slots full' : 'seats available';
      h += `<button class="day ${c} ${key === today ? 'today' : ''}" data-d="${key}" aria-pressed="${key === sel}" aria-label="${Time.longDate(key)}, ${txt}"><span>${d}</span><span class="bar"></span></button>`;
    }
    $('cal').innerHTML = h;
  }
  function drawSlots() {
    $('sd').textContent = Time.longDate(sel);
    const slots = ScheduleAPI.getDay(sel).sort((a, b) => a.time.localeCompare(b.time));
    for (const k of ['available', 'full', 'cancelled']) {
      const g = slots.filter(s => s.status === k), label = { available: 'Available', full: 'Full', cancelled: 'Cancelled' }[k];
      $('s-' + k).innerHTML = g.length ? g.map(s => `<button class="slot ${k}" data-id="${s.id}"><span>${Time.label(s.time)}</span><span style="text-align:right">${label}<small>${k === 'cancelled' ? 'Not operating' : rem(s) + ' of ' + s.capacity + ' seats left'}</small></span></button>`).join('') : `<p class="none-msg">None</p>`;
    }
  }
  const draw = () => { drawCal(); drawSlots(); };
  $('cal').onclick = e => { const b = e.target.closest('[data-d]'); if (b) { sel = b.dataset.d; draw(); } };
  $('prev').onclick = () => { vm--; if (vm < 0) { vm = 11; vy--; } drawCal(); };
  $('next').onclick = () => { vm++; if (vm > 11) { vm = 0; vy++; } drawCal(); };
  $('today').onclick = () => { sel = today; [vy, vm] = [+today.slice(0, 4), +today.slice(5, 7) - 1]; draw(); };
  $('cb').onclick = () => UI.soon('There are no bookings to cancel yet.');

  // Slot dialog
  const f = $('f'), dlg = $('dlg'); let cur = null;
  const rules = {
    capacity: v => !V.int(v) ? 'Enter a whole number, 0 or more.' : +v > 500 ? 'Capacity cannot exceed 500.' : '',
    count: (v, fm) => !V.int(v) ? 'Enter a whole number, 0 or more.' : V.int(fm.elements.capacity.value) && +v > +fm.elements.capacity.value ? 'Booked passengers cannot exceed capacity.' : '',
    status: (v, fm) => { const c = fm.elements.capacity.value, n = fm.elements.count.value; return v === 'available' && V.int(c) && V.int(n) && +c - +n <= 0 ? 'No seats left. Increase capacity or set the status to Full.' : ''; }
  };
  V.live(f, rules);
  const remain = () => { const c = f.elements.capacity.value, n = f.elements.count.value; $('m-rem').textContent = V.int(c) && V.int(n) ? Math.max(0, +c - +n) : 'Enter valid numbers'; };
  f.addEventListener('input', e => {
    if (e.target.name === 'capacity' || e.target.name === 'count') { remain(); const w = f.elements.status.closest('.field'); if (w.classList.contains('bad')) V.setErr(w, rules.status(f.elements.status.value, f)); }
  });
  for (const k of ['available', 'full', 'cancelled']) $('s-' + k).onclick = e => {
    const b = e.target.closest('[data-id]'); if (!b) return;
    cur = ScheduleAPI.getDay(sel).find(s => s.id === b.dataset.id); V.clear(f);
    $('dt').textContent = 'Time slot ' + Time.label(cur.time); $('m-date').textContent = Time.longDate(sel); $('m-time').textContent = Time.label(cur.time);
    f.elements.status.value = cur.status; f.elements.capacity.value = cur.capacity; f.elements.count.value = cur.count; remain(); dlg.showModal();
  };
  const shut = () => dlg.close(); $('x').onclick = shut; $('cancel').onclick = shut;
  f.onsubmit = e => {
    e.preventDefault(); if (!V.run(f, rules)) return;
    const ok = ScheduleAPI.saveSlot(sel, { id: cur.id, capacity: +f.elements.capacity.value, count: +f.elements.count.value, status: f.elements.status.value });
    dlg.close(); draw(); ok ? UI.toast(`${Time.label(cur.time)} slot updated.`, 'ok') : UI.toast('Could not save to browser storage.', 'warn');
  };
  draw();
})();

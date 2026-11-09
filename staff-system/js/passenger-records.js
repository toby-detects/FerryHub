(() => {
  let data = DB.get('passengers', SEED_PASSENGERS);
  const $ = id => document.getElementById(id), st = { q: '', cat: '', cls: '', key: 'regNo', dir: 1 };
  const COLS = [['', 'Edit'], ['regNo', 'Registration No.', 1], ['name', 'Full Name', 1], ['age', 'Age'], ['address', 'Address'], ['email', 'Email'], ['cls', 'Local or Tourist'], ['category', 'Category'], ['dep', 'Departure Time', 1]];
  const dep = p => p.date + ' ' + p.time;
  $('fc').innerHTML += CATEGORIES.map(c => `<option>${c}</option>`).join('');
  $('fk').innerHTML += CLASSES.map(c => `<option>${c}</option>`).join('');
  $('ct').innerHTML = '<option value="">Select</option>' + CATEGORIES.map(c => `<option>${c}</option>`).join('');
  $('cl').innerHTML = '<option value="">Select</option>' + CLASSES.map(c => `<option>${c}</option>`).join('');
  $('dtm').innerHTML = '<option value="">Select</option>' + SLOT_TIMES.map(t => `<option value="${t}">${Time.label(t)}</option>`).join('');

  function head() {
    $('thead').innerHTML = COLS.map(([k, l, s]) => {
      if (!k) return `<th scope="col"><span class="sr">${l}</span></th>`;
      const on = st.key === k, sort = on ? (st.dir > 0 ? 'ascending' : 'descending') : 'none';
      return `<th scope="col" aria-sort="${s ? sort : 'none'}">${s ? `<button data-k="${k}">${l}<span aria-hidden="true">${on ? (st.dir > 0 ? '▲' : '▼') : ''}</span></button>` : l}</th>`;
    }).join('');
  }
  function render() {
    const q = st.q.toLowerCase();
    const rows = data.filter(p => (!st.cat || p.category === st.cat) && (!st.cls || p.cls === st.cls) &&
      (!q || [p.name, p.regNo, p.address, p.email].some(x => x.toLowerCase().includes(q))))
      .sort((a, b) => { const x = st.key === 'dep' ? dep(a) : a[st.key], y = st.key === 'dep' ? dep(b) : b[st.key]; return (x > y ? 1 : x < y ? -1 : 0) * st.dir; });
    head();
    $('rows').innerHTML = rows.map(p => `<tr>
      <td><button class="iconbtn" data-rn="${p.regNo}" aria-label="Edit ${UI.esc(p.regNo)}"><img src="../assets/icons/edit.png" alt=""></button></td>
      <td class="rn">${UI.esc(p.regNo)}</td><td>${UI.esc(p.name)}</td><td>${p.age}</td><td>${UI.esc(p.address)}</td><td>${UI.esc(p.email)}</td>
      <td><span class="badge neutral">${p.cls}</span></td><td><span class="badge">${p.category}</span></td>
      <td>${Time.shortDate(p.date)}, ${Time.label(p.time)}</td></tr>`).join('');
    $('empty').hidden = rows.length > 0;
    $('count').textContent = `Showing ${rows.length} of ${data.length}`;
  }
  $('q').oninput = e => { st.q = e.target.value; render(); };
  $('fc').onchange = e => { st.cat = e.target.value; render(); };
  $('fk').onchange = e => { st.cls = e.target.value; render(); };
  $('reset').onclick = () => { st.q = st.cat = st.cls = ''; $('q').value = $('fc').value = $('fk').value = ''; render(); };
  $('thead').onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; st.dir = st.key === b.dataset.k ? -st.dir : 1; st.key = b.dataset.k; render(); };

  // Edit dialog
  const f = $('f'), dlg = $('dlg'); let cur = null;
  const rules = {
    name: v => !v.trim() ? 'Enter the passenger name.' : v.trim().length < 2 ? 'Enter the full name.' : /\d/.test(v) ? 'Name cannot contain numbers.' : '',
    age: (v, fm) => {
      if (!v.trim()) return 'Enter the age.';
      if (!V.int(v) || +v < 1 || +v > 120) return 'Enter a valid age from 1 to 120.';
      const c = fm.elements.category.value;
      if (c === 'Senior Citizen' && +v < 60) return 'Senior citizens must be 60 or older.';
      if (c === 'Child' && +v > 11) return 'Children must be 11 or younger.';
      return '';
    },
    category: V.req('Select a category.'), cls: V.req('Select Local or Tourist.'),
    email: v => !v.trim() ? 'Enter the email address.' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.',
    address: v => v.trim().length < 5 ? 'Enter the complete address.' : '',
    date: V.req('Choose a departure date.'), time: V.req('Choose a departure time.')
  };
  V.live(f, rules);
  f.addEventListener('change', e => { if (e.target.name === 'category' && f.elements.age.value) V.setErr(f.elements.age.closest('.field'), rules.age(f.elements.age.value, f)); });
  $('rows').onclick = e => {
    const b = e.target.closest('[data-rn]'); if (!b) return;
    cur = data.find(p => p.regNo === b.dataset.rn); V.clear(f);
    $('dt').textContent = 'Edit passenger ' + cur.regNo;
    ['regNo', 'name', 'age', 'category', 'cls', 'email', 'address', 'date', 'time'].forEach(k => { f.elements[k].value = cur[k]; });
    dlg.showModal();
  };
  const shut = () => dlg.close(); $('x').onclick = shut; $('cancel').onclick = shut;
  f.onsubmit = e => {
    e.preventDefault(); if (!V.run(f, rules)) return;
    ['name', 'email', 'address'].forEach(k => { cur[k] = f.elements[k].value.trim(); });
    cur.age = +f.elements.age.value; ['category', 'cls', 'date', 'time'].forEach(k => { cur[k] = f.elements[k].value; });
    if (!DB.set('passengers', data)) UI.toast('Could not save to browser storage.', 'warn'); else UI.toast(`Passenger ${cur.regNo} updated.`, 'ok');
    dlg.close(); render();
  };
  render();
})();

(() => {
  let list = DB.get('announcements', SEED_ANNOUNCEMENTS);
  const $ = id => document.getElementById(id), sel = new Set(), PH = '../assets/images/announcement-placeholder.svg';
  let filter = 'All', q = '', editing = null, newImg;   // newImg: undefined = unchanged, '' = removed, string = new
  const persist = () => { if (!DB.set('announcements', list)) UI.toast('Could not save: browser storage is full. Try a smaller image.', 'warn'); };
  const visible = () => list.filter(a => (filter === 'All' || a.status === filter) && a.title.toLowerCase().includes(q.toLowerCase()));

  function tabs() {
    $('tabs').innerHTML = ['All', 'Active', 'Draft', 'Disabled'].map(t =>
      `<button class="tab" data-t="${t}" aria-pressed="${filter === t}">${t} (${t === 'All' ? list.length : list.filter(a => a.status === t).length})</button>`).join('');
  }
  function tools() {
    $('del').disabled = !sel.size; $('sel').textContent = sel.size ? ` (${sel.size})` : '';
    const v = visible(), n = v.filter(a => sel.has(a.id)).length;
    $('all').checked = v.length > 0 && n === v.length; $('all').indeterminate = n > 0 && n < v.length;
  }
  function render() {
    const v = visible(); tabs();
    $('rows').innerHTML = v.map(a => `<tr>
      <td><input type="checkbox" class="cb" data-id="${a.id}" ${sel.has(a.id) ? 'checked' : ''} aria-label="Select ${UI.esc(a.title)}"></td>
      <td><b style="font-family:Manrope">${UI.esc(a.title)}</b></td>
      <td><div class="imgcell"><img class="thumb" src="${a.image || PH}" alt=""><small>${UI.esc(a.imageName || '')}</small></div></td>
      <td><span class="badge s-${a.status.toLowerCase()}">${a.status}</span></td><td>${Time.stamp(a.added)}</td><td>${Time.stamp(a.updated)}</td>
      <td style="white-space:nowrap"><button class="iconbtn" data-e="${a.id}" aria-label="Edit ${UI.esc(a.title)}"><img src="../assets/icons/edit.png" alt=""></button>
      <button class="iconbtn" data-x="${a.id}" aria-label="Delete ${UI.esc(a.title)}"><img src="../assets/icons/trash.png" alt=""></button></td></tr>`).join('');
    $('empty').hidden = v.length > 0; tools();
  }
  $('tabs').onclick = e => { const b = e.target.closest('[data-t]'); if (b) { filter = b.dataset.t; sel.clear(); render(); } };
  $('q').oninput = e => { q = e.target.value; sel.clear(); render(); };
  $('all').onchange = e => { visible().forEach(a => e.target.checked ? sel.add(a.id) : sel.delete(a.id)); render(); };
  $('rows').onchange = e => { if (e.target.dataset.id) { e.target.checked ? sel.add(e.target.dataset.id) : sel.delete(e.target.dataset.id); tools(); } };
  async function remove(ids) {
    const one = ids.length === 1 ? list.find(a => a.id === ids[0]).title : '';
    if (!await UI.confirm('Delete announcement' + (ids.length > 1 ? 's' : '') + '?', one ? `"${one}" will be permanently removed.` : `${ids.length} announcements will be permanently removed.`)) return;
    list = list.filter(a => !ids.includes(a.id)); ids.forEach(i => sel.delete(i)); persist(); render(); UI.toast('Deleted.', 'ok');
  }
  $('rows').onclick = e => { const x = e.target.closest('[data-x]'), ed = e.target.closest('[data-e]'); if (x) remove([x.dataset.x]); if (ed) open(ed.dataset.e); };
  $('del').onclick = () => remove([...sel]);
  $('add').onclick = () => open(null);
  $('upd').onclick = () => sel.size === 1 ? open([...sel][0]) : UI.toast('Select exactly one announcement to update.', 'warn');

  // Dialog
  const f = $('f'), dlg = $('dlg');
  const rules = {
    title: v => v.trim().length < 3 ? 'Enter a title (at least 3 characters).' : '',
    content: v => v.trim().length < 10 ? 'Enter the announcement content (at least 10 characters).' : '',
    status: V.req('Choose a status.')
  };
  V.live(f, rules);
  function setPreview(src, name) { $('pv').src = src || PH; $('imn').textContent = name || 'No image selected. A blank placeholder is shown.'; $('rmimg').hidden = !src; }
  function open(id) {
    editing = id ? list.find(a => a.id === id) : null; newImg = undefined; V.clear(f); f.reset(); f.elements.image.value = '';
    $('dt').textContent = editing ? 'Update announcement' : 'Add announcement';
    if (editing) { f.elements.title.value = editing.title; f.elements.content.value = editing.content; f.elements.status.value = editing.status; setPreview(editing.image, editing.imageName); }
    else setPreview('', '');
    dlg.showModal();
  }
  async function shrink(file) {
    const url = URL.createObjectURL(file);
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
    const s = Math.min(1, 640 / img.width), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); return c.toDataURL('image/jpeg', .82);
  }
  f.elements.image.onchange = async e => {
    const w = e.target.closest('.field'), file = e.target.files[0]; if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { V.setErr(w, 'Use a JPG, PNG or WEBP image.'); e.target.value = ''; return; }
    if (file.size > 3 * 1048576) { V.setErr(w, 'The image must be 3 MB or smaller.'); e.target.value = ''; return; }
    try { newImg = await shrink(file); newImg = { data: newImg, name: file.name }; V.setErr(w, ''); setPreview(newImg.data, file.name); }
    catch (err) { V.setErr(w, 'That image could not be read. Try another file.'); e.target.value = ''; }
  };
  $('rmimg').onclick = () => { newImg = ''; f.elements.image.value = ''; setPreview('', ''); };
  const shut = () => dlg.close(); $('x').onclick = shut; $('cancel').onclick = shut;
  f.onsubmit = e => {
    e.preventDefault(); if (!V.run(f, rules)) return;
    const now = new Date().toISOString(), rec = editing || { id: 'a' + Date.now(), image: '', imageName: '', added: now };
    rec.title = f.elements.title.value.trim(); rec.content = f.elements.content.value.trim(); rec.status = f.elements.status.value; rec.updated = now;
    if (newImg === '') { rec.image = ''; rec.imageName = ''; } else if (newImg) { rec.image = newImg.data; rec.imageName = newImg.name; }
    if (!editing) list.unshift(rec);
    persist(); dlg.close(); render(); UI.toast(editing ? 'Announcement updated.' : 'Announcement added.', 'ok');
  };
  render();
})();

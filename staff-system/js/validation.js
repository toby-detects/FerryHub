const V = {
  setErr(w, msg) {
    const p = w.querySelector('.err'), c = w.querySelector('input,select,textarea');
    w.classList.toggle('bad', !!msg);
    if (c) c.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (p) { p.textContent = msg || ''; p.hidden = !msg; }
  },
  req: m => v => String(v).trim() ? '' : (m || 'This field is required.'),
  // Validate every field in rules; show errors; focus the first invalid one.
  run(form, rules) {
    let first = null;
    for (const [name, fn] of Object.entries(rules)) {
      const el = form.elements[name]; if (!el) continue;
      const msg = fn(el.value, form, el); V.setErr(el.closest('.field'), msg);
      if (msg && !first) first = el;
    }
    if (first) first.focus();
    return !first;
  },
  live(form, rules) {
    const h = e => { const fn = rules[e.target.name], w = e.target.closest('.field'); if (fn && w && w.classList.contains('bad')) V.setErr(w, fn(e.target.value, form, e.target)); };
    form.addEventListener('input', h); form.addEventListener('change', h);
  },
  clear(form) { form.querySelectorAll('.field.bad').forEach(w => V.setErr(w, '')); },
  int(v) { return /^\d+$/.test(String(v).trim()); }
};

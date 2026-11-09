/* MOCK authentication for the prototype only. Not secure. Admin login is "under progress". */
const Auth = {
  USERS: { staff: { username: 'admin', password: '12345678', label: 'Staff' } },
  session() { try { return JSON.parse(sessionStorage.getItem('fh_staff_session')); } catch (e) { return null; } },
  login(role) { try { sessionStorage.setItem('fh_staff_session', JSON.stringify({ role, label: Auth.USERS[role].label })); } catch (e) {} },
  logout() { try { sessionStorage.removeItem('fh_staff_session'); } catch (e) {} location.href = (document.body.dataset.root || '') + 'index.html'; },
  require() { if (!Auth.session()) { location.replace('../index.html'); return false; } return true; }
};

(() => {
  const form = document.getElementById('loginForm'); if (!form) return;
  if (Auth.session()) { location.replace('pages/passenger-records.html'); return; }
  const note = document.getElementById('lnote'), $ = id => document.getElementById(id);
  const rules = { username: V.req('Enter your username.'), password: V.req('Enter your password.') };
  V.live(form, rules);
  $('segAdmin').onclick = () => { note.hidden = false; note.className = 'notice'; note.textContent = 'Admin login is under progress. Please use Staff.'; };
  $('segStaff').onclick = () => { note.hidden = true; };
  const pw = form.elements.password, eye = $('eye');
  eye.onclick = () => {
    const show = pw.type === 'password'; pw.type = show ? 'text' : 'password';
    eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); eye.setAttribute('aria-pressed', String(show));
    eye.classList.toggle('show', show);
  };
  form.onsubmit = e => {
    e.preventDefault(); note.hidden = true;
    if (!V.run(form, rules)) return;
    const u = Auth.USERS.staff;
    if (form.elements.username.value.trim() === u.username && pw.value === u.password) { Auth.login('staff'); location.href = 'pages/passenger-records.html'; return; }
    note.hidden = false; note.className = 'notice bad'; note.textContent = 'Incorrect username or password.';
    ['username', 'password'].forEach(n => form.elements[n].closest('.field').classList.add('bad'));
    pw.value = ''; pw.focus();
  };
})();

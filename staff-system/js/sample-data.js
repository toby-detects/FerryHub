/* Sample data + storage layer. localStorage here is a stand-in, NOT a database.
   To connect a backend later, replace DB and ScheduleAPI; the page scripts only call these. */
const PHT = 'Asia/Manila';
const SLOT_TIMES = ['05:30', '07:00', '08:30', '10:00', '11:30', '13:00', '14:30', '16:00'];
const CATEGORIES = ['Regular', 'Student', 'Senior Citizen', 'Child', 'PWD'];
const CLASSES = ['Local', 'Tourist'];
const DEFAULT_CAPACITY = 40;

const Time = {
  parts(d = new Date()) {
    return Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: PHT, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
      .formatToParts(d).map(x => [x.type, x.value]));
  },
  today() { const p = Time.parts(); return `${p.year}-${p.month}-${p.day}`; },
  label(hhmm) { const [h, m] = hhmm.split(':').map(Number); return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; },
  longDate(key) { const [y, m, d] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }); },
  shortDate(key) { const [y, m, d] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }); },
  stamp(iso) { return new Date(iso).toLocaleString('en-US', { timeZone: PHT, month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', ''); }
};

const DB = {
  get(k, seed) { try { const v = localStorage.getItem('fh_staff_' + k); if (v) return JSON.parse(v); } catch (e) {} return JSON.parse(JSON.stringify(seed)); },
  set(k, v) { try { localStorage.setItem('fh_staff_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};

const SEED_PASSENGERS = [
  ['RN2601', 'Thomas Bernard Canilang', 20, 'Talaga East, Mabini, Batangas', 'thomas.aspicanilang@gmail.com', 'Tourist', 'Student', '2026-11-10', '10:00'],
  ['RN2602', 'Maria Lourdes Dimaano', 34, 'Bauan, Batangas', 'mldimaano@example.com', 'Local', 'Regular', '2026-11-10', '07:00'],
  ['RN2603', 'Jose Ramon Macalindong', 67, 'Poblacion, Mabini, Batangas', 'jrmacalindong@example.com', 'Local', 'Senior Citizen', '2026-11-10', '07:00'],
  ['RN2604', 'Angelica Mae Villanueva', 9, 'Bagalangit, Mabini, Batangas', 'villanueva.family@example.com', 'Local', 'Child', '2026-11-11', '08:30'],
  ['RN2605', 'Kenneth Paolo Reyes', 22, 'Quezon City, Metro Manila', 'kpreyes@example.com', 'Tourist', 'Student', '2026-11-11', '10:00'],
  ['RN2606', 'Rosario Tolentino', 58, 'Tingloy, Batangas', 'rtolentino@example.com', 'Local', 'PWD', '2026-11-12', '05:30'],
  ['RN2607', 'Daniel Joseph Ocampo', 41, 'Makati City, Metro Manila', 'djocampo@example.com', 'Tourist', 'Regular', '2026-11-12', '11:30'],
  ['RN2608', 'Felicidad Magsino', 72, 'Anilao, Mabini, Batangas', 'fmagsino@example.com', 'Local', 'Senior Citizen', '2026-11-13', '08:30'],
  ['RN2609', 'Carlo Miguel Atienza', 27, 'Lipa City, Batangas', 'cmatienza@example.com', 'Tourist', 'Regular', '2026-11-13', '13:00'],
  ['RN2610', 'Bianca Nicole Landicho', 17, 'Batangas City, Batangas', 'bnlandicho@example.com', 'Local', 'Student', '2026-11-14', '14:30'],
  ['RN2611', 'Eduardo Panganiban', 45, 'Sto. Tomas, Batangas', 'epanganiban@example.com', 'Tourist', 'Regular', '2026-11-14', '16:00'],
  ['RN2612', 'Liza Marie Hernandez', 11, 'Mabini, Batangas', 'hernandez.lm@example.com', 'Local', 'Child', '2026-11-15', '07:00']
].map(r => ({ regNo: r[0], name: r[1], age: r[2], address: r[3], email: r[4], cls: r[5], category: r[6], date: r[7], time: r[8] }));

const SEED_ANNOUNCEMENTS = [
  ['a1', 'MASASA TEMPORARY CLOSURE', 'Masasa pier is temporarily closed. Please check this page before traveling.', 'Active', '2026-10-30T11:47:00+08:00'],
  ['a2', 'Revised departure advisory', 'Departure times for the Mabini-Tingloy route may change. Please arrive early.', 'Active', '2026-10-28T09:15:00+08:00'],
  ['a3', 'Weather safety advisory', 'Trips may be suspended when sea conditions are unsafe. Staff will post updates here.', 'Draft', '2026-10-27T15:30:00+08:00'],
  ['a4', 'Holiday schedule reminder', 'Expect higher passenger volume during the holiday season. Register early.', 'Draft', '2026-10-25T10:05:00+08:00'],
  ['a5', 'Old boarding notice', 'This notice is no longer in use and is kept for reference only.', 'Disabled', '2026-10-20T08:00:00+08:00']
].map(r => ({ id: r[0], title: r[1], content: r[2], status: r[3], image: '', imageName: 'img.png', added: r[4], updated: r[4] }));

function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

const ScheduleAPI = {
  // Sample slots are generated from the date so there is no hard-coded calendar; edits are stored as overrides.
  getDay(date) {
    const ov = DB.get('sched', {})[date] || {};
    return SLOT_TIMES.map(t => {
      const h = hash(date + t), cap = DEFAULT_CAPACITY, count = h % 7 < 2 ? cap : (h >>> 3) % (cap - 5);
      const base = { id: t, time: t, capacity: cap, count, status: count >= cap ? 'full' : 'available' };
      return ov[t] ? { ...base, ...ov[t] } : base;
    });
  },
  saveSlot(date, s) {
    const all = DB.get('sched', {});
    (all[date] = all[date] || {})[s.id] = { capacity: s.capacity, count: s.count, status: s.status };
    return DB.set('sched', all);
  }
};

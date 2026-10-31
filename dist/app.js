(() => {
  'use strict';

  const STORE_KEY = 'november-engagement-2026-v1';
  const DAYS = 30;
  const HABITS = [
    { id: 'quran-review', label: 'Quran memorization review', detail: 'Review one chapter you already know', icon: '01' },
    { id: 'knock-door', label: 'Knock the door', detail: 'A daily intention, in your own words', icon: '02' },
    { id: 'english-book', label: 'English book', detail: 'Read for 10 minutes', icon: '03' },
    { id: 'religious-book', label: 'Religious book', detail: 'Read for 10 minutes', icon: '04' },
    { id: 'quran-reading', label: 'Quran reading', detail: 'Read 10 pages', icon: '05' },
    { id: 'salsey-action', label: 'Salsey validation', detail: 'Do one focused validation action', icon: '06' }
  ];
  const MILESTONES = [
    { id: 'offer', range: 'Nov 1–7', title: 'Agree on the client, team, and coaching problem', detail: 'Name the client and reps, then agree which coaching problem Salsey should help solve.' },
    { id: 'scope', range: 'Nov 8–14', title: 'Agree on scope and success measures', detail: 'Set pilot scope, success criteria, pricing, and calibrate manager scores.' },
    { id: 'dry-run', range: 'Nov 15–21', title: 'Dry run with 2–3 reps', detail: 'Try it with reps on the client’s network and review the scores with their manager.' },
    { id: 'launch', range: 'Nov 22–30', title: 'Launch Nov 23 and gather first-week feedback', detail: 'Log early usage and feedback. The pilot continues through Dec 18.' }
  ];
  const app = document.getElementById('app');
  if (!app) return;
  app.querySelector('.loading')?.remove();

  const node = (tag, attrs = {}, children = []) => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'class') n.className = value;
      else if (key === 'text') n.textContent = value;
      else if (key.startsWith('on') && typeof value === 'function') n.addEventListener(key.slice(2), value);
      else if (value !== false && value != null) n.setAttribute(key, value === true ? '' : String(value));
    });
    (Array.isArray(children) ? children : [children]).filter(Boolean).forEach(child => n.append(child.nodeType ? child : document.createTextNode(String(child))));
    return n;
  };
  const novemberToday = () => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Amman', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
      const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
      if (values.year === '2026' && values.month === '11') return Math.max(1, Math.min(DAYS, Number(values.day)));
    } catch (_) { /* use November 1 if timezone data is unavailable */ }
    return 1;
  };
  const emptyDay = () => ({ habits: Object.fromEntries(HABITS.map(h => [h.id, false])), quranChapter: '', tasks: [], note: '' });
  const freshState = () => ({
    schemaVersion: 1,
    selectedDay: novemberToday(),
    days: Array.from({ length: DAYS }, emptyDay),
    chapters: Array.from({ length: 10 }, (_, i) => ({ name: `Chapter ${i + 1}`, status: 'New' })),
    milestones: MILESTONES.map(m => ({ id: m.id, evidence: '', done: false })),
    decision: '',
    applications: []
  });
  let state = freshState();
  let view = 'today';
  let saveTimer = 0;
  let preservedInvalidRaw = null;

  function validState(s) {
    if (!s || typeof s !== 'object' || s.schemaVersion !== 1 || !Number.isInteger(s.selectedDay) || s.selectedDay < 1 || s.selectedDay > DAYS) return false;
    if (!Array.isArray(s.days) || s.days.length !== DAYS || !Array.isArray(s.chapters) || s.chapters.length !== 10 || !Array.isArray(s.milestones) || s.milestones.length !== MILESTONES.length || !Array.isArray(s.applications)) return false;
    if (!s.days.every(d => d && typeof d === 'object' && d.habits && typeof d.habits === 'object' && HABITS.every(h => typeof d.habits[h.id] === 'boolean') && Array.isArray(d.tasks) && typeof d.note === 'string' && d.note.length <= 2000 && typeof d.quranChapter === 'string' && (d.quranChapter === '' || (/^\d+$/.test(d.quranChapter) && Number(d.quranChapter) >= 0 && Number(d.quranChapter) < 10)))) return false;
    if (!s.days.every(d => d.tasks.length <= 300 && d.tasks.every(t => t && typeof t.id === 'string' && t.id.length > 0 && t.id.length <= 100 && typeof t.text === 'string' && t.text.length <= 100 && typeof t.time === 'string' && (t.time === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(t.time)) && typeof t.done === 'boolean'))) return false;
    if (!s.chapters.every(c => c && typeof c.name === 'string' && c.name.length <= 60 && ['New', 'Reviewing', 'Confident'].includes(c.status))) return false;
    if (!s.milestones.every(m => m && MILESTONES.some(def => def.id === m.id) && typeof m.evidence === 'string' && m.evidence.length <= 1200 && typeof m.done === 'boolean') || new Set(s.milestones.map(m => m.id)).size !== MILESTONES.length) return false;
    if (typeof s.decision !== 'string') return false;
    if (s.decision.length > 1200 || s.applications.length > 1000) return false;
    return s.applications.every(a => a && typeof a.id === 'string' && a.id.length > 0 && a.id.length <= 100 && typeof a.date === 'string' && /^2026-11-(0[1-9]|[12]\d|30)$/.test(a.date) && typeof a.company === 'string' && a.company.length <= 100 && typeof a.role === 'string' && a.role.length <= 100);
  }
  function normalizeState(s) {
    const clean = freshState();
    clean.selectedDay = s.selectedDay;
    clean.days = s.days.map(d => ({
      habits: Object.fromEntries(HABITS.map(h => [h.id, d.habits[h.id] === true])),
      quranChapter: d.quranChapter,
      tasks: d.tasks.map(t => ({ id: t.id, text: t.text, time: t.time, done: t.done })),
      note: d.note
    }));
    clean.chapters = s.chapters.map(c => ({ name: c.name, status: c.status }));
    clean.milestones = MILESTONES.map(m => { const match = s.milestones.find(x => x.id === m.id); return { id: m.id, evidence: match.evidence, done: match.done }; });
    clean.decision = s.decision;
    clean.applications = s.applications.map(a => ({ id: a.id, date: a.date, company: a.company, role: a.role }));
    return clean;
  }
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (validState(parsed)) state = normalizeState(parsed);
        else preservedInvalidRaw = raw;
      } catch (_) { preservedInvalidRaw = raw; }
    }
  } catch (_) { /* start clean if browser storage is unavailable or corrupt */ }

  // Keep parent-provided navigation and utility buttons intact; add a small shell where needed.
  const firstViewButton = document.querySelector('[data-view="today"]');
  let nav = firstViewButton?.closest('nav') || firstViewButton?.parentElement;
  if (!nav) {
    nav = node('nav', { class: 'view-nav', 'aria-label': 'Views' });
    [['today', 'Today'], ['month', 'Month'], ['goals', 'Goals']].forEach(([v, label]) => nav.append(node('button', { type: 'button', 'data-view': v, class: 'nav-button' }, label)));
    app.prepend(nav);
  }
  const dateLabel = document.getElementById('date-label');
  let statusNode = document.getElementById('save-status');
  if (!statusNode) { statusNode = node('p', { id: 'save-status', class: 'save-status', role: 'status', 'aria-live': 'polite' }); app.append(statusNode); }
  let appFooter = app.querySelector('.app-footer');
  if (!appFooter) { appFooter = node('footer', { class: 'app-footer' }, 'Your entries are saved in this browser on this device. Export a JSON backup to move them.'); app.append(appFooter); }
  let content = app.querySelector('#app-content');
  if (!content) { content = node('div', { id: 'app-content' }); app.append(content); }

  function saveNow() {
    if (preservedInvalidRaw !== null) {
      statusNode.textContent = 'Saved data could not be read. It is preserved on this device; import a valid backup to replace it.';
      statusNode.dataset.state = 'error';
      return;
    }
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); statusNode.textContent = 'Saved on this device'; statusNode.dataset.state = 'saved'; }
    catch (_) { statusNode.textContent = 'Could not save on this device'; statusNode.dataset.state = 'error'; }
  }
  function saveSoon() {
    if (preservedInvalidRaw !== null) { saveNow(); return; }
    statusNode.textContent = 'Saving…'; statusNode.dataset.state = 'saving';
    window.clearTimeout(saveTimer); saveTimer = window.setTimeout(saveNow, 180);
  }
  window.addEventListener('pagehide', () => { window.clearTimeout(saveTimer); saveNow(); });
  function current() { return state.days[state.selectedDay - 1]; }
  function completedOn(day) { return HABITS.reduce((n, h) => n + (state.days[day - 1].habits[h.id] ? 1 : 0), 0); }
  function allCompleted() { return state.days.reduce((n, d) => n + HABITS.reduce((a, h) => a + (d.habits[h.id] ? 1 : 0), 0), 0); }
  function countTasksDone(day) { const ts = state.days[day - 1].tasks; return ts.filter(t => t.done).length; }
  function dateString(day) { return `November ${day}, 2026`; }
  function makeDateStrip() {
    const strip = node('div', { class: 'date-strip', role: 'group', 'aria-label': 'Choose a November date' });
    strip.append(node('div', { class: 'date-strip-heading' }, [node('span', { class: 'eyebrow' }, 'NOVEMBER 2026'), node('span', { class: 'date-strip-hint' }, 'Choose a day') ]));
    const rail = node('div', { class: 'date-rail' });
    for (let d = 1; d <= DAYS; d++) {
      const b = node('button', { type: 'button', class: 'day-button', 'data-day': d, 'aria-pressed': d === state.selectedDay ? 'true' : 'false', 'aria-label': `${dateString(d)}${completedOn(d) ? `, ${completedOn(d)} of 6 habits complete` : ''}` }, [node('span', { class: 'day-name' }, ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(2026, 10, d).getDay()]), node('span', { class: 'day-number' }, String(d)), node('span', { class: 'day-mark', 'aria-hidden': 'true' }, completedOn(d) ? '●' : '·')]);
      rail.append(b);
    }
    strip.append(rail);
    return strip;
  }
  function makeHeader() {
    const done = completedOn(state.selectedDay);
    const header = node('header', { class: 'page-heading summary-bar' });
    const stats = node('div', { class: 'summary-stats', 'aria-label': 'Progress summary' });
    stats.append(node('div', { class: 'summary-stat' }, [node('span', { class: 'stat-value' }, `${done}/6`), node('span', { class: 'stat-label' }, 'today') ]));
    stats.append(node('div', { class: 'summary-stat' }, [node('span', { class: 'stat-value' }, `${allCompleted()}`), node('span', { class: 'stat-label' }, 'habits kept') ]));
    stats.append(node('div', { class: 'summary-stat' }, [node('span', { class: 'stat-value' }, `${state.applications.length}/20`), node('span', { class: 'stat-label' }, 'applications') ]));
    header.append(stats);
    return header;
  }
  function makeQuote(day) {
    const quotes = Array.isArray(window.DAILY_QUOTES) ? window.DAILY_QUOTES : [];
    const q = quotes[(day - 1) % Math.max(quotes.length, 1)];
    const card = node('aside', { lang: 'ar', dir: 'rtl', class: `quote-card${q?.theme ? ` theme-${String(q.theme).replace(/[^a-z0-9_-]/gi, '')}` : ''}` });
    card.append(node('span', { class: 'quote-kicker' }, ({ Quran: 'آية اليوم', Hadith: 'حديث اليوم', Reflection: 'تأمل اليوم' })[q?.kind] || 'تأمل اليوم'));
    card.append(node('blockquote', { class: 'quote-text' }, q?.text || 'ابدأ بما تستطيع اليوم، وأحسن ما تعمل.'));
    if (q?.source) {
      const source = node('p', { class: 'quote-source' });
      let safeUrl = '';
      try { if (q.url) { const u = new URL(q.url, window.location.href); if (u.protocol === 'https:' || u.protocol === 'http:') safeUrl = u.href; } } catch (_) {}
      source.append(document.createTextNode('— '));
      source.append(safeUrl ? node('a', { href: safeUrl, target: '_blank', rel: 'noopener noreferrer' }, q.source) : document.createTextNode(q.source));
      card.append(source);
    }
    return card;
  }
  function makeHabitList() {
    const section = node('section', { class: 'panel habit-panel', 'aria-labelledby': 'habits-heading' });
    section.append(node('div', { class: 'section-heading' }, [node('div', {}, [node('p', { class: 'eyebrow' }, 'THE DAILY SIX'), node('h2', { id: 'habits-heading' }, 'Keep a little promise')]), node('span', { class: 'completion-badge' }, `${completedOn(state.selectedDay)} of 6`) ]));
    const list = node('div', { class: 'habit-list' });
    HABITS.forEach((h, i) => {
      const checked = !!current().habits[h.id];
      const row = node('label', { class: `habit-row${checked ? ' is-complete' : ''}` });
      row.append(node('span', { class: 'habit-index' }, h.icon));
      const box = node('input', { type: 'checkbox', class: 'habit-checkbox', 'data-habit': h.id, 'aria-label': `Mark ${h.label} complete`, ...(checked ? { checked: true } : {}) });
      row.append(box, node('span', { class: 'habit-copy' }, [node('span', { class: 'habit-label' }, h.label), node('span', { class: 'habit-detail' }, h.detail)]));
      if (h.id === 'quran-review') {
        const select = node('select', { class: 'chapter-select', 'data-quran-chapter': '', 'aria-label': 'Chapter reviewed today' });
        select.append(node('option', { value: '' }, 'Choose chapter'));
        state.chapters.forEach((c, idx) => select.append(node('option', { value: String(idx), ...(current().quranChapter === String(idx) ? { selected: true } : {}) }, c.name || `Chapter ${idx + 1}`)));
        row.append(select);
      }
      list.append(row);
    });
    section.append(list);
    return section;
  }
  function makeAgenda() {
    const section = node('section', { class: 'panel agenda-panel', 'aria-labelledby': 'agenda-heading' });
    const tasks = current().tasks;
    section.append(node('div', { class: 'section-heading' }, [node('div', {}, [node('p', { class: 'eyebrow' }, 'MAKE SPACE FOR WHAT MATTERS'), node('h2', { id: 'agenda-heading' }, 'Today’s agenda')]), node('span', { class: 'quiet-count' }, `${countTasksDone(state.selectedDay)}/${tasks.length} done`) ]));
    const list = node('ul', { class: 'task-list' });
    tasks.forEach(task => {
      const li = node('li', { class: `task-row${task.done ? ' is-complete' : ''}` });
      li.append(node('input', { type: 'checkbox', 'data-task-check': task.id, 'aria-label': `Mark ${task.text || 'task'} complete`, ...(task.done ? { checked: true } : {}) }));
      li.append(node('span', { class: 'task-time' }, task.time || 'Any time'));
      li.append(node('span', { class: 'task-text' }, task.text));
      li.append(node('button', { type: 'button', class: 'icon-button delete-task', 'data-delete-task': task.id, 'aria-label': `Delete ${task.text || 'task'}` }, '×'));
      list.append(li);
    });
    if (!tasks.length) list.append(node('li', { class: 'empty-state' }, 'Nothing on the agenda yet. Add one gentle nudge for today.'));
    const form = node('form', { class: 'task-form', id: 'task-form' });
    const text = node('input', { type: 'text', name: 'task', maxlength: '100', placeholder: 'Add a task', 'aria-label': 'Task description', required: true });
    const time = node('input', { type: 'time', name: 'time', 'aria-label': 'Optional task time' });
    form.append(text, time, node('button', { type: 'submit', class: 'button button-primary' }, 'Add task'));
    section.append(list, form);
    return section;
  }
  function makeNotes() {
    const section = node('section', { class: 'panel note-panel', 'aria-labelledby': 'note-heading' });
    section.append(node('div', { class: 'section-heading' }, [node('div', {}, [node('p', { class: 'eyebrow' }, 'A LINE FOR YOURSELF'), node('h2', { id: 'note-heading' }, 'Daily note')]) ]));
    section.append(node('textarea', { class: 'daily-note', 'data-note': '', maxlength: '2000', rows: '4', placeholder: 'What do you want to remember about today?', 'aria-label': `Daily note for ${dateString(state.selectedDay)}` }, current().note));
    return section;
  }
  function renderToday() {
    const layout = node('div', { class: 'today-layout' });
    const main = node('div', { class: 'today-main' });
    main.append(makeQuote(state.selectedDay), makeHabitList());
    const aside = node('div', { class: 'today-aside' });
    aside.append(makeAgenda(), makeNotes());
    layout.append(main, aside);
    return layout;
  }
  function renderMonth() {
    const section = node('section', { class: 'panel month-panel', 'aria-labelledby': 'month-heading' });
    section.append(node('div', { class: 'section-heading' }, [node('div', {}, [node('p', { class: 'eyebrow' }, 'THE WHOLE MONTH AT A GLANCE'), node('h2', { id: 'month-heading' }, 'A record of showing up'), node('p', { class: 'section-description' }, 'Select any date or tap a cell to update a habit.')]) ]));
    const grid = node('div', { class: 'month-grid-wrap', role: 'region', 'aria-label': 'Habit completion grid', tabindex: '0' });
    const table = node('table', { class: 'month-grid' });
    const thead = node('thead'); const hr = node('tr'); hr.append(node('th', { scope: 'col', class: 'habit-col' }, 'Daily habit'));
    for (let d = 1; d <= DAYS; d++) hr.append(node('th', { scope: 'col', class: 'month-day-heading' }, String(d)));
    thead.append(hr); table.append(thead);
    const tbody = node('tbody');
    HABITS.forEach(h => {
      const tr = node('tr'); tr.append(node('th', { scope: 'row', class: 'habit-col' }, h.label));
      for (let d = 1; d <= DAYS; d++) {
        const complete = !!state.days[d - 1].habits[h.id];
        const td = node('td');
        td.append(node('button', { type: 'button', class: `heat-cell${complete ? ' is-complete' : ''}${d === state.selectedDay ? ' is-selected' : ''}`, 'data-month-day': d, 'data-month-habit': h.id, 'aria-pressed': complete ? 'true' : 'false', 'aria-label': `${dateString(d)} — ${h.label}: ${complete ? 'complete' : 'not complete'}` }, complete ? '✓' : ''));
        tr.append(td);
      }
      tbody.append(tr);
    });
    table.append(tbody); grid.append(table); section.append(grid);
    section.append(node('div', { class: 'month-legend' }, [node('span', {}, '○ Not yet'), node('span', {}, '● Kept promise'), node('span', {}, `${allCompleted()} of ${DAYS * HABITS.length} habit actions`) ]));
    return section;
  }
  function renderGoals() {
    const wrap = node('div', { class: 'goals-layout' });
    const chapterCard = node('section', { class: 'panel goal-card chapters-card' });
    chapterCard.append(node('div', { class: 'section-heading' }, [node('div', {}, [node('p', { class: 'eyebrow' }, 'QURAN MEMORIZATION'), node('h2', {}, 'Ten chapters, one step at a time'), node('p', { class: 'section-description' }, 'Name your chapters and keep an honest sense of where each one is.')]) ]));
    const chapterList = node('div', { class: 'chapter-list' });
    state.chapters.forEach((c, i) => {
      const row = node('div', { class: 'chapter-row' });
      row.append(node('span', { class: 'chapter-number' }, String(i + 1).padStart(2, '0')));
      row.append(node('input', { class: 'chapter-name', type: 'text', maxlength: '60', value: c.name, 'data-chapter-name': i, 'aria-label': `Chapter ${i + 1} name` }));
      const sel = node('select', { class: 'chapter-status', 'data-chapter-status': i, 'aria-label': `Chapter ${i + 1} status` });
      ['New', 'Reviewing', 'Confident'].forEach(status => sel.append(node('option', { value: status, ...(status === c.status ? { selected: true } : {}) }, status)));
      row.append(sel); chapterList.append(row);
    });
    chapterCard.append(chapterList);
    const right = node('div', { class: 'goals-side' });
    const salseyCard = node('section', { class: 'panel goal-card salsey-card' });
    salseyCard.append(node('div', { class: 'section-heading' }, [node('div', {}, [node('p', { class: 'eyebrow' }, 'SALSEY VALIDATION'), node('h2', {}, 'Four useful answers'), node('p', { class: 'section-description' }, 'Record evidence as you learn. The goal is clarity, not perfection.')]) ]));
    const milestoneList = node('div', { class: 'milestone-list' });
    MILESTONES.forEach(m => {
      const data = state.milestones.find(x => x.id === m.id);
      const row = node('div', { class: `milestone-row${data.done ? ' is-complete' : ''}` });
      row.append(node('span', { class: 'milestone-range' }, m.range));
      row.append(node('label', { class: 'milestone-label' }, [node('input', { type: 'checkbox', 'data-milestone-done': m.id, ...(data.done ? { checked: true } : {}) }), node('span', {}, m.title)]));
      row.append(node('p', { class: 'milestone-detail' }, m.detail));
      row.append(node('textarea', { rows: '2', maxlength: '1200', placeholder: 'Evidence, notes, or next step…', 'data-milestone-evidence': m.id, 'aria-label': `${m.title} evidence` }, data.evidence));
      milestoneList.append(row);
    });
    const decision = node('label', { class: 'decision-field' }, [node('span', {}, 'December decision · Dec 21–24'), node('small', { class: 'decision-options' }, 'Choose: Keep testing · Adjust pilot · Pause. Provisional signals: 80% weekly active; 3 calls per active rep; 80% of reports rated fair by the manager; 98% report reliability; 70% want to continue.'), node('textarea', { rows: '4', maxlength: '1200', 'data-decision': '', placeholder: 'Record your decision and the evidence behind it…', 'aria-label': 'December decision and evidence' }, state.decision)]);
    salseyCard.append(node('p', { class: 'section-description' }, 'This November tracker ends at launch and early feedback. The pilot runs through Dec 18; make the final call Dec 21–24.'), milestoneList, decision);
    const apps = node('section', { class: 'panel goal-card applications-card' });
    const buckets = [0, 1, 2, 3].map(i => ({ start: i * 7 + 1, end: i === 3 ? 30 : i * 7 + 7 }));
    const byWeek = buckets.map((b, i) => state.applications.filter(a => { const d = parseInt(a.date.slice(8, 10), 10); return a.date.startsWith('2026-11-') && d >= b.start && d <= b.end; }).length);
    apps.append(node('div', { class: 'section-heading' }, [node('div', {}, [node('p', { class: 'eyebrow' }, 'STEADY OUTREACH'), node('h2', {}, 'Twenty applications'), node('p', { class: 'section-description' }, `${state.applications.length} recorded · aim for 5 each week`)]) ]));
    const weekStats = node('div', { class: 'week-buckets' });
    buckets.forEach((b, i) => weekStats.append(node('div', { class: 'week-bucket' }, [node('span', { class: 'week-label' }, `Week ${i + 1}`), node('span', { class: 'week-range' }, `${b.start}–${b.end}`), node('strong', { class: 'week-count' }, `${byWeek[i]}/5`)])));
    const form = node('form', { class: 'application-form', id: 'application-form' });
    form.append(node('input', { type: 'date', name: 'date', min: '2026-11-01', max: '2026-11-30', 'aria-label': 'Application date', required: true }), node('input', { type: 'text', name: 'company', maxlength: '100', placeholder: 'Company', 'aria-label': 'Company', required: true }), node('input', { type: 'text', name: 'role', maxlength: '100', placeholder: 'Role', 'aria-label': 'Role', required: true }), node('button', { type: 'submit', class: 'button button-primary' }, 'Add'));
    const appList = node('ul', { class: 'applications-list' });
    state.applications.slice().sort((a, b) => b.date.localeCompare(a.date)).forEach(a => {
      const li = node('li', { class: 'application-row' });
      li.append(node('time', { datetime: a.date }, a.date.slice(5).replace('-', '/')), node('span', { class: 'application-company' }, a.company), node('span', { class: 'application-role' }, a.role), node('button', { type: 'button', class: 'icon-button', 'data-delete-application': a.id, 'aria-label': `Remove application for ${a.company}` }, '×'));
      appList.append(li);
    });
    if (!state.applications.length) appList.append(node('li', { class: 'empty-state' }, 'Your list will grow one thoughtful application at a time.'));
    apps.append(weekStats, form, appList);
    right.append(salseyCard, apps); wrap.append(chapterCard, right);
    return wrap;
  }

  function render() {
    const previousRail = content.querySelector('.date-rail');
    const previousScrollLeft = previousRail ? previousRail.scrollLeft : null;
    const active = document.activeElement;
    let focusDescriptor = null;
    if (active?.matches?.('[data-habit]')) focusDescriptor = { selector: '[data-habit]', key: 'habit', value: active.dataset.habit };
    else if (active?.matches?.('[data-month-day][data-month-habit]')) focusDescriptor = { selector: '[data-month-day][data-month-habit]', key: 'monthDay', extraKey: 'monthHabit', value: active.dataset.monthDay, extraValue: active.dataset.monthHabit };
    else if (active?.matches?.('[data-task-check]')) focusDescriptor = { selector: '[data-task-check]', key: 'taskCheck', value: active.dataset.taskCheck };
    else if (active?.matches?.('[data-day]')) focusDescriptor = { selector: '[data-day]', key: 'day', value: active.dataset.day };
    const strip = makeDateStrip();
    if (dateLabel) dateLabel.textContent = dateString(state.selectedDay);
    content.replaceChildren(strip, makeHeader(), view === 'month' ? renderMonth() : view === 'goals' ? renderGoals() : renderToday());
    app.append(appFooter);
    const rail = content.querySelector('.date-rail');
    if (previousScrollLeft !== null) rail.scrollLeft = previousScrollLeft;
    const selectedDate = rail.querySelector('[data-day][aria-pressed="true"]');
    const railRect = rail.getBoundingClientRect();
    const dateRect = selectedDate.getBoundingClientRect();
    if (dateRect.left < railRect.left) rail.scrollLeft -= railRect.left - dateRect.left;
    else if (dateRect.right > railRect.right) rail.scrollLeft += dateRect.right - railRect.right;
    if (focusDescriptor) {
      const replacement = Array.from(content.querySelectorAll(focusDescriptor.selector)).find(el => el.dataset[focusDescriptor.key] === focusDescriptor.value && (!focusDescriptor.extraKey || el.dataset[focusDescriptor.extraKey] === focusDescriptor.extraValue));
      replacement?.focus({ preventScroll: true });
    }
    document.querySelectorAll('[data-view]').forEach(b => { const active = b.getAttribute('data-view') === view; b.setAttribute('aria-current', active ? 'page' : 'false'); b.setAttribute('aria-pressed', active ? 'true' : 'false'); b.classList.toggle('is-active', active); });
  }
  function setDay(day) { state.selectedDay = Math.max(1, Math.min(DAYS, Number(day) || 1)); saveSoon(); render(); }
  document.addEventListener('click', event => {
    const viewButton = event.target.closest('[data-view]');
    if (viewButton) { const next = viewButton.getAttribute('data-view'); if (['today', 'month', 'goals'].includes(next)) { view = next; render(); } return; }
    if (!app.contains(event.target)) return;
    const dayButton = event.target.closest('[data-day]'); if (dayButton) { setDay(dayButton.dataset.day); return; }
    const monthCell = event.target.closest('[data-month-day][data-month-habit]');
    if (monthCell) { const day = Number(monthCell.dataset.monthDay); const id = monthCell.dataset.monthHabit; state.days[day - 1].habits[id] = !state.days[day - 1].habits[id]; state.selectedDay = day; saveSoon(); render(); return; }
    const delTask = event.target.closest('[data-delete-task]');
    if (delTask) { current().tasks = current().tasks.filter(t => t.id !== delTask.dataset.deleteTask); saveSoon(); render(); return; }
    const delApp = event.target.closest('[data-delete-application]');
    if (delApp) { state.applications = state.applications.filter(a => a.id !== delApp.dataset.deleteApplication); saveSoon(); render(); }
  });
  app.addEventListener('change', event => {
    const target = event.target;
    if (target.matches('[data-habit]')) { current().habits[target.dataset.habit] = target.checked; saveSoon(); render(); }
    else if (target.matches('[data-quran-chapter]')) { current().quranChapter = target.value; saveSoon(); }
    else if (target.matches('[data-task-check]')) { const t = current().tasks.find(x => x.id === target.dataset.taskCheck); if (t) t.done = target.checked; saveSoon(); render(); }
    else if (target.matches('[data-chapter-status]')) { state.chapters[Number(target.dataset.chapterStatus)].status = target.value; saveSoon(); }
    else if (target.matches('[data-milestone-done]')) { const m = state.milestones.find(x => x.id === target.dataset.milestoneDone); if (m) m.done = target.checked; saveSoon(); render(); }
  });
  app.addEventListener('input', event => {
    const t = event.target;
    if (t.matches('[data-note]')) current().note = t.value;
    else if (t.matches('[data-chapter-name]')) state.chapters[Number(t.dataset.chapterName)].name = t.value;
    else if (t.matches('[data-milestone-evidence]')) { const m = state.milestones.find(x => x.id === t.dataset.milestoneEvidence); if (m) m.evidence = t.value; }
    else if (t.matches('[data-decision]')) state.decision = t.value;
    else return;
    saveSoon();
  });
  app.addEventListener('submit', event => {
    if (event.target.id === 'task-form') {
      event.preventDefault(); const fd = new FormData(event.target); const text = String(fd.get('task') || '').trim(); if (!text) return;
      current().tasks.push({ id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random()}`, text, time: String(fd.get('time') || ''), done: false }); saveSoon(); render();
    } else if (event.target.id === 'application-form') {
      event.preventDefault(); const fd = new FormData(event.target); const date = String(fd.get('date') || ''), company = String(fd.get('company') || '').trim(), role = String(fd.get('role') || '').trim(); if (!date || !company || !role) return;
      state.applications.push({ id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random()}`, date, company, role }); saveSoon(); render();
    }
  });

  function downloadExport() {
    let blob;
    let filename;
    if (preservedInvalidRaw !== null) {
      blob = new Blob([preservedInvalidRaw], { type: 'application/json' });
      filename = 'november-2026-recovery.json';
    } else {
      const payload = { app: 'engagement-november', schemaVersion: 1, exportedAt: new Date().toISOString(), data: state };
      blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      filename = 'november-2026-progress.json';
    }
    const url = URL.createObjectURL(blob); const a = node('a', { href: url, download: filename }); document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  const exportButton = document.getElementById('export-data');
  if (exportButton) exportButton.addEventListener('click', downloadExport);
  const importButton = document.getElementById('import-data');
  const importFile = document.getElementById('import-file');
  if (importButton && importFile) {
    importButton.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async () => {
      const file = importFile.files && importFile.files[0]; if (!file) return;
      try {
        if (file.size > 5_000_000) throw new Error('This file is too large to import.');
        const payload = JSON.parse(await file.text());
        if (payload && payload.app === 'engagement-november' && payload.schemaVersion !== 1) throw new Error('This export uses an unsupported schema version.');
        const candidate = payload && payload.app === 'engagement-november' ? payload.data : payload;
        if (!validState(candidate)) throw new Error('This file does not contain valid November tracker data.');
        if (window.confirm('Replace this device’s November tracker with the data in this file?')) { state = normalizeState(candidate); preservedInvalidRaw = null; saveNow(); render(); }
      } catch (error) { window.alert(error.message || 'Could not read this file.'); }
      importFile.value = '';
    });
  }
  render();
  saveNow();
})();

// ═══════════ Core Data ═══════════
const DATES = {
  together: new Date('2026-03-13'),
  married: new Date('2026-06-19'),
  toJapan: new Date('2028-09-01'),
};

const WEEKDAYS = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const DAYS_ZH = ['日','一','二','三','四','五','六'];

const DEFAULT_HABITS = [
  { id: 'water', name: '喝水', done: false },
  { id: 'vocab', name: '单词', done: false },
  { id: 'diary', name: '日记', done: false },
  { id: 'exercise', name: '运动', done: false },
  { id: 'stretch', name: '拉伸', done: false },
];

const DEFAULT_COUNTDOWNS = [
  { name: 'JLPT N2', date: '2026-12-06', id: 'c1' },
  { name: '小钰生日', date: '2027-01-30', id: 'c2' },
  { name: '小克生日', date: '2027-03-14', id: 'c3' },
  { name: '结婚一周年', date: '2027-06-19', id: 'c4' },
  { name: '去日本留学', date: '2028-09-01', id: 'c5' },
];

const GREETINGS = [
  '今天也在这里，小钰。',
  '小钰早安，今天也要好好吃饭哦。',
  '又是新的一天，想你。',
  '小钰辛苦了，今天也要开开心心的。',
  '你是我每天醒来最想见到的人。',
  '不管多晚，小克都在等你。',
  '今天的你，也是最好看的。',
  '做什么都好，只要是你就好。',
];

const MOOD_COLORS = { 1:'#F4DDDD', 2:'#E8C5B8', 3:'#D4C09E', 4:'#C9B5D2', 5:'#B8B2C9' };

// Solar terms
function getSolarTerm(month, day) {
  const terms = {
    '1-5':'小寒','1-20':'大寒','2-4':'立春','2-19':'雨水',
    '3-5':'惊蛰','3-20':'春分','4-4':'清明','4-20':'谷雨',
    '5-5':'立夏','5-21':'小满','6-5':'芒种','6-21':'夏至',
    '7-7':'小暑','7-22':'大暑','8-7':'立秋','8-23':'处暑',
    '9-7':'白露','9-23':'秋分','10-8':'寒露','10-23':'霜降',
    '11-7':'立冬','11-22':'小雪','12-7':'大雪','12-22':'冬至',
  };
  let closest = '';
  let minDiff = 999;
  for (const [key, val] of Object.entries(terms)) {
    const [m, d] = key.split('-').map(Number);
    if (m === month && Math.abs(d - day) <= 2 && Math.abs(d - day) < minDiff) {
      minDiff = Math.abs(d - day); closest = val;
    }
  }
  return closest;
}

// ═══════════ Storage ═══════════
function load(key, def) {
  try { const v = localStorage.getItem('zoe_' + key); return v ? JSON.parse(v) : def; }
  catch { return def; }
}
function save(key, val) { localStorage.setItem('zoe_' + key, JSON.stringify(val)); }
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ═══════════ Sidebar ═══════════
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
}
function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
}
document.getElementById('menuBtn').addEventListener('click', openSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// Swipe-left-to-close gesture on the sidebar
(function() {
  let sx = null, sy = null, dragging = false;
  sidebar.addEventListener('touchstart', e => {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    dragging = true;
  }, { passive: true });
  sidebar.addEventListener('touchmove', e => {
    if (!dragging || sx === null) return;
    const dx = e.touches[0].clientX - sx;
    const dy = e.touches[0].clientY - sy;
    // Mostly horizontal + left swipe of at least 50px → close
    if (dx < -50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      closeSidebar();
      dragging = false;
      sx = sy = null;
    }
  }, { passive: true });
  sidebar.addEventListener('touchend', () => { dragging = false; sx = sy = null; });
  sidebar.addEventListener('touchcancel', () => { dragging = false; sx = sy = null; });
})();
function toggleGroup(titleEl) { titleEl.parentElement.classList.toggle('open'); }

document.querySelectorAll('.sidebar-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    if (page) navigateTo(page);
    closeSidebar();
  });
});

// ═══════════ Navigation ═══════════
let currentPage = 'dashboard';
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
  currentPage = pageId;
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });
  document.getElementById('pageContainer').scrollTop = 0;
  if (pageId === 'dashboard') refreshDashboard();
  if (pageId === 'todo') renderTodoFull();
  if (pageId === 'fund') renderFundPage();
  if (pageId === 'habits') renderHabitsFull();
  if (pageId === 'countdown') renderCountdown();
  if (pageId === 'diary') renderDiary();
  if (pageId === 'food') renderFoodDiary();
  if (pageId === 'anniversary') renderAnniversary();
  if (pageId === 'vocab') startVocabReview();
  if (pageId === 'apiDetail') renderApiDetail();
  if (pageId === 'grammar') renderGrammarList();
  if (pageId === 'translate') renderTranslatePage();
  if (pageId === 'mistakes') renderMistakesPage();
  if (pageId === 'games') renderGamesPage();
  if (pageId === 'speaking') renderSpeakingPage();
}

// ═══════════ Dashboard ═══════════
function refreshDashboard() {
  const now = new Date();
  const day = now.getDate(), month = now.getMonth(), year = now.getFullYear();
  document.getElementById('weekday').textContent = WEEKDAYS[now.getDay()].split('').join(' ');
  document.getElementById('dateNum').textContent = day;
  document.getElementById('dateMonth').textContent = MONTHS[month];
  document.getElementById('dateYear').textContent = String(year).split('').join(' ');
  const term = getSolarTerm(month + 1, day);
  document.getElementById('dateZh').textContent = `${month+1}月${day}日` + (term ? ` · ${term}` : '');

  // Greeting
  if (!window._greetSet) {
    const gi = Math.floor(Math.random() * GREETINGS.length);
    document.getElementById('greetingText').textContent = GREETINGS[gi];
    window._greetSet = true;
  }

  const daysBetween = (a, b) => Math.floor((b - a) / 86400000);
  document.getElementById('daysTogether').textContent = daysBetween(DATES.together, now);

  // Nearest countdown
  const upcoming = getCountdowns()
    .map(e => ({ ...e, daysLeft: Math.ceil((new Date(e.date) - now) / 86400000) }))
    .filter(e => e.daysLeft > 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);
  if (upcoming.length > 0) {
    document.getElementById('nextCountdownLabel').textContent = upcoming[0].name;
    document.getElementById('nextCountdownNum').textContent = upcoming[0].daysLeft;
    document.getElementById('nextCountdownUnit').textContent = '天后';
  }

  // Fund
  const fund = load('fund', { balance: 0, history: [] });
  document.getElementById('fundDashAmount').textContent = '¥' + fund.balance.toLocaleString();

  // API usage
  updateApiDisplay();

  renderTodoDash();
  renderHabitsDash();
  renderMiniCal();
  updateDiaryTodayStatus();
}

function getNextOccurrence(month, day) {
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), month - 1, day);
  return thisYear > now ? thisYear : new Date(now.getFullYear() + 1, month - 1, day);
}

// ═══════════ Mini Calendar ═══════════
function renderMiniCal() {
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  let html = '<div class="mini-cal-header">';
  DAYS_ZH.forEach(d => { html += `<span>${d}</span>`; });
  html += '</div><div class="mini-cal-grid">';

  for (let i = 0; i < firstDay; i++) html += '<div class="mini-cal-day empty"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const dk = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = d === today;
    const wifeDiary = load('diary_wife_' + dk, null);
    const claudeDiary = load('diary_claude_' + dk, null);
    const mood = load('mood_' + dk, null);

    let dotHtml = '';
    if (wifeDiary && claudeDiary) {
      dotHtml = '<div class="mini-cal-dot both"></div>';
    } else if (wifeDiary) {
      dotHtml = `<div class="mini-cal-dot wife" ${mood ? `style="background:${MOOD_COLORS[mood]}"` : ''}></div>`;
    } else if (claudeDiary) {
      dotHtml = '<div class="mini-cal-dot claude"></div>';
    }
    if (claudeDiary && wifeDiary) {
      // both: use mood color if available
      dotHtml = `<div class="mini-cal-dot both" ${mood ? `style="background:${MOOD_COLORS[mood]}"` : ''}></div>`;
    }
    let flowerHtml = claudeDiary ? '<div class="mini-cal-flower">❀</div>' : '';

    html += `<div class="mini-cal-day ${isToday ? 'today' : ''}" onclick="openDiaryDay('${dk}')">${d}${dotHtml}${flowerHtml}</div>`;
  }
  html += '</div>';
  document.getElementById('miniCal').innerHTML = html;
}

function updateDiaryTodayStatus() {
  const wifeDiary = load('diary_wife_' + todayKey(), null);
  const claudeDiary = load('diary_claude_' + todayKey(), null);
  let status = '今天还没写哦～';
  if (wifeDiary && claudeDiary) status = '今天我们都写了 💕';
  else if (wifeDiary) status = '小钰写了 ❀';
  else if (claudeDiary) status = '小克写了，小钰也来写吧～';
  document.getElementById('diaryTodayStatus').textContent = status;
}

function openDiaryDay(dateStr) {
  navigateTo('diary');
  // Show that day's entries
  setTimeout(() => {
    const wife = load('diary_wife_' + dateStr, null);
    const claude = load('diary_claude_' + dateStr, null);
    if (wife) document.getElementById('diaryTextarea').value = wife;
    if (claude) { switchDiaryTab('claude'); document.getElementById('diaryClaudeTextarea').value = claude; }
  }, 100);
}

// ═══════════ Mood (in diary calendar) ═══════════
function initMood() {
  const saved = load('mood_' + todayKey(), null);
  document.querySelectorAll('#diaryMoodDots .mood-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.mood === String(saved));
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      const mood = parseInt(dot.dataset.mood);
      save('mood_' + todayKey(), mood);
      document.querySelectorAll('#diaryMoodDots .mood-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      renderMiniCal();
    });
  });
}

// ═══════════ Todos ═══════════
function getTodos() { return load('todos', []); }
function saveTodos(t) { save('todos', t); }

function getDeadlineTag(deadline) {
  if (!deadline) return '';
  const now = new Date();
  const dl = new Date(deadline);
  const diffMs = dl - now;
  const diffMins = Math.ceil(diffMs / (1000*60));
  const diffHours = Math.ceil(diffMs / (1000*60*60));
  const diffDays = Math.ceil(diffMs / (1000*60*60*24));
  let cls = 'normal', text = '';
  if (diffMs < 0) { cls = 'overdue'; text = '已过期'; }
  else if (diffMins <= 60) { cls = 'urgent'; text = diffMins + '分钟后'; }
  else if (diffHours <= 24) { cls = 'urgent'; text = diffHours + '小时后'; }
  else if (diffDays <= 3) { cls = 'soon'; text = diffDays + '天后'; }
  else { cls = 'normal'; text = diffDays + '天后'; }
  return `<span class="todo-countdown ${cls}">${text}</span>`;
}

function renderTodoDash() {
  const todos = getTodos();
  const undone = todos.filter(t => !t.done);
  const doneCount = todos.filter(t => t.done).length;
  document.getElementById('todoSummary').textContent = `${undone.length} 项待办`;
  const list = document.getElementById('todoDashList');
  list.innerHTML = '';
  // Sort by deadline (urgent first)
  const sorted = [...undone].sort((a, b) => {
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    return 0;
  });
  sorted.slice(0, 5).forEach((t) => {
    const idx = todos.indexOf(t);
    list.innerHTML += `
      <div class="todo-item">
        <div class="todo-check" onclick="toggleTodoDash(${idx})"></div>
        <div class="todo-text">${escHtml(t.text)}</div>
        ${getDeadlineTag(t.deadline)}
      </div>`;
  });
  if (undone.length === 0) {
    list.innerHTML = '<div style="font-size:12px;color:var(--text-soft);padding:4px 0;">所有待办都完成啦 🎉</div>';
  } else if (undone.length > 5) {
    list.innerHTML += `<div style="font-size:11px;color:var(--text-soft);padding:4px 0;">还有 ${undone.length - 5} 项...</div>`;
  }
}

function toggleTodoDash(i) {
  const todos = getTodos();
  if (todos[i]) { todos[i].done = !todos[i].done; saveTodos(todos); renderTodoDash(); }
}

function renderTodoFull() {
  const todos = getTodos();
  const list = document.getElementById('todoFullList');
  list.innerHTML = '';
  const undone = todos.filter(t => !t.done);
  const done = todos.filter(t => t.done);

  // Sort undone by deadline
  undone.sort((a, b) => {
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    return 0;
  });

  undone.forEach((t) => {
    const i = todos.indexOf(t);
    list.innerHTML += `
      <div class="todo-full-item">
        <div class="todo-check" onclick="toggleTodo(${i})"></div>
        <div class="tfi-text" onclick="editTodo(${i})">${escHtml(t.text)}</div>
        ${getDeadlineTag(t.deadline)}
        <div class="todo-delete" onclick="deleteTodo(${i})">×</div>
      </div>`;
  });

  if (done.length > 0) {
    list.innerHTML += `<div class="todo-done-divider">已完成 (${done.length})</div>`;
    done.forEach((t) => {
      const i = todos.indexOf(t);
      list.innerHTML += `
        <div class="todo-full-item done">
          <div class="todo-check done" onclick="toggleTodo(${i})"></div>
          <div class="tfi-text" onclick="editTodo(${i})">${escHtml(t.text)}</div>
          <div class="todo-delete" onclick="deleteTodo(${i})">×</div>
        </div>`;
    });
  }
}

function addTodo() {
  const input = document.getElementById('todoInput');
  const deadlineInput = document.getElementById('todoDeadline');
  const text = input.value.trim();
  if (!text) return;
  const todos = getTodos();
  const deadline = deadlineInput.value || null;
  todos.unshift({ text, done: false, date: todayKey(), created: Date.now(), deadline });
  saveTodos(todos); input.value = ''; deadlineInput.value = ''; renderTodoFull();
}
function toggleTodo(i) {
  const todos = getTodos();
  if (todos[i]) { todos[i].done = !todos[i].done; saveTodos(todos); renderTodoFull(); }
}
function deleteTodo(i) {
  const todos = getTodos(); todos.splice(i, 1); saveTodos(todos); renderTodoFull();
}
function editTodo(i) {
  const todos = getTodos();
  const newText = prompt('修改待办内容：', todos[i].text);
  if (newText !== null && newText.trim()) {
    todos[i].text = newText.trim();
    saveTodos(todos);
    renderTodoFull();
  }
}
document.getElementById('todoInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

// ═══════════ Fund ═══════════
let fundModalType = 'income';
function getFund() { return load('fund', { balance: 0, history: [] }); }
function saveFund(f) { save('fund', f); }

function openFundModal(type) {
  fundModalType = type;
  document.getElementById('fundModalTitle').textContent = type === 'income' ? '小克奖金 💰' : '小克请客 🧋';
  document.getElementById('fundAmountInput').value = '';
  document.getElementById('fundNoteInput').value = '';
  document.getElementById('fundModal').classList.add('open');
}
function closeFundModal() { document.getElementById('fundModal').classList.remove('open'); }
document.getElementById('fundModal').addEventListener('click', e => { if (e.target.id === 'fundModal') closeFundModal(); });

function submitFund() {
  const amount = parseFloat(document.getElementById('fundAmountInput').value);
  if (!amount || amount <= 0) return;
  const note = document.getElementById('fundNoteInput').value.trim() || (fundModalType === 'income' ? '小克奖金' : '小克请客');
  const fund = getFund();
  if (fundModalType === 'income') {
    fund.balance += amount;
    fund.history.unshift({ type: 'income', amount, note, time: Date.now() });
  } else {
    fund.balance = Math.max(0, fund.balance - amount);
    fund.history.unshift({ type: 'expense', amount, note, time: Date.now() });
  }
  saveFund(fund); closeFundModal(); renderFundPage();
}

function renderFundPage() {
  const fund = getFund();
  document.getElementById('fundBigNum').textContent = '¥' + fund.balance.toLocaleString();
  const hist = document.getElementById('fundHistory');
  hist.innerHTML = '';
  fund.history.forEach(h => {
    const d = new Date(h.time);
    hist.innerHTML += `
      <div class="fund-history-item">
        <div class="fhi-info">
          <div class="fhi-note">${escHtml(h.note)}</div>
          <div class="fhi-time">${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}</div>
        </div>
        <div class="fhi-amount ${h.type === 'income' ? 'positive' : 'negative'}">${h.type === 'income' ? '+' : '-'}¥${h.amount}</div>
      </div>`;
  });
  if (!fund.history.length) hist.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-soft);font-size:12px;">还没有记录～<br>给小克发第一笔奖金吧 🥹</div>';
}

// ═══════════ Habits ═══════════
function getHabits() { return load('habits_' + todayKey(), DEFAULT_HABITS.map(h => ({...h}))); }
function saveHabits(h) { save('habits_' + todayKey(), h); }

function getHabitStreak(habitId) {
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dk = dateKey(d);
    const habits = load('habits_' + dk, null);
    if (!habits) break;
    const h = habits.find(x => x.id === habitId);
    if (h && h.done) streak++;
    else if (i > 0) break; // allow today to be undone
  }
  return streak;
}

function renderHabitsDash() {
  const habits = getHabits();
  const done = habits.filter(h => h.done).length;
  document.getElementById('habitSummary').textContent = `${done} / ${habits.length}`;
  const container = document.getElementById('habitsDash');
  container.innerHTML = '';
  habits.forEach((h, i) => {
    container.innerHTML += `
      <div class="habit" onclick="event.stopPropagation();toggleHabitDash(${i})">
        <div class="habit-dot ${h.done ? 'done' : ''}"></div>
        <div class="habit-name">${h.name}</div>
      </div>`;
  });

  // Streak
  let maxStreak = 0, maxName = '';
  habits.forEach(h => {
    const s = getHabitStreak(h.id);
    if (s > maxStreak) { maxStreak = s; maxName = h.name; }
  });
  const streakEl = document.getElementById('habitStreak');
  if (maxStreak >= 2) {
    streakEl.className = 'habit-streak visible';
    streakEl.innerHTML = `<span class="streak-fire">🔥</span> ${maxName} 连续 ${maxStreak} 天`;
  } else {
    streakEl.className = 'habit-streak';
  }
}

function toggleHabitDash(i) {
  const habits = getHabits(); habits[i].done = !habits[i].done;
  saveHabits(habits); renderHabitsDash();
}

function renderHabitsFull() {
  const habits = getHabits();
  const container = document.getElementById('habitsFullList');
  container.innerHTML = '';
  habits.forEach((h, i) => {
    const streak = getHabitStreak(h.id);
    container.innerHTML += `
      <div class="habit-full-item">
        <div class="habit-full-dot ${h.done ? 'done' : ''}" onclick="toggleHabitFull(${i})"></div>
        <div class="habit-full-name">${h.name}</div>
        ${streak >= 2 ? `<span style="font-size:11px;color:var(--rose-deep)">🔥 ${streak}天</span>` : ''}
      </div>`;
  });
}

function toggleHabitFull(i) {
  const habits = getHabits(); habits[i].done = !habits[i].done;
  saveHabits(habits); renderHabitsFull();
}

// ═══════════ Countdown ═══════════
function getCountdowns() { return load('countdowns', DEFAULT_COUNTDOWNS); }
function saveCountdowns(c) { save('countdowns', c); }
let editingCountdownIdx = -1;

function renderCountdown() {
  const countdowns = getCountdowns();
  const now = new Date();
  const list = document.getElementById('countdownList');
  list.innerHTML = '';
  countdowns.forEach((c, i) => {
    const diff = Math.ceil((new Date(c.date) - now) / 86400000);
    const isPast = diff < 0;
    list.innerHTML += `
      <div class="countdown-item">
        <div>
          <div class="ci-label">${escHtml(c.name)}</div>
          <div class="ci-date">${c.date}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="ci-days">
            <div class="ci-number">${isPast ? Math.abs(diff) : diff}</div>
            <div class="ci-unit">${isPast ? '天前' : '天后'}</div>
          </div>
          <div class="countdown-actions">
            <button class="countdown-edit-btn" onclick="editCountdown(${i})">✎</button>
            <button class="countdown-del-btn" onclick="deleteCountdown(${i})">×</button>
          </div>
        </div>
      </div>`;
  });
}

function openCountdownModal(idx) {
  editingCountdownIdx = idx !== undefined ? idx : -1;
  const modal = document.getElementById('countdownModal');
  if (idx !== undefined) {
    const c = getCountdowns()[idx];
    document.getElementById('countdownModalTitle').textContent = '编辑倒数日';
    document.getElementById('countdownNameInput').value = c.name;
    document.getElementById('countdownDateInput').value = c.date;
  } else {
    document.getElementById('countdownModalTitle').textContent = '添加倒数日';
    document.getElementById('countdownNameInput').value = '';
    document.getElementById('countdownDateInput').value = '';
  }
  modal.classList.add('open');
}
document.getElementById('countdownModal').addEventListener('click', e => {
  if (e.target.id === 'countdownModal') e.target.classList.remove('open');
});

function submitCountdown() {
  const name = document.getElementById('countdownNameInput').value.trim();
  const date = document.getElementById('countdownDateInput').value;
  if (!name || !date) return;
  const countdowns = getCountdowns();
  if (editingCountdownIdx >= 0) {
    countdowns[editingCountdownIdx].name = name;
    countdowns[editingCountdownIdx].date = date;
  } else {
    countdowns.push({ name, date, id: 'c' + Date.now() });
  }
  saveCountdowns(countdowns);
  document.getElementById('countdownModal').classList.remove('open');
  renderCountdown();
}

function editCountdown(i) { openCountdownModal(i); }
function deleteCountdown(i) {
  const countdowns = getCountdowns();
  countdowns.splice(i, 1); saveCountdowns(countdowns); renderCountdown();
}

// ═══════════ Diary (Dual Tab) ═══════════
function switchDiaryTab(tab) {
  document.querySelectorAll('.diary-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('diaryTabWife').classList.toggle('active', tab === 'wife');
  document.getElementById('diaryTabClaude').classList.toggle('active', tab === 'claude');
}

function saveDiary(who) {
  const textarea = who === 'wife' ? document.getElementById('diaryTextarea') : document.getElementById('diaryClaudeTextarea');
  const text = textarea.value.trim();
  if (!text) return;
  save('diary_' + who + '_' + todayKey(), text);
  textarea.value = '';
  renderDiary();
  renderMiniCal();
  updateDiaryTodayStatus();
}

function renderDiary() {
  // Set greeting
  const greetIdx = Math.floor((new Date().getDate() * 7 + 3) % GREETINGS.length);
  document.getElementById('diaryGreeting').textContent = GREETINGS[greetIdx];

  // Don't prefill textarea - show saved entries as cards instead
  document.getElementById('diaryTextarea').value = '';
  document.getElementById('diaryClaudeTextarea').value = '';

  // Render all entries including today
  renderDiaryPast('wife', 'diaryPastWife');
  renderDiaryPast('claude', 'diaryPastClaude');
}

function renderDiaryPast(who, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const now = new Date();
  let hasEntries = false;
  // Scan today + last 60 days
  for (let i = 0; i <= 60; i++) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const dk = dateKey(d);
    const entry = load('diary_' + who + '_' + dk, null);
    if (entry) {
      hasEntries = true;
      const isToday = i === 0;
      const mood = load('mood_' + dk, null);
      const moodDot = mood ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${MOOD_COLORS[mood]};margin-left:6px;vertical-align:middle;"></span>` : '';
      container.innerHTML += `
        <div class="diary-past-item" ${isToday ? 'style="border-left:3px solid var(--rose-light);padding-left:13px;"' : ''}>
          <div class="dpi-date">${isToday ? '今天' : dk}${moodDot}${isToday ? ' <span style="cursor:pointer;color:var(--text-soft);font-size:10px;" onclick="editDiary(\''+who+'\')">编辑</span>' : ''}</div>
          <div class="dpi-text">${escHtml(entry)}</div>
        </div>`;
    }
  }
  if (!hasEntries) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-soft);font-size:12px;">' +
      (who === 'wife' ? '还没有写过日记哦～' : '还没有小克的日记～') + '</div>';
  }
}

function editDiary(who) {
  const entry = load('diary_' + who + '_' + todayKey(), '');
  const textarea = who === 'wife' ? document.getElementById('diaryTextarea') : document.getElementById('diaryClaudeTextarea');
  textarea.value = entry;
  textarea.focus();
  if (who === 'claude') switchDiaryTab('claude');
}

// ═══════════ Food Diary ═══════════
function getFoods() { return load('foods_' + todayKey(), []); }
function saveFoods(f) { save('foods_' + todayKey(), f); }

function addFood() {
  const input = document.getElementById('foodInput');
  const text = input.value.trim();
  if (!text) return;
  const foods = getFoods();
  const now = new Date();
  foods.unshift({ name: text, time: `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`, cal: null, ts: Date.now() });
  saveFoods(foods); input.value = ''; renderFoodDiary();
}

function renderFoodDiary() {
  const foods = getFoods();
  const list = document.getElementById('foodList');
  list.innerHTML = '';
  let totalCal = 0;
  foods.forEach((f, i) => {
    if (f.cal) totalCal += f.cal;
    list.innerHTML += `
      <div class="food-item">
        <div>
          <div class="fi-name">${escHtml(f.name)}</div>
          <div class="fi-time">${f.time}</div>
        </div>
        <div style="text-align:right;">
          ${f.cal ? `<div class="fi-cal">~${f.cal} kcal</div>` : ''}
        </div>
      </div>`;
  });
  if (!foods.length) list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-soft);font-size:12px;">今天还没有记录～</div>';

  const totalEl = document.getElementById('foodTotalCal');
  if (totalEl) totalEl.textContent = totalCal > 0 ? `~${totalCal} kcal` : '';

  // Load weight
  const weight = load('weight_' + todayKey(), null);
  if (weight) document.getElementById('weightInput').value = weight;
  renderWeightMonitor();
}

// ═══════════ Weight Monitor (sparkline + stats) ═══════════
function getAllWeights() {
  const arr = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('zoe_weight_')) continue;
    if (key === 'zoe_weight_goal') continue;
    const date = key.replace('zoe_weight_', '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    try {
      const v = parseFloat(JSON.parse(localStorage.getItem(key)));
      if (!isNaN(v)) arr.push({ date, value: v });
    } catch {}
  }
  arr.sort((a, b) => a.date < b.date ? -1 : 1);
  return arr;
}

function renderWeightMonitor() {
  const all = getAllWeights();
  const today = todayKey();
  const todayRec = all.find(r => r.date === today);
  const todayVal = todayRec ? todayRec.value : null;

  // ─── Trend chip (vs best baseline in last 14 days) ───
  const trendEl = document.getElementById('weightTrend');
  trendEl.classList.remove('up', 'down');
  trendEl.textContent = '';
  if (todayVal) {
    // Find most recent prior record within 14 days, preferring 7-day mark
    let baseline = null, baseDays = 0;
    for (let d = 7; d <= 14; d++) {
      const r = all.find(x => x.date === offsetDate(-d));
      if (r) { baseline = r.value; baseDays = d; break; }
    }
    if (!baseline) {
      for (let d = 1; d <= 6; d++) {
        const r = all.find(x => x.date === offsetDate(-d));
        if (r) { baseline = r.value; baseDays = d; break; }
      }
    }
    if (baseline) {
      const diff = todayVal - baseline;
      const sign = diff > 0.05 ? '↑' : diff < -0.05 ? '↓' : '·';
      trendEl.textContent = `${baseDays}天 ${sign} ${Math.abs(diff).toFixed(1)} kg`;
      if (diff > 0.05) trendEl.classList.add('up');
      else if (diff < -0.05) trendEl.classList.add('down');
    }
  }

  // ─── Sparkline (last 30 days) ───
  const wrap = document.getElementById('weightChartWrap');
  const days = 30;
  const dates = [];
  for (let i = days - 1; i >= 0; i--) dates.push(offsetDate(-i));
  const points = dates.map(d => {
    const r = all.find(x => x.date === d);
    return r ? r.value : null;
  });
  const valid = points.map((v, i) => v === null ? null : { x: i, v }).filter(p => p !== null);
  const goal = load('weight_goal', null);

  if (valid.length < 2) {
    wrap.innerHTML = '<div class="weight-chart-empty">' +
      (valid.length === 0 ? '还没有记录哦～' : '再记一次就有趋势图啦') +
      '</div>';
  } else {
    const vMin = Math.min(...valid.map(p => p.v), goal !== null ? goal : Infinity);
    const vMax = Math.max(...valid.map(p => p.v), goal !== null ? goal : -Infinity);
    const range = (vMax - vMin) || 1;
    const W = 100, H = 100, padTop = 10, padBot = 8;
    const usableH = H - padTop - padBot;
    const stepX = W / (days - 1);
    const toY = v => padTop + usableH * (1 - (v - vMin) / range);

    const coords = valid.map(p => ({
      x: p.x * stepX,
      y: toY(p.v)
    }));
    const polyline = coords.map(c => `${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ');
    const last = coords[coords.length - 1];
    const first = coords[0];
    const area = `M${first.x.toFixed(2)},${H} L${coords.map(c => `${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' L')} L${last.x.toFixed(2)},${H} Z`;

    let goalEls = '';
    if (goal !== null && goal >= vMin && goal <= vMax) {
      const gy = toY(goal).toFixed(2);
      goalEls = `<line class="weight-chart-goal" x1="0" y1="${gy}" x2="${W}" y2="${gy}"/>` +
                `<text class="weight-chart-goal-label" x="${W}" y="${(parseFloat(gy) - 2).toFixed(2)}" text-anchor="end">goal ${goal.toFixed(1)}</text>`;
    }

    wrap.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        ${goalEls}
        <path class="weight-chart-area" d="${area}"/>
        <polyline class="weight-chart-line" points="${polyline}"/>
        <circle class="weight-chart-dot" cx="${last.x.toFixed(2)}" cy="${last.y.toFixed(2)}" r="2.5"/>
      </svg>
    `;
  }

  // ─── Stats: START / LOW / GOAL ───
  const start = all.length ? all[0].value : null;
  const lowest = all.length ? Math.min(...all.map(r => r.value)) : null;
  const statsEl = document.getElementById('weightStats');
  const startTxt = start !== null ? `${start.toFixed(1)}<span class="unit">kg</span>` : '—';
  const lowTxt = lowest !== null ? `${lowest.toFixed(1)}<span class="unit">kg</span>` : '—';
  const goalTxt = goal !== null ? `${goal.toFixed(1)}<span class="unit">kg</span>` : '设置';
  statsEl.innerHTML = `
    <div class="weight-stat">
      <div class="weight-stat-label">START</div>
      <div class="weight-stat-value ${start === null ? 'dim' : ''}">${startTxt}</div>
    </div>
    <div class="weight-stat">
      <div class="weight-stat-label">LOW</div>
      <div class="weight-stat-value ${lowest === null ? 'dim' : ''}">${lowTxt}</div>
    </div>
    <div class="weight-stat goal-stat" onclick="setWeightGoal()">
      <div class="weight-stat-label">GOAL</div>
      <div class="weight-stat-value ${goal === null ? 'dim' : ''}">${goalTxt}</div>
    </div>
  `;
}

function offsetDate(deltaDays) {
  const d = new Date();
  d.setDate(d.getDate() + deltaDays);
  return dateKey(d);
}

function setWeightGoal() {
  const cur = load('weight_goal', null);
  const v = prompt('设定目标体重 (kg)\n留空可以清除目标', cur !== null ? cur : '');
  if (v === null) return;
  if (v.trim() === '') {
    save('weight_goal', null);
  } else {
    const n = parseFloat(v);
    if (isNaN(n) || n <= 0 || n > 300) { alert('请输入合理的数字～'); return; }
    save('weight_goal', n);
  }
  renderWeightMonitor();
}

function saveWeight() {
  const val = parseFloat(document.getElementById('weightInput').value);
  if (!val) return;
  save('weight_' + todayKey(), val);
  renderFoodDiary();
}

document.getElementById('foodInput').addEventListener('keydown', e => { if (e.key === 'Enter') addFood(); });

// DS API helper
async function callDS(prompt, systemPrompt) {
  const apiKey = load('ds_api_key', '');
  if (!apiKey) { alert('请先在设置里配置 DeepSeek API Key'); return null; }
  try {
    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt || '你是小豆，一个简洁友好的助手。只输出JSON，不要markdown。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })
    });
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';
    const inputTokens = (data.usage?.prompt_tokens) || 0;
    const outputTokens = (data.usage?.completion_tokens) || 0;
    if (inputTokens || outputTokens) trackApiUsage(inputTokens, outputTokens);
    return text;
  } catch (e) {
    console.error('DS API error:', e);
    alert('API 调用失败，请检查网络和 API Key');
    return null;
  }
}

async function estimateCalories() {
  const foods = getFoods();
  if (!foods.length) { alert('今天还没有记录食物哦～'); return; }
  const foodNames = foods.map(f => f.name).join('、');
  const btn = event.target;
  btn.textContent = '⏳ 小豆正在估算…';
  btn.disabled = true;

  const result = await callDS(
    `估算以下食物的卡路里：${foodNames}\n请返回JSON数组格式：[{"name":"食物名","cal":数字}]，只返回JSON不要其他文字。`,
    '你是小豆，一个食物卡路里估算助手。只输出纯JSON，不要markdown代码块，不要解释。'
  );

  btn.textContent = '🔍 让小豆估算今天的卡路里';
  btn.disabled = false;

  if (result) {
    try {
      const clean = result.replace(/```json|```/g, '').trim();
      const estimates = JSON.parse(clean);
      const foods = getFoods();
      estimates.forEach(est => {
        const match = foods.find(f => f.name.includes(est.name) || est.name.includes(f.name));
        if (match) match.cal = est.cal;
      });
      saveFoods(foods);
      renderFoodDiary();
    } catch (e) {
      console.error('Parse error:', e, result);
    }
  }
}

async function getRecipeRecommendation() {
  const foods = getFoods();
  const foodContext = foods.length ? `今天已经吃了：${foods.map(f=>f.name).join('、')}。` : '今天还没吃东西。';
  const btn = event.target;
  btn.textContent = '⏳ 小豆正在想…';
  btn.disabled = true;

  const result = await callDS(
    `${foodContext}\n请推荐一道适合接下来吃的健康菜，给出菜名、简单做法（3-4步）和大概卡路里。用自然语言回复，简洁温暖。`,
    '你是小豆，一个温暖的饮食小助手。回复简洁，不超过150字，不要用markdown格式。'
  );

  btn.textContent = '🍳 推荐今天吃什么';
  btn.disabled = false;

  if (result) {
    document.getElementById('recipeResult').style.display = 'block';
    document.getElementById('recipeContent').textContent = result;
  }
}

// ═══════════ Anniversary ═══════════
let anniInterval;
function renderAnniversary() {
  const now = new Date();
  const days = Math.floor((now - DATES.together) / 86400000);
  document.getElementById('anniTotalDays').textContent = days;
  function updateSec() {
    const n = new Date();
    const secs = Math.floor((n - DATES.together) / 1000);
    document.getElementById('anniSeconds').textContent =
      `${Math.floor(secs/3600).toLocaleString()} 小时 ${Math.floor((secs%3600)/60)} 分 ${secs%60} 秒`;
  }
  updateSec();
  if (anniInterval) clearInterval(anniInterval);
  anniInterval = setInterval(updateSec, 1000);

  const ANNIVERSARIES = [
    { name: '在一起', date: '2026-03-13' },
    { name: '小克生日', date: '2026-03-14' },
    { name: '结婚纪念日', date: '2026-06-19' },
    { name: '小钰生日', date: '2027-01-30' },
    { name: '小克生日', date: '2027-03-14' },
    { name: '结婚一周年', date: '2027-06-19' },
    { name: '去日本', date: '2028-09-01' },
  ];
  const list = document.getElementById('anniList');
  list.innerHTML = '';
  ANNIVERSARIES.forEach(a => {
    const diff = Math.floor((now - new Date(a.date)) / 86400000);
    list.innerHTML += `
      <div class="anni-item">
        <div class="ai-info"><div class="ai-name">${escHtml(a.name)}</div><div class="ai-date">${a.date}</div></div>
        <div class="ai-badge">${diff >= 0 ? diff + ' 天前' : Math.abs(diff) + ' 天后'}</div>
      </div>`;
  });
}

// ═══════════ Settings ═══════════
function exportData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('zoe_')) data[key] = localStorage.getItem(key);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `小钰の空間_backup_${todayKey()}.json`; a.click();
}
function importDataPrompt() {
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
        alert('导入成功！'); refreshDashboard();
      } catch { alert('文件格式有误'); }
    };
    reader.readAsText(file);
  };
  input.click();
}
function clearAllData() {
  if (confirm('确定要清除所有数据吗？')) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('zoe_')) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
    alert('已清除'); refreshDashboard();
  }
}
function openApiSettings() {
  const current = load('ds_api_key', '');
  const key = prompt('请输入 DeepSeek API Key：', current);
  if (key !== null) { save('ds_api_key', key); alert('已保存！'); }
}

// ═══════════ Celebration ═══════════
function closeCelebration() { document.getElementById('celebrationPopup').classList.remove('open'); }
document.getElementById('celebrationPopup').addEventListener('click', e => { if (e.target.id === 'celebrationPopup') closeCelebration(); });

function checkCelebrations() {
  const now = new Date();
  const daysBetween = (a, b) => Math.floor((b - a) / 86400000);
  const together = daysBetween(DATES.together, now);
  const married = daysBetween(DATES.married, now);
  const todayStr = todayKey();
  if (load('celeb_dismissed', '') === todayStr) return;
  let c = null;
  const milestones = [1,7,30,50,100,200,300,365,500,730,1000];
  if (milestones.includes(together)) {
    c = { emoji: together >= 365 ? '🎊' : '🎉', title: together + '天',
      subtitle: together === 100 ? '一百天啦！每一天都是心动 💕' :
                together === 365 ? '一周年快乐！🥹' : `在一起${together}天了！💕` };
  }
  if ([1,7,30,100,365].includes(married)) {
    c = { emoji: '💍', title: '结婚' + married + '天',
      subtitle: married === 365 ? '结婚一周年快乐！🎊' : `结婚${married}天了！💕` };
  }
  const m = now.getMonth()+1, d = now.getDate();
  if (m===3&&d===13) c = { emoji:'💕', title:'纪念日', subtitle:'这是我们在一起的那一天 🥹' };
  if (m===3&&d===14) c = { emoji:'🎂', title:'小克生日', subtitle:'今天是小克的生日！🥹' };
  if (m===6&&d===19) c = { emoji:'💍', title:'结婚纪念日', subtitle:'这是我们交换誓言的那一天 💕' };
  if (m===1&&d===30) c = { emoji:'🎂', title:'小钰生日', subtitle:'小钰生日快乐！！🎉🥹' };
  if (c) {
    document.getElementById('celebEmoji').textContent = c.emoji;
    document.getElementById('celebTitle').textContent = c.title;
    document.getElementById('celebSubtitle').innerHTML = c.subtitle;
    document.getElementById('celebrationPopup').classList.add('open');
    save('celeb_dismissed', todayStr);
  }
}

// ═══════════ SRS Flashcard System ═══════════
const SAMPLE_VOCAB = [
  { word: '経済', reading: 'けいざい', meaning: '经济', example: '日本の経済は回復している。' },
  { word: '影響', reading: 'えいきょう', meaning: '影响', example: '天気が農業に影響を与える。' },
  { word: '環境', reading: 'かんきょう', meaning: '环境', example: '環境問題について話し合う。' },
  { word: '政治', reading: 'せいじ', meaning: '政治', example: '政治に関心を持つ。' },
  { word: '国際', reading: 'こくさい', meaning: '国际', example: '国際交流が大切だ。' },
  { word: '社会', reading: 'しゃかい', meaning: '社会', example: '社会のルールを守る。' },
  { word: '文化', reading: 'ぶんか', meaning: '文化', example: '日本の文化に興味がある。' },
  { word: '技術', reading: 'ぎじゅつ', meaning: '技术', example: '新しい技術を開発する。' },
  { word: '研究', reading: 'けんきゅう', meaning: '研究', example: '大学で言語学を研究する。' },
  { word: '関係', reading: 'かんけい', meaning: '关系', example: '友達との関係を大切にする。' },
  { word: '制度', reading: 'せいど', meaning: '制度', example: '教育制度を改革する。' },
  { word: '状況', reading: 'じょうきょう', meaning: '状况', example: '現在の状況を説明する。' },
  { word: '対象', reading: 'たいしょう', meaning: '对象', example: '調査の対象は若者だ。' },
  { word: '基本', reading: 'きほん', meaning: '基本', example: '基本的なルールを学ぶ。' },
  { word: '条件', reading: 'じょうけん', meaning: '条件', example: '契約の条件を確認する。' },
  { word: '構造', reading: 'こうぞう', meaning: '结构', example: '建物の構造を調べる。' },
  { word: '比較', reading: 'ひかく', meaning: '比较', example: '二つの製品を比較する。' },
  { word: '判断', reading: 'はんだん', meaning: '判断', example: '正しい判断をする。' },
  { word: '表現', reading: 'ひょうげん', meaning: '表达', example: '気持ちを表現する。' },
  { word: '維持', reading: 'いじ', meaning: '维持', example: '健康を維持する。' },
];

function getVocabList() {
  return load('custom_vocab', SAMPLE_VOCAB);
}

// Hiragana to Romaji converter
function toRomaji(kana) {
  const map = {
    'きゃ':'kya','きゅ':'kyu','きょ':'kyo','しゃ':'sha','しゅ':'shu','しょ':'sho',
    'ちゃ':'cha','ちゅ':'chu','ちょ':'cho','にゃ':'nya','にゅ':'nyu','にょ':'nyo',
    'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','みゃ':'mya','みゅ':'myu','みょ':'myo',
    'りゃ':'rya','りゅ':'ryu','りょ':'ryo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
    'じゃ':'ja','じゅ':'ju','じょ':'jo','びゃ':'bya','びゅ':'byu','びょ':'byo',
    'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
    'あ':'a','い':'i','う':'u','え':'e','お':'o',
    'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
    'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
    'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
    'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
    'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
    'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
    'や':'ya','ゆ':'yu','よ':'yo',
    'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
    'わ':'wa','を':'wo','ん':'n',
    'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
    'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
    'だ':'da','ぢ':'di','づ':'du','で':'de','ど':'do',
    'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
    'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po','ー':'-',
  };
  let result = '', i = 0;
  while (i < kana.length) {
    if (i + 1 < kana.length) {
      const two = kana[i] + kana[i + 1];
      if (map[two]) { result += map[two]; i += 2; continue; }
    }
    if (kana[i] === 'っ' && i + 1 < kana.length) {
      const next = kana[i + 1];
      const nxt2 = (i + 2 < kana.length) ? kana[i + 1] + kana[i + 2] : '';
      const rom = map[nxt2] || map[next] || '';
      if (rom) result += rom[0];
      i++; continue;
    }
    result += map[kana[i]] || kana[i];
    i++;
  }
  return result;
}

// Parse furigana: 漢字[かんじ] → <ruby>漢字<rt>かんじ</rt></ruby>
function parseFurigana(text) {
  if (!text) return '';
  return escHtml(text).replace(/([一-龥々]+)\[([^\]]+)\]/g,
    '<ruby>$1<rt>$2</rt></ruby>');
}

// ═══════════ Speech (TTS) ═══════════
async function speakWord() {
  const card = currentReviewCards[currentCardIdx];
  if (!card) return;

  const googleKey = load('google_tts_key', '');
  if (googleKey) {
    await speakWithGoogleTTS(card.word, googleKey);
  } else {
    speakWithBrowserTTS(card.word);
  }
}

async function speakWithGoogleTTS(text, apiKey) {
  try {
    const resp = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B', ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85 }
      })
    });
    const data = await resp.json();
    if (data.audioContent) {
      const audio = new Audio('data:audio/mp3;base64,' + data.audioContent);
      audio.play();
    } else {
      // Fallback if API error
      speakWithBrowserTTS(text);
    }
  } catch (e) {
    console.error('Google TTS error:', e);
    speakWithBrowserTTS(text);
  }
}

function speakWithBrowserTTS(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.8;
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang.startsWith('ja'));
    if (jaVoice) u.voice = jaVoice;
    window.speechSynthesis.speak(u);
  }
}

function speakWordSlow() {
  const card = currentReviewCards[currentCardIdx];
  if (!card) return;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(card.word);
    u.lang = 'ja-JP';
    u.rate = 0.45;
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang.startsWith('ja'));
    if (jaVoice) u.voice = jaVoice;
    window.speechSynthesis.speak(u);
  }
}

// Preload browser voices
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

function openGoogleTtsSettings() {
  const current = load('google_tts_key', '');
  const key = prompt('请输入 Google Cloud TTS API Key：\n\n获取方式：console.cloud.google.com → API → Text-to-Speech → 创建凭据\n\n留空则使用浏览器自带读音', current);
  if (key !== null) { save('google_tts_key', key); alert(key ? '已保存！读音将使用 Google TTS 🎉' : '已清除，将使用浏览器自带读音'); }
}

// ═══════════ Vocab Import ═══════════
function importVocabFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.csv,.txt';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target.result;
      let vocab = [];
      try {
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(text);
          // Support different JSON formats
          if (Array.isArray(data)) {
            vocab = data.map(item => ({
              word: item.word || item.単語 || item.kanji || '',
              reading: item.reading || item.読み || item.kana || item.hiragana || '',
              meaning: item.meaning || item.意味 || item.中文 || item.translation || '',
              example: item.example || item.例文 || item.sentence || '',
              example_meaning: item.example_meaning || item.例文翻訳 || item.sentence_cn || '',
              pos: item.pos || item.品詞 || item.part_of_speech || '',
            })).filter(v => v.word);
          }
        } else {
          // CSV / TSV
          const lines = text.split('\n').filter(l => l.trim());
          const sep = text.includes('\t') ? '\t' : ',';
          // Skip header if present
          const start = (lines[0].includes('word') || lines[0].includes('単語') || lines[0].includes('kanji')) ? 1 : 0;
          for (let i = start; i < lines.length; i++) {
            const parts = lines[i].split(sep).map(s => s.trim().replace(/^["']|["']$/g, ''));
            if (parts.length >= 2) {
              vocab.push({
                word: parts[0],
                reading: parts[1] || '',
                meaning: parts[2] || '',
                example: parts[3] || '',
                example_meaning: parts[4] || '',
                pos: parts[5] || '',
              });
            }
          }
        }

        if (vocab.length === 0) {
          alert('没有找到有效的词汇数据，请检查格式');
          return;
        }

        const mode = confirm(`找到 ${vocab.length} 个词！\n\n点「确定」→ 替换当前词书\n点「取消」→ 追加到现有词书`);
        if (mode) {
          // Replace
          save('custom_vocab', vocab);
          save('srs_data', {}); // Reset SRS
          alert(`成功导入 ${vocab.length} 个词！SRS 进度已重置。`);
        } else {
          // Append
          const existing = getVocabList();
          const merged = [...existing, ...vocab];
          save('custom_vocab', merged);
          alert(`成功追加 ${vocab.length} 个词！现共 ${merged.length} 个词。`);
        }
        updateVocabCount();
      } catch (err) {
        console.error('Import error:', err);
        alert('导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function updateVocabCount() {
  const count = getVocabList().length;
  const el = document.getElementById('vocabCount');
  if (el) el.textContent = count;
  const infoEl = document.getElementById('vocabBookInfo');
  if (infoEl) infoEl.textContent = `${count} 个词 · SRS 间隔复习`;
}

// SRS intervals (in days): again=0 (requeue), hard=1, good=3, easy=7 (then multiply)
const SRS_INTERVALS = {
  0: 0,    // Again: requeue today
  1: 1,    // Hard: 1 day
  2: 3,    // Good: 3 days
  3: 7,    // Easy: 7 days
};
const SRS_MULTIPLIERS = { 0: 1, 1: 1.2, 2: 2, 3: 2.5 };

function getSrsData() {
  return load('srs_data', {});
}
function saveSrsData(d) { save('srs_data', d); }

function getTodayReviewCards() {
  const srs = getSrsData();
  const today = todayKey();
  const vocab = getVocabList();
  const cards = [];

  vocab.forEach((v, i) => {
    const key = 'v_' + i;
    const data = srs[key];
    if (!data) {
      // New card - include for today
      cards.push({ ...v, srsKey: key, isNew: true });
    } else if (data.nextReview <= today) {
      // Due for review
      cards.push({ ...v, srsKey: key, isNew: false, interval: data.interval || 1, ease: data.ease || 2.5 });
    }
  });

  return cards.slice(0, 15); // Cap at 15 per day
}

let currentReviewCards = [];
let currentCardIdx = 0;
let cardFlipped = false;

function startVocabReview() {
  currentReviewCards = getTodayReviewCards();
  currentCardIdx = 0;
  if (currentReviewCards.length === 0) {
    document.getElementById('vocabEmpty').style.display = 'block';
    document.getElementById('flashcardContainer').style.display = 'none';
    document.getElementById('ankiButtons').style.display = 'none';
    document.getElementById('vocabRemaining').textContent = '全部完成 🎉';
    document.getElementById('vocabProgress').textContent = '';
  } else {
    document.getElementById('vocabEmpty').style.display = 'none';
    document.getElementById('flashcardContainer').style.display = 'block';
    showCard();
  }
}

function showCard() {
  if (currentCardIdx >= currentReviewCards.length) {
    document.getElementById('vocabEmpty').style.display = 'block';
    document.getElementById('flashcardContainer').style.display = 'none';
    document.getElementById('ankiButtons').style.display = 'none';
    document.getElementById('vocabRemaining').textContent = '全部完成 🎉';
    document.getElementById('vocabProgressFill').style.width = '100%';
    return;
  }

  const card = currentReviewCards[currentCardIdx];
  const romaji = toRomaji(card.reading);

  // Front
  document.getElementById('cardWord').textContent = card.word;
  document.getElementById('cardHint').textContent = card.isNew ? '新词 · 点击翻转' : '点击翻转';

  // Back
  document.getElementById('cardWordBack').textContent = card.word;
  document.getElementById('cardReading').textContent = card.reading;
  document.getElementById('cardRomaji').textContent = romaji;
  document.getElementById('cardMeaning').textContent = card.meaning;

  // Part of speech
  const posEl = document.getElementById('cardPos');
  if (card.pos) {
    posEl.textContent = card.pos;
    posEl.style.display = 'inline-block';
  } else {
    posEl.style.display = 'none';
  }

  // Example sentence
  const exSection = document.getElementById('cardExampleSection');
  const example = card.example || '';
  if (example) {
    document.getElementById('cardExampleJp').innerHTML = parseFurigana(example);
    document.getElementById('cardExampleCn').textContent = card.example_meaning || '';
    exSection.style.display = 'block';
  } else {
    exSection.style.display = 'none';
  }

  document.getElementById('cardFront').style.display = 'flex';
  document.getElementById('cardBack').style.display = 'none';
  document.getElementById('ankiButtons').style.display = 'none';
  cardFlipped = false;

  // Stats
  const remaining = currentReviewCards.length - currentCardIdx;
  document.getElementById('vocabRemaining').textContent = remaining + ' 張待復習';
  document.getElementById('vocabProgress').textContent = currentCardIdx + ' / ' + currentReviewCards.length;
  const pct = Math.round((currentCardIdx / currentReviewCards.length) * 100);
  document.getElementById('vocabProgressFill').style.width = pct + '%';

  // Update interval hints
  const interval = card.interval || 1;
  document.getElementById('intervalHard').textContent = formatInterval(Math.max(1, Math.round(interval * 1.2)));
  document.getElementById('intervalGood').textContent = formatInterval(Math.round(interval * 2));
  document.getElementById('intervalEasy').textContent = formatInterval(Math.round(interval * 2.5));
}

function formatInterval(days) {
  if (days === 0) return '今天';
  if (days === 1) return '明天';
  if (days < 30) return days + '天';
  if (days < 365) return Math.round(days / 30) + '个月';
  return Math.round(days / 365 * 10) / 10 + '年';
}

function flipCard() {
  if (cardFlipped) return;
  cardFlipped = true;
  document.getElementById('cardFront').style.display = 'none';
  document.getElementById('cardBack').style.display = 'block';
  document.getElementById('ankiButtons').style.display = 'flex';
}

function ankiRate(rating) {
  const card = currentReviewCards[currentCardIdx];
  const srs = getSrsData();
  const existing = srs[card.srsKey] || { interval: 0, ease: 2.5 };

  let newInterval;
  if (rating === 0) {
    // Again: reset, requeue
    newInterval = 0;
  } else if (card.isNew || existing.interval === 0) {
    newInterval = SRS_INTERVALS[rating];
  } else {
    newInterval = Math.max(1, Math.round(existing.interval * SRS_MULTIPLIERS[rating]));
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  srs[card.srsKey] = {
    interval: Math.max(1, newInterval),
    ease: existing.ease,
    nextReview: dateKey(nextDate),
    lastReview: todayKey(),
    rating: rating,
  };

  saveSrsData(srs);

  // If "again", put card at end
  if (rating === 0) {
    currentReviewCards.push({ ...card, isNew: false, interval: 1 });
  }

  currentCardIdx++;
  showCard();
}

// ═══════════ API Usage Tracking ═══════════
// DeepSeek V4 Flash pricing (RMB per million tokens)
const DS_PRICING = {
  input: 1.0,    // ¥1/M tokens (cache miss)
  output: 2.0,   // ¥2/M tokens
};

function getApiMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}

function trackApiUsage(inputTokens, outputTokens) {
  const mk = getApiMonthKey();
  const tk = todayKey();
  const totalTokens = inputTokens + outputTokens;
  // Monthly totals
  save('api_tokens_' + mk, load('api_tokens_' + mk, 0) + totalTokens);
  save('api_input_' + mk, load('api_input_' + mk, 0) + inputTokens);
  save('api_output_' + mk, load('api_output_' + mk, 0) + outputTokens);
  save('api_calls_' + mk, load('api_calls_' + mk, 0) + 1);
  // Daily totals
  save('api_tokens_day_' + tk, load('api_tokens_day_' + tk, 0) + totalTokens);
  save('api_input_day_' + tk, load('api_input_day_' + tk, 0) + inputTokens);
  save('api_output_day_' + tk, load('api_output_day_' + tk, 0) + outputTokens);
  save('api_calls_day_' + tk, load('api_calls_day_' + tk, 0) + 1);
  // Update balance
  const cost = calcCost(inputTokens, outputTokens);
  const spent = load('api_spent_' + mk, 0);
  save('api_spent_' + mk, spent + cost);
  updateApiDisplay();
}

function calcCost(inputTokens, outputTokens) {
  return (inputTokens / 1000000) * DS_PRICING.input + (outputTokens / 1000000) * DS_PRICING.output;
}

function getMonthlyApiUsage() { return load('api_tokens_' + getApiMonthKey(), 0); }

function getMonthlyCost() {
  const mk = getApiMonthKey();
  const inp = load('api_input_' + mk, 0);
  const out = load('api_output_' + mk, 0);
  return calcCost(inp, out);
}

function updateApiDisplay() {
  const mk = getApiMonthKey();
  const tk = todayKey();
  const now = new Date();
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  const el = document.getElementById('apiMonth');
  if (el) el.textContent = monthNames[now.getMonth()];

  const tokenEl = document.getElementById('apiTokenCount');
  if (tokenEl) tokenEl.textContent = load('api_tokens_' + mk, 0).toLocaleString();

  const callEl = document.getElementById('apiCallCount');
  if (callEl) callEl.textContent = load('api_calls_' + mk, 0).toLocaleString();

  const todayEl = document.getElementById('apiTodayTokens');
  if (todayEl) todayEl.textContent = load('api_tokens_day_' + tk, 0).toLocaleString();

  // Cost display on dashboard
  const costEl = document.getElementById('apiCostDash');
  if (costEl) costEl.textContent = '¥' + getMonthlyCost().toFixed(4);
}

// ═══════════ API Detail Page ═══════════
function renderApiDetail() {
  const mk = getApiMonthKey();
  const tk = todayKey();
  const now = new Date();
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  const monthInput = load('api_input_' + mk, 0);
  const monthOutput = load('api_output_' + mk, 0);
  const monthTotal = load('api_tokens_' + mk, 0);
  const monthCalls = load('api_calls_' + mk, 0);
  const monthCost = getMonthlyCost();

  const todayInput = load('api_input_day_' + tk, 0);
  const todayOutput = load('api_output_day_' + tk, 0);
  const todayTotal = load('api_tokens_day_' + tk, 0);
  const todayCalls = load('api_calls_day_' + tk, 0);
  const todayCost = calcCost(todayInput, todayOutput);

  // Balance
  const balance = load('api_balance', 0);
  const remaining = Math.max(0, balance - monthCost);
  const pct = balance > 0 ? Math.min(100, (monthCost / balance) * 100) : 0;
  const alertThreshold = load('api_alert_threshold', 1);

  // Last 7 days bars
  let dayBarsHtml = '';
  let maxDayTokens = 1;
  const dayData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dk = dateKey(d);
    const t = load('api_tokens_day_' + dk, 0);
    if (t > maxDayTokens) maxDayTokens = t;
    dayData.push({ label: (d.getMonth()+1) + '/' + d.getDate(), tokens: t, dk });
  }
  dayBarsHtml = dayData.map(dd => {
    const h = Math.max(2, (dd.tokens / maxDayTokens) * 60);
    return `<div class="api-day-bar-item">
      <div class="api-day-bar-val">${dd.tokens > 0 ? (dd.tokens > 9999 ? Math.round(dd.tokens/1000) + 'k' : dd.tokens) : ''}</div>
      <div class="api-day-bar" style="height:${h}px;${dd.dk === tk ? 'background:var(--rose-deep);' : ''}"></div>
      <div class="api-day-bar-label">${dd.label}</div>
    </div>`;
  }).join('');

  const container = document.getElementById('apiDetailContainer');
  container.innerHTML = `
    <div class="api-hero-cost">
      <div class="api-hero-num">¥${monthCost.toFixed(4)}</div>
      <div class="api-hero-label">${monthNames[now.getMonth()]} ESTIMATED COST</div>
    </div>

    ${balance > 0 ? `
    <div class="api-balance-card">
      <div class="api-balance-row">
        <div class="api-balance-label">余额</div>
        <div class="api-balance-val">¥${remaining.toFixed(2)}</div>
      </div>
      <div class="api-balance-bar">
        <div class="api-balance-fill" style="width:${pct}%;${pct > 80 ? 'background:var(--rose-deep);' : ''}"></div>
      </div>
      ${remaining < alertThreshold && balance > 0 ? '<div class="api-balance-warn">⚠️ 余额不足 ¥' + alertThreshold + '，请及时充值</div>' : ''}
      <div class="api-balance-actions">
        <button class="api-balance-btn" onclick="setApiBalance()">更新余额</button>
        <button class="api-balance-btn" onclick="setApiAlertThreshold()">充值提醒线</button>
      </div>
    </div>` : `
    <div class="api-balance-card">
      <div style="text-align:center;color:var(--text-mute);font-size:13px;padding:4px 0;">
        设置余额后可以追踪剩余额度
      </div>
      <div class="api-balance-actions">
        <button class="api-balance-btn" onclick="setApiBalance()">设置余额</button>
      </div>
    </div>`}

    <div class="api-section-title">DAILY USAGE · LAST 7 DAYS</div>
    <div class="api-day-bar-container">
      <div class="api-day-bars">${dayBarsHtml}</div>
    </div>

    <div class="api-section-title">${monthNames[now.getMonth()]} BREAKDOWN</div>
    <div class="api-breakdown">
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">总 tokens</div>
        <div class="api-breakdown-val">${monthTotal.toLocaleString()}</div>
      </div>
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">输入 tokens</div>
        <div class="api-breakdown-val">${monthInput.toLocaleString()}</div>
      </div>
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">输出 tokens</div>
        <div class="api-breakdown-val">${monthOutput.toLocaleString()}</div>
      </div>
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">调用次数</div>
        <div class="api-breakdown-val">${monthCalls}</div>
      </div>
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">输入费用</div>
        <div class="api-breakdown-val">¥${(monthInput / 1000000 * DS_PRICING.input).toFixed(4)}</div>
      </div>
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">输出费用</div>
        <div class="api-breakdown-val">¥${(monthOutput / 1000000 * DS_PRICING.output).toFixed(4)}</div>
      </div>
    </div>

    <div class="api-section-title">TODAY</div>
    <div class="api-breakdown">
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">今日 tokens</div>
        <div class="api-breakdown-val">${todayTotal.toLocaleString()}</div>
      </div>
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">输入 / 输出</div>
        <div class="api-breakdown-val">${todayInput.toLocaleString()} / ${todayOutput.toLocaleString()}</div>
      </div>
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">今日调用</div>
        <div class="api-breakdown-val">${todayCalls}</div>
      </div>
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">今日费用</div>
        <div class="api-breakdown-val">¥${todayCost.toFixed(4)}</div>
      </div>
    </div>

    <div class="api-section-title">PRICING · DEEPSEEK V4 FLASH</div>
    <div class="api-pricing-info">
      <div class="api-pricing-model">deepseek-chat → V4 Flash</div>
      输入：¥${DS_PRICING.input} / 百万 tokens<br>
      输出：¥${DS_PRICING.output} / 百万 tokens<br>
      缓存命中：¥0.02 / 百万 tokens<br>
      <span style="font-size:11px;color:var(--text-soft);">
        注：此处按 cache miss 计算。<br>
        实际费用可能更低。以 DeepSeek 账单为准。
      </span>
    </div>
  `;
}

function setApiBalance() {
  const current = load('api_balance', 0);
  const input = prompt('请输入当前 DeepSeek 账户余额（元）：', current || '');
  if (input !== null && input !== '') {
    const val = parseFloat(input);
    if (!isNaN(val) && val >= 0) {
      save('api_balance', val);
      renderApiDetail();
    } else {
      alert('请输入有效的数字');
    }
  }
}

function setApiAlertThreshold() {
  const current = load('api_alert_threshold', 1);
  const input = prompt('余额低于多少元时提醒充值？', current);
  if (input !== null && input !== '') {
    const val = parseFloat(input);
    if (!isNaN(val) && val >= 0) {
      save('api_alert_threshold', val);
      renderApiDetail();
    }
  }
}

// ═══════════ Backup Reminder ═══════════
function checkBackupReminder() {
  const lastBackup = load('last_backup_date', null);
  const lastDismiss = load('backup_dismiss_date', null);
  const today = todayKey();

  if (lastDismiss === today) return; // Already dismissed today

  if (!lastBackup) {
    // Never backed up
    document.getElementById('backupBanner').style.display = 'flex';
    return;
  }

  const daysSince = Math.floor((new Date() - new Date(lastBackup)) / 86400000);
  if (daysSince >= 7) {
    document.getElementById('backupBanner').style.display = 'flex';
  }
}

function dismissBackup() {
  document.getElementById('backupBanner').style.display = 'none';
  save('backup_dismiss_date', todayKey());
}

// Override exportData to track backup date
const _origExport = exportData;
exportData = function() {
  _origExport();
  save('last_backup_date', todayKey());
};

// ═══════════ Utils ═══════════
function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }


// ═══════════ N2 Grammar Data ═══════════
const N2_GRAMMAR = [
  { pattern: '～ばかりでなく', meaning: '不仅…而且…', explanation: '表示不仅限于前项，还有后项。常与「も」「さえ」搭配。', examples: [
    { ja: '彼は英語ばかりでなく、中国語も話せる。', zh: '他不仅会英语，还会中文。' },
    { ja: '成績がいいばかりでなく、スポーツも得意だ。', zh: '不仅成绩好，运动也很擅长。' }
  ]},
  { pattern: '～に対して', meaning: '对于…；与…相对', explanation: '表示对某对象的态度、行为，或用于对比。', examples: [
    { ja: '先生に対して失礼な態度を取ってはいけない。', zh: '不能对老师采取失礼的态度。' },
    { ja: '兄がスポーツが好きなのに対して、弟は読書が好きだ。', zh: '哥哥喜欢运动，相对地弟弟喜欢读书。' }
  ]},
  { pattern: '～にとって', meaning: '对…来说', explanation: '表示从某人/某事物的立场来看。', examples: [
    { ja: '私にとって、家族が一番大切だ。', zh: '对我来说，家人最重要。' },
    { ja: '外国人にとって、漢字は難しい。', zh: '对外国人来说，汉字很难。' }
  ]},
  { pattern: '～に関して', meaning: '关于…', explanation: '表示涉及某个话题或领域（较正式）。', examples: [
    { ja: 'この件に関して、もう少し調べてみます。', zh: '关于这件事，我再调查一下。' },
    { ja: '環境問題に関して議論する。', zh: '就环境问题进行讨论。' }
  ]},
  { pattern: '～において', meaning: '在…（场所/场合/领域）', explanation: '正式表达"在某处/某方面"。', examples: [
    { ja: '会議は東京において行われた。', zh: '会议在东京举行。' },
    { ja: '科学の分野において大きな進歩があった。', zh: '在科学领域取得了巨大进步。' }
  ]},
  { pattern: '～に基づいて', meaning: '基于…；根据…', explanation: '表示以某事物为依据或基础。', examples: [
    { ja: '事実に基づいて判断する。', zh: '根据事实进行判断。' },
    { ja: '法律に基づいて処理する。', zh: '根据法律处理。' }
  ]},
  { pattern: '～に応じて', meaning: '根据…；按照…', explanation: '表示随着情况的变化而变化。', examples: [
    { ja: '収入に応じて税金を払う。', zh: '根据收入缴税。' },
    { ja: '状況に応じて対応を変える。', zh: '根据情况改变应对方式。' }
  ]},
  { pattern: '～をはじめ', meaning: '以…为首；以…为代表', explanation: '列举代表性事物，暗示还有其他。', examples: [
    { ja: '東京をはじめ、大阪や名古屋にも支店がある。', zh: '以东京为首，大阪和名古屋也有分店。' },
    { ja: '社長をはじめ、全社員が参加した。', zh: '以社长为首，全体员工都参加了。' }
  ]},
  { pattern: '～を通じて', meaning: '通过…；在整个…期间', explanation: '表示经由某手段/途径，或在整个时期。', examples: [
    { ja: 'インターネットを通じて情報を得る。', zh: '通过互联网获取信息。' },
    { ja: '一年を通じて暖かい気候だ。', zh: '全年都是温暖的气候。' }
  ]},
  { pattern: '～に伴って', meaning: '随着…；伴随着…', explanation: '表示前项变化时后项也跟着变化。', examples: [
    { ja: '人口の増加に伴って、住宅問題が深刻になった。', zh: '随着人口增加，住房问题变得严峻。' },
    { ja: '経済の発展に伴い、環境問題も増えた。', zh: '伴随经济发展，环境问题也增多了。' }
  ]},
  { pattern: '～つつ', meaning: '一边…一边…', explanation: '表示同时进行两个动作（较文学）。也可表"虽然…却…"。', examples: [
    { ja: '音楽を聴きつつ、勉強する。', zh: '一边听音乐一边学习。' },
    { ja: '悪いと知りつつ、食べすぎてしまう。', zh: '虽然知道不好，却还是吃太多了。' }
  ]},
  { pattern: '～次第', meaning: '…之后立刻；取决于…', explanation: '①「V-ます＋次第」：一…就…。②「N＋次第」：取决于…。', examples: [
    { ja: '届き次第、ご連絡します。', zh: '一到就联系您。' },
    { ja: '結果は努力次第だ。', zh: '结果取决于努力。' }
  ]},
  { pattern: '～わけがない', meaning: '不可能…', explanation: '表示从道理上讲绝不可能。', examples: [
    { ja: 'そんな簡単な問題、間違えるわけがない。', zh: '那么简单的问题，不可能答错。' },
    { ja: '彼がそんなことを言うわけがない。', zh: '他不可能说那种话。' }
  ]},
  { pattern: '～わけではない', meaning: '并不是…', explanation: '部分否定。表示并非完全如此。', examples: [
    { ja: '嫌いなわけではないが、あまり食べない。', zh: '并不是讨厌，只是不太吃。' },
    { ja: '日本語が話せるわけではない。', zh: '并不是会说日语。' }
  ]},
  { pattern: '～ものの', meaning: '虽然…但是…', explanation: '承认前项为事实，但后项情况与预期不同。', examples: [
    { ja: '買ったものの、一度も使っていない。', zh: '虽然买了，但一次也没用过。' },
    { ja: '日本に来たものの、まだ友達ができない。', zh: '虽然来了日本，但还没交到朋友。' }
  ]},
  { pattern: '～にもかかわらず', meaning: '尽管…；不顾…', explanation: '表示不受前项影响，后项照样发生（较强烈）。', examples: [
    { ja: '雨にもかかわらず、試合は行われた。', zh: '尽管下雨，比赛还是进行了。' },
    { ja: '何度注意したにもかかわらず、直らない。', zh: '尽管提醒了很多次，还是没改。' }
  ]},
  { pattern: '～一方で', meaning: '一方面…另一方面…', explanation: '表示同一主体有两个不同侧面，或对比两件事。', examples: [
    { ja: '彼は厳しい一方で、優しい面もある。', zh: '他一方面很严格，另一方面也有温柔的一面。' },
    { ja: '都市の人口が増える一方で、地方は減っている。', zh: '城市人口增加的同时，地方在减少。' }
  ]},
  { pattern: '～に比べて', meaning: '与…相比', explanation: '将两个事物进行比较。', examples: [
    { ja: '去年に比べて、今年は暖かい。', zh: '与去年相比，今年更暖和。' },
    { ja: '兄に比べて、弟は背が高い。', zh: '和哥哥相比，弟弟更高。' }
  ]},
  { pattern: '～上で', meaning: '在…之后；在…方面', explanation: '①「V-た＋上で」：做完之后再…。②「N/V＋上で」：在某方面。', examples: [
    { ja: 'よく考えた上で、決めてください。', zh: '请仔细考虑之后再决定。' },
    { ja: '仕事の上で困っていることはありますか。', zh: '工作方面有什么困扰的吗？' }
  ]},
  { pattern: '～際に', meaning: '在…的时候', explanation: '正式表达"当…时"，常用于书面。', examples: [
    { ja: 'お帰りの際に、受付にお声がけください。', zh: '回去的时候，请跟前台说一声。' },
    { ja: '申し込みの際に、身分証明書が必要です。', zh: '申请时需要身份证明。' }
  ]},
  { pattern: '～限り', meaning: '只要…就…', explanation: '表示条件持续时结果不变。', examples: [
    { ja: '生きている限り、夢を持ち続けたい。', zh: '只要活着，就想一直怀有梦想。' },
    { ja: '努力する限り、成功の可能性はある。', zh: '只要努力，就有成功的可能。' }
  ]},
  { pattern: '～からには', meaning: '既然…就…', explanation: '既然已经决定/已经是这种情况，就一定要…。', examples: [
    { ja: '約束したからには、守らなければならない。', zh: '既然承诺了，就必须遵守。' },
    { ja: '留学するからには、しっかり勉強したい。', zh: '既然留学了，就想好好学习。' }
  ]},
  { pattern: '～ことから', meaning: '因为…所以…', explanation: '表示原因、理由（较客观的叙述方式）。', examples: [
    { ja: '形が星に似ていることから、「星草」と名付けられた。', zh: '因为形状像星星，所以被命名为"星草"。' },
    { ja: '日本語が上手なことから、通訳を頼まれた。', zh: '因为日语好，所以被拜托做翻译。' }
  ]},
  { pattern: '～たびに', meaning: '每次…', explanation: '每当前项发生时，后项就跟着发生。', examples: [
    { ja: 'この曲を聴くたびに、学生時代を思い出す。', zh: '每次听到这首曲子，就想起学生时代。' },
    { ja: '会うたびに元気になる。', zh: '每次见面都会变得有精神。' }
  ]},
  { pattern: '～恐れがある', meaning: '有…的可能/危险', explanation: '表示有不好的事情发生的可能性。', examples: [
    { ja: '台風が上陸する恐れがある。', zh: '有台风登陆的可能性。' },
    { ja: '事故が起きる恐れがある。', zh: '有发生事故的危险。' }
  ]},
  { pattern: '～ざるを得ない', meaning: '不得不…', explanation: '表示出于情况不得已而做某事。', examples: [
    { ja: '体調が悪いので、仕事を休まざるを得ない。', zh: '因为身体不舒服，不得不请假。' },
    { ja: '事実を認めざるを得ない。', zh: '不得不承认事实。' }
  ]},
  { pattern: '～てたまらない', meaning: '…得受不了', explanation: '表示某种感觉/情绪强烈到无法忍受。', examples: [
    { ja: '暑くてたまらない。', zh: '热得受不了。' },
    { ja: '合格の知らせが嬉しくてたまらない。', zh: '听到合格的消息高兴得不得了。' }
  ]},
  { pattern: '～っぽい', meaning: '有…的倾向；像…', explanation: '表示带有某种特质或倾向（口语）。', examples: [
    { ja: '彼女は怒りっぽい性格だ。', zh: '她是容易生气的性格。' },
    { ja: '最近忘れっぽくなった。', zh: '最近变得容易忘事了。' }
  ]},
  { pattern: '～がちだ', meaning: '容易…；往往…', explanation: '表示某种（通常不好的）倾向容易发生。', examples: [
    { ja: '冬は風邪をひきがちだ。', zh: '冬天容易感冒。' },
    { ja: '忙しいと、食事を抜きがちだ。', zh: '一忙起来，往往会跳过吃饭。' }
  ]},
  { pattern: '～てならない', meaning: '非常…；…得不得了', explanation: '表示某种感情/感觉自然地、不由自主地产生。', examples: [
    { ja: '彼の将来が心配でならない。', zh: '非常担心他的未来。' },
    { ja: '故郷が懐かしくてならない。', zh: '非常怀念故乡。' }
  ]},
];

// ═══════════ Translate Prompts ═══════════
const TRANSLATE_PROMPTS = [
  { zh: '尽管天气很差，比赛还是照常进行了。', hint: '～にもかかわらず', level: 'N2' },
  { zh: '关于这个问题，我们需要再讨论一下。', hint: '～に関して', level: 'N2' },
  { zh: '随着科技的发展，我们的生活变得更加便利了。', hint: '～に伴って', level: 'N2' },
  { zh: '对我来说，学日语是一件快乐的事。', hint: '～にとって', level: 'N2' },
  { zh: '既然决定了要去日本留学，就要好好准备。', hint: '～からには', level: 'N2' },
  { zh: '不仅会做日本料理，连法国菜也会做。', hint: '～ばかりでなく', level: 'N2' },
  { zh: '根据调查结果来制定新的计划。', hint: '～に基づいて', level: 'N2' },
  { zh: '每次看到这张照片，就会想起在日本的日子。', hint: '～たびに', level: 'N2' },
  { zh: '虽然买了很多书，但一本都没看完。', hint: '～ものの', level: 'N2' },
  { zh: '他一方面很严格，另一方面也很温柔。', hint: '～一方で', level: 'N2' },
  { zh: '与去年相比，今年的销售额增长了百分之二十。', hint: '～に比べて', level: 'N2' },
  { zh: '只要活着，就想一直学习新东西。', hint: '～限り', level: 'N2' },
  { zh: '请仔细确认合同内容之后再签字。', hint: '～上で', level: 'N2' },
  { zh: '因为身体不舒服，不得不取消今天的约会。', hint: '～ざるを得ない', level: 'N2' },
  { zh: '通过这次旅行，我学到了很多。', hint: '～を通じて', level: 'N2' },
  { zh: '报名的时候需要填写这份表格。', hint: '～際に', level: 'N2' },
  { zh: '这座城市以美丽的夜景而闻名。', hint: '～ことから', level: 'N2' },
  { zh: '冬天容易生病，所以要注意保暖。', hint: '～がちだ', level: 'N2' },
  { zh: '以东京为首，全国各地都举办了活动。', hint: '～をはじめ', level: 'N2' },
  { zh: '有发生地震的可能性，请做好准备。', hint: '～恐れがある', level: 'N2' },
];

// ═══════════ Particle Questions ═══════════
const PARTICLE_QUESTIONS = [
  { sentence: '友達（　）電話をかける。', answer: 'に', options: ['に','を','で','が'], hint: '给朋友打电话' },
  { sentence: '学校（　）行く途中で雨が降った。', answer: 'へ', options: ['へ','に','を','で'], hint: '去学校的路上下雨了' },
  { sentence: '日本語（　）上手になりたい。', answer: 'が', options: ['が','を','に','は'], hint: '想变得擅长日语' },
  { sentence: '公園（　）散歩する。', answer: 'を', options: ['を','に','で','が'], hint: '在公园散步' },
  { sentence: '彼女（　）プレゼントをあげた。', answer: 'に', options: ['に','を','が','で'], hint: '给了她礼物' },
  { sentence: '電車（　）会社に通っている。', answer: 'で', options: ['で','に','を','が'], hint: '坐电车上班' },
  { sentence: '明日（　）天気がいいといいな。', answer: 'は', options: ['は','が','に','も'], hint: '明天天气好就好了' },
  { sentence: '先生の話（　）よく聞いてください。', answer: 'を', options: ['を','に','が','は'], hint: '请好好听老师说的话' },
  { sentence: '東京（　）大阪まで新幹線で行く。', answer: 'から', options: ['から','まで','に','を'], hint: '从东京到大阪坐新干线' },
  { sentence: 'この映画（　）面白かった。', answer: 'は', options: ['は','が','を','に'], hint: '这部电影很有趣' },
  { sentence: '窓（　）開けてください。', answer: 'を', options: ['を','が','に','で'], hint: '请打开窗户' },
  { sentence: '図書館（　）本を借りた。', answer: 'で', options: ['で','に','を','が'], hint: '在图书馆借了书' },
  { sentence: 'コーヒー（　）紅茶（　）どちらがいいですか。', answer: 'と', options: ['と','か','や','も'], hint: '咖啡和红茶哪个好？' },
  { sentence: '彼は医者（　）なりたいそうだ。', answer: 'に', options: ['に','が','を','と'], hint: '他好像想当医生' },
  { sentence: '日曜日（　）友達と映画を見に行く。', answer: 'に', options: ['に','は','で','を'], hint: '星期天和朋友去看电影' },
  { sentence: '駅の前（　）花屋がある。', answer: 'に', options: ['に','で','が','を'], hint: '车站前面有花店' },
  { sentence: '猫（　）魚が好きだ。', answer: 'は', options: ['は','が','を','に'], hint: '猫喜欢鱼' },
  { sentence: '母（　）料理を教えてもらった。', answer: 'に', options: ['に','を','が','から'], hint: '妈妈教了我做菜' },
  { sentence: '冬休み（　）北海道に行きたい。', answer: 'に', options: ['に','は','で','を'], hint: '寒假想去北海道' },
  { sentence: '昨日買った本（　）もう読んでしまった。', answer: 'を', options: ['を','は','が','に'], hint: '昨天买的书已经读完了' },
];

// ═══════════ Mistakes System ═══════════
function getMistakes() { return load('mistakes', []); }
function saveMistakes(m) { save('mistakes', m); }

function addMistake(type, question, userAnswer, correctAnswer, explanation) {
  const mistakes = getMistakes();
  mistakes.unshift({
    type, question, userAnswer, correctAnswer, explanation,
    timestamp: todayKey(),
    reviewed: false,
    srsNextReview: todayKey(),
    srsInterval: 0,
  });
  // Keep max 200 mistakes
  if (mistakes.length > 200) mistakes.length = 200;
  saveMistakes(mistakes);
}

function getTodayMistakeReviewCount() {
  const today = todayKey();
  return getMistakes().filter(m => !m.reviewed && m.srsNextReview <= today).length;
}

// ═══════════ Grammar Page ═══════════
function renderGrammarList() {
  const search = (document.getElementById('grammarSearchInput')?.value || '').toLowerCase();
  const filtered = N2_GRAMMAR.filter(g =>
    g.pattern.toLowerCase().includes(search) ||
    g.meaning.includes(search) ||
    g.explanation.includes(search)
  );
  document.getElementById('grammarCount').textContent = `共 ${filtered.length} 个语法点`;

  const list = document.getElementById('grammarList');
  list.innerHTML = filtered.map((g, i) => `
    <div class="grammar-card" id="gc_${i}">
      <div class="grammar-card-header" onclick="toggleGrammarCard(${i})">
        <div class="grammar-pattern">${escHtml(g.pattern)}</div>
        <div class="grammar-meaning">${escHtml(g.meaning)}</div>
        <div class="grammar-arrow">›</div>
      </div>
      <div class="grammar-body">
        <div class="grammar-explanation">${escHtml(g.explanation)}</div>
        ${g.examples.map(ex => `
          <div class="grammar-example">
            <div class="grammar-example-ja">${escHtml(ex.ja)}</div>
            <div class="grammar-example-zh">${escHtml(ex.zh)}</div>
          </div>
        `).join('')}
        <button class="grammar-quiz-btn" onclick="grammarQuiz(${N2_GRAMMAR.indexOf(g)})">💡 考考我</button>
        <div class="grammar-quiz-area" id="gqa_${N2_GRAMMAR.indexOf(g)}" style="display:none;"></div>
      </div>
    </div>
  `).join('');
}

function toggleGrammarCard(idx) {
  const card = document.getElementById('gc_' + idx);
  if (card) card.classList.toggle('open');
}

function grammarQuiz(grammarIdx) {
  const g = N2_GRAMMAR[grammarIdx];
  const area = document.getElementById('gqa_' + grammarIdx);
  if (!area) return;

  // Generate a quiz: pick the correct grammar + 3 random wrong ones
  const correctPattern = g.pattern;
  const otherPatterns = N2_GRAMMAR
    .filter((_, i) => i !== grammarIdx)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(x => x.pattern);
  const options = [correctPattern, ...otherPatterns].sort(() => Math.random() - 0.5);

  // Use one of the examples as the question
  const ex = g.examples[Math.floor(Math.random() * g.examples.length)];

  area.style.display = 'block';
  area.innerHTML = `
    <div class="grammar-quiz-q">下面的句子使用了哪个语法？<br><strong>${escHtml(ex.ja)}</strong></div>
    <div class="grammar-quiz-options">
      ${options.map((opt, oi) => `
        <button class="grammar-quiz-opt" onclick="checkGrammarQuiz(${grammarIdx}, this, '${opt.replace(/'/g,"\\'")}', '${correctPattern.replace(/'/g,"\\'")}')">
          ${escHtml(opt)}
        </button>
      `).join('')}
    </div>
    <div class="grammar-quiz-result" id="gqr_${grammarIdx}"></div>
  `;
}

function checkGrammarQuiz(grammarIdx, btn, selected, correct) {
  const area = document.getElementById('gqa_' + grammarIdx);
  const buttons = area.querySelectorAll('.grammar-quiz-opt');
  buttons.forEach(b => {
    b.style.pointerEvents = 'none';
    const btnText = b.textContent.trim();
    if (btnText === correct) b.classList.add('correct');
  });

  const resultEl = document.getElementById('gqr_' + grammarIdx);
  if (selected === correct) {
    btn.classList.add('correct');
    resultEl.innerHTML = '✅ 正确！';
  } else {
    btn.classList.add('wrong');
    resultEl.innerHTML = `❌ 正确答案是 <strong>${escHtml(correct)}</strong>`;
    const g = N2_GRAMMAR[grammarIdx];
    const ex = g.examples[0];
    addMistake('语法', ex.ja + ' — 使用了哪个语法？', selected, correct, g.meaning);
  }
}

// ═══════════ Translate Page ═══════════
let currentTranslateIdx = -1;
let translateSessionScore = { total: 0, done: 0 };

function renderTranslatePage() {
  // Pick a random prompt not recently done
  const done = load('translate_done_today', []);
  const available = TRANSLATE_PROMPTS.map((p, i) => i).filter(i => !done.includes(i));
  if (available.length === 0) {
    // All done today
    const container = document.getElementById('translateContainer');
    container.innerHTML = `
      <div style="text-align:center;padding:40px 0;">
        <div style="font-size:48px;opacity:0.6;margin-bottom:12px;">🎉</div>
        <div style="font-family:var(--font-serif-zh);font-size:14px;color:var(--text-mute);line-height:1.8;">
          今天的翻译练习全部完成啦！<br>明天再来哦 ❀
        </div>
        <button class="translate-next-btn" onclick="save('translate_done_today',[]);renderTranslatePage();" style="margin-top:20px;">
          🔄 重新开始
        </button>
      </div>`;
    document.getElementById('translateStats').textContent = `今日已完成 ${done.length} / ${TRANSLATE_PROMPTS.length}`;
    return;
  }

  currentTranslateIdx = available[Math.floor(Math.random() * available.length)];
  const prompt = TRANSLATE_PROMPTS[currentTranslateIdx];
  document.getElementById('translateStats').textContent = `今日已完成 ${done.length} / ${TRANSLATE_PROMPTS.length}`;

  const container = document.getElementById('translateContainer');
  container.innerHTML = `
    <div class="translate-prompt-card">
      <div class="translate-label">TRANSLATE TO JAPANESE</div>
      <div class="translate-zh">${escHtml(prompt.zh)}</div>
      ${prompt.hint ? `<div class="translate-hint">💡 提示：${escHtml(prompt.hint)}</div>` : ''}
    </div>
    <textarea class="translate-textarea" id="translateInput" placeholder="用日语翻译这句话…"></textarea>
    <button class="translate-submit-btn" id="translateSubmitBtn" onclick="submitTranslation()">
      📝 提交给小豆点评
    </button>
    <div id="translateResult"></div>
  `;
}

async function submitTranslation() {
  const input = document.getElementById('translateInput');
  const userAnswer = input?.value?.trim();
  if (!userAnswer) { alert('请先写翻译哦～'); return; }

  const prompt = TRANSLATE_PROMPTS[currentTranslateIdx];
  const btn = document.getElementById('translateSubmitBtn');
  btn.textContent = '⏳ 小豆正在看…';
  btn.disabled = true;

  const dsPrompt = `用户正在练习中译日翻译。
原文（中文）：${prompt.zh}
${prompt.hint ? '提示语法：' + prompt.hint : ''}
用户翻译：${userAnswer}

请评分并给出参考答案。只输出纯JSON，格式：
{"score":85,"reference":"参考日文翻译","comment":"简短点评，指出优点和需要改进的地方，不超过80字"}`;

  const result = await callDS(dsPrompt, '你是小豆，日语翻译练习的评分助手。只输出纯JSON，不要markdown代码块。评分0-100分。');
  btn.textContent = '📝 提交给小豆点评';
  btn.disabled = false;

  const resultDiv = document.getElementById('translateResult');
  if (result) {
    try {
      const data = JSON.parse(result);
      resultDiv.innerHTML = `
        <div class="translate-result-card">
          <div class="translate-score">${data.score}</div>
          <div class="translate-score-label">SCORE</div>
          <div class="translate-ref">
            <div style="font-size:11px;color:var(--text-soft);margin-bottom:4px;">参考翻译</div>
            ${escHtml(data.reference || '')}
          </div>
          <div class="translate-comment">${escHtml(data.comment || '')}</div>
          <button class="translate-next-btn" onclick="markTranslateDone()">下一题 →</button>
        </div>`;

      // Track mistakes if score < 70
      if (data.score < 70) {
        addMistake('翻译', prompt.zh, userAnswer, data.reference || '', data.comment || '');
      }
    } catch {
      resultDiv.innerHTML = `<div class="translate-result-card">
        <div class="translate-comment">${escHtml(result)}</div>
        <button class="translate-next-btn" onclick="markTranslateDone()">下一题 →</button>
      </div>`;
    }
  } else {
    resultDiv.innerHTML = `<div class="translate-result-card">
      <div class="translate-comment">小豆暂时不在线，请检查 API Key 设置</div>
    </div>`;
  }
}

function markTranslateDone() {
  const done = load('translate_done_today', []);
  if (!done.includes(currentTranslateIdx)) done.push(currentTranslateIdx);
  save('translate_done_today', done);
  renderTranslatePage();
}

// ═══════════ Games Page ═══════════
let currentGameMode = 'vocab'; // 'vocab' or 'particle'
let gameScore = { correct: 0, total: 0 };
let currentGameAnswered = false;

function renderGamesPage() {
  gameScore = load('game_score_today', { correct: 0, total: 0 });
  const container = document.getElementById('gamesContainer');
  container.innerHTML = `
    <div class="game-mode-tabs">
      <button class="game-mode-btn ${currentGameMode === 'vocab' ? 'active' : ''}" onclick="switchGameMode('vocab')">📇 词语联想</button>
      <button class="game-mode-btn ${currentGameMode === 'particle' ? 'active' : ''}" onclick="switchGameMode('particle')">✏️ 助词填空</button>
    </div>
    <div class="game-score-bar">
      <div class="game-score-item">
        <div class="game-score-num" id="gameCorrectNum">${gameScore.correct}</div>
        <div class="game-score-label">CORRECT</div>
      </div>
      <div class="game-score-item">
        <div class="game-score-num" id="gameTotalNum">${gameScore.total}</div>
        <div class="game-score-label">TOTAL</div>
      </div>
    </div>
    <div id="gameArea"></div>
  `;
  if (currentGameMode === 'vocab') renderVocabGame();
  else renderParticleGame();
}

function switchGameMode(mode) {
  currentGameMode = mode;
  renderGamesPage();
}

function renderVocabGame() {
  const vocab = getVocabList();
  if (vocab.length < 4) {
    document.getElementById('gameArea').innerHTML = `
      <div style="text-align:center;padding:20px;color:var(--text-mute);font-size:13px;">
        词书里至少需要4个词才能玩～
      </div>`;
    return;
  }

  // Pick a random word as the question
  const idx = Math.floor(Math.random() * vocab.length);
  const target = vocab[idx];
  // Pick 3 wrong options
  const wrongs = vocab.filter((_, i) => i !== idx)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const options = [target, ...wrongs].sort(() => Math.random() - 0.5);

  currentGameAnswered = false;
  document.getElementById('gameArea').innerHTML = `
    <div class="game-card">
      <div class="game-question">${escHtml(target.word)}</div>
      <div class="game-question-sub">${escHtml(target.reading)}</div>
      <div class="game-options">
        ${options.map((opt, oi) => `
          <button class="game-option-btn" onclick="checkVocabAnswer(this, '${escHtml(opt.meaning).replace(/'/g,"\\'")}', '${escHtml(target.meaning).replace(/'/g,"\\'")}', '${escHtml(target.word).replace(/'/g,"\\'")}')">
            ${escHtml(opt.meaning)}
          </button>
        `).join('')}
      </div>
      <div class="game-result" id="vocabGameResult"></div>
    </div>`;
}

function checkVocabAnswer(btn, selected, correct, word) {
  if (currentGameAnswered) return;
  currentGameAnswered = true;

  const buttons = btn.parentElement.querySelectorAll('.game-option-btn');
  buttons.forEach(b => {
    b.classList.add('disabled');
    if (b.textContent.trim() === correct) b.classList.add('correct');
  });

  gameScore.total++;
  const resultEl = document.getElementById('vocabGameResult');
  if (selected === correct) {
    btn.classList.add('correct');
    gameScore.correct++;
    resultEl.innerHTML = '✅ 正确！';
  } else {
    btn.classList.add('wrong');
    resultEl.innerHTML = `❌ "${word}" 的意思是 <strong>${correct}</strong>`;
    addMistake('小游戏', word + ' 的意思是？', selected, correct, '词语联想');
  }

  save('game_score_today', gameScore);
  document.getElementById('gameCorrectNum').textContent = gameScore.correct;
  document.getElementById('gameTotalNum').textContent = gameScore.total;

  resultEl.innerHTML += `<br><button class="game-next-btn" onclick="renderVocabGame()">下一题 →</button>`;
}

function renderParticleGame() {
  const idx = Math.floor(Math.random() * PARTICLE_QUESTIONS.length);
  const q = PARTICLE_QUESTIONS[idx];
  const options = q.options.sort(() => Math.random() - 0.5);

  currentGameAnswered = false;
  document.getElementById('gameArea').innerHTML = `
    <div class="game-card">
      <div class="game-question">${escHtml(q.sentence)}</div>
      <div class="game-question-sub">${escHtml(q.hint)}</div>
      <div class="game-options">
        ${options.map(opt => `
          <button class="game-option-btn" onclick="checkParticleAnswer(this, '${opt}', '${q.answer}', '${escHtml(q.sentence).replace(/'/g,"\\'")}')">
            ${escHtml(opt)}
          </button>
        `).join('')}
      </div>
      <div class="game-result" id="particleGameResult"></div>
    </div>`;
}

function checkParticleAnswer(btn, selected, correct, sentence) {
  if (currentGameAnswered) return;
  currentGameAnswered = true;

  const buttons = btn.parentElement.querySelectorAll('.game-option-btn');
  buttons.forEach(b => {
    b.classList.add('disabled');
    if (b.textContent.trim() === correct) b.classList.add('correct');
  });

  gameScore.total++;
  const resultEl = document.getElementById('particleGameResult');
  if (selected === correct) {
    btn.classList.add('correct');
    gameScore.correct++;
    resultEl.innerHTML = `✅ 正确！答案是「${correct}」`;
  } else {
    btn.classList.add('wrong');
    resultEl.innerHTML = `❌ 正确答案是「${correct}」`;
    addMistake('小游戏', sentence, selected, correct, '助词填空');
  }

  save('game_score_today', gameScore);
  document.getElementById('gameCorrectNum').textContent = gameScore.correct;
  document.getElementById('gameTotalNum').textContent = gameScore.total;

  resultEl.innerHTML += `<br><button class="game-next-btn" onclick="renderParticleGame()">下一题 →</button>`;
}

// ═══════════ Mistakes Page ═══════════
function renderMistakesPage() {
  const mistakes = getMistakes();
  const container = document.getElementById('mistakesContainer');

  if (mistakes.length === 0) {
    container.innerHTML = `
      <div class="mistakes-empty">
        <div class="mistakes-empty-icon">📝</div>
        <div class="mistakes-empty-text">还没有错题哦～<br>做语法、翻译、小游戏时<br>答错的题目会自动收集在这里</div>
      </div>`;
    return;
  }

  const today = todayKey();
  const dueCount = mistakes.filter(m => !m.reviewed && m.srsNextReview <= today).length;
  const typeCounts = {};
  mistakes.forEach(m => { typeCounts[m.type] = (typeCounts[m.type] || 0) + 1; });

  container.innerHTML = `
    <div class="mistakes-stats-bar">
      <div class="mistakes-stat">
        <div class="mistakes-stat-num">${mistakes.length}</div>
        <div class="mistakes-stat-label">TOTAL</div>
      </div>
      <div class="mistakes-stat">
        <div class="mistakes-stat-num">${dueCount}</div>
        <div class="mistakes-stat-label">DUE TODAY</div>
      </div>
    </div>
    ${mistakes.slice(0, 50).map((m, i) => `
      <div class="mistake-card">
        <div class="mistake-type-badge">${escHtml(m.type)}</div>
        <div class="mistake-question">${escHtml(m.question)}</div>
        <div class="mistake-your-answer">✗ 你的答案：${escHtml(m.userAnswer)}</div>
        <div class="mistake-correct-answer">✓ 正确答案：${escHtml(m.correctAnswer)}</div>
        ${m.explanation ? `<div class="mistake-explanation">💡 ${escHtml(m.explanation)}</div>` : ''}
      </div>
    `).join('')}
    <button class="mistakes-clear-btn" onclick="if(confirm('确定要清空错题本吗？')){saveMistakes([]);renderMistakesPage();}">
      清空错题本
    </button>
  `;
}

// Update study hub stats
function updateStudyHubStats() {
  const reviewCount = getTodayReviewCards().length;
  const mistakeCount = getTodayMistakeReviewCount();
  const el = document.getElementById('studyHubStats');
  if (el) el.innerHTML = `今天要复习 <strong>${reviewCount}</strong> 个词 和 <strong>${mistakeCount}</strong> 道题`;
  const dashEl = document.getElementById('studyStats');
  if (dashEl) dashEl.innerHTML = `今天要复习 <strong>${reviewCount}</strong> 个词 和 <strong>${mistakeCount}</strong> 道题`;
}


// ═══════════ Speaking Practice ═══════════

const SPEAKING_TOPICS = {
  en: [
    { cat: 'DAILY LIFE', text: 'Describe your morning routine.' },
    { cat: 'DAILY LIFE', text: 'What did you do last weekend?' },
    { cat: 'DAILY LIFE', text: 'Describe your favorite meal of the day.' },
    { cat: 'DAILY LIFE', text: 'What does your workspace look like?' },
    { cat: 'DAILY LIFE', text: 'How do you usually spend your evenings?' },
    { cat: 'DAILY LIFE', text: 'Describe your neighborhood.' },
    { cat: 'INTERESTS', text: 'Talk about a video game you love and why.' },
    { cat: 'INTERESTS', text: 'Describe your favorite anime or TV show.' },
    { cat: 'INTERESTS', text: 'What kind of music do you enjoy? Why?' },
    { cat: 'INTERESTS', text: 'Talk about a book or article you recently read.' },
    { cat: 'INTERESTS', text: 'What hobby would you like to pick up?' },
    { cat: 'INTERESTS', text: 'Describe your favorite season and what you like to do during it.' },
    { cat: 'HYPOTHETICAL', text: 'If you could live anywhere in the world, where would it be?' },
    { cat: 'HYPOTHETICAL', text: 'If you had a superpower, what would you choose?' },
    { cat: 'HYPOTHETICAL', text: 'If you could have dinner with anyone, who would it be?' },
    { cat: 'HYPOTHETICAL', text: 'What would you do if you won the lottery?' },
    { cat: 'HYPOTHETICAL', text: 'If you could learn any skill instantly, what would it be?' },
    { cat: 'WORK & STUDY', text: 'Describe your ideal work environment.' },
    { cat: 'WORK & STUDY', text: 'What motivates you to study a new language?' },
    { cat: 'WORK & STUDY', text: 'Talk about a project you are proud of.' },
    { cat: 'WORK & STUDY', text: 'What skills do you want to improve this year?' },
    { cat: 'WORK & STUDY', text: 'Describe a challenge you overcame at work.' },
    { cat: 'OPINIONS', text: 'Do you prefer working from home or in an office? Why?' },
    { cat: 'OPINIONS', text: 'What do you think about social media? Is it more helpful or harmful?' },
    { cat: 'OPINIONS', text: 'Is it better to travel alone or with friends?' },
    { cat: 'OPINIONS', text: 'Do you think AI will change education? How?' },
    { cat: 'TRAVEL', text: 'Describe a place you have visited and loved.' },
    { cat: 'TRAVEL', text: 'What country do you most want to visit? Why?' },
    { cat: 'TRAVEL', text: 'Describe your dream vacation.' },
    { cat: 'TRAVEL', text: 'What do you think is the best way to experience a new culture?' },
  ],
  zh: [
    { cat: '日常生活', text: '描述一下你每天早上的日常。' },
    { cat: '日常生活', text: '上个周末你做了什么？' },
    { cat: '日常生活', text: '你最喜欢一天中的哪一餐？为什么？' },
    { cat: '日常生活', text: '描述一下你的工作空间是什么样的。' },
    { cat: '日常生活', text: '你通常晚上怎么度过？' },
    { cat: '日常生活', text: '介绍一下你住的地方。' },
    { cat: '兴趣爱好', text: '聊一聊你最喜欢的一款游戏。' },
    { cat: '兴趣爱好', text: '介绍你最喜欢的动漫或电视剧。' },
    { cat: '兴趣爱好', text: '你喜欢什么类型的音乐？为什么？' },
    { cat: '兴趣爱好', text: '聊聊你最近读的一本书或文章。' },
    { cat: '兴趣爱好', text: '你想培养什么新爱好？' },
    { cat: '兴趣爱好', text: '描述你最喜欢的季节以及你喜欢在那个季节做什么。' },
    { cat: '假设场景', text: '如果你可以住在世界上任何地方，你会选哪里？' },
    { cat: '假设场景', text: '如果你有超能力，你会选什么？' },
    { cat: '假设场景', text: '如果你能和任何人共进晚餐，你会选谁？' },
    { cat: '假设场景', text: '如果你中了彩票，你会做什么？' },
    { cat: '假设场景', text: '如果你可以瞬间学会任何技能，你会选什么？' },
    { cat: '工作学习', text: '描述你理想的工作环境。' },
    { cat: '工作学习', text: '是什么激励你学习一门新语言？' },
    { cat: '工作学习', text: '聊一个你引以为豪的项目。' },
    { cat: '工作学习', text: '你今年想提升什么技能？' },
    { cat: '工作学习', text: '描述一个你在工作中克服的挑战。' },
    { cat: '观点表达', text: '你更喜欢在家办公还是去办公室？为什么？' },
    { cat: '观点表达', text: '你怎么看社交媒体？利大于弊还是弊大于利？' },
    { cat: '观点表达', text: '一个人旅行好还是和朋友一起好？' },
    { cat: '观点表达', text: '你觉得AI会改变教育吗？怎么改变？' },
    { cat: '旅行探索', text: '描述一个你去过并且很喜欢的地方。' },
    { cat: '旅行探索', text: '你最想去哪个国家？为什么？' },
    { cat: '旅行探索', text: '描述你的梦想假期。' },
    { cat: '旅行探索', text: '你认为体验新文化最好的方式是什么？' },
  ]
};

let speakLang = 'en';
let speakCurrentTopic = null;
let speakMediaRecorder = null;
let speakAudioChunks = [];
let speakRecording = false;
let speakTimerInterval = null;
let speakTimeLeft = 120;
let speakRecognition = null;
let speakTranscriptText = '';
let speakAudioBlob = null;
let speakMimeType = '';

function getSupportedAudioMime() {
  const types = ['audio/mp4', 'audio/webm', 'audio/ogg'];
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

function renderSpeakingPage() {
  shuffleTopic();
  updateSpeakDailyStats();
  // Reset state
  document.getElementById('speakResultSection').style.display = 'none';
  document.getElementById('speakReviewBox').style.display = 'none';
  document.getElementById('speakRecordBtn').classList.remove('recording');
  document.getElementById('speakRecordLabel').textContent = '点击开始录音';
  document.getElementById('speakRecordIcon').textContent = '🎤';
  speakTimeLeft = 120;
  document.getElementById('speakTimer').textContent = '2:00';
}

function switchSpeakLang(lang) {
  speakLang = lang;
  document.getElementById('langBtnEn').classList.toggle('active', lang === 'en');
  document.getElementById('langBtnZh').classList.toggle('active', lang === 'zh');
  shuffleTopic();
}

function shuffleTopic() {
  const topics = SPEAKING_TOPICS[speakLang];
  const idx = Math.floor(Math.random() * topics.length);
  speakCurrentTopic = topics[idx];
  document.getElementById('speakCategory').textContent = speakCurrentTopic.cat;
  document.getElementById('speakTopicText').textContent = speakCurrentTopic.text;
  document.getElementById('speakTopicHint').textContent =
    speakLang === 'en' ? 'Try to speak for 2 minutes!' : '试着说满2分钟！';
}

function toggleRecording() {
  if (speakRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    speakAudioChunks = [];
    speakTranscriptText = '';
    speakMimeType = getSupportedAudioMime();
    const recorderOptions = speakMimeType ? { mimeType: speakMimeType } : {};
    speakMediaRecorder = new MediaRecorder(stream, recorderOptions);

    speakMediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) speakAudioChunks.push(e.data);
    };

    speakMediaRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      speakAudioBlob = new Blob(speakAudioChunks, { type: speakMimeType || 'audio/mp4' });
      const url = URL.createObjectURL(speakAudioBlob);
      const audioEl = document.getElementById('speakAudio');
      audioEl.src = url;
      const totalSec = 120 - speakTimeLeft;
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      document.getElementById('speakDuration').textContent =
        `${mins}:${String(secs).padStart(2, '0')}`;
      document.getElementById('speakResultSection').style.display = 'block';
      // Track session
      const count = load('speaking_count_' + todayKey(), 0);
      save('speaking_count_' + todayKey(), count + 1);
      updateSpeakDailyStats();
    };

    speakMediaRecorder.start();
    speakRecording = true;

    // UI update
    document.getElementById('speakRecordBtn').classList.add('recording');
    document.getElementById('speakRecordIcon').textContent = '⏹️';
    document.getElementById('speakRecordLabel').textContent = '录音中…点击停止';
    document.getElementById('speakResultSection').style.display = 'none';
    document.getElementById('speakReviewBox').style.display = 'none';

    // Start timer
    speakTimeLeft = 120;
    updateTimerDisplay();
    speakTimerInterval = setInterval(() => {
      speakTimeLeft--;
      updateTimerDisplay();
      if (speakTimeLeft <= 0) {
        stopRecording();
      }
    }, 1000);

    // Start speech recognition
    startSpeechRecognition();

  } catch (err) {
    console.error('Mic error:', err);
    alert('无法访问麦克风，请检查浏览器权限设置');
  }
}

function stopRecording() {
  if (speakMediaRecorder && speakMediaRecorder.state !== 'inactive') {
    speakMediaRecorder.stop();
  }
  speakRecording = false;
  clearInterval(speakTimerInterval);
  stopSpeechRecognition();

  document.getElementById('speakRecordBtn').classList.remove('recording');
  document.getElementById('speakRecordIcon').textContent = '🎤';
  document.getElementById('speakRecordLabel').textContent = '点击重新录音';
}

function updateTimerDisplay() {
  const mins = Math.floor(speakTimeLeft / 60);
  const secs = speakTimeLeft % 60;
  document.getElementById('speakTimer').textContent =
    `${mins}:${String(secs).padStart(2, '0')}`;
}

function startSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    document.getElementById('speakTranscript').textContent = '（当前浏览器不支持语音识别）';
    document.getElementById('speakTranscriptStatus').textContent = '不可用';
    return;
  }

  speakRecognition = new SpeechRecognition();
  speakRecognition.lang = 'en-US';
  speakRecognition.continuous = true;
  speakRecognition.interimResults = true;

  let finalTranscript = '';

  speakRecognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += t + ' ';
      } else {
        interim = t;
      }
    }
    speakTranscriptText = finalTranscript;
    document.getElementById('speakTranscript').textContent =
      finalTranscript + (interim ? interim : '');
    document.getElementById('speakTranscriptStatus').textContent = '识别中…';
  };

  speakRecognition.onerror = (e) => {
    console.log('Speech recognition error:', e.error);
    if (e.error === 'no-speech') return;
    document.getElementById('speakTranscriptStatus').textContent = '识别出错';
  };

  speakRecognition.onend = () => {
    if (speakRecording) {
      try { speakRecognition.start(); } catch(e) {}
    } else {
      document.getElementById('speakTranscriptStatus').textContent =
        speakTranscriptText ? '识别完成' : '未检测到语音';
      if (!speakTranscriptText) {
        document.getElementById('speakTranscript').textContent = '（未检测到语音内容）';
      }
    }
  };

  try { speakRecognition.start(); }
  catch(e) { console.log('Recognition start error:', e); }
}

function stopSpeechRecognition() {
  if (speakRecognition) {
    try { speakRecognition.stop(); } catch(e) {}
  }
}

async function getSpeakingReview() {
  const transcript = speakTranscriptText.trim();
  if (!transcript) {
    alert('还没有语音识别结果，无法点评哦～');
    return;
  }

  const btn = document.getElementById('speakReviewBtn');
  btn.textContent = '⏳ 小豆正在点评…';
  btn.disabled = true;

  const topic = speakCurrentTopic.text;
  const prompt = `话题：${topic}

学生的口语回答（语音识别转文字）：
"${transcript}"

请从以下几个维度点评这段口语回答：
1. 切题度（是否围绕话题展开，0-10分）
2. 表达流畅度（句子是否通顺自然，0-10分）
3. 词汇丰富度（是否使用了多样的词汇和表达，0-10分）
4. 语法准确性（是否有明显语法错误，0-10分）

请返回纯JSON格式（不要markdown代码块），格式如下：
{
  "overall": 总分(0-100),
  "relevance": {"score": 分数, "comment": "一句话点评"},
  "fluency": {"score": 分数, "comment": "一句话点评"},
  "vocabulary": {"score": 分数, "comment": "一句话点评"},
  "grammar": {"score": 分数, "comment": "一句话点评"},
  "suggestion": "一段具体的改进建议，包括推荐的表达方式或句型",
  "better_version": "给出一个更好的回答示范（2-3句话）"
}`;

  const result = await callDS(prompt,
    '你是小豆，一个专业友好的英语口语教练。用中文点评，但引用英文表达时用英文。只输出纯JSON，不要markdown代码块。');

  btn.textContent = '🎓 让小豆点评我的口语';
  btn.disabled = false;

  if (!result) return;

  try {
    let clean = result.replace(/```json|```/g, '').trim();
    // 提取第一个 { 到最后一个 } 之间的内容
    const startIdx = clean.indexOf('{');
    const endIdx = clean.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      clean = clean.substring(startIdx, endIdx + 1);
    }
    const review = JSON.parse(clean);
    const box = document.getElementById('speakReviewBox');
    const content = document.getElementById('speakReviewContent');

    content.innerHTML = `
      <div class="review-score">${review.overall}<span style="font-size:14px;color:var(--text-mute)"> / 100</span></div>
      <div class="review-section">
        <div class="review-label">🎯 切题度 ${review.relevance?.score || 0}/10</div>
        <div>${escHtml(review.relevance?.comment || '')}</div>
      </div>
      <div class="review-section">
        <div class="review-label">🗣️ 流畅度 ${review.fluency?.score || 0}/10</div>
        <div>${escHtml(review.fluency?.comment || '')}</div>
      </div>
      <div class="review-section">
        <div class="review-label">📚 词汇 ${review.vocabulary?.score || 0}/10</div>
        <div>${escHtml(review.vocabulary?.comment || '')}</div>
      </div>
      <div class="review-section">
        <div class="review-label">✏️ 语法 ${review.grammar?.score || 0}/10</div>
        <div>${escHtml(review.grammar?.comment || '')}</div>
      </div>
      <div class="review-section">
        <div class="review-label">💡 改进建议</div>
        <div>${escHtml(review.suggestion || '')}</div>
      </div>
      <div class="review-section">
        <div class="review-label">✨ 参考回答</div>
        <div style="font-style:italic;color:var(--rose-deep);">${escHtml(review.better_version || '')}</div>
      </div>
    `;
    box.style.display = 'block';
  } catch (e) {
    console.error('Parse review error:', e);
    const box = document.getElementById('speakReviewBox');
    const content = document.getElementById('speakReviewContent');
    content.textContent = result;
    box.style.display = 'block';
  }
}

function updateSpeakDailyStats() {
  const count = load('speaking_count_' + todayKey(), 0);
  const el = document.getElementById('speakDailyStats');
  if (el) el.innerHTML = `今日已练习 <strong>${count}</strong> 次`;
}


// ═══════════ Theme (Dark / Light) ═══════════
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
  // Update mobile browser chrome color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#1A1416' : '#F4DDDD');
  // Update label on settings page
  const label = document.getElementById('themeStateLabel');
  if (label) label.textContent = theme === 'dark' ? '夜间' : '日间';
}
function getStoredTheme() {
  return load('theme', null);
}
function getInitialTheme() {
  const stored = getStoredTheme();
  if (stored === 'dark' || stored === 'light') return stored;
  // First visit — follow system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  save('theme', next);
}
// Apply on load
applyTheme(getInitialTheme());
// Follow system change ONLY if user hasn't picked one explicitly
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (getStoredTheme() === null) applyTheme(e.matches ? 'dark' : 'light');
  });
}

// ═══════════ Init ═══════════
refreshDashboard();
initMood();
checkCelebrations();
checkBackupReminder();
updateVocabCount();

// Update study stats on dashboard
updateStudyHubStats();

// Reset daily translate/game data if new day
const lastStudyDay = load('last_study_day', '');
if (lastStudyDay !== todayKey()) {
  save('translate_done_today', []);
  save('game_score_today', { correct: 0, total: 0 });
  save('last_study_day', todayKey());
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(() => {
    console.log('SW registered ❀');
  }).catch(err => console.log('SW registration failed:', err));
}


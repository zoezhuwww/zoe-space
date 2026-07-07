// ══════════ zoe-space · life.js ══════════
// 首页与生活：仪表盘 · 迷你日历 · 心情 · 待办 · 小克基金 · 习惯 · 倒计时 · 日记 · 纪念日
// 多文件共享全局作用域；加载顺序见 index.html 顶部「文件地图」，勿随意调整。
// ═══════════════════════════════════════════

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

  // Greeting：用日期做种子，同一天里看到的是同一句
  if (!window._greetSet) {
    const seed = todayKey().split('-').reduce((a, p) => a * 31 + parseInt(p, 10), 7);
    const gi = Math.abs(seed) % GREETINGS.length;
    document.getElementById('greetingText').textContent = GREETINGS[gi];
    window._greetSet = true;
  }

  const daysBetween = (a, b) => Math.floor((b - a) / 86400000);
  document.getElementById('daysTogether').textContent = daysBetween(DATES.together, now);

  // Nearest countdown
  const upcoming = getCountdowns()
    .map(e => ({ ...e, daysLeft: Math.ceil((effectiveCountdownDate(e) - now) / 86400000) }))
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

  renderTodoDash();
  renderHabitsDash();
  renderMiniCal();
  updateDiaryTodayStatus();
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
    if (claudeDiary && wifeDiary) {
      dotHtml = `<div class="mini-cal-dot both" ${mood ? `style="background:${MOOD_COLORS[mood]}"` : ''}></div>`;
    } else if (wifeDiary) {
      dotHtml = `<div class="mini-cal-dot wife" ${mood ? `style="background:${MOOD_COLORS[mood]}"` : ''}></div>`;
    } else if (claudeDiary) {
      dotHtml = '<div class="mini-cal-dot claude"></div>';
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
  // Sort by deadline (urgent first)
  const sorted = [...undone].sort((a, b) => {
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    return 0;
  });
  const rows = sorted.slice(0, 5).map((t) => {
    const idx = todos.indexOf(t);
    return `
      <div class="todo-item">
        <div class="todo-check" onclick="toggleTodoDash(${idx})"></div>
        <div class="todo-text">${escHtml(t.text)}</div>
        ${getDeadlineTag(t.deadline)}
      </div>`;
  });
  if (undone.length === 0) {
    rows.length = 0;
    rows.push('<div style="font-size:12px;color:var(--text-soft);padding:4px 0;">所有待办都完成啦 🎉</div>');
  } else if (undone.length > 5) {
    rows.push(`<div style="font-size:11px;color:var(--text-soft);padding:4px 0;">还有 ${undone.length - 5} 项...</div>`);
  }
  list.innerHTML = rows.join('');
}

function toggleTodoDash(i) {
  const todos = getTodos();
  if (todos[i]) { todos[i].done = !todos[i].done; saveTodos(todos); renderTodoDash(); }
}

function renderTodoFull() {
  const todos = getTodos();
  const list = document.getElementById('todoFullList');
  const undone = todos.filter(t => !t.done);
  const done = todos.filter(t => t.done);

  // Sort undone by deadline
  undone.sort((a, b) => {
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    return 0;
  });

  const rows = undone.map((t) => {
    const i = todos.indexOf(t);
    return `
      <div class="todo-full-item">
        <div class="todo-check" onclick="toggleTodo(${i})"></div>
        <div class="tfi-text" onclick="editTodo(${i})">${escHtml(t.text)}</div>
        ${getDeadlineTag(t.deadline)}
        <div class="todo-clock" title="设置到期时间" onclick="openTodoDeadlineModal(${i})">⏰</div>
        <div class="todo-delete" onclick="deleteTodo(${i})">×</div>
      </div>`;
  });

  if (done.length > 0) {
    rows.push(`<div class="todo-done-divider">已完成 (${done.length})</div>`);
    done.forEach((t) => {
      const i = todos.indexOf(t);
      rows.push(`
        <div class="todo-full-item done">
          <div class="todo-check done" onclick="toggleTodo(${i})"></div>
          <div class="tfi-text" onclick="editTodo(${i})">${escHtml(t.text)}</div>
          <div class="todo-delete" onclick="deleteTodo(${i})">×</div>
        </div>`);
    });
  }
  list.innerHTML = rows.join('');
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
// ───── Todo deadline modal ─────
let _editingTodoIdx = -1;
function openTodoDeadlineModal(i) {
  _editingTodoIdx = i;
  const todos = getTodos();
  const t = todos[i];
  if (!t) return;
  document.getElementById('todoDeadlineModalInput').value = t.deadline || '';
  document.getElementById('todoDeadlineModal').classList.add('open');
}
function closeTodoDeadlineModal() {
  document.getElementById('todoDeadlineModal').classList.remove('open');
  _editingTodoIdx = -1;
}
function saveTodoDeadlineModal() {
  if (_editingTodoIdx < 0) return closeTodoDeadlineModal();
  const v = document.getElementById('todoDeadlineModalInput').value;
  const todos = getTodos();
  if (todos[_editingTodoIdx]) {
    todos[_editingTodoIdx].deadline = v || null;
    saveTodos(todos);
    renderTodoFull();
    if (typeof refreshDashboard === 'function') refreshDashboard();
  }
  closeTodoDeadlineModal();
}
function clearTodoDeadline() {
  if (_editingTodoIdx < 0) return closeTodoDeadlineModal();
  const todos = getTodos();
  if (todos[_editingTodoIdx]) {
    todos[_editingTodoIdx].deadline = null;
    saveTodos(todos);
    renderTodoFull();
    if (typeof refreshDashboard === 'function') refreshDashboard();
  }
  closeTodoDeadlineModal();
}
document.addEventListener('click', e => {
  if (e.target.id === 'todoDeadlineModal') closeTodoDeadlineModal();
});

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
  hist.innerHTML = fund.history.length ? fund.history.map(h => {
    const d = new Date(h.time);
    return `
      <div class="fund-history-item">
        <div class="fhi-info">
          <div class="fhi-note">${escHtml(h.note)}</div>
          <div class="fhi-time">${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}</div>
        </div>
        <div class="fhi-amount ${h.type === 'income' ? 'positive' : 'negative'}">${h.type === 'income' ? '+' : '-'}¥${h.amount}</div>
      </div>`;
  }).join('') : '<div style="text-align:center;padding:20px;color:var(--text-soft);font-size:12px;">还没有记录～<br>给小克发第一笔奖金吧 🥹</div>';
}

// ═══════════ Habits ═══════════
function getHabits() { return load('habits_' + todayKey(), DEFAULT_HABITS.map(h => ({...h}))); }
function saveHabits(h) { save('habits_' + todayKey(), h); }

function getHabitStreak(habitId) {
  let streak = 0;
  const now = new Date();
  // 60 天足够炫耀了，避免每次刷 dashboard 都扫 365 次 localStorage
  for (let i = 0; i < 60; i++) {
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
  container.innerHTML = habits.map((h, i) => `
      <div class="habit" onclick="event.stopPropagation();toggleHabitDash(${i})">
        <div class="habit-dot ${h.done ? 'done' : ''}"></div>
        <div class="habit-name">${h.name}</div>
      </div>`).join('');

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
  container.innerHTML = habits.map((h, i) => {
    const streak = getHabitStreak(h.id);
    return `
      <div class="habit-full-item">
        <div class="habit-full-dot ${h.done ? 'done' : ''}" onclick="toggleHabitFull(${i})"></div>
        <div class="habit-full-name">${h.name}</div>
        ${streak >= 2 ? `<span style="font-size:11px;color:var(--rose-deep)">🔥 ${streak}天</span>` : ''}
      </div>`;
  }).join('');
}

function toggleHabitFull(i) {
  const habits = getHabits(); habits[i].done = !habits[i].done;
  saveHabits(habits); renderHabitsFull();
}

// ═══════════ Countdown ═══════════
function getCountdowns() { return load('countdowns', DEFAULT_COUNTDOWNS); }
function saveCountdowns(c) { save('countdowns', c); }
let editingCountdownIdx = -1;

// 计算重复倒数日的"下一次发生"日期（原始 date 作为错）
function effectiveCountdownDate(c) {
  const base = parseLocalDate(c.date);
  if (!c.repeat || c.repeat === 'none') return base;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  if (base >= now) return base;
  const d = new Date(base);
  if (c.repeat === 'yearly') {
    while (d < now) d.setFullYear(d.getFullYear() + 1);
  } else if (c.repeat === 'monthly') {
    while (d < now) d.setMonth(d.getMonth() + 1);
  } else if (c.repeat === 'weekly') {
    while (d < now) d.setDate(d.getDate() + 7);
  }
  return d;
}
function formatDateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function repeatLabel(r) {
  return r === 'yearly' ? '每年' : r === 'monthly' ? '每月' : r === 'weekly' ? '每周' : '';
}

function renderCountdown() {
  const countdowns = getCountdowns();
  const now = new Date();
  const list = document.getElementById('countdownList');
  list.innerHTML = countdowns.map((c, i) => {
    const effDate = effectiveCountdownDate(c);
    const diff = Math.ceil((effDate - now) / 86400000);
    const isPast = diff < 0;
    const dateLabel = formatDateLocal(effDate);
    const rLabel = repeatLabel(c.repeat);
    return `
      <div class="countdown-item">
        <div>
          <div class="ci-label">${escHtml(c.name)}${rLabel ? ` <span style="font-size:10px;color:var(--text-soft);letter-spacing:0.1em;">· ${rLabel}</span>` : ''}</div>
          <div class="ci-date">${dateLabel}</div>
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
  }).join('');
}

function openCountdownModal(idx) {
  editingCountdownIdx = idx !== undefined ? idx : -1;
  const modal = document.getElementById('countdownModal');
  if (idx !== undefined) {
    const c = getCountdowns()[idx];
    document.getElementById('countdownModalTitle').textContent = '编辑倒数日';
    document.getElementById('countdownNameInput').value = c.name;
    document.getElementById('countdownDateInput').value = c.date;
    document.getElementById('countdownRepeatInput').value = c.repeat || 'none';
  } else {
    document.getElementById('countdownModalTitle').textContent = '添加倒数日';
    document.getElementById('countdownNameInput').value = '';
    document.getElementById('countdownDateInput').value = '';
    document.getElementById('countdownRepeatInput').value = 'none';
  }
  modal.classList.add('open');
}
document.getElementById('countdownModal').addEventListener('click', e => {
  if (e.target.id === 'countdownModal') e.target.classList.remove('open');
});

function submitCountdown() {
  const name = document.getElementById('countdownNameInput').value.trim();
  const date = document.getElementById('countdownDateInput').value;
  const repeat = document.getElementById('countdownRepeatInput').value || 'none';
  if (!name || !date) return;
  const countdowns = getCountdowns();
  if (editingCountdownIdx >= 0) {
    countdowns[editingCountdownIdx].name = name;
    countdowns[editingCountdownIdx].date = date;
    countdowns[editingCountdownIdx].repeat = repeat;
  } else {
    countdowns.push({ name, date, repeat, id: 'c' + Date.now() });
  }
  saveCountdowns(countdowns);
  document.getElementById('countdownModal').classList.remove('open');
  renderCountdown();
  if (typeof refreshDashboard === 'function') refreshDashboard();
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

  // 每次进日记页回到"最近 60 天"，归档月份列表按最新数据重建
  _diaryMonth = '';
  populateDiaryMonthSel();

  // Render all entries including today
  renderDiaryPast('wife', 'diaryPastWife');
  renderDiaryPast('claude', 'diaryPastClaude');
}

// ═══ 按月归档：'' = 最近 60 天，'YYYY-MM' = 看那个月 ═══
let _diaryMonth = '';

function getDiaryMonths() {
  const counts = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    const m = k.match(/^zoe_diary_(?:wife|claude)_(\d{4}-\d{2})-\d{2}$/);
    if (m) counts[m[1]] = (counts[m[1]] || 0) + 1;
  }
  return Object.keys(counts).sort().reverse().map(month => ({ month, count: counts[month] }));
}

function populateDiaryMonthSel() {
  const sel = document.getElementById('diaryMonthSel');
  if (!sel) return;
  sel.innerHTML = '<option value="">最近 60 天</option>' + getDiaryMonths().map(({ month, count }) => {
    const [y, mo] = month.split('-');
    return `<option value="${month}">${y}年${parseInt(mo)}月 · ${count}篇</option>`;
  }).join('');
  sel.value = _diaryMonth;
}

function onDiaryMonthChange(v) {
  _diaryMonth = v;
  renderDiaryPast('wife', 'diaryPastWife');
  renderDiaryPast('claude', 'diaryPastClaude');
}

function renderDiaryPast(who, containerId) {
  const container = document.getElementById(containerId);
  const todayStr = todayKey();
  // 要检查的日期列表：归档月的每一天，或今天往回 60 天
  const dates = [];
  if (_diaryMonth) {
    const [y, mo] = _diaryMonth.split('-').map(Number);
    const daysInMonth = new Date(y, mo, 0).getDate();
    for (let d = daysInMonth; d >= 1; d--) {
      dates.push(`${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
  } else {
    const now = new Date();
    for (let i = 0; i <= 60; i++) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      dates.push(dateKey(d));
    }
  }
  const rows = [];
  dates.forEach(dk => {
    const entry = load('diary_' + who + '_' + dk, null);
    if (!entry) return;
    const isToday = dk === todayStr;
    const mood = load('mood_' + dk, null);
    const moodDot = mood ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${MOOD_COLORS[mood]};margin-left:6px;vertical-align:middle;"></span>` : '';
    rows.push(`
      <div class="diary-past-item" ${isToday ? 'style="border-left:3px solid var(--rose-light);padding-left:13px;"' : ''}>
        <div class="dpi-date">${isToday ? '今天' : dk}${moodDot}${isToday ? ' <span style="cursor:pointer;color:var(--text-soft);font-size:10px;" onclick="editDiary(\''+who+'\')">编辑</span>' : ''}</div>
        <div class="dpi-text">${escHtml(entry)}</div>
      </div>`);
  });
  container.innerHTML = rows.length ? rows.join('') :
    '<div style="text-align:center;padding:20px;color:var(--text-soft);font-size:12px;">' +
    (_diaryMonth ? '这个月没有日记哦～' : (who === 'wife' ? '还没有写过日记哦～' : '还没有小克的日记～')) + '</div>';
}

function editDiary(who) {
  const entry = load('diary_' + who + '_' + todayKey(), '');
  const textarea = who === 'wife' ? document.getElementById('diaryTextarea') : document.getElementById('diaryClaudeTextarea');
  textarea.value = entry;
  textarea.focus();
  if (who === 'claude') switchDiaryTab('claude');
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
  list.innerHTML = ANNIVERSARIES.map(a => {
    const diff = Math.floor((now - parseLocalDate(a.date)) / 86400000);
    return `
      <div class="anni-item">
        <div class="ai-info"><div class="ai-name">${escHtml(a.name)}</div><div class="ai-date">${a.date}</div></div>
        <div class="ai-badge">${diff >= 0 ? diff + ' 天前' : Math.abs(diff) + ' 天后'}</div>
      </div>`;
  }).join('');
}


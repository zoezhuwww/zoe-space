// ══════════ zoe-space · sentences.js ══════════
// 日语·句子卡：例句 SRS · 每日推送 · 手动添加
// 多文件共享全局作用域；加载顺序见 index.html 顶部「文件地图」，勿随意调整。
// ═══════════════════════════════════════════

// ═══════════ Sentence Card System ═══════════
// Data shape: sentences = [{id, jp, reading, cn, breakdown:[{word,reading,meaning}], grammar, source, addedAt, srs:{interval, ease, nextReview}}]
const SENT_LEVEL_DEFAULT = 'N4-N3';
const SENT_DAILY_DEFAULT = 10;

function getSentences() { return load('sentences', []); }
function saveSentences(arr) { save('sentences', arr); }
function getSentSettings() {
  return load('sentence_settings', { dailyCount: SENT_DAILY_DEFAULT, level: SENT_LEVEL_DEFAULT, themes: '' });
}
function saveSentSettings(s) { save('sentence_settings', s); }

function getTodaySentenceQueue() {
  // Returns: sentences due today (new + SRS due)
  const all = getSentences();
  const today = todayKey();
  return all.filter(s => {
    if (!s.srs) return true;
    return s.srs.nextReview <= today;
  });
}

function getTodaySentenceCounts() {
  const all = getSentences();
  const today = todayKey();
  let dueReview = 0, addedToday = 0;
  all.forEach(s => {
    if (s.addedAt && new Date(s.addedAt).toISOString().slice(0,10) === today) addedToday++;
    if (s.srs && s.srs.nextReview <= today) dueReview++;
    else if (!s.srs) dueReview++;
  });
  return { dueReview, addedToday, total: all.length };
}

let _sentQueue = [];
let _sentIdx = 0;
let _sentFlipped = false;

function renderSentencesPage() {
  _sentQueue = getTodaySentenceQueue();
  _sentIdx = 0;
  _sentFlipped = false;
  showSentCard();
}

function showSentCard() {
  const emptyEl = document.getElementById('sentEmpty');
  const cardEl = document.getElementById('sentCardContainer');
  const ankiEl = document.getElementById('sentAnkiButtons');
  const remEl = document.getElementById('sentRemaining');
  const progEl = document.getElementById('sentProgress');
  const fillEl = document.getElementById('sentProgressFill');

  if (_sentQueue.length === 0) {
    emptyEl.style.display = 'block';
    cardEl.style.display = 'none';
    ankiEl.style.display = 'none';
    remEl.textContent = '今天还没句子';
    progEl.textContent = '';
    fillEl.style.width = '0%';
    const settings = getSentSettings();
    const btn = document.getElementById('sentFetchBtn');
    if (btn) btn.textContent = `🌱 让小豆推今天的 ${settings.dailyCount} 句`;
    return;
  }
  if (_sentIdx >= _sentQueue.length) {
    emptyEl.style.display = 'block';
    document.getElementById('sentEmptyTitle').textContent = '今天的句子都过完啦 🎉';
    cardEl.style.display = 'none';
    ankiEl.style.display = 'none';
    remEl.textContent = '全部完成';
    progEl.textContent = `${_sentQueue.length} / ${_sentQueue.length}`;
    fillEl.style.width = '100%';
    return;
  }

  emptyEl.style.display = 'none';
  cardEl.style.display = 'block';
  ankiEl.style.display = _sentFlipped ? 'flex' : 'none';

  const card = _sentQueue[_sentIdx];
  document.getElementById('sentJp').textContent = card.jp || '';
  document.getElementById('sentJpBack').textContent = card.jp || '';
  document.getElementById('sentSourceFront').textContent = card.source || '';
  document.getElementById('sentReading').textContent = card.reading || '';
  document.getElementById('sentCn').textContent = card.cn || '';

  // Breakdown
  const bd = card.breakdown || [];
  const bdEl = document.getElementById('sentBreakdown');
  const bdWrap = document.getElementById('sentBreakdownWrap');
  if (bd.length) {
    bdWrap.style.display = 'block';
    bdEl.innerHTML = bd.map(b => `
      <div class="sent-bd-row">
        <span class="sent-bd-word">${escHtml(b.word||'')}</span>
        <span class="sent-bd-reading">${escHtml(b.reading||'')}</span>
        <span class="sent-bd-meaning">${escHtml(b.meaning||'')}</span>
      </div>`).join('');
  } else {
    bdWrap.style.display = 'none';
  }

  // Grammar
  const grWrap = document.getElementById('sentGrammarWrap');
  if (card.grammar) {
    grWrap.style.display = 'block';
    document.getElementById('sentGrammar').textContent = card.grammar;
  } else {
    grWrap.style.display = 'none';
  }

  document.getElementById('sentSource').textContent = card.source ? '— ' + card.source : '';

  // Show/hide front/back
  document.getElementById('sentFront').style.display = _sentFlipped ? 'none' : 'flex';
  document.getElementById('sentBack').style.display = _sentFlipped ? 'block' : 'none';

  // Progress
  const remaining = _sentQueue.length - _sentIdx;
  remEl.textContent = remaining + ' 张待复习';
  progEl.textContent = `${_sentIdx + 1} / ${_sentQueue.length}`;
  fillEl.style.width = Math.round((_sentIdx / _sentQueue.length) * 100) + '%';
}

function flipSentCard() {
  _sentFlipped = !_sentFlipped;
  showSentCard();
}

function rateSentCard(rating) {
  const card = _sentQueue[_sentIdx];
  if (!card) return;
  const all = getSentences();
  const idx = all.findIndex(s => s.id === card.id);
  if (idx === -1) return;

  const prev = all[idx].srs || { interval: 0, ease: 2.5 };
  let newInterval;
  if (rating === 0) newInterval = 0;
  else if (prev.interval === 0) newInterval = SRS_INTERVALS[rating];
  else newInterval = Math.max(1, Math.round(prev.interval * SRS_MULTIPLIERS[rating]));

  const next = new Date();
  next.setDate(next.getDate() + newInterval);
  all[idx].srs = {
    interval: Math.max(1, newInterval),
    ease: prev.ease,
    nextReview: next.toISOString().slice(0,10),
    lastReview: todayKey(),
  };
  saveSentences(all);

  if (rating === 0) {
    // requeue at end
    _sentQueue.push(card);
  }
  _sentIdx++;
  _sentFlipped = false;
  // 记录今日活跃，用于学习连续天数
  markSentenceActiveToday();
  showSentCard();
  updateStudyHubStats();
  if (typeof refreshDashboard === 'function') refreshDashboard();
}

// ───── Sentence streak ─────
function markSentenceActiveToday() {
  const dates = load('sent_active_dates', []);
  const today = todayKey();
  if (!dates.includes(today)) {
    dates.push(today);
    save('sent_active_dates', dates.slice(-90)); // 保留最近 90 天
  }
}
function getSentenceStreak() {
  const dates = new Set(load('sent_active_dates', []));
  if (!dates.size) return 0;
  let streak = 0;
  const d = new Date();
  // 如果今天还没活跃，从昨天开始数（保留昨天连续的成就感）
  let key = d.toISOString().slice(0, 10);
  if (!dates.has(key)) {
    d.setDate(d.getDate() - 1);
    key = d.toISOString().slice(0, 10);
  }
  while (dates.has(key)) {
    streak++;
    d.setDate(d.getDate() - 1);
    key = d.toISOString().slice(0, 10);
  }
  return streak;
}

// ───── Add (manual) ─────
function openSentenceAddModal() {
  document.getElementById('sentJpInput').value = '';
  document.getElementById('sentSourceInput').value = '';
  document.getElementById('sentAddSubmit').textContent = '保存';
  document.getElementById('sentAddSubmit').disabled = false;
  document.getElementById('sentenceAddModal').classList.add('open');
}
function closeSentenceAddModal() {
  document.getElementById('sentenceAddModal').classList.remove('open');
}
async function submitSentenceAdd() {
  const jp = document.getElementById('sentJpInput').value.trim();
  const source = document.getElementById('sentSourceInput').value.trim();
  if (!jp) { alert('粘一句日语进来吧～'); return; }
  const btn = document.getElementById('sentAddSubmit');
  btn.textContent = '⏳ 小豆在拆解…';
  btn.disabled = true;

  const prompt = `用户加了一句日语，帮我处理成句子学习卡。日语原句：「${jp}」
请返回 JSON：
{
  "jp": "原句（轻微纠正错字，保持口语自然）",
  "reading": "完整假名读音（汉字部分注音，连读保留）",
  "cn": "自然口语化的中文翻译",
  "breakdown": [{"word":"关键词","reading":"假名","meaning":"中文"}],
  "grammar": "若有典型语法点，一句话讲清楚；没有就空字符串"
}
breakdown 只列 2-5 个对 N4 学习者重要的词。只返回JSON，不要markdown代码块。`;

  let result;
  try {
    result = await callDS(prompt, '你是小豆，温柔的日语学习助手。只输出纯JSON。');
  } catch (e) {
    alert('小豆罢工啦，再试一次？\n' + (e && e.message ? e.message : e));
    return;
  } finally {
    btn.textContent = '保存';
    btn.disabled = false;
  }

  if (!result) return;
  let data;
  try {
    const clean = result.replace(/```json|```/g, '').trim();
    data = JSON.parse(clean);
  } catch(e) {
    alert('小豆拆解失败了，再试一次？\n' + e.message);
    return;
  }

  const all = getSentences();
  all.push({
    id: 'sent_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    jp: data.jp || jp,
    reading: data.reading || '',
    cn: data.cn || '',
    breakdown: Array.isArray(data.breakdown) ? data.breakdown : [],
    grammar: data.grammar || '',
    source: source || '自己加',
    addedAt: Date.now(),
    srs: null,
  });
  saveSentences(all);
  closeSentenceAddModal();
  renderSentencesPage();
  updateStudyHubStats();
}

// ───── Daily push from 小豆 ─────
// 宽容 JSON 解析：扫描字符串里完整的 {...} 对象逐个 JSON.parse，丢掉残缺的最后一个
// field：对象必须带的字段（日语句子 jp / 英语句子 en）
function salvageSentenceArray(raw, field) {
  field = field || 'jp';
  if (!raw) return [];
  const text = raw.replace(/```json|```/g, '');
  const objects = [];
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const chunk = text.slice(start, i + 1);
        try {
          const obj = JSON.parse(chunk);
          if (obj && obj[field]) objects.push(obj);
        } catch {}
        start = -1;
      }
    }
  }
  return objects;
}

async function fetchDailySentences() {
  const settings = getSentSettings();
  const today = todayKey();
  const lastPushKey = 'sent_last_push_' + today;
  if (load(lastPushKey, false)) {
    if (!confirm('今天已经让小豆推过了，要再推一批吗？')) return;
  }

  const btn = document.getElementById('sentFetchBtn');
  if (btn) { btn.textContent = '⏳ 小豆在挑句子…'; btn.disabled = true; }

  // 分批，每批 5 句，避开 DeepSeek 输出 token 上限
  const total = settings.dailyCount;
  const batchSize = 5;
  const batches = [];
  let remaining = total;
  while (remaining > 0) {
    batches.push(Math.min(batchSize, remaining));
    remaining -= batchSize;
  }

  const themeHint = settings.themes ? `偏好主题：${settings.themes}。` : '主题随机，覆盖日常各种场景。';
  const buildPrompt = (n, batchIdx) => `请为日语水平 ${settings.level} 的学习者推荐 ${n} 个实用日常日语句子。${themeHint}（这是第 ${batchIdx + 1} 批，请和其他批的句子在场景上尽量不重复）

要求：
- 真实日本人会说的口语，不要教科书句
- 涵盖不同生活场景
- 每句配一个简短场景标签
- breakdown 只挑 2-3 个对 ${settings.level} 重要的词，meaning 用中文，控制简短

只返回 JSON 数组，不要markdown，不要其他文字：
[{"jp":"日本語の文","reading":"假名","cn":"中文","breakdown":[{"word":"","reading":"","meaning":""}],"grammar":"一句话或空字符串","scene":"场景标签"}]`;

  // 并发发请求
  const promises = batches.map((n, i) =>
    callDS(buildPrompt(n, i), '你是小豆，温柔的日语老师。只输出纯JSON数组，简短。', { maxTokens: 3000, timeoutMs: 90000 })
      .then(r => r ? salvageSentenceArray(r) : [])
      .catch(() => [])
  );

  const results = await Promise.all(promises);
  if (btn) { btn.textContent = `🌱 让小豆推今天的 ${settings.dailyCount} 句`; btn.disabled = false; }

  const merged = [].concat(...results);
  if (!merged.length) {
    alert('小豆这次一句都没推回来，看看 API 余额够不够？\n或者去设置里把数量调小再试试');
    return;
  }

  const all = getSentences();
  const baseTime = Date.now();
  merged.forEach((s, i) => {
    if (!s.jp) return;
    all.push({
      id: 'sent_' + baseTime + '_' + i,
      jp: s.jp,
      reading: s.reading || '',
      cn: s.cn || '',
      breakdown: Array.isArray(s.breakdown) ? s.breakdown : [],
      grammar: s.grammar || '',
      source: s.scene ? '小豆 · ' + s.scene : '小豆推荐',
      addedAt: baseTime + i,
      srs: null,
    });
  });
  saveSentences(all);
  save(lastPushKey, true);
  renderSentencesPage();
  updateStudyHubStats();
  if (merged.length < total) {
    setTimeout(() => alert(`小豆推回来 ${merged.length} 句（原计划 ${total}）～其余的去设置里"重抽今天的"再来一次就好`), 100);
  }
}

function resetTodaySentences() {
  if (!confirm('这只是清掉"今天推过了"的标记，已经加进卡库的句子不会动～')) return;
  const today = todayKey();
  localStorage.removeItem('zoe_sent_last_push_' + today);
  alert('好啦～现在可以再让小豆推一次');
  closeSentenceSettings();
}

// ───── Settings ─────
function openSentenceSettings() {
  const s = getSentSettings();
  document.getElementById('sentDailyCountInput').value = s.dailyCount;
  document.getElementById('sentLevelInput').value = s.level;
  document.getElementById('sentThemesInput').value = s.themes || '';
  document.getElementById('sentenceSettingsModal').classList.add('open');
}
function closeSentenceSettings() {
  document.getElementById('sentenceSettingsModal').classList.remove('open');
}
function submitSentenceSettings() {
  const dailyCount = Math.max(3, Math.min(30, parseInt(document.getElementById('sentDailyCountInput').value) || SENT_DAILY_DEFAULT));
  const level = document.getElementById('sentLevelInput').value || SENT_LEVEL_DEFAULT;
  const themes = document.getElementById('sentThemesInput').value.trim();
  saveSentSettings({ dailyCount, level, themes });
  closeSentenceSettings();
}

// ───── TTS for sentences ─────
// 走 nihongo.js 的统一入口 speakJa：VOICEVOX → Google → 系统语音逐级降级，
// 和单词卡同一条路，带按钮加载态和音频缓存
function speakSentence(btn) {
  const card = _sentQueue[_sentIdx];
  if (!card) return;
  speakJa(card.jp, { btn });
}
function speakSentenceSlow(btn) {
  const card = _sentQueue[_sentIdx];
  if (!card) return;
  speakJa(card.jp, { slow: true, btn });
}

// Modal close on overlay click
document.addEventListener('click', e => {
  if (e.target.id === 'sentenceAddModal') closeSentenceAddModal();
  if (e.target.id === 'sentenceSettingsModal') closeSentenceSettings();
});


// ══════════ zoe-space · sentences.js ══════════
// 日语·句子库：小豆每日推送 · 手动添加 · 学习连续天数
// 练习交互（卡片/听写/跟读/收藏）在 practice.js，本文件只管数据。
// 多文件共享全局作用域；加载顺序见 index.html 顶部「文件地图」，勿随意调整。
// ═══════════════════════════════════════════

// Data shape: sentences = [{id, jp, reading, cn, breakdown:[{word,reading,meaning}], grammar, source, addedAt, fav, lastPracticed}]
// （老数据可能还带 srs 字段，忽略即可）
const SENT_LEVEL_DEFAULT = 'N4-N3';
const SENT_DAILY_DEFAULT = 10;
// 长度档位 → 给小豆的出题提示
const SENT_LENGTHS = {
  short:  { label: '短句',  ja: '每句 8-15 个字的短句',   en: '6-9 words each, short and punchy' },
  medium: { label: '适中',  ja: '每句 15-30 个字',        en: '10-16 words each' },
  long:   { label: '长句',  ja: '每句 30-45 个字的长句（可以是复句）', en: '16-24 words each (complex sentences welcome)' },
};

function getSentences() { return load('sentences', []); }
function saveSentences(arr) { save('sentences', arr); }
function getSentSettings() {
  const s = load('sentence_settings', {});
  return { dailyCount: s.dailyCount || SENT_DAILY_DEFAULT, level: s.level || SENT_LEVEL_DEFAULT,
           themes: s.themes || '', length: s.length || 'medium' };
}
function saveSentSettings(s) { save('sentence_settings', s); }

// 今日队列 = 今天推送/添加的句子（没有 SRS 了，旧句子靠 ⭐ 收藏留下来反复练）
function getTodaySentenceCounts() {
  const all = getSentences();
  const today = todayKey();
  const todays = all.filter(x => x.addedAt && dateKey(new Date(x.addedAt)) === today);
  const done = todays.filter(x => x.lastPracticed === today).length;
  return { dueReview: todays.length - done, todayTotal: todays.length, total: all.length };
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
    fav: false,
  });
  saveSentences(all);
  closeSentenceAddModal();
  renderPracticePage('ja');
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
  const lengthHint = (SENT_LENGTHS[settings.length] || SENT_LENGTHS.medium).ja;
  const buildPrompt = (n, batchIdx) => `请为日语水平 ${settings.level} 的学习者推荐 ${n} 个实用日常日语句子。${themeHint}（这是第 ${batchIdx + 1} 批，请和其他批的句子在场景上尽量不重复）

要求：
- 真实日本人会说的口语，不要教科书句
- 长度：${lengthHint}
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
      fav: false,
    });
  });
  saveSentences(all);
  save(lastPushKey, true);
  renderPracticePage('ja');
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
  document.getElementById('sentLengthInput').value = s.length || 'medium';
  document.getElementById('sentThemesInput').value = s.themes || '';
  document.getElementById('sentenceSettingsModal').classList.add('open');
}
function closeSentenceSettings() {
  document.getElementById('sentenceSettingsModal').classList.remove('open');
}
function submitSentenceSettings() {
  const dailyCount = Math.max(3, Math.min(30, parseInt(document.getElementById('sentDailyCountInput').value) || SENT_DAILY_DEFAULT));
  const level = document.getElementById('sentLevelInput').value || SENT_LEVEL_DEFAULT;
  const length = document.getElementById('sentLengthInput').value || 'medium';
  const themes = document.getElementById('sentThemesInput').value.trim();
  saveSentSettings({ dailyCount, level, themes, length });
  closeSentenceSettings();
}

// Modal close on overlay click
document.addEventListener('click', e => {
  if (e.target.id === 'sentenceAddModal') closeSentenceAddModal();
  if (e.target.id === 'sentenceSettingsModal') closeSentenceSettings();
});


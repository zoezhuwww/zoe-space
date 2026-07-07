// ══════════ zoe-space · english.js ══════════
// 英语：句子卡（SRS · 每日推送 · 手动添加）+ 听读练习（听写 · 跟读）
// 多文件共享全局作用域；加载顺序见 index.html 顶部「文件地图」，勿随意调整。
// 依赖 nihongo.js 的 TTS 基建（ttsCache / _playAudioBlob / _setTtsLoading）
// 和 sentences.js 的 salvageSentenceArray。
// ═══════════════════════════════════════════

// ═══════════ English TTS ═══════════
// 链路：Google TTS（配了 key，结果缓存进 IndexedDB）→ 浏览器自带英语音
// 慢速用 playbackRate，和常速共用一份缓存
async function _googleTtsFetchBlob(text, apiKey) {
  const resp = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'en-US', name: 'en-US-Neural2-F', ssmlGender: 'FEMALE' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 }
    })
  });
  const data = await resp.json();
  if (!data.audioContent) throw new Error((data.error && data.error.message) || 'no audio');
  const bin = atob(data.audioContent);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: 'audio/mp3' });
}

function _speakEnBrowser(text, rate) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = rate || 0.95;
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
  if (enVoice) u.voice = enVoice;
  window.speechSynthesis.speak(u);
}

async function speakEn(text, opts) {
  if (!text) return;
  opts = opts || {};
  const rate = opts.slow ? 0.65 : 1;
  const gKey = load('google_tts_key', '');
  if (gKey) {
    _ttsAudioUnlock();
    const cacheKey = `en|${text}|1`;
    let blob = await ttsCacheGet(cacheKey);
    if (!blob) {
      _setTtsLoading(opts.btn, true);
      try {
        blob = await _googleTtsFetchBlob(text, gKey);
        ttsCachePut(cacheKey, blob);
      } catch (e) {
        console.warn('Google TTS failed, fallback:', e);
        _speakEnBrowser(text, opts.slow ? 0.55 : 0.95);
        return;
      } finally {
        _setTtsLoading(opts.btn, false);
      }
    }
    _playAudioBlob(blob, rate);
    return;
  }
  _speakEnBrowser(text, opts.slow ? 0.55 : 0.95);
}

// ═══════════ English Sentence Cards ═══════════
// Data shape: en_sentences = [{id, en, cn, breakdown:[{word,meaning}], note, source, addedAt, srs}]
const ENSENT_LEVEL_DEFAULT = 'B1（中级）';
const ENSENT_DAILY_DEFAULT = 10;

function getEnSentences() { return load('en_sentences', []); }
function saveEnSentences(arr) { save('en_sentences', arr); }
function getEnSentSettings() {
  return load('en_sentence_settings', { dailyCount: ENSENT_DAILY_DEFAULT, level: ENSENT_LEVEL_DEFAULT, themes: '' });
}
function saveEnSentSettings(s) { save('en_sentence_settings', s); }

function getTodayEnSentenceQueue() {
  const today = todayKey();
  return getEnSentences().filter(s => !s.srs || s.srs.nextReview <= today);
}

let _enSentQueue = [];
let _enSentIdx = 0;
let _enSentFlipped = false;

function renderEnSentencesPage() {
  _enSentQueue = getTodayEnSentenceQueue();
  _enSentIdx = 0;
  _enSentFlipped = false;
  showEnSentCard();
}

function showEnSentCard() {
  const emptyEl = document.getElementById('enSentEmpty');
  const cardEl = document.getElementById('enSentCardContainer');
  const ankiEl = document.getElementById('enSentAnkiButtons');
  const remEl = document.getElementById('enSentRemaining');
  const progEl = document.getElementById('enSentProgress');
  const fillEl = document.getElementById('enSentProgressFill');

  if (_enSentQueue.length === 0) {
    emptyEl.style.display = 'block';
    document.getElementById('enSentEmptyTitle').textContent = '今天的句子还没准备好';
    cardEl.style.display = 'none';
    ankiEl.style.display = 'none';
    remEl.textContent = '今天还没句子';
    progEl.textContent = '';
    fillEl.style.width = '0%';
    const settings = getEnSentSettings();
    const btn = document.getElementById('enSentFetchBtn');
    if (btn) btn.textContent = `🌱 让小豆推今天的 ${settings.dailyCount} 句`;
    return;
  }
  if (_enSentIdx >= _enSentQueue.length) {
    emptyEl.style.display = 'block';
    document.getElementById('enSentEmptyTitle').textContent = '今天的句子都过完啦 🎉';
    cardEl.style.display = 'none';
    ankiEl.style.display = 'none';
    remEl.textContent = '全部完成';
    progEl.textContent = `${_enSentQueue.length} / ${_enSentQueue.length}`;
    fillEl.style.width = '100%';
    return;
  }

  emptyEl.style.display = 'none';
  cardEl.style.display = 'block';
  ankiEl.style.display = _enSentFlipped ? 'flex' : 'none';

  const card = _enSentQueue[_enSentIdx];
  document.getElementById('enSentEn').textContent = card.en || '';
  document.getElementById('enSentEnBack').textContent = card.en || '';
  document.getElementById('enSentSourceFront').textContent = card.source || '';
  document.getElementById('enSentCn').textContent = card.cn || '';

  const bd = card.breakdown || [];
  const bdEl = document.getElementById('enSentBreakdown');
  const bdWrap = document.getElementById('enSentBreakdownWrap');
  if (bd.length) {
    bdWrap.style.display = 'block';
    bdEl.innerHTML = bd.map(b => `
      <div class="sent-bd-row">
        <span class="sent-bd-word">${escHtml(b.word||'')}</span>
        <span class="sent-bd-meaning">${escHtml(b.meaning||'')}</span>
      </div>`).join('');
  } else {
    bdWrap.style.display = 'none';
  }

  const noteWrap = document.getElementById('enSentNoteWrap');
  if (card.note) {
    noteWrap.style.display = 'block';
    document.getElementById('enSentNote').textContent = card.note;
  } else {
    noteWrap.style.display = 'none';
  }

  document.getElementById('enSentSource').textContent = card.source ? '— ' + card.source : '';

  document.getElementById('enSentFront').style.display = _enSentFlipped ? 'none' : 'flex';
  document.getElementById('enSentBack').style.display = _enSentFlipped ? 'block' : 'none';

  const remaining = _enSentQueue.length - _enSentIdx;
  remEl.textContent = remaining + ' 张待复习';
  progEl.textContent = `${_enSentIdx + 1} / ${_enSentQueue.length}`;
  fillEl.style.width = Math.round((_enSentIdx / _enSentQueue.length) * 100) + '%';
}

function flipEnSentCard() {
  _enSentFlipped = !_enSentFlipped;
  showEnSentCard();
}

function rateEnSentCard(rating) {
  const card = _enSentQueue[_enSentIdx];
  if (!card) return;
  const all = getEnSentences();
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
  saveEnSentences(all);

  if (rating === 0) _enSentQueue.push(card);
  _enSentIdx++;
  _enSentFlipped = false;
  const count = load('ensent_done_' + todayKey(), 0);
  save('ensent_done_' + todayKey(), count + 1);
  showEnSentCard();
  updateEnHubStats();
}

function speakEnSentence(btn) {
  const card = _enSentQueue[_enSentIdx];
  if (!card) return;
  speakEn(card.en, { btn });
}
function speakEnSentenceSlow(btn) {
  const card = _enSentQueue[_enSentIdx];
  if (!card) return;
  speakEn(card.en, { slow: true, btn });
}

// ───── Add (manual) ─────
function openEnSentenceAddModal() {
  document.getElementById('enSentInput').value = '';
  document.getElementById('enSentSourceInput').value = '';
  document.getElementById('enSentAddSubmit').textContent = '保存';
  document.getElementById('enSentAddSubmit').disabled = false;
  document.getElementById('enSentenceAddModal').classList.add('open');
}
function closeEnSentenceAddModal() {
  document.getElementById('enSentenceAddModal').classList.remove('open');
}
async function submitEnSentenceAdd() {
  const en = document.getElementById('enSentInput').value.trim();
  const source = document.getElementById('enSentSourceInput').value.trim();
  if (!en) { alert('粘一句英语进来吧～'); return; }
  const btn = document.getElementById('enSentAddSubmit');
  btn.textContent = '⏳ 小豆在拆解…';
  btn.disabled = true;

  const prompt = `用户加了一句英语，帮我处理成句子学习卡。英语原句："${en}"
请返回 JSON：
{
  "en": "原句（轻微纠正拼写和语法，保持口语自然）",
  "cn": "自然口语化的中文翻译",
  "breakdown": [{"word":"关键词或短语","meaning":"中文释义"}],
  "note": "若有值得注意的用法/搭配/语法点，一句话讲清楚；没有就空字符串"
}
breakdown 只列 2-5 个重要的词或短语。只返回JSON，不要markdown代码块。`;

  let result;
  try {
    result = await callDS(prompt, '你是小豆，温柔的英语学习助手。只输出纯JSON。');
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

  const all = getEnSentences();
  all.push({
    id: 'ensent_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    en: data.en || en,
    cn: data.cn || '',
    breakdown: Array.isArray(data.breakdown) ? data.breakdown : [],
    note: data.note || '',
    source: source || '自己加',
    addedAt: Date.now(),
    srs: null,
  });
  saveEnSentences(all);
  closeEnSentenceAddModal();
  renderEnSentencesPage();
  updateEnHubStats();
}

// ───── Daily push from 小豆 ─────
async function fetchDailyEnSentences() {
  const settings = getEnSentSettings();
  const lastPushKey = 'ensent_last_push_' + todayKey();
  if (load(lastPushKey, false)) {
    if (!confirm('今天已经让小豆推过了，要再推一批吗？')) return;
  }

  const btn = document.getElementById('enSentFetchBtn');
  if (btn) { btn.textContent = '⏳ 小豆在挑句子…'; btn.disabled = true; }

  const total = settings.dailyCount;
  const batchSize = 5;
  const batches = [];
  let remaining = total;
  while (remaining > 0) {
    batches.push(Math.min(batchSize, remaining));
    remaining -= batchSize;
  }

  const themeHint = settings.themes ? `偏好主题：${settings.themes}。` : '主题随机，覆盖日常各种场景。';
  const buildPrompt = (n, batchIdx) => `请为英语水平 ${settings.level} 的学习者推荐 ${n} 个实用日常英语句子。${themeHint}（这是第 ${batchIdx + 1} 批，请和其他批的句子在场景上尽量不重复）

要求：
- 母语者真实会说的口语，不要教科书句
- 涵盖不同生活场景
- 每句配一个简短场景标签
- breakdown 只挑 2-3 个对该水平重要的词或短语，meaning 用中文，控制简短

只返回 JSON 数组，不要markdown，不要其他文字：
[{"en":"English sentence","cn":"中文","breakdown":[{"word":"","meaning":""}],"note":"一句话用法点或空字符串","scene":"场景标签"}]`;

  const promises = batches.map((n, i) =>
    callDS(buildPrompt(n, i), '你是小豆，温柔的英语老师。只输出纯JSON数组，简短。', { maxTokens: 3000, timeoutMs: 90000 })
      .then(r => r ? salvageSentenceArray(r, 'en') : [])
      .catch(() => [])
  );

  const results = await Promise.all(promises);
  if (btn) { btn.textContent = `🌱 让小豆推今天的 ${settings.dailyCount} 句`; btn.disabled = false; }

  const merged = [].concat(...results);
  if (!merged.length) {
    alert('小豆这次一句都没推回来，看看 API 余额够不够？\n或者去设置里把数量调小再试试');
    return;
  }

  const all = getEnSentences();
  const baseTime = Date.now();
  merged.forEach((s, i) => {
    if (!s.en) return;
    all.push({
      id: 'ensent_' + baseTime + '_' + i,
      en: s.en,
      cn: s.cn || '',
      breakdown: Array.isArray(s.breakdown) ? s.breakdown : [],
      note: s.note || '',
      source: s.scene ? '小豆 · ' + s.scene : '小豆推荐',
      addedAt: baseTime + i,
      srs: null,
    });
  });
  saveEnSentences(all);
  save(lastPushKey, true);
  renderEnSentencesPage();
  updateEnHubStats();
  if (merged.length < total) {
    setTimeout(() => alert(`小豆推回来 ${merged.length} 句（原计划 ${total}）～再点一次推送按钮补齐就好`), 100);
  }
}

// ───── Settings ─────
function openEnSentenceSettings() {
  const s = getEnSentSettings();
  document.getElementById('enSentDailyCountInput').value = s.dailyCount;
  document.getElementById('enSentLevelInput').value = s.level;
  document.getElementById('enSentThemesInput').value = s.themes || '';
  document.getElementById('enSentenceSettingsModal').classList.add('open');
}
function closeEnSentenceSettings() {
  document.getElementById('enSentenceSettingsModal').classList.remove('open');
}
function submitEnSentenceSettings() {
  const dailyCount = Math.max(3, Math.min(30, parseInt(document.getElementById('enSentDailyCountInput').value) || ENSENT_DAILY_DEFAULT));
  const level = document.getElementById('enSentLevelInput').value || ENSENT_LEVEL_DEFAULT;
  const themes = document.getElementById('enSentThemesInput').value.trim();
  saveEnSentSettings({ dailyCount, level, themes });
  closeEnSentenceSettings();
}

// ═══════════ Listening & Reading Practice ═══════════
// 听写：只放声音 → 打字 → 逐词对答案；跟读：看句子朗读 → 语音识别 → 逐词比对
// 今日题目缓存在 listen_data = {date, items:[{en,cn}], idx}
function getListenData() { return load('listen_data', null); }
function saveListenData(d) { save('listen_data', d); }

let _lisMode = 'dictation'; // 'dictation' | 'shadow'
let _lisChecked = false;
let _lisRecognition = null;
let _lisRecognizing = false;

function renderListeningPage() {
  _lisChecked = false;
  _lisStopRecognition();
  switchListenMode(_lisMode);
}

function switchListenMode(mode) {
  _lisMode = mode;
  document.getElementById('lisModeDictation').classList.toggle('active', mode === 'dictation');
  document.getElementById('lisModeShadow').classList.toggle('active', mode === 'shadow');
  _lisStopRecognition();
  showListenItem();
}

function _lisCurrentItem() {
  const d = getListenData();
  if (!d || d.date !== todayKey() || !d.items || !d.items.length) return null;
  if (d.idx >= d.items.length) return undefined; // 做完了
  return d.items[d.idx];
}

function showListenItem() {
  const d = getListenData();
  const fresh = d && d.date === todayKey() && d.items && d.items.length;
  const emptyEl = document.getElementById('lisEmpty');
  const practiceEl = document.getElementById('lisPractice');
  const progEl = document.getElementById('lisProgressText');

  _lisChecked = false;
  document.getElementById('lisResultBox').style.display = 'none';
  document.getElementById('lisAnswerInput').value = '';
  document.getElementById('lisNextBtn').style.display = 'none';
  document.getElementById('lisShadowTranscript').textContent = '';

  if (!fresh || d.idx >= d.items.length) {
    emptyEl.style.display = 'block';
    practiceEl.style.display = 'none';
    const doneAll = fresh && d.idx >= d.items.length;
    document.getElementById('lisEmptyTitle').textContent =
      doneAll ? '今天的听读都练完啦 🎉' : '今天的题目还没准备好';
    document.getElementById('lisEmptySub').textContent =
      doneAll ? '想加练就再让小豆出一批～' : '让小豆按你的水平出 10 句';
    progEl.textContent = fresh ? `${Math.min(d.idx, d.items.length)} / ${d.items.length}` : '';
    return;
  }

  emptyEl.style.display = 'none';
  practiceEl.style.display = 'block';
  progEl.textContent = `${d.idx + 1} / ${d.items.length}`;

  const isDict = _lisMode === 'dictation';
  document.getElementById('lisDictationBox').style.display = isDict ? 'block' : 'none';
  document.getElementById('lisShadowBox').style.display = isDict ? 'none' : 'block';

  const item = d.items[d.idx];
  // 听写不给看原文；跟读要看着读
  document.getElementById('lisShadowText').textContent = item.en;
  document.getElementById('lisShadowCn').textContent = item.cn || '';
}

function lisPlay(btn, slow) {
  const item = _lisCurrentItem();
  if (!item) return;
  speakEn(item.en, { btn, slow: !!slow });
}

// ───── 逐词比对：LCS 对齐，目标句里每个词标记命中/漏掉 ─────
function _lisTokens(s) {
  return (s || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/gi, ' ')
    .split(/\s+/).filter(Boolean);
}

function _lisDiff(targetText, userText) {
  const t = _lisTokens(targetText);
  const u = _lisTokens(userText);
  // LCS 表
  const dp = Array.from({ length: t.length + 1 }, () => new Array(u.length + 1).fill(0));
  for (let i = t.length - 1; i >= 0; i--)
    for (let j = u.length - 1; j >= 0; j--)
      dp[i][j] = t[i] === u[j] ? dp[i+1][j+1] + 1 : Math.max(dp[i+1][j], dp[i][j+1]);
  // 回溯标记目标词是否命中
  const hit = new Array(t.length).fill(false);
  let i = 0, j = 0;
  while (i < t.length && j < u.length) {
    if (t[i] === u[j]) { hit[i] = true; i++; j++; }
    else if (dp[i+1][j] >= dp[i][j+1]) i++;
    else j++;
  }
  const hits = hit.filter(Boolean).length;
  return { tokens: t, hit, score: t.length ? Math.round(hits / t.length * 100) : 0 };
}

function _lisRenderResult(item, userText) {
  const diff = _lisDiff(item.en, userText);
  const html = diff.tokens.map((w, k) =>
    `<span class="lis-word ${diff.hit[k] ? 'ok' : 'miss'}">${escHtml(w)}</span>`).join(' ');
  const scoreMsg = diff.score >= 90 ? '太棒了！' : diff.score >= 70 ? '不错不错～' : diff.score >= 40 ? '再听一遍试试？' : '别灰心，多听几遍 ❀';
  document.getElementById('lisResultBox').style.display = 'block';
  document.getElementById('lisScore').textContent = diff.score + ' 分 · ' + scoreMsg;
  document.getElementById('lisDiffText').innerHTML = html;
  document.getElementById('lisOriginal').textContent = item.en;
  document.getElementById('lisTranslation').textContent = item.cn || '';
  document.getElementById('lisNextBtn').style.display = 'block';
  return diff.score;
}

function lisCheckDictation() {
  if (_lisChecked) return;
  const item = _lisCurrentItem();
  if (!item) return;
  const userText = document.getElementById('lisAnswerInput').value.trim();
  if (!userText) { alert('先把听到的句子打出来哦～'); return; }
  _lisChecked = true;
  _lisRenderResult(item, userText);
  const count = load('listen_count_' + todayKey(), 0);
  save('listen_count_' + todayKey(), count + 1);
}

function lisNext() {
  const d = getListenData();
  if (!d) return;
  d.idx++;
  saveListenData(d);
  _lisStopRecognition();
  showListenItem();
  updateEnHubStats();
}

// ───── 跟读：语音识别比对 ─────
function lisToggleShadowRecord() {
  if (_lisRecognizing) { _lisStopRecognition(); return; }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('当前浏览器不支持语音识别，换听写模式练也可以～');
    return;
  }
  const item = _lisCurrentItem();
  if (!item) return;

  _lisRecognition = new SpeechRecognition();
  _lisRecognition.lang = 'en-US';
  _lisRecognition.continuous = true;
  _lisRecognition.interimResults = true;
  let finalText = '';

  _lisRecognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += t + ' ';
      else interim = t;
    }
    document.getElementById('lisShadowTranscript').textContent = (finalText + interim).trim();
  };
  _lisRecognition.onend = () => {
    _lisRecognizing = false;
    _lisUpdateShadowBtn();
    const heard = finalText.trim() || document.getElementById('lisShadowTranscript').textContent.trim();
    if (heard) {
      _lisChecked = true;
      _lisRenderResult(item, heard);
      const count = load('listen_count_' + todayKey(), 0);
      save('listen_count_' + todayKey(), count + 1);
    }
  };
  _lisRecognition.onerror = (e) => {
    if (e.error !== 'no-speech') console.log('Shadow recognition error:', e.error);
  };

  try { _lisRecognition.start(); } catch(e) { return; }
  _lisRecognizing = true;
  document.getElementById('lisShadowTranscript').textContent = '';
  _lisUpdateShadowBtn();
}

function _lisStopRecognition() {
  if (_lisRecognition) {
    try { _lisRecognition.stop(); } catch(e) {}
  }
  _lisRecognizing = false;
  _lisUpdateShadowBtn();
}

function _lisUpdateShadowBtn() {
  const btn = document.getElementById('lisShadowRecordBtn');
  if (!btn) return;
  btn.textContent = _lisRecognizing ? '⏹ 读完了，看结果' : '🎤 开始跟读';
  btn.classList.toggle('recording', _lisRecognizing);
}

// ───── 小豆出题 ─────
async function fetchListenItems() {
  const settings = getEnSentSettings();
  const btn = document.getElementById('lisFetchBtn');
  if (btn) { btn.textContent = '⏳ 小豆在出题…'; btn.disabled = true; }

  const themeHint = settings.themes ? `偏好主题：${settings.themes}。` : '';
  const prompt = `请为英语水平 ${settings.level} 的学习者出 10 句听写练习用的英语句子。${themeHint}

要求：
- 母语者日常真实会说的句子，长度 6-14 个词
- 用词和语速难度贴合该水平，覆盖不同场景
- 不要生僻人名地名

只返回 JSON 数组，不要markdown，不要其他文字：
[{"en":"English sentence","cn":"中文翻译"}]`;

  let items = [];
  try {
    const r = await callDS(prompt, '你是小豆，温柔的英语老师。只输出纯JSON数组。', { maxTokens: 2000, timeoutMs: 90000 });
    items = r ? salvageSentenceArray(r, 'en') : [];
  } catch (e) { items = []; }

  if (btn) { btn.textContent = '🌱 让小豆出今天的 10 句'; btn.disabled = false; }
  if (!items.length) {
    alert('小豆这次没出出来，看看 API 余额够不够？再试一次～');
    return;
  }
  saveListenData({ date: todayKey(), items: items.map(s => ({ en: s.en, cn: s.cn || '' })), idx: 0 });
  showListenItem();
}

// ═══════════ English Hub stats ═══════════
function updateEnHubStats() {
  const el = document.getElementById('enHubStats');
  if (!el) return;
  const due = getTodayEnSentenceQueue().length;
  const done = load('ensent_done_' + todayKey(), 0);
  const listened = load('listen_count_' + todayKey(), 0);
  el.innerHTML = `今天 <strong>${done}</strong> 张句子卡 · <strong>${listened}</strong> 次听读 · 还有 <strong>${due}</strong> 张待复习`;
  const info = document.getElementById('enSentencesInfo');
  if (info) info.textContent = due > 0 ? `${due} 张待复习` : '小豆每天推荐 · 也可以自己加';
}

// Modal close on overlay click
document.addEventListener('click', e => {
  if (e.target.id === 'enSentenceAddModal') closeEnSentenceAddModal();
  if (e.target.id === 'enSentenceSettingsModal') closeEnSentenceSettings();
});

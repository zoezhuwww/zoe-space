// ══════════ zoe-space · practice.js ══════════
// 句子练习（日/英通用引擎）：来源（今日 / 收藏）× 模式（卡片 / 听写 / 跟读）
// 数据仍在各语言句子库（sentences / en_sentences），本文件只管练习交互。
// 没有 SRS：练完就归档，喜欢的句子用 ⭐ 收藏，收藏夹里随时用三种模式重练。
// 多文件共享全局作用域；加载顺序见 index.html 顶部「文件地图」，勿随意调整。
// ═══════════════════════════════════════════

const PR_CFGS = {
  ja: {
    pageId: 'sentences',
    getAll: () => getSentences(),
    saveAll: a => saveSentences(a),
    text: s => s.jp || '',
    reading: s => s.reading || '',
    noteOf: s => s.grammar || '',
    noteLabel: '语法点',
    getSettings: () => getSentSettings(),
    speak: (t, o) => speakJa(t, o),
    recogLang: 'ja-JP',
    charDiff: true,
    fetchBtnId: 'sentFetchBtn',
    fetchDailyCall: 'fetchDailySentences()',
    openAddCall: 'openSentenceAddModal()',
    dictPlaceholder: '聞こえたまま打ってみて…（假名或汉字都行）',
    flipHint: '点击翻转 · 看读音和翻译',
    breakdownRows: s => (s.breakdown || []).map(b => `
      <div class="sent-bd-row">
        <span class="sent-bd-word">${escHtml(b.word||'')}</span>
        <span class="sent-bd-reading">${escHtml(b.reading||'')}</span>
        <span class="sent-bd-meaning">${escHtml(b.meaning||'')}</span>
      </div>`).join(''),
    onPracticed: () => {
      if (typeof markSentenceActiveToday === 'function') markSentenceActiveToday();
      if (typeof updateStudyHubStats === 'function') updateStudyHubStats();
      if (typeof refreshDashboard === 'function' && currentPage === 'dashboard') refreshDashboard();
    },
  },
  en: {
    pageId: 'ensentences',
    getAll: () => getEnSentences(),
    saveAll: a => saveEnSentences(a),
    text: s => s.en || '',
    reading: () => '',
    noteOf: s => s.note || '',
    noteLabel: '用法点',
    getSettings: () => getEnSentSettings(),
    speak: (t, o) => speakEn(t, o),
    recogLang: 'en-US',
    charDiff: false,
    fetchBtnId: 'enSentFetchBtn',
    fetchDailyCall: 'fetchDailyEnSentences()',
    openAddCall: 'openEnSentenceAddModal()',
    dictPlaceholder: 'Type what you hear...',
    flipHint: '点击翻转 · 看翻译和讲解',
    breakdownRows: s => (s.breakdown || []).map(b => `
      <div class="sent-bd-row">
        <span class="sent-bd-word">${escHtml(b.word||'')}</span>
        <span class="sent-bd-meaning">${escHtml(b.meaning||'')}</span>
      </div>`).join(''),
    onPracticed: () => { if (typeof updateEnHubStats === 'function') updateEnHubStats(); },
  },
};

// 每种语言各自的练习状态（不进 localStorage，刷新就重置到今天第一句没练的）
const _prState = {
  ja: { source: 'today', mode: 'card', idx: 0, flipped: false, checked: false, recog: null, recognizing: false },
  en: { source: 'today', mode: 'card', idx: 0, flipped: false, checked: false, recog: null, recognizing: false },
};

function _prEl(lang, sel) {
  return document.querySelector('#page-' + PR_CFGS[lang].pageId + ' ' + sel);
}

function _prTodayQueue(cfg) {
  const today = todayKey();
  return cfg.getAll().filter(s => s.addedAt && dateKey(new Date(s.addedAt)) === today);
}
function _prFavQueue(cfg) {
  return cfg.getAll().filter(s => s.fav).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
}
function _prQueue(lang) {
  const cfg = PR_CFGS[lang];
  const st = _prState[lang];
  return st.source === 'fav' ? _prFavQueue(cfg) : _prTodayQueue(cfg);
}

// ───── 页面入口 ─────
function renderPracticePage(lang) {
  const st = _prState[lang];
  _prStopRecognition(lang);
  st.flipped = false;
  st.checked = false;
  // 进页面时跳到今天第一句还没练的；都练完就落在完成页
  if (st.source === 'today') {
    const q = _prQueue(lang);
    const today = todayKey();
    const firstUndone = q.findIndex(s => s.lastPracticed !== today);
    st.idx = firstUndone === -1 ? q.length : firstUndone;
  } else {
    st.idx = Math.min(st.idx, Math.max(0, _prQueue(lang).length - 1));
  }
  prRender(lang);
}

// ───── 主渲染 ─────
function prRender(lang) {
  const cfg = PR_CFGS[lang];
  const st = _prState[lang];
  const root = _prEl(lang, '.pr-root');
  if (!root) return;
  const q = _prQueue(lang);
  const item = q[st.idx];

  const tabs = `
    <div class="speak-lang-toggle pr-tabs">
      <button class="speak-lang-btn ${st.source==='today'?'active':''}" onclick="prSwitchSource('${lang}','today')">📅 今日</button>
      <button class="speak-lang-btn ${st.source==='fav'?'active':''}" onclick="prSwitchSource('${lang}','fav')">⭐ 收藏</button>
    </div>
    <div class="speak-lang-toggle pr-tabs pr-tabs-mode">
      <button class="speak-lang-btn ${st.mode==='card'?'active':''}" onclick="prSwitchMode('${lang}','card')">🃏 卡片</button>
      <button class="speak-lang-btn ${st.mode==='dict'?'active':''}" onclick="prSwitchMode('${lang}','dict')">✍️ 听写</button>
      <button class="speak-lang-btn ${st.mode==='shadow'?'active':''}" onclick="prSwitchMode('${lang}','shadow')">🗣️ 跟读</button>
    </div>`;

  // 空 / 完成状态
  if (!q.length || st.idx >= q.length) {
    const isFav = st.source === 'fav';
    const done = q.length > 0;
    const settings = cfg.getSettings();
    let title, sub, actions;
    if (isFav) {
      title = done ? '收藏的句子练完一轮啦 🎉' : '还没有收藏的句子';
      sub = done ? '喜欢就再来一轮 ❀' : '练习的时候点 ⭐，喜欢的句子就留在这儿了';
      actions = done ? `<button class="sent-action-btn primary" onclick="prRestart('${lang}')">🔁 再来一轮</button>` : '';
    } else {
      title = done ? '今天的句子都练完啦 🎉' : '今天的句子还没准备好';
      sub = done ? '还想练就再来一轮，或者让小豆再推一批 ❀' : '让小豆推今天的，或者把你听到的一句加进来';
      actions = `
        ${done ? `<button class="sent-action-btn primary" onclick="prRestart('${lang}')">🔁 再来一轮</button>` : ''}
        <button class="sent-action-btn ${done ? '' : 'primary'}" id="${cfg.fetchBtnId}" onclick="${cfg.fetchDailyCall}">🌱 让小豆推今天的 ${settings.dailyCount} 句</button>
        <button class="sent-action-btn" onclick="${cfg.openAddCall}">＋ 自己加一句</button>`;
    }
    root.innerHTML = `${tabs}
      <div class="sent-empty" style="display:block;">
        <div class="placeholder-icon">${isFav ? '⭐' : '❀'}</div>
        <div class="placeholder-text">${title}</div>
        <div class="placeholder-sub">${sub}</div>
        <div class="sent-empty-actions">${actions}</div>
        ${done ? `<div class="pr-progress-done">${q.length} / ${q.length}</div>` : ''}
      </div>`;
    return;
  }

  const text = cfg.text(item);
  const favIcon = item.fav ? '⭐' : '☆';

  const progress = `
    <div class="pr-progress-row">
      <span>${st.idx + 1} / ${q.length}</span>
      <button class="pr-fav-btn ${item.fav ? 'faved' : ''}" onclick="prToggleFav('${lang}')" title="收藏">${favIcon}</button>
    </div>`;

  let body = '';
  if (st.mode === 'card') {
    body = `
      <div class="flashcard-container" style="display:block;">
        <div class="flashcard sent-card" onclick="prFlip('${lang}')">
          ${!st.flipped ? `
          <div class="flashcard-front" style="display:flex;">
            <div class="sent-jp">${escHtml(text)}</div>
            <div class="sent-source-front">${escHtml(item.source || '')}</div>
            <div class="card-hint">${cfg.flipHint}</div>
          </div>` : `
          <div class="flashcard-back" style="display:block;">
            <div class="sent-jp-back">${escHtml(text)}</div>
            ${cfg.reading(item) ? `<div class="sent-reading">${escHtml(cfg.reading(item))}</div>` : ''}
            <div class="card-tts-row">
              <button class="card-tts-btn" onclick="event.stopPropagation();prPlay('${lang}',false,this)">🔊 发音</button>
              <button class="card-tts-btn" onclick="event.stopPropagation();prPlay('${lang}',true,this)">🐢 慢速</button>
            </div>
            <div class="card-divider"></div>
            <div class="sent-cn">${escHtml(item.cn || '')}</div>
            ${(item.breakdown && item.breakdown.length) ? `
            <div class="sent-breakdown-wrap" style="display:block;">
              <div class="sent-section-label">词语拆解</div>
              <div class="sent-breakdown">${cfg.breakdownRows(item)}</div>
            </div>` : ''}
            ${cfg.noteOf(item) ? `
            <div class="sent-grammar-wrap" style="display:block;">
              <div class="sent-section-label">${cfg.noteLabel}</div>
              <div class="sent-grammar">${escHtml(cfg.noteOf(item))}</div>
            </div>` : ''}
            <div class="sent-source">${item.source ? '— ' + escHtml(item.source) : ''}</div>
          </div>`}
        </div>
      </div>`;
  } else if (st.mode === 'dict') {
    body = `
      <div class="speak-topic-card">
        <div class="speak-topic-category">DICTATION</div>
        <div class="card-tts-row" style="justify-content:center;margin:14px 0 6px;">
          <button class="card-tts-btn" onclick="prPlay('${lang}',false,this)">🔊 播放</button>
          <button class="card-tts-btn" onclick="prPlay('${lang}',true,this)">🐢 慢速</button>
        </div>
        <div class="speak-topic-hint">听到什么就打什么，可以反复听</div>
      </div>
      <textarea class="modal-input pr-dict-input" rows="3" placeholder="${escHtml(cfg.dictPlaceholder)}"></textarea>
      <button class="food-action-btn" onclick="prCheckDict('${lang}')" style="margin-top:10px;">✅ 对答案</button>
      <div class="pr-result"></div>`;
  } else {
    body = `
      <div class="speak-topic-card">
        <div class="speak-topic-category">SHADOWING</div>
        <div class="speak-topic-text">${escHtml(text)}</div>
        <div class="speak-topic-hint">${escHtml(item.cn || '')}</div>
        <div class="card-tts-row" style="justify-content:center;margin-top:10px;">
          <button class="card-tts-btn" onclick="prPlay('${lang}',false,this)">🔊 听示范</button>
          <button class="card-tts-btn" onclick="prPlay('${lang}',true,this)">🐢 慢速</button>
        </div>
      </div>
      <button class="food-action-btn pr-record-btn" onclick="prToggleShadow('${lang}')" style="margin-top:14px;">🎤 开始跟读</button>
      <div class="pr-transcript"></div>
      <div class="pr-result"></div>`;
  }

  const nav = `
    <div class="pr-nav">
      <button class="sent-action-btn" onclick="prPrev('${lang}')" ${st.idx === 0 ? 'disabled' : ''}>← 上一句</button>
      <button class="sent-action-btn primary" onclick="prNext('${lang}')">${st.idx + 1 >= q.length ? '完成 ✓' : '下一句 →'}</button>
    </div>`;

  root.innerHTML = tabs + progress + body + nav;
}

// ───── 交互 ─────
function prSwitchSource(lang, source) {
  const st = _prState[lang];
  if (st.source === source) return;
  _prStopRecognition(lang);
  st.source = source;
  st.idx = 0;
  st.flipped = false;
  st.checked = false;
  if (source === 'today') renderPracticePage(lang);
  else prRender(lang);
}

function prSwitchMode(lang, mode) {
  const st = _prState[lang];
  if (st.mode === mode) return;
  _prStopRecognition(lang);
  st.mode = mode;
  st.flipped = false;
  st.checked = false;
  prRender(lang);
}

function prFlip(lang) {
  _prState[lang].flipped = !_prState[lang].flipped;
  prRender(lang);
}

function prPlay(lang, slow, btn) {
  const q = _prQueue(lang);
  const item = q[_prState[lang].idx];
  if (!item) return;
  PR_CFGS[lang].speak(PR_CFGS[lang].text(item), { slow: !!slow, btn });
}

function prToggleFav(lang) {
  const cfg = PR_CFGS[lang];
  const q = _prQueue(lang);
  const st = _prState[lang];
  const item = q[st.idx];
  if (!item) return;
  const all = cfg.getAll();
  const idx = all.findIndex(s => s.id === item.id);
  if (idx === -1) return;
  all[idx].fav = !all[idx].fav;
  cfg.saveAll(all);
  showToast(all[idx].fav ? '收下啦 ⭐' : '取消收藏了');
  // 收藏夹里取消收藏 = 当前句离开队列，索引不动重画即可
  if (st.source === 'fav' && !all[idx].fav) {
    st.flipped = false; st.checked = false;
    st.idx = Math.min(st.idx, Math.max(0, _prFavQueue(cfg).length - 1));
  }
  prRender(lang);
}

function prPrev(lang) {
  const st = _prState[lang];
  if (st.idx === 0) return;
  _prStopRecognition(lang);
  st.idx--;
  st.flipped = false;
  st.checked = false;
  prRender(lang);
}

function prNext(lang) {
  const cfg = PR_CFGS[lang];
  const st = _prState[lang];
  const q = _prQueue(lang);
  const item = q[st.idx];
  if (item) _prMarkPracticed(lang, item);
  _prStopRecognition(lang);
  st.idx++;
  st.flipped = false;
  st.checked = false;
  prRender(lang);
  cfg.onPracticed();
}

function prRestart(lang) {
  const st = _prState[lang];
  st.idx = 0;
  st.flipped = false;
  st.checked = false;
  prRender(lang);
}

function _prMarkPracticed(lang, item) {
  const cfg = PR_CFGS[lang];
  const all = cfg.getAll();
  const idx = all.findIndex(s => s.id === item.id);
  const today = todayKey();
  if (idx !== -1 && all[idx].lastPracticed !== today) {
    all[idx].lastPracticed = today;
    cfg.saveAll(all);
    const count = load('pr_count_' + lang + '_' + today, 0);
    save('pr_count_' + lang + '_' + today, count + 1);
  }
}

// ───── 逐词/逐字比对（LCS 对齐）─────
function _prLcsDiff(t, u) {
  const dp = Array.from({ length: t.length + 1 }, () => new Array(u.length + 1).fill(0));
  for (let i = t.length - 1; i >= 0; i--)
    for (let j = u.length - 1; j >= 0; j--)
      dp[i][j] = t[i] === u[j] ? dp[i+1][j+1] + 1 : Math.max(dp[i+1][j], dp[i][j+1]);
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

function _prWordTokens(s) {
  return (s || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/gi, ' ')
    .split(/\s+/).filter(Boolean);
}
// 日语：去掉空白和标点后按字比（注意别去掉长音「ー」）
function _prJaChars(s) {
  return (s || '').replace(/[\s、。．・！？!?.,，…‥「」『』（）()〈〉《》【】"'“”〜～]/g, '').split('');
}
function _prKataToHira(arr) {
  return arr.map(c => {
    const code = c.charCodeAt(0);
    return (code >= 0x30A1 && code <= 0x30F6) ? String.fromCharCode(code - 0x60) : c;
  });
}

// 返回 {tokens, hit, score, joiner}
function _prDiff(lang, item, userText) {
  const cfg = PR_CFGS[lang];
  if (!cfg.charDiff) {
    return Object.assign(_prLcsDiff(_prWordTokens(cfg.text(item)), _prWordTokens(userText)), { joiner: ' ' });
  }
  // 日语：跟原文比一次，再跟假名读音比一次（片假名归一成平假名），取高分——
  // 这样打假名、打汉字、语音识别出汉字都能对上
  const u = _prJaChars(userText);
  const d1 = _prLcsDiff(_prJaChars(cfg.text(item)), u);
  let best = d1;
  const reading = cfg.reading(item);
  if (reading) {
    const d2 = _prLcsDiff(_prKataToHira(_prJaChars(reading)), _prKataToHira(u));
    if (d2.score > d1.score) best = d2;
  }
  return Object.assign(best, { joiner: '' });
}

function _prShowResult(lang, item, userText) {
  const cfg = PR_CFGS[lang];
  const diff = _prDiff(lang, item, userText);
  const words = diff.tokens.map((w, k) =>
    `<span class="lis-word ${diff.hit[k] ? 'ok' : 'miss'}">${escHtml(w)}</span>`).join(diff.joiner);
  const msg = diff.score >= 90 ? '太棒了！' : diff.score >= 70 ? '不错不错～' : diff.score >= 40 ? '再听一遍试试？' : '别灰心，多练几遍 ❀';
  const box = _prEl(lang, '.pr-result');
  if (!box) return;
  box.innerHTML = `
    <div class="speak-review-box" style="display:block;margin:16px 0 0;">
      <div class="pr-score">${diff.score} 分 · ${msg}</div>
      <div class="review-section">
        <div class="review-label">逐${cfg.charDiff ? '字' : '词'}比对（绿=对上了 · 红=漏了/错了）</div>
        <div class="lis-diff">${words}</div>
      </div>
      <div class="review-section">
        <div class="review-label">原句</div>
        <div style="font-style:italic;">${escHtml(cfg.text(item))}</div>
        ${cfg.reading(item) ? `<div style="color:var(--text-mute);font-size:12px;margin-top:2px;">${escHtml(cfg.reading(item))}</div>` : ''}
      </div>
      <div class="review-section">
        <div class="review-label">翻译</div>
        <div>${escHtml(item.cn || '')}</div>
      </div>
    </div>`;
}

function prCheckDict(lang) {
  const st = _prState[lang];
  const q = _prQueue(lang);
  const item = q[st.idx];
  if (!item) return;
  const input = _prEl(lang, '.pr-dict-input');
  const userText = input ? input.value.trim() : '';
  if (!userText) { alert('先把听到的句子打出来哦～'); return; }
  st.checked = true;
  _prShowResult(lang, item, userText);
}

// ───── 跟读 ─────
function prToggleShadow(lang) {
  const st = _prState[lang];
  if (st.recognizing) { _prStopRecognition(lang); return; }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('当前浏览器不支持语音识别，换听写模式练也可以～');
    return;
  }
  const q = _prQueue(lang);
  const item = q[st.idx];
  if (!item) return;

  const recog = new SpeechRecognition();
  recog.lang = PR_CFGS[lang].recogLang;
  recog.continuous = true;
  recog.interimResults = true;
  let finalText = '';

  recog.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += t + ' ';
      else interim = t;
    }
    const el = _prEl(lang, '.pr-transcript');
    if (el) el.textContent = (finalText + interim).trim();
  };
  recog.onend = () => {
    st.recognizing = false;
    _prUpdateShadowBtn(lang);
    const el = _prEl(lang, '.pr-transcript');
    const heard = finalText.trim() || (el ? el.textContent.trim() : '');
    if (heard) {
      st.checked = true;
      _prShowResult(lang, item, heard);
    }
  };
  recog.onerror = (e) => {
    if (e.error !== 'no-speech') console.log('Shadow recognition error:', e.error);
  };

  try { recog.start(); } catch (e) { return; }
  st.recog = recog;
  st.recognizing = true;
  const el = _prEl(lang, '.pr-transcript');
  if (el) el.textContent = '';
  _prUpdateShadowBtn(lang);
}

function _prStopRecognition(lang) {
  const st = _prState[lang];
  if (st.recog) { try { st.recog.stop(); } catch (e) {} }
  st.recognizing = false;
  _prUpdateShadowBtn(lang);
}

function _prUpdateShadowBtn(lang) {
  const btn = _prEl(lang, '.pr-record-btn');
  if (!btn) return;
  btn.textContent = _prState[lang].recognizing ? '⏹ 读完了，看结果' : '🎤 开始跟读';
  btn.classList.toggle('recording', _prState[lang].recognizing);
}

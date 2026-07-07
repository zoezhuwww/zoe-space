// ══════════ zoe-space · english.js ══════════
// 英语：发音链路 + 句子库（小豆每日推送 · 手动添加）
// 练习交互（卡片/听写/跟读/收藏）在 practice.js，本文件管发音和数据。
// 依赖 nihongo.js 的 TTS 基建（ttsCache / _playAudioBlob / _setTtsLoading）
// 和 sentences.js 的 salvageSentenceArray / SENT_LENGTHS。
// 多文件共享全局作用域；加载顺序见 index.html 顶部「文件地图」，勿随意调整。
// ═══════════════════════════════════════════

// ═══════════ English TTS ═══════════
// 链路：Google Cloud TTS（配了 key，结果缓存进 IndexedDB）
//   → 谷歌翻译朗读接口（免费无 key；不给跨域 fetch，只能 <audio> 直接播，没法缓存）
//   → 浏览器自带英语音
// 慢速用 playbackRate，和常速共用一份音频
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

// 远程 URL 直接喂给共享 <audio> 元素播（谷歌翻译接口不给跨域 fetch，走不了 blob 缓存）
function _playAudioUrl(url, rate, onError) {
  if (!_ttsAudioEl) _ttsAudioEl = new Audio();
  const a = _ttsAudioEl;
  a.pause();
  if (a.src && a.src.startsWith('blob:')) URL.revokeObjectURL(a.src);
  let failed = false;
  // src 校验：共享元素之后可能换播别的（比如日语 blob），残留的 onerror 不该再触发这次的兜底
  const fail = () => {
    if (failed || (a.src && a.src !== url)) return;
    failed = true; a.onerror = null;
    if (onError) onError();
  };
  a.onerror = fail;
  a.src = url;
  a.defaultPlaybackRate = rate || 1;
  a.playbackRate = rate || 1;
  a.play().catch(e => { console.warn('audio play blocked:', e); fail(); });
}

function _speakEnTranslate(text, opts) {
  // 接口对长文本会拒，超长的直接交给系统语音
  if (text.length > 180) { _speakEnBrowser(text, opts.slow ? 0.55 : 0.95); return; }
  const url = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=' + encodeURIComponent(text);
  _playAudioUrl(url, opts.slow ? 0.65 : 1, () => _speakEnBrowser(text, opts.slow ? 0.55 : 0.95));
}

let _enTtsKeyWarned = false;

async function speakEn(text, opts) {
  if (!text) return;
  opts = opts || {};
  const rate = opts.slow ? 0.65 : 1;
  const gKey = load('google_tts_key', '');
  // 必须在第一个 await 之前调用：还在用户手势的同步上下文里，iOS 才认
  _ttsAudioUnlock();
  if (gKey) {
    const cacheKey = `en|${text}|1`;
    let blob = await ttsCacheGet(cacheKey);
    if (!blob) {
      _setTtsLoading(opts.btn, true);
      try {
        blob = await _googleTtsFetchBlob(text, gKey);
        ttsCachePut(cacheKey, blob);
      } catch (e) {
        console.warn('Google TTS failed, fallback:', e);
        if (!_enTtsKeyWarned) {
          _enTtsKeyWarned = true;
          showToast('Google TTS 用不了，先用谷歌翻译的声音 ❀');
        }
        blob = null;
      } finally {
        _setTtsLoading(opts.btn, false);
      }
    }
    if (blob) { _playAudioBlob(blob, rate); return; }
  }
  _speakEnTranslate(text, opts);
}

// ═══════════ English Sentence Library ═══════════
// Data shape: en_sentences = [{id, en, cn, breakdown:[{word,meaning}], note, source, addedAt, fav, lastPracticed}]
const ENSENT_LEVEL_DEFAULT = 'B1（中级）';
const ENSENT_DAILY_DEFAULT = 10;

function getEnSentences() { return load('en_sentences', []); }
function saveEnSentences(arr) { save('en_sentences', arr); }
function getEnSentSettings() {
  const s = load('en_sentence_settings', {});
  return { dailyCount: s.dailyCount || ENSENT_DAILY_DEFAULT, level: s.level || ENSENT_LEVEL_DEFAULT,
           themes: s.themes || '', length: s.length || 'medium' };
}
function saveEnSentSettings(s) { save('en_sentence_settings', s); }

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
    fav: false,
  });
  saveEnSentences(all);
  closeEnSentenceAddModal();
  renderPracticePage('en');
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
  const lengthHint = (SENT_LENGTHS[settings.length] || SENT_LENGTHS.medium).en;
  const buildPrompt = (n, batchIdx) => `请为英语水平 ${settings.level} 的学习者推荐 ${n} 个实用日常英语句子。${themeHint}（这是第 ${batchIdx + 1} 批，请和其他批的句子在场景上尽量不重复）

要求：
- 母语者真实会说的口语，不要教科书句
- 长度：${lengthHint}
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
      fav: false,
    });
  });
  saveEnSentences(all);
  save(lastPushKey, true);
  renderPracticePage('en');
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
  document.getElementById('enSentLengthInput').value = s.length || 'medium';
  document.getElementById('enSentThemesInput').value = s.themes || '';
  document.getElementById('enSentenceSettingsModal').classList.add('open');
}
function closeEnSentenceSettings() {
  document.getElementById('enSentenceSettingsModal').classList.remove('open');
}
function submitEnSentenceSettings() {
  const dailyCount = Math.max(3, Math.min(30, parseInt(document.getElementById('enSentDailyCountInput').value) || ENSENT_DAILY_DEFAULT));
  const level = document.getElementById('enSentLevelInput').value || ENSENT_LEVEL_DEFAULT;
  const length = document.getElementById('enSentLengthInput').value || 'medium';
  const themes = document.getElementById('enSentThemesInput').value.trim();
  saveEnSentSettings({ dailyCount, level, themes, length });
  closeEnSentenceSettings();
}

// ═══════════ English Hub stats ═══════════
function updateEnHubStats() {
  const el = document.getElementById('enHubStats');
  if (!el) return;
  const all = getEnSentences();
  const today = todayKey();
  const todays = all.filter(x => x.addedAt && dateKey(new Date(x.addedAt)) === today);
  const remaining = todays.filter(x => x.lastPracticed !== today).length;
  const favs = all.filter(x => x.fav).length;
  el.innerHTML = `今天 <strong>${todays.length - remaining}</strong> / <strong>${todays.length}</strong> 句 · 收藏了 <strong>${favs}</strong> 句`;
  const info = document.getElementById('enSentencesInfo');
  if (info) {
    if (remaining > 0) info.textContent = `今天还有 ${remaining} 句没练`;
    else if (todays.length > 0) info.textContent = '今天的都练完啦 🎉';
    else info.textContent = '卡片 · 听写 · 跟读 · 收藏';
  }
}

// Modal close on overlay click
document.addEventListener('click', e => {
  if (e.target.id === 'enSentenceAddModal') closeEnSentenceAddModal();
  if (e.target.id === 'enSentenceSettingsModal') closeEnSentenceSettings();
});

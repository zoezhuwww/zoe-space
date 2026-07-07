// ══════════ zoe-space · nihongo.js ══════════
// 日语学习主体：词汇卡 SRS · TTS 发音 · 词汇导入 · N2 语法 · 翻译 · 助词 · 错题 · 游戏
// 多文件共享全局作用域；加载顺序见 index.html 顶部「文件地图」，勿随意调整。
// ═══════════════════════════════════════════

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
function saveVocabList(list) { save('custom_vocab', list); }
function _vocabIdxFromKey(srsKey) { return parseInt(String(srsKey).slice(2), 10); }
// 复习卡是词条的浅拷贝，生成/收藏后从词库取最新版
function _freshVocabEntry(card) {
  if (!card || card.srsKey === undefined) return null;
  return getVocabList()[_vocabIdxFromKey(card.srsKey)] || null;
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
// 发音链路：VOICEVOX（配了 key）→ Google TTS（配了 key）→ 浏览器自带
// VOICEVOX 合成结果缓存进 IndexedDB，同一「文本+音色+速度」只请求一次 API
const VOICEVOX_SPEAKERS = [
  { id: 8,  name: '春日部つむぎ（自然女声・默认）' },
  { id: 2,  name: '四国めたん（清爽女声）' },
  { id: 14, name: '冥鳴ひまり（温柔女声）' },
  { id: 3,  name: 'ずんだもん（软萌）' },
  { id: 13, name: '青山龍星（男声）' },
];
const VOICEVOX_DEFAULT_SPEAKER = 8;

// ── IndexedDB 音频缓存 ──
function _ttsDbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('zoe_tts_cache', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('audio');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function ttsCacheGet(key) {
  try {
    const db = await _ttsDbOpen();
    return await new Promise((resolve, reject) => {
      const req = db.transaction('audio', 'readonly').objectStore('audio').get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch { return null; }
}
async function ttsCachePut(key, blob) {
  try {
    const db = await _ttsDbOpen();
    await new Promise((resolve, reject) => {
      const req = db.transaction('audio', 'readwrite').objectStore('audio').put(blob, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) { console.warn('ttsCachePut failed:', e); }
}

// 复用同一个 <audio> 元素：iOS 上 audio.play() 必须由用户手势触发，
// 点击瞬间先用无声音频「解锁」这个元素，之后异步合成完成再换 src 播放才不会被拦
let _ttsAudioEl = null;
const _SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';

function _ttsAudioUnlock() {
  if (!_ttsAudioEl) _ttsAudioEl = new Audio();
  try {
    _ttsAudioEl.src = _SILENT_WAV;
    _ttsAudioEl.play().catch(() => {});
  } catch {}
}

function _playAudioBlob(blob, rate) {
  if (!_ttsAudioEl) _ttsAudioEl = new Audio();
  const a = _ttsAudioEl;
  a.pause();
  if (a.src && a.src.startsWith('blob:')) URL.revokeObjectURL(a.src);
  a.src = URL.createObjectURL(blob);
  a.defaultPlaybackRate = rate || 1;
  a.playbackRate = rate || 1;
  a.play().catch(e => console.warn('audio play blocked:', e));
}

// 发音按钮加载态：合成等待期间转圈，避免用户以为没反应而连点
function _setTtsLoading(btn, on) {
  if (!btn || !btn.classList) return;
  btn.classList.toggle('tts-loading', on);
  btn.disabled = on;
}

// ── VOICEVOX WEB 版 API（api.tts.quest v3，异步合成需轮询就绪状态）──
// 失败判定原则：只有「请求报错 / key 无效 / 点数耗尽 / 明确生成失败」才算失败；
// 「还在生成中」「首次请求慢」都不是失败，耐心等。
const _sleep = ms => new Promise(r => setTimeout(r, ms));

// 注意：限流（429）响应里 isApiKeyValid 也是 false，不能拿它当「key 无效」的依据；
// 且 key 失效时服务器仍会走免费通道返回 success:true + 音频，能用就照用
let _vvKeyWarned = false;

async function _voicevoxFetchBlob(text, speaker, key) {
  const params = new URLSearchParams({ text, speaker: String(speaker), key });
  const url = 'https://api.tts.quest/v3/voicevox/synthesis?' + params.toString();
  let data = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await _sleep(Math.min(data && data.retryAfter || 2, 15) * 1000 + 300);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('synthesis http ' + resp.status);
    data = await resp.json();
    if (data.success && data.mp3DownloadUrl) {
      if (data.isApiKeyValid === false && key && !_vvKeyWarned) {
        _vvKeyWarned = true;
        showToast('VOICEVOX Key 可能失效了，暂时走免费通道，记得去 tts.quest 看看 ❀');
      }
      return _voicevoxAwaitAudio(data);
    }
    if (!data.retryAfter) break; // 不是限流，重试也没用
  }
  if (data && data.retryAfter) throw new Error('rate limited');
  throw new Error((data && data.isApiKeyValid === false) ? 'invalid api key'
    : String(data && data.errorMessage || 'synthesis rejected'));
}

// 等音频生成完成再下载。「生成中」不算失败，只有明确 isAudioError 或彻底超时才抛
async function _voicevoxAwaitAudio(data) {
  let ready = false;
  if (data.audioStatusUrl) {
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline) {
      let st = null;
      try { st = await (await fetch(data.audioStatusUrl)).json(); } catch {} // 状态接口偶发失败不算数
      if (st) {
        if (st.isAudioError) throw new Error('voicevox audio error');
        if (st.isAudioReady) { ready = true; break; }
      }
      await _sleep(1200);
    }
  }

  // 下载 mp3：就绪后正常 1-2 次就成；状态接口没走通时多给几次机会，
  // 服务器可能还在写文件，返回非音频内容只当「再等等」，不当失败
  const attempts = ready ? 3 : 5;
  let lastErr = 'audio download failed';
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await _sleep(1500);
    try {
      const audioResp = await fetch(data.mp3DownloadUrl);
      if (!audioResp.ok) { lastErr = 'audio http ' + audioResp.status; continue; }
      const blob = await audioResp.blob();
      const type = blob.type || '';
      if (blob.size > 0 && !type.includes('json') && !type.includes('html') && !type.includes('text')) {
        return blob;
      }
      lastErr = 'audio not ready yet';
    } catch (e) {
      lastErr = e.message || 'network error';
    }
  }
  throw new Error(lastErr);
}

// 统一日语发音入口：opts = { slow: true } 慢速
// 同一文本合成中再次点击时复用同一个请求，不重复扣点、也不会因限流误报失败
const _vvInFlight = {};

async function speakJa(text, opts) {
  if (!text) return;
  opts = opts || {};
  const rate = opts.slow ? 0.6 : 1;
  const vvKey = load('voicevox_key', '');

  if (vvKey) {
    // 必须在第一个 await 之前调用：还在用户手势的同步上下文里，iOS 才认
    _ttsAudioUnlock();
    const speaker = load('voicevox_speaker', VOICEVOX_DEFAULT_SPEAKER);
    // 慢速用 playbackRate 实现，音频与常速共用一份缓存
    const cacheKey = `${text}|${speaker}|1`;
    let blob = await ttsCacheGet(cacheKey);
    if (!blob) {
      _setTtsLoading(opts.btn, true);
      try {
        if (!_vvInFlight[cacheKey]) {
          _vvInFlight[cacheKey] = _voicevoxFetchBlob(text, speaker, vvKey)
            .finally(() => { delete _vvInFlight[cacheKey]; });
        }
        blob = await _vvInFlight[cacheKey];
        ttsCachePut(cacheKey, blob);
      } catch (e) {
        // 走到这里才是真失败：请求报错 / key 无效 / 点数耗尽 / 明确生成失败
        console.warn('VOICEVOX failed, fallback:', e);
        const msg = String(e && e.message || '');
        showToast(msg.includes('invalid api key')
          ? 'VOICEVOX Key 无效，先用系统语音 ❀'
          : 'VOICEVOX 暂时不可用，先用系统语音 ❀');
        speakWithBrowserTTS(text, opts.slow ? 0.45 : 0.8);
        return;
      } finally {
        _setTtsLoading(opts.btn, false);
      }
    }
    _playAudioBlob(blob, rate);
    return;
  }

  const googleKey = load('google_tts_key', '');
  if (googleKey) {
    await speakWithGoogleTTS(text, googleKey);
  } else {
    speakWithBrowserTTS(text, opts.slow ? 0.45 : 0.8);
  }
}

async function speakWord(btn) {
  const card = currentReviewCards[currentCardIdx];
  if (!card) return;
  await speakJa(card.reading || card.word, { btn });
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

function speakWithBrowserTTS(text, rate) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = rate || 0.8;
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang.startsWith('ja'));
    if (jaVoice) u.voice = jaVoice;
    window.speechSynthesis.speak(u);
  }
}

async function speakWordSlow(btn) {
  const card = currentReviewCards[currentCardIdx];
  if (!card) return;
  await speakJa(card.reading || card.word, { slow: true, btn });
}

async function speakCardExample(btn) {
  const card = currentReviewCards[currentCardIdx];
  if (!card) return;
  const sentence = getCardExampleText(card);
  if (sentence) await speakJa(sentence, { btn });
}

function copyCardExample() {
  const card = currentReviewCards[currentCardIdx];
  if (!card) return;
  const sentence = getCardExampleText(card);
  if (!sentence) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(sentence).then(
      () => showToast('例句已复制 📋'),
      () => showToast('复制失败了…')
    );
  } else {
    showToast('这个浏览器不支持复制');
  }
}

// 例句纯文本：新结构从 tokens 拼，旧结构去掉振り仮名标注
function getCardExampleText(card) {
  const v = _freshVocabEntry(card) || card;
  if (v.example && Array.isArray(v.example.tokens)) {
    return v.example.tokens.map(t => t.surface).join('');
  }
  const old = typeof v.example === 'string' ? v.example : '';
  return old.replace(/\[[^\]]+\]/g, '');
}

function openVoicevoxSettings() {
  const modal = document.getElementById('voicevoxModal');
  document.getElementById('voicevoxKeyInput').value = load('voicevox_key', '');
  const sel = document.getElementById('voicevoxSpeakerInput');
  sel.innerHTML = VOICEVOX_SPEAKERS.map(s =>
    `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');
  sel.value = String(load('voicevox_speaker', VOICEVOX_DEFAULT_SPEAKER));
  modal.classList.add('open');
}
function closeVoicevoxSettings() {
  document.getElementById('voicevoxModal').classList.remove('open');
}
function submitVoicevoxSettings() {
  const key = document.getElementById('voicevoxKeyInput').value.trim();
  const speaker = parseInt(document.getElementById('voicevoxSpeakerInput').value) || VOICEVOX_DEFAULT_SPEAKER;
  save('voicevox_key', key);
  save('voicevox_speaker', speaker);
  closeVoicevoxSettings();
  showToast(key ? '已保存，发音将使用 VOICEVOX ❀' : '已清除，发音回到系统语音');
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
    document.getElementById('nextWordBtn').style.display = 'none';
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
    document.getElementById('nextWordBtn').style.display = 'none';
    document.getElementById('vocabRemaining').textContent = '全部完成 🎉';
    document.getElementById('vocabProgressFill').style.width = '100%';
    return;
  }

  const card = currentReviewCards[currentCardIdx];

  // Front
  document.getElementById('cardWord').textContent = card.word;
  document.getElementById('cardHint').textContent = card.isNew ? '新词 · 点击翻转' : '点击翻转';

  // 缺扩展字段就后台生成（in-flight 标记同步生效，骨架屏能立刻显示）
  const fresh = _freshVocabEntry(card);
  if (fresh && !fresh.cardGeneratedAt) ensureCardData(card);

  renderCardBack(card);

  document.getElementById('cardFront').style.display = 'flex';
  document.getElementById('cardBack').style.display = 'none';
  document.getElementById('ankiButtons').style.display = 'none';
  document.getElementById('nextWordBtn').style.display = 'none';
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

// ── 卡片背面（新版布局：单词区 / 释义区 / 例句区）──
function renderCardBack(card) {
  const fresh = _freshVocabEntry(card);
  const v = fresh ? { ...card, ...fresh } : card;
  const generating = !v.cardGeneratedAt && !!_cardGenInFlight[_vocabIdxFromKey(card.srsKey)];

  document.getElementById('cardWordBack').textContent = v.word;
  document.getElementById('cardReading').textContent =
    (v.reading && v.reading !== v.word) ? v.reading : '';
  document.getElementById('cardRomaji').textContent = v.romaji || toRomaji(v.reading || v.word);
  _updateStarBtn(!!v.starred);

  // 释义区
  const shortMeaning = v.meaning_zh_short || v.meaning || '';
  let meaningHtml = `
    <div class="card-info-row">
      ${v.pos ? `<span class="card-pos">${escHtml(v.pos)}</span>` : ''}
      <span class="card-meaning">${escHtml(shortMeaning)}</span>
    </div>`;
  if (v.meaning_ja) {
    meaningHtml += `<div class="card-def-row"><span class="card-def-tag">日文</span><span class="card-def-text card-def-ja">${escHtml(v.meaning_ja)}</span></div>`;
  }
  if (v.meaning_zh && v.meaning_zh !== shortMeaning) {
    meaningHtml += `<div class="card-def-row"><span class="card-def-tag">中文</span><span class="card-def-text">${escHtml(v.meaning_zh)}</span></div>`;
  }
  if (generating && !v.meaning_ja) meaningHtml += _skeletonRows(2);
  document.getElementById('cardMeaningArea').innerHTML = meaningHtml;

  // 例句区
  document.getElementById('cardExampleArea').innerHTML = _cardExampleHtml(v, generating);
}

function _cardExampleHtml(v, generating) {
  const hasTokens = v.example && Array.isArray(v.example.tokens) && v.example.tokens.length;
  const oldExample = typeof v.example === 'string' ? v.example : '';
  if (!hasTokens && !oldExample && !generating) return '';

  let bodyHtml = '';
  if (hasTokens) {
    // 逐词分词：上假名（ruby）、下罗马音，目标词高亮
    bodyHtml = `<div class="card-tokens">` + v.example.tokens.map(t => `<span class="card-tk${t.isTarget ? ' tk-target' : ''}"><ruby>${escHtml(t.surface)}<rt>${t.kana ? escHtml(t.kana) : '&#8203;'}</rt></ruby><span class="tk-romaji">${escHtml(t.romaji || '')}</span></span>`).join('') + `</div>`;
    bodyHtml += `<div class="card-example-foot">
      ${v.example.jlpt ? `<span class="card-jlpt">${escHtml(v.example.jlpt)}</span>` : ''}
      <span class="card-example-cn">${escHtml(v.example.translation_zh || '')}</span>
    </div>`;
  } else if (oldExample) {
    bodyHtml = `<div class="card-example-jp">${parseFurigana(oldExample)}</div>`;
    if (v.example_meaning) bodyHtml += `<div class="card-example-cn">${escHtml(v.example_meaning)}</div>`;
    if (generating) bodyHtml += _skeletonRows(1);
  } else {
    bodyHtml = _skeletonRows(2);
  }

  return `
    <div class="card-example-section">
      <div class="card-example-head">
        <span class="card-example-label">单词例句</span>
        <span class="card-example-tools">
          <button class="card-tool-btn" onclick="event.stopPropagation();copyCardExample()" aria-label="复制例句">📋</button>
          <button class="card-tool-btn" onclick="event.stopPropagation();speakCardExample(this)" aria-label="朗读例句">🔊</button>
        </span>
      </div>
      ${bodyHtml}
    </div>`;
}

function _skeletonRows(n) {
  let h = '';
  for (let i = 0; i < n; i++) h += `<div class="card-skeleton" style="width:${72 - i * 18}%"></div>`;
  return h;
}

// ── 卡片内容懒加载生成（DeepSeek，每词只生成一次，永久缓存在词库里）──
const _cardGenInFlight = {};

async function ensureCardData(card) {
  const idx = _vocabIdxFromKey(card.srsKey);
  const list = getVocabList();
  const v = list[idx];
  if (!v || v.cardGeneratedAt || _cardGenInFlight[idx]) return;
  if (!load('ds_api_key', '')) return; // 没配 key 就安静地用旧字段
  _cardGenInFlight[idx] = true;
  try {
    const gen = await _generateCardData(v);
    if (gen) {
      const freshList = getVocabList();
      freshList[idx] = { ...freshList[idx], ...gen, cardGeneratedAt: Date.now() };
      saveVocabList(freshList);
    } else {
      showToast('完整卡片没生成出来，先看基础版 ❀');
    }
  } finally {
    delete _cardGenInFlight[idx];
    // 用户还停在这张卡上就刷新显示
    const cur = currentReviewCards[currentCardIdx];
    if (cur && cur.srsKey === card.srsKey) renderCardBack(cur);
  }
}

async function _generateCardData(v) {
  const prompt = `为一个日语单词生成学习卡片数据。
单词：${v.word}
读音：${v.reading || ''}
中文释义：${v.meaning || ''}
${typeof v.example === 'string' && v.example ? '参考例句：' + v.example : ''}

只输出纯 JSON（不要 markdown 代码块、不要任何解释），结构：
{"pos":"词性，如 他动词・一类 / 名词 / い形容词","romaji":"单词的罗马音","meaning_zh_short":"中文核心释义，简短","meaning_ja":"用简单日语解释这个词","meaning_zh":"中文详细释义","example":{"tokens":[{"surface":"词","kana":"该词假名读音；surface 本身是假名或读音与 surface 相同时留空字符串","romaji":"罗马音","isTarget":false}],"translation_zh":"例句中文翻译","jlpt":"N5/N4/N3/N2/N1"}}

要求：
- 例句自然、必须包含目标单词，难度贴合该词等级；逐词分词放入 tokens，目标单词所在 token 的 isTarget 为 true
- 助词（は/が/を/に 等）单独成 token，kana 留空
- jlpt 填这个单词本身的 JLPT 等级`;

  // 解析失败重试一次，仍失败则返回 null 走降级
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callDS(prompt, '你是日语教学卡片生成助手。只输出纯JSON，不要markdown代码块，不要解释。', { silent: true, maxTokens: 1200, temperature: 0.3 });
    if (!raw) continue;
    try {
      const data = JSON.parse(raw.replace(/```json|```/g, '').trim());
      if (data && data.example && Array.isArray(data.example.tokens) && data.example.tokens.length) return data;
    } catch (e) {
      console.warn('card gen parse failed (attempt ' + (attempt + 1) + '):', e);
    }
  }
  return null;
}

// ── 收藏 ──
function _updateStarBtn(starred) {
  const btn = document.getElementById('cardStarBtn');
  if (!btn) return;
  btn.textContent = starred ? '⭐ 已收藏' : '☆ 收藏';
  btn.classList.toggle('starred', starred);
}

function toggleCardStar() {
  const card = currentReviewCards[currentCardIdx];
  if (!card) return;
  const idx = _vocabIdxFromKey(card.srsKey);
  const list = getVocabList();
  if (!list[idx]) return;
  list[idx].starred = !list[idx].starred;
  saveVocabList(list);
  card.starred = list[idx].starred;
  _updateStarBtn(card.starred);
}

// ── 下一词（跳过，不评分不影响 SRS）──
function nextWord() {
  currentCardIdx++;
  showCard();
}

// ═══════════ 单词本列表页 ═══════════
let _vocabListStarredOnly = false;

function toggleVocabListFilter() {
  _vocabListStarredOnly = !_vocabListStarredOnly;
  renderVocabListPage();
}

function toggleListStar(idx) {
  const list = getVocabList();
  if (!list[idx]) return;
  list[idx].starred = !list[idx].starred;
  saveVocabList(list);
  renderVocabListPage();
}

function renderVocabListPage() {
  const list = getVocabList();
  const rows = list.map((v, i) => ({ v, i })).filter(x => !_vocabListStarredOnly || x.v.starred);
  const starredCount = list.filter(v => v.starred).length;
  const container = document.getElementById('vocabListContainer');
  container.innerHTML = `
    <div class="vl-toolbar">
      <button class="vl-filter-btn${_vocabListStarredOnly ? ' active' : ''}" onclick="toggleVocabListFilter()">⭐ 只看收藏（${starredCount}）</button>
      <span class="vl-count">共 ${rows.length} 个词</span>
    </div>
    ${rows.length ? rows.map(({ v, i }) => `
      <div class="vl-item">
        <div class="vl-main">
          <div class="vl-word">${escHtml(v.word)}</div>
          <div class="vl-sub">${escHtml(v.reading && v.reading !== v.word ? v.reading : '')}${v.pos ? `<span class="vl-pos">${escHtml(v.pos)}</span>` : ''}</div>
        </div>
        <div class="vl-meaning">${escHtml(v.meaning_zh_short || v.meaning || '')}</div>
        <button class="vl-star${v.starred ? ' on' : ''}" onclick="toggleListStar(${i})" aria-label="收藏">${v.starred ? '⭐' : '☆'}</button>
      </div>`).join('')
    : `<div class="vl-empty">${_vocabListStarredOnly ? '还没有收藏的词～在卡片上点 ☆ 收藏' : '词书是空的～'}</div>`}
  `;
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
  document.getElementById('nextWordBtn').style.display = 'block';
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
  const sentCounts = (typeof getTodaySentenceCounts === 'function') ? getTodaySentenceCounts() : { dueReview: 0, total: 0 };
  const el = document.getElementById('studyHubStats');
  if (el) el.innerHTML = `今天 <strong>${sentCounts.dueReview}</strong> 句日语 · <strong>${reviewCount}</strong> 张单词 · <strong>${mistakeCount}</strong> 道错题`;

  // ───── 首页 日语 feature 卡 ─────
  const streak = (typeof getSentenceStreak === 'function') ? getSentenceStreak() : 0;
  const meta = document.getElementById('jpStreakMeta');
  if (meta) {
    if (streak >= 2) meta.innerHTML = `❀ 已经坚持 <strong>${streak}</strong> 天`;
    else if (streak === 1) meta.textContent = '今天来过了 ❀';
    else meta.textContent = '今天一点点';
  }

  const headline = document.getElementById('jpFeatureHeadline');
  const progressWrap = document.getElementById('jpProgressWrap');
  const progressFill = document.getElementById('jpProgressFill');
  const progressText = document.getElementById('jpProgressText');
  const lastPreview = document.getElementById('jpLastPreview');
  const lastJp = document.getElementById('jpLastJp');
  const lastCn = document.getElementById('jpLastCn');

  if (headline && progressWrap && lastPreview) {
    const all = (typeof getSentences === 'function') ? getSentences() : [];
    if (sentCounts.dueReview > 0) {
      const totalToday = _sentQueue && _sentQueue.length ? _sentQueue.length : sentCounts.dueReview;
      const doneToday = Math.max(0, totalToday - sentCounts.dueReview);
      headline.textContent = `今天还有 ${sentCounts.dueReview} 句在等你 ❀`;
      progressWrap.style.display = 'flex';
      const pct = totalToday > 0 ? Math.round(doneToday / totalToday * 100) : 0;
      progressFill.style.width = pct + '%';
      progressText.textContent = `${doneToday} / ${totalToday}`;
    } else if (sentCounts.total === 0) {
      headline.textContent = '点进来让小豆推今天的句子 ❀';
      progressWrap.style.display = 'none';
    } else {
      headline.textContent = '今天的句子都过完啦 🎉';
      progressWrap.style.display = 'flex';
      progressFill.style.width = '100%';
      progressText.textContent = '完成';
    }
    // 最近加的一句预览
    if (all.length > 0) {
      const recent = [...all].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))[0];
      if (recent && recent.jp) {
        lastPreview.style.display = 'block';
        lastJp.textContent = recent.jp;
        lastCn.textContent = recent.cn || '';
      } else {
        lastPreview.style.display = 'none';
      }
    } else {
      lastPreview.style.display = 'none';
    }
  }

  // ───── 学习中心顶部统计 ─────
  // Sentence hub card desc
  const sInfo = document.getElementById('sentencesInfo');
  if (sInfo) {
    if (sentCounts.dueReview > 0) sInfo.textContent = `今天 ${sentCounts.dueReview} 张待复习`;
    else if (sentCounts.total > 0) sInfo.textContent = `共 ${sentCounts.total} 张 · 今天都过完啦`;
    else sInfo.textContent = '小豆每天推荐 · 也可以自己加';
  }

  // ───── 基金最近一笔 ─────
  const fundPrev = document.getElementById('fundLastPreview');
  if (fundPrev && typeof getFund === 'function') {
    const fund = getFund();
    if (fund.history && fund.history.length) {
      const last = fund.history[0];
      const sign = last.type === 'income' ? '+' : '−';
      const when = ((Date.now() - (last.time || 0)) / 86400000) | 0;
      const whenTxt = when === 0 ? '今天' : when === 1 ? '昨天' : `${when} 天前`;
      fundPrev.innerHTML = `<span class="flp-amt">${sign}¥${(last.amount || 0).toLocaleString()}</span> · ${escHtml(last.note || '')} · ${whenTxt}`;
    } else {
      fundPrev.innerHTML = '';
    }
  }
}



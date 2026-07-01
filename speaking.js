// ══════════ zoe-space · speaking.js ══════════
// 日语·口语练习：录音 · 语音识别 · AI 点评
// 多文件共享全局作用域；加载顺序见 index.html 顶部「文件地图」，勿随意调整。
// ═══════════════════════════════════════════

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
      const speakAudioBlob = new Blob(speakAudioChunks, { type: speakMimeType || 'audio/mp4' });
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



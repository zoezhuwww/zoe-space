// ══════════ zoe-space · init.js ══════════
// 启动文件（最后加载·请勿改动加载顺序）：拍快照 · 恢复上次页面 · 各模块初始化 · 注册 SW
// 多文件共享全局作用域；加载顺序见 index.html 顶部「文件地图」，勿随意调整。
// ═══════════════════════════════════════════

// ═══════════ Init ═══════════
// 先拍一张今日自动快照，再做其它初始化
autoBackup();

// 根据 URL hash 恢复上次停留的页面
const _initialHash = location.hash.slice(1);
if (_initialHash && document.getElementById('page-' + _initialHash)) {
  navigateTo(_initialHash, { replace: true });
} else {
  history.replaceState({ page: 'dashboard' }, '', '#dashboard');
}

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




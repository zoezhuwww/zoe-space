// ══════════ zoe-space · ui.js ══════════
// 界面框架：侧边栏 · 页面路由 · 庆祝弹窗 · 深浅色主题 · 弹窗兜底(ESC/防卡死)
// 多文件共享全局作用域；加载顺序见 index.html 顶部「文件地图」，勿随意调整。
// ═══════════════════════════════════════════

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

// 从屏幕左边缘右滑开启侧边栏
(function() {
  const EDGE = 24;       // 左边缘 24px 内开始才算
  const THRESHOLD = 60;  // 横向滑动 60px 触发
  let sx = null, sy = null, tracking = false;
  document.addEventListener('touchstart', e => {
    if (sidebar.classList.contains('open')) return; // 已经开了就别再监听
    const t = e.touches[0];
    if (t.clientX <= EDGE) {
      sx = t.clientX;
      sy = t.clientY;
      tracking = true;
    }
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!tracking || sx === null) return;
    const t = e.touches[0];
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;
    // 主要是横向 + 向右滑 60px → 开
    if (dx > THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.3) {
      openSidebar();
      tracking = false; sx = sy = null;
    }
  }, { passive: true });
  document.addEventListener('touchend', () => { tracking = false; sx = sy = null; });
  document.addEventListener('touchcancel', () => { tracking = false; sx = sy = null; });
})();
function toggleGroup(titleEl) { titleEl.parentElement.classList.toggle('open'); }

document.querySelectorAll('.sidebar-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    // 先让侧边栏的关闭动画起步，下一帧再渲染新页面，滑出过程不掉帧
    closeSidebar();
    if (page) requestAnimationFrame(() => navigateTo(page));
  });
});

// ═══════════ Navigation ═══════════
let currentPage = 'dashboard';

// 页面 → 渲染函数。加新页面只改这张表。
// 这些函数都定义在文件后面，运行时按名查表，没有 hoist 问题。
const PAGE_RENDERERS = {
  dashboard:  () => refreshDashboard(),
  todo:       () => renderTodoFull(),
  fund:       () => renderFundPage(),
  habits:     () => renderHabitsFull(),
  countdown:  () => renderCountdown(),
  diary:      () => renderDiary(),
  food:       () => renderFoodDiary(),
  anniversary:() => renderAnniversary(),
  vocab:      () => startVocabReview(),
  vocablist:  () => renderVocabListPage(),
  sentences:  () => renderSentencesPage(),
  japanese:   () => updateStudyHubStats(),
  english:    () => updateEnHubStats(),
  ensentences:() => renderEnSentencesPage(),
  listening:  () => renderListeningPage(),
  apiDetail:  () => renderApiDetail(),
  grammar:    () => renderGrammarList(),
  translate:  () => renderTranslatePage(),
  mistakes:   () => renderMistakesPage(),
  games:      () => renderGamesPage(),
  speaking:   () => renderSpeakingPage(),
};

function navigateTo(pageId, opts) {
  opts = opts || {};
  const target = document.getElementById('page-' + pageId);
  if (!target) return;
  // 离开 anniversary 页时停掉秒数 interval
  if (currentPage === 'anniversary' && pageId !== 'anniversary' && typeof anniInterval !== 'undefined' && anniInterval) {
    clearInterval(anniInterval); anniInterval = null;
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  target.classList.add('active');
  currentPage = pageId;
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });
  document.getElementById('pageContainer').scrollTop = 0;
  const render = PAGE_RENDERERS[pageId];
  if (render) render();
  // hash 路由：刷新 / Android 返回键 / iOS 上下滑动手势都能恢复正确页面
  if (!opts.fromPop) {
    const url = '#' + pageId;
    // 永远用 replaceState：不在历史里堆栈，系统左滑就不会"返回"到主页
    if (location.hash !== url) history.replaceState({ page: pageId }, '', url);
    else history.replaceState({ page: pageId }, '', url);
  }
}

window.addEventListener('popstate', e => {
  const pageId = (e.state && e.state.page) || location.hash.slice(1) || 'dashboard';
  if (document.getElementById('page-' + pageId)) navigateTo(pageId, { fromPop: true });
});

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
  // iOS Safari 不会就地重读已存在的 theme-color meta，必须重建节点才能触发状态栏颜色刷新
  const old = document.querySelector('meta[name="theme-color"]');
  const color = next === 'dark' ? '#1A1416' : '#F4DDDD';
  if (old) old.remove();
  const meta = document.createElement('meta');
  meta.setAttribute('name', 'theme-color');
  meta.setAttribute('content', color);
  document.head.appendChild(meta);
}
// Apply on load
applyTheme(getInitialTheme());
// Follow system change ONLY if user hasn't picked one explicitly
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (getStoredTheme() === null) applyTheme(e.matches ? 'dark' : 'light');
  });
}

// ═══════════ Toast（不打扰的轻提示）═══════════
let _toastTimer = null;
function showToast(msg) {
  let el = document.getElementById('zoeToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'zoeToast';
    el.className = 'zoe-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ═══════════ Global modal safety net ═══════════
// ESC closes the topmost open modal/popup — last resort if anything ever gets stuck.
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  // Priority: celebration > modals (close the visible one user is looking at)
  const celeb = document.getElementById('celebrationPopup');
  if (celeb && celeb.classList.contains('open')) {
    celeb.classList.remove('open');
    return;
  }
  const openModal = document.querySelector('.modal-overlay.open');
  if (openModal) openModal.classList.remove('open');
});

// Belt-and-suspenders: if anything triggers a modal to open while a celebration
// popup is still showing, auto-dismiss the celebration so it can't block input.
(function() {
  const obs = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type !== 'attributes' || m.attributeName !== 'class') continue;
      const t = m.target;
      if (t.classList.contains('modal-overlay') && t.classList.contains('open')) {
        const celeb = document.getElementById('celebrationPopup');
        if (celeb && celeb.classList.contains('open')) celeb.classList.remove('open');
      }
    }
  });
  document.querySelectorAll('.modal-overlay').forEach(m => {
    obs.observe(m, { attributes: true, attributeFilter: ['class'] });
  });
})();

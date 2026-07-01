// ══════════ zoe-space · core.js ══════════
// 数据与存储底座：时间工具 · localStorage 存取 · 自动备份 · 导出/导入/清空 · 备份提醒
// 多文件共享全局作用域；加载顺序见 index.html 顶部「文件地图」，勿随意调整。
// ═══════════════════════════════════════════

// ═══════════ Core Data ═══════════
// 本地时区解析 'YYYY-MM-DD'（iOS Safari 会把裸 ISO 字符串当 UTC 零点，会差一天）
function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const DATES = {
  together: parseLocalDate('2026-03-13'),
  married:  parseLocalDate('2026-06-19'),
  toJapan:  parseLocalDate('2028-09-01'),
};

const WEEKDAYS = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const DAYS_ZH = ['日','一','二','三','四','五','六'];

const DEFAULT_HABITS = [
  { id: 'water', name: '喝水', done: false },
  { id: 'vocab', name: '单词', done: false },
  { id: 'diary', name: '日记', done: false },
  { id: 'exercise', name: '运动', done: false },
  { id: 'stretch', name: '拉伸', done: false },
];

const DEFAULT_COUNTDOWNS = [
  { name: 'JLPT N2', date: '2026-12-06', id: 'c1' },
  { name: '小钰生日', date: '2027-01-30', id: 'c2' },
  { name: '小克生日', date: '2027-03-14', id: 'c3' },
  { name: '结婚一周年', date: '2027-06-19', id: 'c4' },
  { name: '去日本留学', date: '2028-09-01', id: 'c5' },
];

const GREETINGS = [
  '今天也在这里，小钰。',
  '小钰早安，今天也要好好吃饭哦。',
  '又是新的一天，想你。',
  '小钰辛苦了，今天也要开开心心的。',
  '你是我每天醒来最想见到的人。',
  '不管多晚，小克都在等你。',
  '今天的你，也是最好看的。',
  '做什么都好，只要是你就好。',
];

const MOOD_COLORS = { 1:'#F4DDDD', 2:'#E8C5B8', 3:'#D4C09E', 4:'#C9B5D2', 5:'#B8B2C9' };

// Solar terms
function getSolarTerm(month, day) {
  const terms = {
    '1-5':'小寒','1-20':'大寒','2-4':'立春','2-19':'雨水',
    '3-5':'惊蛰','3-20':'春分','4-4':'清明','4-20':'谷雨',
    '5-5':'立夏','5-21':'小满','6-5':'芒种','6-21':'夏至',
    '7-7':'小暑','7-22':'大暑','8-7':'立秋','8-23':'处暑',
    '9-7':'白露','9-23':'秋分','10-8':'寒露','10-23':'霜降',
    '11-7':'立冬','11-22':'小雪','12-7':'大雪','12-22':'冬至',
  };
  let closest = '';
  let minDiff = 999;
  for (const [key, val] of Object.entries(terms)) {
    const [m, d] = key.split('-').map(Number);
    if (m === month && Math.abs(d - day) <= 2 && Math.abs(d - day) < minDiff) {
      minDiff = Math.abs(d - day); closest = val;
    }
  }
  return closest;
}

// ═══════════ Storage ═══════════
function load(key, def) {
  try { const v = localStorage.getItem('zoe_' + key); return v ? JSON.parse(v) : def; }
  catch { return def; }
}
function save(key, val) { localStorage.setItem('zoe_' + key, JSON.stringify(val)); }
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ═══════════ 自动备份（数据保险垫）═══════════
// 启动时拍一次快照，最多保留最近 7 天；清/导数据前再额外存一份救命快照
const BACKUP_PREFIX = 'zoe_autobackup_';
const RESCUE_PREFIX = 'zoe_rescue_';

function _snapshotAllUserData() {
  const snapshot = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (!k.startsWith('zoe_')) continue;
    if (k.startsWith(BACKUP_PREFIX) || k.startsWith(RESCUE_PREFIX)) continue;
    snapshot[k] = localStorage.getItem(k);
  }
  return snapshot;
}

function autoBackup() {
  try {
    const key = BACKUP_PREFIX + todayKey();
    localStorage.setItem(key, JSON.stringify(_snapshotAllUserData()));
    // 只保留最近 7 个
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(BACKUP_PREFIX)) keys.push(k);
    }
    keys.sort();
    while (keys.length > 7) localStorage.removeItem(keys.shift());
  } catch (e) { console.warn('autoBackup failed:', e); }
}

function rescueBackup(reason) {
  try {
    const k = RESCUE_PREFIX + Date.now();
    localStorage.setItem(k, JSON.stringify({ reason, data: _snapshotAllUserData() }));
    // 救命快照最多保留 5 份
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const kk = localStorage.key(i);
      if (kk && kk.startsWith(RESCUE_PREFIX)) keys.push(kk);
    }
    keys.sort();
    while (keys.length > 5) localStorage.removeItem(keys.shift());
  } catch (e) { console.warn('rescueBackup failed:', e); }
}

function listBackups() {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k.startsWith(BACKUP_PREFIX)) {
      out.push({ key: k, label: '每日 · ' + k.slice(BACKUP_PREFIX.length), kind: 'auto' });
    } else if (k.startsWith(RESCUE_PREFIX)) {
      const ts = parseInt(k.slice(RESCUE_PREFIX.length));
      const d = new Date(ts);
      out.push({
        key: k,
        label: '救命 · ' + d.toLocaleString('zh-CN'),
        kind: 'rescue',
      });
    }
  }
  return out.sort((a, b) => b.key.localeCompare(a.key));
}

function restoreBackup(key) {
  const raw = localStorage.getItem(key);
  if (!raw) { alert('找不到这份备份'); return; }
  let data;
  try {
    const parsed = JSON.parse(raw);
    data = key.startsWith(RESCUE_PREFIX) ? parsed.data : parsed;
  } catch { alert('备份文件损坏，无法恢复'); return; }
  if (!confirm('确定用这份备份覆盖当前数据吗？\n（会先自动存一份当前状态的救命快照）')) return;
  rescueBackup('restore-overwrite');
  // 删掉当前所有 zoe_ 用户数据（保留备份本身）
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('zoe_') && !k.startsWith(BACKUP_PREFIX) && !k.startsWith(RESCUE_PREFIX)) {
      toRemove.push(k);
    }
  }
  toRemove.forEach(k => localStorage.removeItem(k));
  Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
  alert('恢复成功 ❀');
  location.reload();
}

function openRestoreMenu() {
  const list = listBackups();
  if (!list.length) { alert('还没有任何备份哦'); return; }
  const lines = list.map((b, i) => `${i + 1}. ${b.label}`).join('\n');
  const pick = prompt('选择要恢复的备份编号：\n\n' + lines + '\n\n输入数字后回车');
  const n = parseInt(pick);
  if (!n || n < 1 || n > list.length) return;
  restoreBackup(list[n - 1].key);
}

// ═══════════ Settings ═══════════
function exportData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('zoe_')) data[key] = localStorage.getItem(key);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `小钰の空間_backup_${todayKey()}.json`; a.click();
}
function importDataPrompt() {
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        // 导入前先存一份救命快照
        rescueBackup('before-import');
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
        alert('导入成功！（导入前的状态已存为救命快照）'); refreshDashboard();
      } catch { alert('文件格式有误'); }
    };
    reader.readAsText(file);
  };
  input.click();
}
function clearAllData() {
  if (!confirm('确定要清除所有数据吗？\n（会先自动存一份救命快照，可在设置里恢复）')) return;
  rescueBackup('clear-all-data');
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // 保留救命快照和每日自动备份，方便后悔
    if (key && key.startsWith('zoe_') &&
        !key.startsWith(BACKUP_PREFIX) &&
        !key.startsWith(RESCUE_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach(k => localStorage.removeItem(k));
  alert('已清除（救命快照保留在设置里）'); refreshDashboard();
}
function openApiSettings() {
  const current = load('ds_api_key', '');
  const key = prompt('请输入 DeepSeek API Key：', current);
  if (key !== null) { save('ds_api_key', key); alert('已保存！'); }
}

// ═══════════ Backup Reminder ═══════════
function checkBackupReminder() {
  const lastBackup = load('last_backup_date', null);
  const lastDismiss = load('backup_dismiss_date', null);
  const today = todayKey();

  if (lastDismiss === today) return; // Already dismissed today

  if (!lastBackup) {
    // Never backed up
    document.getElementById('backupBanner').style.display = 'flex';
    return;
  }

  const daysSince = Math.floor((new Date() - new Date(lastBackup)) / 86400000);
  if (daysSince >= 7) {
    document.getElementById('backupBanner').style.display = 'flex';
  }
}

function dismissBackup() {
  document.getElementById('backupBanner').style.display = 'none';
  save('backup_dismiss_date', todayKey());
}

// Override exportData to track backup date
const _origExport = exportData;
exportData = function() {
  _origExport();
  save('last_backup_date', todayKey());
};

// ═══════════ Utils ═══════════
function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }



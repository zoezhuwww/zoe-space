// ══════════ zoe-space · health.js ══════════
// 饮食与体重：饮食日记 · 体重记录/图表 · 卡路里估算 · 食谱推荐
// 多文件共享全局作用域；加载顺序见 index.html 顶部「文件地图」，勿随意调整。
// ═══════════════════════════════════════════

// ═══════════ Food Diary ═══════════
function getFoods() { return load('foods_' + todayKey(), []); }
function saveFoods(f) { save('foods_' + todayKey(), f); }

function addFood() {
  const input = document.getElementById('foodInput');
  const text = input.value.trim();
  if (!text) return;
  const foods = getFoods();
  const now = new Date();
  foods.unshift({ name: text, time: `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`, cal: null, ts: Date.now() });
  saveFoods(foods); input.value = ''; renderFoodDiary();
}

function renderFoodDiary() {
  const foods = getFoods();
  const list = document.getElementById('foodList');
  list.innerHTML = '';
  let totalCal = 0;
  foods.forEach((f, i) => {
    if (f.cal) totalCal += f.cal;
    list.innerHTML += `
      <div class="food-item">
        <div>
          <div class="fi-name">${escHtml(f.name)}</div>
          <div class="fi-time">${f.time}</div>
        </div>
        <div style="text-align:right;">
          ${f.cal ? `<div class="fi-cal">~${f.cal} kcal</div>` : ''}
        </div>
      </div>`;
  });
  if (!foods.length) list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-soft);font-size:12px;">今天还没有记录～</div>';

  const totalEl = document.getElementById('foodTotalCal');
  if (totalEl) totalEl.textContent = totalCal > 0 ? `~${totalCal} kcal` : '';
}

// ═══════════ Food / Weight Tab Switch ═══════════
function switchFoodTab(tab) {
  document.getElementById('panel-food').style.display = tab === 'food' ? '' : 'none';
  document.getElementById('panel-weight').style.display = tab === 'weight' ? '' : 'none';
  document.getElementById('tab-food').classList.toggle('active', tab === 'food');
  document.getElementById('tab-weight').classList.toggle('active', tab === 'weight');
  if (tab === 'weight') renderWeightTab();
}

// ═══════════ Weight Tab ═══════════
let _weightChartRange = '3m';

function getWeightRecords() {
  return load('weight_records', []);
}

function renderWeightTab() {
  const dateEl = document.getElementById('wDate');
  if (dateEl && !dateEl.value) dateEl.value = todayKey();
  const records = getWeightRecords();
  renderWeightList(records);
  renderWeightChart(records);
}

function saveWeightRecord() {
  const date = document.getElementById('wDate').value;
  const val = parseFloat(document.getElementById('wKg').value);
  const note = document.getElementById('wNote').value.trim();
  if (!date || isNaN(val) || val <= 0) return;

  const records = getWeightRecords();
  const idx = records.findIndex(r => r.date === date);
  if (idx >= 0) {
    records[idx] = { date, weight: val, note };
  } else {
    records.push({ date, weight: val, note });
  }
  records.sort((a, b) => (a.date < b.date ? -1 : 1));
  save('weight_records', records);

  document.getElementById('wKg').value = '';
  document.getElementById('wNote').value = '';
  renderWeightList(records);
  renderWeightChart(records);
}

function deleteWeightRecord(date) {
  const records = getWeightRecords().filter(r => r.date !== date);
  save('weight_records', records);
  renderWeightList(records);
  renderWeightChart(records);
}

function renderWeightList(records) {
  const el = document.getElementById('wList');
  if (!records.length) {
    el.innerHTML = '<div class="w-empty">还没有记录～</div>';
    return;
  }
  const recent = [...records].reverse().slice(0, 10);
  el.innerHTML = recent.map(r => `
    <div class="w-record-item">
      <div class="w-record-date">${r.date}</div>
      <div class="w-record-weight">${r.weight}<span class="w-record-unit"> 斤</span></div>
      ${r.note ? `<div class="w-record-note">${escHtml(r.note)}</div>` : '<div></div>'}
      <button class="w-delete-btn" onclick="deleteWeightRecord('${r.date}')">×</button>
    </div>
  `).join('');
}

function setWeightChartRange(range) {
  _weightChartRange = range;
  document.getElementById('wToggle3m').classList.toggle('active', range === '3m');
  document.getElementById('wToggleAll').classList.toggle('active', range === 'all');
  renderWeightChart(getWeightRecords());
}

function renderWeightChart(records) {
  const el = document.getElementById('wChart');
  if (!el) return;

  let data = [...records].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (_weightChartRange === '3m') {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);
    const cutStr = cutoff.toISOString().slice(0, 10);
    data = data.filter(r => r.date >= cutStr);
  }

  if (data.length < 2) {
    el.innerHTML = `<div class="w-chart-empty">${data.length === 0 ? '暂无数据' : '再记一次就有图表啦'}</div>`;
    return;
  }

  const W = 300, H = 140, padL = 38, padR = 10, padT = 10, padB = 28;
  const usableW = W - padL - padR;
  const usableH = H - padT - padB;

  const weights = data.map(r => r.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = (maxW - minW) || 1;

  const toX = i => padL + (i / (data.length - 1)) * usableW;
  const toY = v => padT + usableH * (1 - (v - minW) / range);

  const pts = data.map((r, i) => ({ x: toX(i), y: toY(r.weight) }));
  const polyline = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Y-axis: 3 grid lines
  const yVals = [minW, (minW + maxW) / 2, maxW];
  const yEls = yVals.map(v => {
    const y = toY(v).toFixed(1);
    return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" class="w-chart-grid"/>
            <text x="${padL - 4}" y="${y}" text-anchor="end" dominant-baseline="middle" class="w-chart-label">${v.toFixed(1)}</text>`;
  }).join('');

  // X-axis: first / mid / last labels
  const xIdxs = [0, Math.floor((data.length - 1) / 2), data.length - 1];
  const xEls = xIdxs.map(i => {
    const x = toX(i).toFixed(1);
    return `<text x="${x}" y="${H - padB + 14}" text-anchor="middle" class="w-chart-label">${data[i].date.slice(5)}</text>`;
  }).join('');

  const dots = pts.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.5" class="w-chart-dot"/>`).join('');

  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" width="100%" class="w-chart-svg">
      ${yEls}${xEls}
      <polyline points="${polyline}" class="w-chart-line"/>
      ${dots}
    </svg>`;
}

document.getElementById('foodInput').addEventListener('keydown', e => { if (e.key === 'Enter') addFood(); });

async function estimateCalories(btn) {
  const foods = getFoods();
  if (!foods.length) { alert('今天还没有记录食物哦～'); return; }
  const foodNames = foods.map(f => f.name).join('、');
  btn = btn || (typeof event !== 'undefined' ? event.target : null);
  if (btn) { btn.textContent = '⏳ 小豆正在估算…'; btn.disabled = true; }

  const result = await callDS(
    `估算以下食物的卡路里：${foodNames}\n请返回JSON数组格式：[{"name":"食物名","cal":数字}]，只返回JSON不要其他文字。`,
    '你是小豆，一个食物卡路里估算助手。只输出纯JSON，不要markdown代码块，不要解释。'
  );

  if (btn) { btn.textContent = '🔍 让小豆估算今天的卡路里'; btn.disabled = false; }

  if (result) {
    try {
      const clean = result.replace(/```json|```/g, '').trim();
      const estimates = JSON.parse(clean);
      const foods = getFoods();
      estimates.forEach(est => {
        const match = foods.find(f => f.name.includes(est.name) || est.name.includes(f.name));
        if (match) match.cal = est.cal;
      });
      saveFoods(foods);
      renderFoodDiary();
    } catch (e) {
      console.error('Parse error:', e, result);
    }
  }
}

async function getRecipeRecommendation(btn) {
  const foods = getFoods();
  const foodContext = foods.length ? `今天已经吃了：${foods.map(f=>f.name).join('、')}。` : '今天还没吃东西。';
  btn = btn || (typeof event !== 'undefined' ? event.target : null);
  if (btn) { btn.textContent = '⏳ 小豆正在想…'; btn.disabled = true; }

  const result = await callDS(
    `${foodContext}\n请推荐一道适合接下来吃的健康菜，给出菜名、简单做法（3-4步）和大概卡路里。用自然语言回复，简洁温暖。`,
    '你是小豆，一个温暖的饮食小助手。回复简洁，不超过150字，不要用markdown格式。'
  );

  if (btn) { btn.textContent = '🍳 推荐今天吃什么'; btn.disabled = false; }

  if (result) {
    document.getElementById('recipeResult').style.display = 'block';
    document.getElementById('recipeContent').textContent = result;
  }
}


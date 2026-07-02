// ══════════ zoe-space · ai.js ══════════
// AI 公共层：callDS(DeepSeek 请求) · API 用量追踪 · API 详情页
// 多文件共享全局作用域；加载顺序见 index.html 顶部「文件地图」，勿随意调整。
// ═══════════════════════════════════════════

// DS API helper
async function callDS(prompt, systemPrompt, opts) {
  opts = opts || {};
  const apiKey = load('ds_api_key', '');
  if (!apiKey) { if (!opts.silent) alert('请先在设置里配置 DeepSeek API Key'); return null; }
  // 60s 超时（推荐句子量大）
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs || 60000);
  try {
    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt || '你是小豆，一个简洁友好的助手。只输出JSON，不要markdown。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: opts.maxTokens || 1000,
        temperature: opts.temperature ?? 0.7,
      }),
      signal: controller.signal,
    });
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';
    const inputTokens = (data.usage?.prompt_tokens) || 0;
    const outputTokens = (data.usage?.completion_tokens) || 0;
    if (inputTokens || outputTokens) trackApiUsage(inputTokens, outputTokens);
    return text;
  } catch (e) {
    console.error('DS API error:', e);
    if (!opts.silent) {
      if (e.name === 'AbortError') alert('小豆好像没反应，请再试一次喂～');
      else alert('API 调用失败，请检查网络和 API Key');
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ═══════════ API Usage Tracking ═══════════
// DeepSeek V4 Flash pricing (RMB per million tokens)
const DS_PRICING = {
  input: 1.0,    // ¥1/M tokens (cache miss)
  output: 2.0,   // ¥2/M tokens
};

function getApiMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}

function trackApiUsage(inputTokens, outputTokens) {
  const mk = getApiMonthKey();
  const tk = todayKey();
  const totalTokens = inputTokens + outputTokens;
  // Monthly totals
  save('api_tokens_' + mk, load('api_tokens_' + mk, 0) + totalTokens);
  save('api_input_' + mk, load('api_input_' + mk, 0) + inputTokens);
  save('api_output_' + mk, load('api_output_' + mk, 0) + outputTokens);
  save('api_calls_' + mk, load('api_calls_' + mk, 0) + 1);
  // Daily totals
  save('api_tokens_day_' + tk, load('api_tokens_day_' + tk, 0) + totalTokens);
  save('api_input_day_' + tk, load('api_input_day_' + tk, 0) + inputTokens);
  save('api_output_day_' + tk, load('api_output_day_' + tk, 0) + outputTokens);
  save('api_calls_day_' + tk, load('api_calls_day_' + tk, 0) + 1);
  // Update balance
  const cost = calcCost(inputTokens, outputTokens);
  const spent = load('api_spent_' + mk, 0);
  save('api_spent_' + mk, spent + cost);
}

function calcCost(inputTokens, outputTokens) {
  return (inputTokens / 1000000) * DS_PRICING.input + (outputTokens / 1000000) * DS_PRICING.output;
}

function getMonthlyCost() {
  const mk = getApiMonthKey();
  const inp = load('api_input_' + mk, 0);
  const out = load('api_output_' + mk, 0);
  return calcCost(inp, out);
}

// ═══════════ API Detail Page ═══════════
function renderApiDetail() {
  const mk = getApiMonthKey();
  const tk = todayKey();
  const now = new Date();
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  const monthInput = load('api_input_' + mk, 0);
  const monthOutput = load('api_output_' + mk, 0);
  const monthTotal = load('api_tokens_' + mk, 0);
  const monthCalls = load('api_calls_' + mk, 0);
  const monthCost = getMonthlyCost();

  const todayInput = load('api_input_day_' + tk, 0);
  const todayOutput = load('api_output_day_' + tk, 0);
  const todayTotal = load('api_tokens_day_' + tk, 0);
  const todayCalls = load('api_calls_day_' + tk, 0);
  const todayCost = calcCost(todayInput, todayOutput);

  // Balance
  const balance = load('api_balance', 0);
  const remaining = Math.max(0, balance - monthCost);
  const pct = balance > 0 ? Math.min(100, (monthCost / balance) * 100) : 0;
  const alertThreshold = load('api_alert_threshold', 1);

  // Last 7 days bars
  let dayBarsHtml = '';
  let maxDayTokens = 1;
  const dayData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dk = dateKey(d);
    const t = load('api_tokens_day_' + dk, 0);
    if (t > maxDayTokens) maxDayTokens = t;
    dayData.push({ label: (d.getMonth()+1) + '/' + d.getDate(), tokens: t, dk });
  }
  dayBarsHtml = dayData.map(dd => {
    const h = Math.max(2, (dd.tokens / maxDayTokens) * 60);
    return `<div class="api-day-bar-item">
      <div class="api-day-bar-val">${dd.tokens > 0 ? (dd.tokens > 9999 ? Math.round(dd.tokens/1000) + 'k' : dd.tokens) : ''}</div>
      <div class="api-day-bar" style="height:${h}px;${dd.dk === tk ? 'background:var(--rose-deep);' : ''}"></div>
      <div class="api-day-bar-label">${dd.label}</div>
    </div>`;
  }).join('');

  const container = document.getElementById('apiDetailContainer');
  container.innerHTML = `
    <div class="api-hero-cost">
      <div class="api-hero-num">¥${monthCost.toFixed(4)}</div>
      <div class="api-hero-label">${monthNames[now.getMonth()]} ESTIMATED COST</div>
    </div>

    ${balance > 0 ? `
    <div class="api-balance-card">
      <div class="api-balance-row">
        <div class="api-balance-label">余额</div>
        <div class="api-balance-val">¥${remaining.toFixed(2)}</div>
      </div>
      <div class="api-balance-bar">
        <div class="api-balance-fill" style="width:${pct}%;${pct > 80 ? 'background:var(--rose-deep);' : ''}"></div>
      </div>
      ${remaining < alertThreshold && balance > 0 ? '<div class="api-balance-warn">⚠️ 余额不足 ¥' + alertThreshold + '，请及时充值</div>' : ''}
      <div class="api-balance-actions">
        <button class="api-balance-btn" onclick="setApiBalance()">更新余额</button>
        <button class="api-balance-btn" onclick="setApiAlertThreshold()">充值提醒线</button>
      </div>
    </div>` : `
    <div class="api-balance-card">
      <div style="text-align:center;color:var(--text-mute);font-size:13px;padding:4px 0;">
        设置余额后可以追踪剩余额度
      </div>
      <div class="api-balance-actions">
        <button class="api-balance-btn" onclick="setApiBalance()">设置余额</button>
      </div>
    </div>`}

    <div class="api-section-title">DAILY USAGE · LAST 7 DAYS</div>
    <div class="api-day-bar-container">
      <div class="api-day-bars">${dayBarsHtml}</div>
    </div>

    <div class="api-section-title">${monthNames[now.getMonth()]} BREAKDOWN</div>
    <div class="api-breakdown">
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">总 tokens</div>
        <div class="api-breakdown-val">${monthTotal.toLocaleString()}</div>
      </div>
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">输入 tokens</div>
        <div class="api-breakdown-val">${monthInput.toLocaleString()}</div>
      </div>
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">输出 tokens</div>
        <div class="api-breakdown-val">${monthOutput.toLocaleString()}</div>
      </div>
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">调用次数</div>
        <div class="api-breakdown-val">${monthCalls}</div>
      </div>
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">输入费用</div>
        <div class="api-breakdown-val">¥${(monthInput / 1000000 * DS_PRICING.input).toFixed(4)}</div>
      </div>
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">输出费用</div>
        <div class="api-breakdown-val">¥${(monthOutput / 1000000 * DS_PRICING.output).toFixed(4)}</div>
      </div>
    </div>

    <div class="api-section-title">TODAY</div>
    <div class="api-breakdown">
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">今日 tokens</div>
        <div class="api-breakdown-val">${todayTotal.toLocaleString()}</div>
      </div>
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">输入 / 输出</div>
        <div class="api-breakdown-val">${todayInput.toLocaleString()} / ${todayOutput.toLocaleString()}</div>
      </div>
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">今日调用</div>
        <div class="api-breakdown-val">${todayCalls}</div>
      </div>
      <div class="api-breakdown-row">
        <div class="api-breakdown-label">今日费用</div>
        <div class="api-breakdown-val">¥${todayCost.toFixed(4)}</div>
      </div>
    </div>

    <div class="api-section-title">PRICING · DEEPSEEK V4 FLASH</div>
    <div class="api-pricing-info">
      <div class="api-pricing-model">deepseek-chat → V4 Flash</div>
      输入：¥${DS_PRICING.input} / 百万 tokens<br>
      输出：¥${DS_PRICING.output} / 百万 tokens<br>
      缓存命中：¥0.02 / 百万 tokens<br>
      <span style="font-size:11px;color:var(--text-soft);">
        注：此处按 cache miss 计算。<br>
        实际费用可能更低。以 DeepSeek 账单为准。
      </span>
    </div>
  `;
}

function setApiBalance() {
  const current = load('api_balance', 0);
  const input = prompt('请输入当前 DeepSeek 账户余额（元）：', current || '');
  if (input !== null && input !== '') {
    const val = parseFloat(input);
    if (!isNaN(val) && val >= 0) {
      save('api_balance', val);
      renderApiDetail();
    } else {
      alert('请输入有效的数字');
    }
  }
}

function setApiAlertThreshold() {
  const current = load('api_alert_threshold', 1);
  const input = prompt('余额低于多少元时提醒充值？', current);
  if (input !== null && input !== '') {
    const val = parseFloat(input);
    if (!isNaN(val) && val >= 0) {
      save('api_alert_threshold', val);
      renderApiDetail();
    }
  }
}


// ═══════════════════════════════════════════════════
//  zoe-space Service Worker · v8
//  策略：
//   - App Shell（本站自家文件）: cache-first，离线优先，最快
//   - Google Fonts (CSS + woff2):   stale-while-revalidate
//   - 其它跨域 GET:                  network-first，回退缓存
//   - API (DeepSeek / TTS):          直通，不缓存
// ═══════════════════════════════════════════════════
const CACHE_VERSION = 'v8';   // v7 单词卡改版+VOICEVOX · v8 体重饮食趋势图
const SHELL_CACHE = 'zoe-shell-' + CACHE_VERSION;
const FONT_CACHE  = 'zoe-fonts-' + CACHE_VERSION;
const RUNTIME_CACHE = 'zoe-runtime-' + CACHE_VERSION;

const SHELL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './core.js',
  './ui.js',
  './ai.js',
  './life.js',
  './health.js',
  './nihongo.js',
  './speaking.js',
  './sentences.js',
  './init.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Noto+Serif+SC:wght@300;400;500&family=Noto+Sans+SC:wght@300;400;500&display=swap';

// Install: 预缓存自家 shell，字体让运行时去拿
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// Activate: 清理旧版本缓存
self.addEventListener('activate', event => {
  const keep = new Set([SHELL_CACHE, FONT_CACHE, RUNTIME_CACHE]);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !keep.has(k)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch 策略
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // API 直通（VOICEVOX 音频有自己的 IndexedDB 缓存，别在 SW 里重复缓存）
  if (url.hostname === 'api.deepseek.com' ||
      url.hostname === 'texttospeech.googleapis.com' ||
      url.hostname === 'tts.quest' || url.hostname.endsWith('.tts.quest')) {
    return;
  }

  // 自家 shell: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request, SHELL_CACHE));
    return;
  }

  // Google Fonts: stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(event.request, FONT_CACHE));
    return;
  }

  // 其它跨域: network-first
  event.respondWith(networkFirst(event.request, RUNTIME_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    // 后台静默更新一次，下次刷新就拿到新版
    fetch(request).then(res => { if (res.ok) cache.put(request, res.clone()); }).catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return new Response('离线中～', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(res => {
    if (res.ok) cache.put(request, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fetchPromise;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('离线中～', { status: 503 });
  }
}

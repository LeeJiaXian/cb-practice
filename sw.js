// 爵士鼓練習室（原名數小節練習室）：離線快取。改版時把 VERSION 加一，使用者下次連網打開就會更新。
const VERSION = 'cb-v21';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const LIBS = [
  'https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.9.9/build/opensheetmusicdisplay.min.js',
  'https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(CORE);
    await Promise.all(LIBS.map(u => fetch(u, {mode: 'cors'}).then(r => r.ok ? c.put(u, r) : null).catch(() => null)));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 頁面本身：先連網拿最新版，失敗就用快取（離線）
  if (req.mode === 'navigate' || (url.origin === location.origin && url.pathname.endsWith('/index.html'))){
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // 其他（元件、字型、圖示）：有快取就用，沒有再連網並存起來
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r && (r.ok || r.type === 'opaque')){ const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); }
    return r;
  })));
});

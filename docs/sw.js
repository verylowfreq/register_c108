// ============================================================
//  Service Worker - オフライン動作用キャッシュ
//  静的アセットを事前キャッシュし、初回ロード後はオフラインでも起動可能。
//  アセットを更新したら CACHE_NAME のバージョンを上げる。
// ============================================================
var CACHE_NAME = "register_c108_CACHE_v3";

var ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./products.js",
  "./manifest.webmanifest",
  "./images/p01.svg",
  "./images/p02.svg",
  "./images/p03.svg",
  "./images/p04.svg",
  "./images/p05.svg",
  "./images/p06.svg",
  "./images/p07.svg",
  "./images/p08.svg",
  "./images/icon-192.png",
  "./images/icon-512.png"
];

// インストール: 全アセットをキャッシュ
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // 個別に addAll（1つ失敗しても致命的にしない）
      return Promise.all(ASSETS.map(function (url) {
        return cache.add(url).catch(function () { /* 欠損は無視 */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

// 有効化: 旧バージョンのキャッシュを破棄
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

// フェッチ: キャッシュ優先（cache-first）。無ければネット取得しキャッシュに追加。
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (res) {
        // 同一オリジンの正常応答のみキャッシュ
        if (res && res.status === 200 && res.type === "basic") {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, clone); });
        }
        return res;
      }).catch(function () {
        // オフラインでナビゲーション要求ならトップを返す
        if (event.request.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});

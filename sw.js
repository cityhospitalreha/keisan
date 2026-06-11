// ========== Service Worker (sw.js) ==========
// 役割：アプリのファイルをブラウザに保存（キャッシュ）して、
//       Wi-Fiがなくても動くようにする「裏方スタッフ」

// キャッシュの名前（バージョン管理に使う。更新時はここを変える）
const CACHE_NAME = 'keisan-v1';

// キャッシュするファイルの一覧
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ========== インストール時 ==========
// 初めてSWが登録されるときに呼ばれる。ファイルをキャッシュに保存する。
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('キャッシュ保存中...');
      // アイコンがなくてもエラーにしないよう個別にtry
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting(); // 即座に有効化
});

// ========== アクティベート時 ==========
// 古いキャッシュを削除する（バージョンアップ時に古いデータが残らないように）
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME) // 今のキャッシュ以外を削除
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ========== フェッチ時（ページ読み込み・通信時） ==========
// ネットワークに接続できればネット優先、できなければキャッシュを使う
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // ネット接続成功 → キャッシュも更新しておく
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // ネット接続失敗 → キャッシュから返す（オフライン対応）
        return caches.match(event.request);
      })
  );
});

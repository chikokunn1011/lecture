/* 講義まとめサイトのパスワードゲート。
   全ページの <head> で同期読み込みし、未認証なら本文を隠して入力画面を出す。
   パスワードそのものは書かず、SHA-256 ハッシュだけを持つ。
   ※ 静的サイト上のクライアント側の目隠しなので、ソースを直接読まれると中身は見える。 */
(function () {
  var HASH = 'e09ed791cdac877c37c1a5c5ed6147be113ad55180541a6053fbd33f4be0ed91';
  var KEY = 'lecture-gate-v1';
  var root = document.documentElement;

  function saved() {
    try { if (localStorage.getItem(KEY) === HASH) return true; } catch (e) {}
    try { if (sessionStorage.getItem(KEY) === HASH) return true; } catch (e) {}
    return false;
  }
  if (saved()) return;

  root.classList.add('gate-locked');
  var css = document.createElement('style');
  css.textContent =
    'html.gate-locked body>:not(#lecture-gate){display:none!important}' +
    'html.gate-locked body{overflow:hidden}' +
    '#lecture-gate{--g-bg:#eef1f5;--g-paper:#fff;--g-ink:#1a2b4a;--g-sub:#56657c;--g-line:#d9e0e8;--g-acc:#1a2b4a;--g-acc-ink:#fff;--g-err:#c0392b;' +
    'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:16px;' +
    'background:var(--g-bg);color:var(--g-ink);font-family:"BIZ UDPGothic","Hiragino Sans","Yu Gothic","Meiryo",sans-serif}' +
    '@media (prefers-color-scheme:dark){#lecture-gate{--g-bg:#11161f;--g-paper:#19202c;--g-ink:#e5eaf2;--g-sub:#9daabd;--g-line:#2c3646;--g-acc:#e5eaf2;--g-acc-ink:#11161f;--g-err:#ff8a7a}}' +
    '#lecture-gate form{width:100%;max-width:360px;background:var(--g-paper);border:1px solid var(--g-line);border-radius:14px;padding:28px 22px;box-shadow:0 6px 24px rgba(0,0,0,.08)}' +
    '#lecture-gate h1{margin:0 0 6px;font-size:1.25rem;font-family:"Zen Kaku Gothic New","Hiragino Sans",sans-serif;font-weight:900}' +
    '#lecture-gate p{margin:0 0 18px;color:var(--g-sub);font-size:.9rem}' +
    '#lecture-gate input[type=password]{width:100%;box-sizing:border-box;font-size:16px;padding:12px 14px;border:1px solid var(--g-line);border-radius:10px;background:var(--g-bg);color:var(--g-ink)}' +
    '#lecture-gate input[type=password]:focus{outline:2px solid var(--g-acc);outline-offset:1px}' +
    '#lecture-gate label.keep{display:flex;gap:8px;align-items:center;margin:12px 0 16px;font-size:.88rem;color:var(--g-sub)}' +
    '#lecture-gate button{width:100%;font-size:1rem;font-weight:700;padding:12px;border:0;border-radius:10px;background:var(--g-acc);color:var(--g-acc-ink);cursor:pointer}' +
    '#lecture-gate .err{min-height:1.2em;margin:10px 0 0;color:var(--g-err);font-size:.85rem}';
  (document.head || root).appendChild(css);

  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('');
  }
  function sha256(text) {
    if (!window.crypto || !crypto.subtle) return Promise.reject(new Error('no-subtle'));
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(hex);
  }

  function build() {
    var box = document.createElement('div');
    box.id = 'lecture-gate';
    box.innerHTML =
      '<form autocomplete="off">' +
      '<h1>🔒 講義まとめノート</h1>' +
      '<p>見るにはパスワードを入力してね。</p>' +
      '<input type="password" aria-label="パスワード" placeholder="パスワード" required>' +
      '<label class="keep"><input type="checkbox" checked> この端末で覚えておく</label>' +
      '<button type="submit">開く</button>' +
      '<div class="err" role="alert"></div>' +
      '</form>';
    document.body.appendChild(box);
    var form = box.querySelector('form');
    var pw = box.querySelector('input[type=password]');
    var keep = box.querySelector('input[type=checkbox]');
    var err = box.querySelector('.err');
    pw.focus();
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      sha256(pw.value).then(function (h) {
        if (h !== HASH) {
          err.textContent = 'パスワードが違うよ。';
          pw.select();
          return;
        }
        try { (keep.checked ? localStorage : sessionStorage).setItem(KEY, HASH); } catch (e) {}
        box.remove();
        root.classList.remove('gate-locked');
        // ハッシュ付きURLで来たときは解除後に目的の場所へスクロールし直す
        if (location.hash) {
          var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
          if (t) t.scrollIntoView();
        }
      }, function () {
        err.textContent = 'このブラウザでは確認できなかった（https で開いてね）。';
      });
    });
  }

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();

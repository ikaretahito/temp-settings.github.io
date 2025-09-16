// DOMの構築完了を待ってからバインド
document.addEventListener('DOMContentLoaded', () => {
  const content = document.getElementById('content');
  const menu = document.getElementById('menu');

  // セクション切替（左メニュー）
  if (menu && content) {
    const pages = [...content.querySelectorAll('section[data-page]')];
    menu.addEventListener('click', e => {
      const li = e.target.closest('li');
      if (!li) return;
      document.querySelectorAll('li').forEach(x => x.classList.toggle('active', x === li));
      const name = li.dataset.page;
      pages.forEach(p => p.hidden = p.dataset.page !== name);
    });
  }

  // トグルスイッチ挙動（ON/OFFの見た目だけ）
  document.querySelectorAll('.toggle').forEach(t => {
    t.addEventListener('click', () => t.classList.toggle('on'));
  });

  // 位置情報の簡易トグル（アプリ画面）
  const locEl = document.getElementById('locState');
  if (locEl) {
    const btn = document.querySelector('section[data-page="apps"] button.badge');
    if (btn) btn.addEventListener('click', () => {
      locEl.textContent = (locEl.textContent === '許可') ? '不許可' : '許可';
    });
  }

  // 「通信量を制限」ONでパネル表示（モバイル通信）
  const capToggle = document.querySelector('[data-bind="cap"]');
  const capPanel = document.getElementById('capPanel');
  if (capToggle && capPanel) {
    capToggle.addEventListener('click', () => {
      setTimeout(() => {
        capPanel.hidden = !capToggle.classList.contains('on');
      }, 0);
    });
  }

  // メニュー外のページ遷移（NFC ▸ など）用にグローバル関数を公開
  window.show = function(name){
    document.querySelectorAll('main section[data-page]')
      .forEach(s => s.hidden = (s.dataset.page !== name));
  };

  // 簡易計測API（任意）
  const start = performance.now();
  window.markDone = label => console.log(label, Math.round(performance.now() - start) + 'ms 経過');
});

// ====== 以下、機能関数（モバイル通信：APN/上限） ======

// 上限の適用（ダミー）
function applyCap(){
  const input = document.getElementById('capInput');
  const now = document.getElementById('capNow');
  if (!input || !now) return;
  const v = Number(input.value || 20);
  now.textContent = v;
  alert('上限を ' + v + ' GB に設定しました');
}

// APNの切替（ダミー）
function setAPN(apn){
  const el = document.getElementById('apnCurrent');
  if (!el) return;
  el.textContent = apn;
  alert('APNを ' + apn + ' に切り替えました');
}

// カスタムAPN追加（ダミー）
function addAPN(){
  const nameEl = document.getElementById('apnName');
  const apnEl  = document.getElementById('apnValue');
  if (!nameEl || !apnEl) return;

  const name = nameEl.value.trim();
  const apn  = apnEl.value.trim();
  if(!name || !apn){
    alert('名称とAPNを入力してください');
    return;
  }
  const list = document.querySelector('section[data-page="apn"] .panel ul');
  if (!list) return;

  const li = document.createElement('li');
  li.innerHTML = `<button class="badge" onclick="setAPN('${apn}')">${apn}</button> <span class="note">(${name})</span>`;
  list.appendChild(li);
  nameEl.value = '';
  apnEl.value = '';
}

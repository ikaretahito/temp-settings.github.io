document.addEventListener('DOMContentLoaded', () => {
  const content = document.getElementById('content');
  const menu = document.getElementById('menu');

  // 左メニュー切替
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

  // トグル（見た目だけON/OFF）
  document.querySelectorAll('.toggle').forEach(t => {
    t.addEventListener('click', () => t.classList.toggle('on'));
  });

  // 位置情報トグル（アプリ）
  const locEl = document.getElementById('locState');
  if (locEl) {
    const btn = document.querySelector('section[data-page="apps"] button.badge');
    if (btn) btn.addEventListener('click', () => {
      locEl.textContent = (locEl.textContent === '許可') ? '不許可' : '許可';
    });
  }

  // 通信量制限（モバイル通信）
  const capToggle = document.querySelector('[data-bind="cap"]');
  const capPanel = document.getElementById('capPanel');
  if (capToggle && capPanel) {
    capToggle.addEventListener('click', () => {
      setTimeout(() => {
        capPanel.hidden = !capToggle.classList.contains('on');
      }, 0);
    });
  }

  // ページ遷移API（NFC ▸ など）
  window.show = function(name){
    document.querySelectorAll('main section[data-page]')
      .forEach(s => s.hidden = (s.dataset.page !== name));
  };

  // ===== ストレージ：単位切替（GB <-> %） =====
  const storageImg = document.getElementById('storageChart');
  if (storageImg) {
    const buttons = document.querySelectorAll('.seg-btn[data-unit]');
    const SRC = {
      gb:  'storage usageGB.png',       // 単位なしのGB版
      pct: 'storage usageもどき.png'    // %版
    };
    const ALT = {
      gb:  'ストレージ円グラフ（GB）',
      pct: 'ストレージ円グラフ（%）'
    };
    buttons.forEach(b=>{
      b.addEventListener('click', ()=>{
        buttons.forEach(x=>{
          x.classList.toggle('active', x===b);
          x.setAttribute('aria-pressed', x===b ? 'true':'false');
        });
        const unit = b.dataset.unit;
        storageImg.src = SRC[unit];
        storageImg.alt = ALT[unit];
      });
    });
  }

  // ===== 画面：輝度スライダ（％連動） =====
  const brightRange = document.getElementById('brightRange');
  const brightVal   = document.getElementById('brightVal');
  if (brightRange && brightVal) {
    const update = () => { brightVal.textContent = brightRange.value; };
    brightRange.addEventListener('input', update);
    update();
  }

  // ===== 画面：ダークモード切替 =====
  const darkToggle = document.querySelector('[data-bind="darkmode"]');
  if (darkToggle) {
    darkToggle.addEventListener('click', () => {
      const on = darkToggle.classList.toggle('on');
      document.documentElement.classList.toggle('theme-dark', on);
    });
  }

  // ===== 画面：壁紙ボタン =====
  const btnWallpaper = document.getElementById('btnWallpaper');
  if (btnWallpaper) {
    btnWallpaper.addEventListener('click', () => {
      alert('壁紙ギャラリーを開きます（モック）');
    });
  }

  // ===== 画面：自動ロック（ダミー保存） =====
  const autolock = document.getElementById('autolock');
  if (autolock) {
    autolock.addEventListener('change', () => {
      console.log('自動ロック: ', autolock.value);
    });
  }

  // 簡易計測
  const start = performance.now();
  window.markDone = label => console.log(label, Math.round(performance.now() - start) + 'ms 経過');
});

// ===== モバイル通信：APNユーティリティ =====
function applyCap(){
  const input = document.getElementById('capInput');
  const now = document.getElementById('capNow');
  if (!input || !now) return;
  const v = Number(input.value || 20);
  now.textContent = v;
  alert('上限を ' + v + ' GB に設定しました');
}
function setAPN(apn){
  const el = document.getElementById('apnCurrent');
  if (!el) return;
  el.textContent = apn;
  alert('APNを ' + apn + ' に切り替えました');
}
function addAPN(){
  const nameEl = document.getElementById('apnName');
  const apnEl  = document.getElementById('apnValue');
  if (!nameEl || !apnEl) return;
  const name = nameEl.value.trim();
  const apn  = apnEl.value.trim();
  if(!name || !apn){ alert('名称とAPNを入力してください'); return; }
  const list = document.querySelector('section[data-page="apn"] .panel ul');
  if (!list) return;
  const li = document.createElement('li');
  li.innerHTML = `<button class="badge" onclick="setAPN('${apn}')">${apn}</button> <span class="note">(${name})</span>`;
  list.appendChild(li);
  nameEl.value = ''; apnEl.value = '';
}

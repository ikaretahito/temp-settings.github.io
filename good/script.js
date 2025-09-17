// 状態管理（永続化つき）
const Store = (() => {
  const KEY = "pref-ui-state";
  const def = {
    airplane: false, wifi: true, saver: false, bt: true,
    nearby: false, nfc: false, nfc_unlock: false, cap: false,
    tether: false, notifyData: true, autoBrightness: true,
    darkmode: false, unit: "gb", capValue: 20, apn: "carrier.example.jp",
    locAllowed: true, brightness: 60
  };
  let state = { ...def, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const set = (k, v) => { state[k] = v; save(); };
  const get = (k) => state[k];
  return { get, set, all: () => ({...state}), def };
})();

// 汎用: トグルDOMのon/offと状態同期
function bindToggles(){
  document.querySelectorAll(".toggle[data-bind]").forEach(el => {
    const key = el.dataset.bind;
    el.classList.toggle("on", !!Store.get(key));
    el.addEventListener("click", () => {
      const now = el.classList.toggle("on");
      Store.set(key, now);

      // 連動動作
      if(key === "darkmode"){
        document.body.classList.toggle("theme-dark", now);
      }
      if(key === "cap"){
        document.getElementById("capPanel")?.toggleAttribute("hidden", !now);
      }
    });
  });
}

// 左メニュー: クリックでセクション切替 + アクティブ表示
function bindMenu(){
  const menu = document.getElementById("menu");
  const content = document.getElementById("content");
  if(!menu || !content) return;

  const pages = [...content.querySelectorAll('section[data-page]')];

  // 初期: hashまたはactiveに合わせて表示
  const initial = location.hash.replace("#","") ||
    (menu.querySelector("li.active")?.dataset.page ?? pages[0]?.dataset.page);
  show(initial);
  highlight(initial);

  function highlight(name){
    menu.querySelectorAll("li").forEach(li =>
      li.classList.toggle("active", li.dataset.page === name));
  }

  menu.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-page]");
    if(!li) return;
    const name = li.dataset.page;
    show(name);
    highlight(name);
    history.replaceState(null, "", `#${name}`);
  });
}

// HTML側のshow(name)を利用
// window.show is already defined inline in HTML

// 検索: 左メニューをフィルタ
function bindSearch(){
  const q = document.getElementById("q");
  const items = [...document.querySelectorAll("#menu li")];
  if(!q) return;
  const norm = s => s.normalize("NFKC").toLowerCase();
  q.addEventListener("input", () => {
    const kw = norm(q.value);
    items.forEach(li => {
      const hit = norm(li.textContent).includes(kw);
      li.style.display = hit ? "" : "none";
    });
  });
}

// 画面系: 輝度・ダークモード・壁紙ボタン
function bindDisplay(){
  const r = document.getElementById("brightRange");
  const label = document.getElementById("brightVal");
  if(r && label){
    r.value = Store.get("brightness");
    label.textContent = r.value;
    r.addEventListener("input", () => {
      label.textContent = r.value;
    });
    r.addEventListener("change", () => {
      Store.set("brightness", Number(r.value));
    });
  }

  // ダークモード初期反映
  document.body.classList.toggle("theme-dark", !!Store.get("darkmode"));

  // 壁紙
  document.getElementById("btnWallpaper")?.addEventListener("click", () => {
    alert("壁紙選択ダイアログ（モック）");
  });

  // 自動ロック: 保存だけ
  const autolock = document.getElementById("autolock");
  if(autolock){
    autolock.addEventListener("change", () => {
      Store.set("autolock", autolock.value);
    });
    if(Store.get("autolock")) autolock.value = Store.get("autolock");
  }
}

// ストレージ: 単位切替（画像差し替え）
function bindStorage(){
  const chart = document.getElementById("storageChart");
  const segBtns = document.querySelectorAll(".seg-btn[data-unit]");
  if(!chart || !segBtns.length) return;

  function apply(unit){
    if(unit === "gb"){
      chart.src = "storage usageGB.png";
      chart.alt = "ストレージ円グラフ（GB）";
    }else{
      chart.src = "storage usageもどき.png";
      chart.alt = "ストレージ円グラフ（%）";
    }
    segBtns.forEach(b => {
      const active = b.dataset.unit === unit;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    Store.set("unit", unit);
  }

  segBtns.forEach(b => {
    b.addEventListener("click", () => apply(b.dataset.unit));
  });

  apply(Store.get("unit") || "gb");
}

// モバイル通信: 上限・バー反映等
function bindMobile(){
  const capPanel = document.getElementById("capPanel");
  const capInput = document.getElementById("capInput");
  const capNow = document.getElementById("capNow");
  const bar = document.getElementById("dataUsedBar");

  // 初期: capの表示
  const capOn = !!Store.get("cap");
  capPanel?.toggleAttribute("hidden", !capOn);

  // cap値初期化
  if(capInput){
    capInput.value = Store.get("capValue") ?? 20;
  }
  if(capNow){
    capNow.textContent = Store.get("capValue") ?? 20;
  }

  // 使用量バーの例: 11.8 / 20 → 59%
  if(bar){
    // HTML側に初期幅があるが、cap変更後に再計算できるよう関数化
    const updateBar = () => {
      const used = 11.8; // モックの固定値（必要ならStore化可能）
      const cap = Number(Store.get("capValue") ?? 20);
      const pct = Math.min(100, Math.round((used / cap) * 100));
      bar.style.width = pct + "%";
    };
    updateBar();
    // 外から呼べるように保存
    window.__updateDataBar = updateBar;
  }
}

// 位置情報（アプリ）
window.toggleLocation = function(){
  const next = !Store.get("locAllowed");
  Store.set("locAllowed", next);
  const el = document.getElementById("locState");
  if(el) el.textContent = next ? "許可" : "拒否";
};

// APN
window.setAPN = function(name){
  Store.set("apn", name);
  document.getElementById("apnCurrent").textContent = name;
  alert(`APNを ${name} に切替えました（モック）`);
};
window.addAPN = function(){
  const name = document.getElementById("apnName")?.value?.trim();
  const apn  = document.getElementById("apnValue")?.value?.trim();
  if(!name || !apn){ alert("名称とAPNを入力してください"); return; }
  // 実装簡略化：選択中にする
  setAPN(apn);
  document.getElementById("apnName").value = "";
  document.getElementById("apnValue").value = "";
};

// データ上限の適用
window.applyCap = function(){
  const v = Number(document.getElementById("capInput").value);
  if(isNaN(v) || v < 1 || v > 200){
    alert("1〜200の範囲で入力してください");
    return;
  }
  Store.set("capValue", v);
  document.getElementById("capNow").textContent = v;
  window.__updateDataBar?.();
  alert(`上限を ${v} GB に設定しました`);
};

// 初期化
document.addEventListener("DOMContentLoaded", () => {
  bindMenu();
  bindSearch();
  bindToggles();
  bindDisplay();
  bindStorage();
  bindMobile();

  // ページ直接リンク（hash）の戻り/進む対応
  window.addEventListener("popstate", () => {
    const name = location.hash.replace("#","");
    if(name){
      show(name);
      // 左メニューの見た目も更新
      document.querySelectorAll("#menu li").forEach(li => {
        li.classList.toggle("active", li.dataset.page === name);
      });
    }
  });
});

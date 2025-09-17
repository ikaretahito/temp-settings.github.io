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
// ---- アプリのモックデータ ----
const Apps = (() => {
  const data = [
    {
      id: "line", name: "LINE", system: false, icon: "icons/line.png",
      permissions: { camera:true, mic:true, location:true, notifications:true },
      revoked: false,
      screentime: { todayMin: 35, weekMin: 240 } // 直近7日合計
    },
    {
      id: "youtube", name: "YouTube", system:false, icon:"icons/youtube.png",
      permissions: { camera:false, mic:true, location:false, notifications:true },
      revoked:false,
      screentime:{ todayMin: 52, weekMin: 380 }
    },
    {
      id: "camera", name: "カメラ", system:true, icon:"icons/camera.png",
      permissions: { camera:true, mic:true, location:true, notifications:false },
      revoked:false,
      screentime:{ todayMin: 5, weekMin: 40 }
    },
    {
      id: "settings", name:"設定", system:true, icon:"icons/settings.png",
      permissions:{ camera:false, mic:false, location:false, notifications:false },
      revoked:false,
      screentime:{ todayMin: 2, weekMin: 15 }
    }
  ];
  const byId = id => data.find(x => x.id === id);
  return { all:() => data, byId };
})();

// ---- 一覧描画 ----
function renderAppList(){
  const listEl = document.getElementById("appList");
  const showSys = document.getElementById("showSystem")?.checked;
  const q = (document.getElementById("appSearch")?.value || "").trim().toLowerCase();

  const apps = Apps.all().filter(a => (showSys || !a.system))
    .filter(a => a.name.toLowerCase().includes(q));

  // 集計
  const sumEl = document.getElementById("appSummary");
  if(sumEl){
    const total = apps.length;
    const sys = apps.filter(a => a.system).length;
    sumEl.innerHTML = `
      <div><strong>${total}</strong> 件表示（システム: ${sys}）</div>
      <div class="help">クリックで詳細へ。剥奪/付与、スクリーンタイム確認ができます。</div>
    `;
  }

  // 一覧
  listEl.innerHTML = "";
  apps.forEach(a => {
    const row = document.createElement("div");
    row.className = "row app-row";
    row.tabIndex = 0;
    row.addEventListener("click", () => openAppDetail(a.id));
    row.addEventListener("keypress", (e) => { if(e.key === "Enter") openAppDetail(a.id); });

    row.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <div class="app-icon" aria-hidden="true">${(a.name[0] || "?")}</div>
        <div>
          <div>${a.name}${a.system ? ' <span class="badge">システム</span>' : ""}</div>
          <div class="help">本日 ${a.screentime.todayMin} 分・直近7日 ${a.screentime.weekMin} 分</div>
        </div>
      </div>
      <div class="link">詳細</div>
    `;
    listEl.appendChild(row);
  });
}

// ---- 詳細描画 ----
function openAppDetail(id){
  const a = Apps.byId(id); if(!a) return;
  // タイトル・メタ
  document.getElementById("appTitle").textContent = a.name;
  document.getElementById("appMeta").innerHTML = `
    <div class="grid">
      <div><strong>ID</strong><div class="help">${a.id}</div></div>
      <div><strong>種別</strong><div class="help">${a.system ? "システム" : "ユーザー"}</div></div>
    </div>
  `;

  // 権限一覧
  const perms = a.permissions;
  const toBadge = (k, v) => `<span class="badge" style="margin-right:6px">${k}:${v ? "許可" : "拒否"}</span>`;
  document.getElementById("appPermissions").innerHTML =
    Object.keys(perms).map(k => toBadge(k, perms[k])).join("");

  // スクリーンタイム
  document.getElementById("stToday").textContent = `${a.screentime.todayMin}分`;
  // 週バーの幅は、便宜上 “1日120分想定×7=840分” 比で可視化
  const pct = Math.min(100, Math.round(a.screentime.weekMin / 840 * 100));
  document.getElementById("stWeekBar").style.width = pct + "%";
  document.getElementById("stWeekNote").textContent =
    `直近7日: ${a.screentime.weekMin}分（目安比 ${pct}%）`;

  // 剥奪/付与
  const btnRevoke = document.getElementById("btnRevoke");
  const btnGrant  = document.getElementById("btnGrant");
  btnRevoke.onclick = () => {
    Object.keys(perms).forEach(k => perms[k] = false);
    openAppDetail(id);
    alert("すべての権限を剥奪しました（モック）");
  };
  btnGrant.onclick = () => {
    Object.keys(perms).forEach(k => perms[k] = true);
    openAppDetail(id);
    alert("すべての権限を付与しました（モック）");
  };

  // アンインストール
  const uninstallRow = document.getElementById("uninstallRow");
  const btnUninstall = document.getElementById("btnUninstall");
  if(a.system){
    uninstallRow.style.opacity = .5;
    btnUninstall.disabled = true;
    btnUninstall.title = "システムアプリはアンインストール不可";
  }else{
    uninstallRow.style.opacity = 1;
    btnUninstall.disabled = false;
    btnUninstall.title = "";
    btnUninstall.onclick = () => alert(`${a.name} をアンインストールします（モック）`);
  }

  show("app-detail");
  history.replaceState(null, "", `#app-${id}`);
}

// ---- バインド（一覧のイベント） ----
function bindAppsPage(){
  const s = document.getElementById("appSearch");
  const c = document.getElementById("showSystem");
  if(s){ s.addEventListener("input", renderAppList); }
  if(c){ c.addEventListener("change", renderAppList); }
  renderAppList();
}

// 既存DOMContentLoaded末尾に追加
document.addEventListener("DOMContentLoaded", () => {
  // appsページ初期化
  bindAppsPage();

  // 直接ハッシュ遷移（例: #app-line）
  const m = location.hash.match(/^#app-(.+)$/);
  if(m && Apps.byId(m[1])) openAppDetail(m[1]);
});

/* ========= 永続ストア ========= */
const Store = (() => {
  const KEY = "pref-ui-state";
  const def = {
    airplane:false, wifi:true, saver:false, bt:true, nearby:false,
    nfc:false, nfc_unlock:false, cap:false, tether:false, notifyData:true,
    autoBrightness:true, darkmode:false, unit:"gb", capValue:20, apn:"carrier.example.jp",
    locAllowed:true, brightness:60, autolock:"1m",
    // ★ システム用 追加
    lang:"ja", ime:"jp", tz:"Asia/Tokyo", autoTime:true
  };
  let state = { ...def, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  return { get:k=>state[k], set:(k,v)=>{ state[k]=v; save(); }, all:()=>({...state}), def };
})();

/* ========= ルーティング ========= */
function show(name){
  document.querySelectorAll('section[data-page]').forEach(s => {
    s.hidden = (s.dataset.page !== name);
  });
}
function highlight(name){
  document.querySelectorAll("#menu li")
    .forEach(li => li.classList.toggle("active", li.dataset.page === name));
}
function routeFromHash(){
  const h = location.hash.slice(1);
  const m = h.match(/^app-(.+)$/);
  if (m && Apps.byId(m[1])) { openAppDetail(m[1]); return; }
  const name = h || document.querySelector('#menu li')?.dataset.page || "internet";
  show(name); highlight(name);
}

/* ========= メニュー・検索 ========= */
function bindMenu(){
  const menu = document.getElementById("menu");
  if(!menu) return;
  // 初期テーマ
  document.body.classList.toggle("theme-dark", !!Store.get("darkmode"));
  // 初期ルート
  routeFromHash();

  menu.addEventListener("click", e => {
    const li = e.target.closest("li[data-page]");
    if(!li) return;
    const name = li.dataset.page;
    show(name); highlight(name);
    history.pushState(null, "", `#${name}`);
  });
}
function bindSearch(){
  const q = document.getElementById("q"); if(!q) return;
  const items = [...document.querySelectorAll("#menu li")];
  const norm = s => s.normalize("NFKC").toLowerCase();
  q.addEventListener("input", () => {
    const kw = norm(q.value);
    items.forEach(li => li.style.display =
      norm(li.textContent).includes(kw) ? "" : "none");
  });
}

/* ========= トグル ========= */
function bindToggles(){
  document.querySelectorAll(".toggle[data-bind]").forEach(el => {
    const key = el.dataset.bind;
    const on = !!Store.get(key);
    el.classList.toggle("on", on);
    el.setAttribute("aria-pressed", String(on));
    el.addEventListener("click", () => {
      const now = el.classList.toggle("on");
      el.setAttribute("aria-pressed", String(now));
      Store.set(key, now);
      if(key === "darkmode") document.body.classList.toggle("theme-dark", now);
      if(key === "cap") document.getElementById("capPanel")?.toggleAttribute("hidden", !now);
      if(key === "autoTime") {/* モックなので保存のみ */}
    });
  });
}

/* ========= 画面 ========= */
function bindDisplay(){
  const r = document.getElementById("brightRange");
  const label = document.getElementById("brightVal");
  if(r && label){
    r.value = Store.get("brightness");
    label.textContent = r.value;
    r.addEventListener("input", () => label.textContent = r.value);
    r.addEventListener("change", () => Store.set("brightness", Number(r.value)));
  }
  const autolock = document.getElementById("autolock");
  if(autolock){
    autolock.value = Store.get("autolock");
    autolock.addEventListener("change", () => Store.set("autolock", autolock.value));
  }
  document.getElementById("btnWallpaper")?.addEventListener("click", () => {
    alert("壁紙選択ダイアログ（モック）");
  });
}

/* ========= ストレージ ========= */
function bindStorage(){
  const chart = document.getElementById("storageChart");
  const segBtns = document.querySelectorAll(".seg-btn[data-unit]");
  if(!chart || !segBtns.length) return;

  function apply(unit){
    if(unit === "gb"){
      chart.src = "storage usageGB.png";
      chart.alt = "ストレージ円グラフ（GB）";
    }else{
      chart.src = "storage usageもどき.png"; // ← 指定通り
      chart.alt = "ストレージ円グラフ（%）";
    }
    segBtns.forEach(b => {
      const active = b.dataset.unit === unit;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    Store.set("unit", unit);
  }
  segBtns.forEach(b => b.addEventListener("click", () => apply(b.dataset.unit)));
  apply(Store.get("unit") || "gb");
}

/* ========= モバイル通信 ========= */
function bindMobile(){
  const capPanel = document.getElementById("capPanel");
  const capInput = document.getElementById("capInput");
  const capNow = document.getElementById("capNow");
  const bar = document.getElementById("dataUsedBar");

  capPanel?.toggleAttribute("hidden", !Store.get("cap"));
  if(capInput){ capInput.value = Store.get("capValue") ?? 20; }
  if(capNow){ capNow.textContent = Store.get("capValue") ?? 20; }

  if(bar){
    const updateBar = () => {
      const used = 11.8;
      const cap = Number(Store.get("capValue") ?? 20);
      const pct = Math.min(100, Math.round((used / cap) * 100));
      bar.style.width = pct + "%";
    };
    updateBar(); window.__updateDataBar = updateBar;
  }
}
window.applyCap = function(){
  const v = Number(document.getElementById("capInput").value);
  if(isNaN(v) || v < 1 || v > 200){ alert("1〜200の範囲で入力してください"); return; }
  Store.set("capValue", v);
  document.getElementById("capNow").textContent = v;
  window.__updateDataBar?.();
  alert(`上限を ${v} GB に設定しました`);
};

/* ========= APN / 位置情報 ========= */
window.setAPN = function(name){
  Store.set("apn", name);
  document.getElementById("apnCurrent").textContent = name;
  alert(`APNを ${name} に切替えました（モック）`);
};
window.addAPN = function(){
  const name = document.getElementById("apnName")?.value?.trim();
  const apn  = document.getElementById("apnValue")?.value?.trim();
  if(!name || !apn){ alert("名称とAPNを入力してください"); return; }
  setAPN(apn);
  document.getElementById("apnName").value = "";
  document.getElementById("apnValue").value = "";
};
window.toggleLocation = function(){
  const next = !Store.get("locAllowed");
  Store.set("locAllowed", next);
  const el = document.getElementById("locState");
  if(el) el.textContent = next ? "許可" : "拒否";
};

/* ========= アプリデータ ========= */
const Apps = (() => {
  const data = [
    { id:"line", name:"LINE", system:false,
      permissions:{ camera:true, mic:true, location:true, notifications:true },
      screentime:{ todayMin:35, weekMin:240 } },
    { id:"youtube", name:"YouTube", system:false,
      permissions:{ camera:false, mic:true, location:false, notifications:true },
      screentime:{ todayMin:52, weekMin:380 } },
    { id:"camera", name:"カメラ", system:true,
      permissions:{ camera:true, mic:true, location:true, notifications:false },
      screentime:{ todayMin:5, weekMin:40 } },
    { id:"settings", name:"設定", system:true,
      permissions:{ camera:false, mic:false, location:false, notifications:false },
      screentime:{ todayMin:2, weekMin:15 } },
     { id:"maps", name:"地図", system:false,
    permissions:{ camera:false, mic:false, location:true, notifications:true },
    screentime:{ todayMin:12, weekMin:90 } },
  { id:"browser", name:"ブラウザ", system:false,
    permissions:{ camera:true, mic:true, location:true, notifications:true },
    screentime:{ todayMin:25, weekMin:210 } },
  { id:"photos", name:"フォト", system:false,
    permissions:{ camera:false, mic:false, location:false, notifications:true },
    screentime:{ todayMin:8, weekMin:55 } },
  { id:"mail", name:"メール", system:false,
    permissions:{ camera:false, mic:false, location:false, notifications:true },
    screentime:{ todayMin:5, weekMin:48 } },
  { id:"music", name:"ミュージック", system:false,
    permissions:{ camera:false, mic:false, location:false, notifications:true },
    screentime:{ todayMin:18, weekMin:160 } },
  { id:"clock", name:"時計", system:false,
    permissions:{ camera:false, mic:false, location:false, notifications:true },
    screentime:{ todayMin:1, weekMin:12 } },
  { id:"calendar", name:"カレンダー", system:false,
    permissions:{ camera:false, mic:false, location:false, notifications:true },
    screentime:{ todayMin:2, weekMin:30 } },
  { id:"files", name:"ファイル", system:false,
    permissions:{ camera:false, mic:false, location:false, notifications:false },
    screentime:{ todayMin:3, weekMin:26 } },
  { id:"notes", name:"メモ", system:false,
    permissions:{ camera:false, mic:false, location:false, notifications:true },
    screentime:{ todayMin:4, weekMin:40 } },
  { id:"weather", name:"天気", system:false,
    permissions:{ camera:false, mic:false, location:true, notifications:true },
    screentime:{ todayMin:2, weekMin:20 } }
  ];
  return {
    all: () => data,
    byId: id => data.find(x => x.id === id),
    addMany: items => { data.push(...items); }
  };
})();

/* ========= アプリ一覧/詳細 ========= */
function renderAppList(){
  const listEl = document.getElementById("appList");
  if(!listEl) return;
  const showSys = document.getElementById("showSystem")?.checked;
  const q = (document.getElementById("appSearch")?.value || "").trim().toLowerCase();

  const apps = Apps.all().filter(a => (showSys || !a.system))
    .filter(a => a.name.toLowerCase().includes(q));

  const sumEl = document.getElementById("appSummary");
  if(sumEl){
    const total = apps.length;
    const sys = apps.filter(a => a.system).length;
    sumEl.innerHTML = `<div><strong>${total}</strong> 件表示（システム: ${sys}）</div>
      <div class="help">クリックで詳細へ。剥奪/付与、スクリーンタイム確認ができます。</div>`;
  }

  listEl.innerHTML = "";
  apps.forEach(a => {
    const row = document.createElement("div");
    row.className = "row app-row";
    row.dataset.id = a.id;
    row.tabIndex = 0;
    row.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <div class="app-icon" aria-hidden="true">${(a.name[0]||"?")}</div>
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
function bindAppsPage(){
  const list = document.getElementById("appList");
  const s = document.getElementById("appSearch");
  const c = document.getElementById("showSystem");
  const debounce = (fn, d=160) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), d); }; };
  if(s) s.addEventListener("input", debounce(renderAppList, 160));
  if(c) c.addEventListener("change", renderAppList);
  if(list && !list.__bound){
    list.addEventListener("click", e => {
      const row = e.target.closest(".app-row[data-id]");
      if(row) openAppDetail(row.dataset.id);
    });
    list.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        const row = e.target.closest(".app-row[data-id]");
        if(row) openAppDetail(row.dataset.id);
      }
    });
    list.__bound = true;
  }
  renderAppList();
}
function openAppDetail(id){
  try{
    const a = Apps.byId(id);
    if(!a){ alert(`アプリが見つかりません: ${id}`); return; }

    document.getElementById("appTitle").textContent = a.name;
    document.getElementById("appMeta").innerHTML = `
      <div class="grid">
        <div><strong>ID</strong><div class="help">${a.id}</div></div>
        <div><strong>種別</strong><div class="help">${a.system ? "システム" : "ユーザー"}</div></div>
      </div>`;

    const perms = a.permissions || {};
    const toBadge = (k,v)=>`<span class="badge" style="margin-right:6px">${k}:${v?"許可":"拒否"}</span>`;
    document.getElementById("appPermissions").innerHTML =
      Object.keys(perms).map(k=>toBadge(k,perms[k])).join("") || "<div class='help'>権限情報なし</div>";

    const today = a.screentime?.todayMin ?? 0;
    const week  = a.screentime?.weekMin  ?? 0;
    document.getElementById("stToday").textContent = `${today}分`;
    const pct = Math.min(100, Math.round(week / 840 * 100));
    document.getElementById("stWeekBar").style.width = pct + "%";
    document.getElementById("stWeekNote").textContent = `直近7日: ${week}分（目安比 ${pct}%）`;

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

    show("app-detail"); highlight("apps");
    history.pushState(null, "", `#app-${id}`);
    document.getElementById("appTitle")?.focus();
  }catch(err){
    console.error(err);
    alert("詳細の描画中にエラーが発生しました（コンソールを確認）");
  }
}

/* ========= システム ========= */
function bindSystem(){
  // 言語
  const langSel = document.getElementById("lang");
  if(langSel){
    langSel.value = Store.get("lang") || "ja";
    langSel.addEventListener("change", () => {
      Store.set("lang", langSel.value);
      document.documentElement.setAttribute("lang", langSel.value);
      alert(`表示言語を ${langSel.options[langSel.selectedIndex].text} に設定しました（モック）`);
    });
    document.documentElement.setAttribute("lang", langSel.value);
  }
  // OSアップデート（モック）
  const osStatus = document.getElementById("osStatus");
  const btnUpdate = document.getElementById("btnUpdateCheck");
  if(btnUpdate && osStatus){
    btnUpdate.addEventListener("click", () => {
      osStatus.textContent = "確認中…";
      setTimeout(() => {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2,"0");
        const mm = String(now.getMinutes()).padStart(2,"0");
        osStatus.textContent = `最新の状態です（最終確認 ${hh}:${mm}）`;
      }, 800);
    });
  }
  // IME
  const imeSel = document.getElementById("ime");
  if(imeSel){
    imeSel.value = Store.get("ime") || "jp";
    imeSel.addEventListener("change", () => {
      Store.set("ime", imeSel.value);
      alert(`入力方法を変更しました（${imeSel.options[imeSel.selectedIndex].text} / モック）`);
    });
  }
  // 時刻・日付
  const tzSel = document.getElementById("tz");
  const nowLabel = document.getElementById("nowTime");
  if(tzSel) tzSel.value = Store.get("tz") || "Asia/Tokyo";

  function tick(){
    if(!nowLabel) return;
    const tz = (tzSel?.value) || "Asia/Tokyo";
    const fmt = new Intl.DateTimeFormat('ja-JP', {
      timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', second:'2-digit', weekday:'short'
    });
    nowLabel.textContent = fmt.format(new Date());
  }
  clearInterval(window.__clockTimer);
  window.__clockTimer = setInterval(tick, 1000);
  tick();
  tzSel?.addEventListener("change", () => { Store.set("tz", tzSel.value); tick(); });

  // NTP（モック）
  const ntpInput = document.getElementById("ntpServer");
  const btnNTP = document.getElementById("btnNTP");
  btnNTP?.addEventListener("click", () => {
    const server = ntpInput?.value?.trim() || "pool.ntp.org";
    tick();
    alert(`NTPサーバー ${server} と同期しました（モック）`);
  });

  // リセット群
  const ask = (msg, fn) => { if(confirm(msg)) fn(); };
  document.getElementById("btnResetNet")?.addEventListener("click", () => {
    ask("ネットワーク設定をリセットしますか？（モック）", () => {
      Store.set("wifi", true); Store.set("bt", true); Store.set("nearby", false);
      alert("ネットワーク設定をリセットしました（モック）");
    });
  });
  document.getElementById("btnResetAll")?.addEventListener("click", () => {
    ask("すべての設定をリセットしますか？（データは保持 / モック）", () => {
      const d = Store.def;
      Object.keys(d).forEach(k => Store.set(k, d[k]));
      document.body.classList.toggle("theme-dark", !!Store.get("darkmode"));
      alert("すべての設定を既定値に戻しました（モック）");
      tick();
    });
  });
  document.getElementById("btnFactory")?.addEventListener("click", () => {
    ask("工場出荷状態に初期化しますか？（モック）", () => {
      localStorage.clear();
      alert("初期化しました（モック）。ページを再読み込みしてください。");
    });
  });
}

/* ========= 初期化 ========= */
document.addEventListener("DOMContentLoaded", () => {
  bindMenu(); bindSearch(); bindToggles(); bindDisplay(); bindStorage();
  bindMobile(); bindAppsPage(); bindSystem();startUptimeTimer();

  window.addEventListener("popstate", routeFromHash);
  // Escで詳細→一覧へ（任意）
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !document.querySelector('[data-page="app-detail"]').hidden) {
      show("apps"); highlight("apps"); history.pushState(null, "", "#apps");
    }
  });
  routeFromHash();
});
/* ========= 端末情報 ========= */
function bindAbout(){
  // デバイス名編集
  const nameEl = document.getElementById("deviceName");
  document.getElementById("btnRename")?.addEventListener("click", () => {
    const next = prompt("デバイス名を入力", nameEl.textContent || "Yonyon Device");
    if(next && next.trim()){
      nameEl.textContent = next.trim();
      alert("デバイス名を変更しました（モック）");
    }
  });

  // バッテリー（ゆっくり減るモック）
  const bat = document.getElementById("batteryPct");
  if(bat){
    let level = 96 + Math.random()*4; // 96〜100で開始
    clearInterval(window.__batTimer);
    window.__batTimer = setInterval(() => {
      level = Math.max(0, level - 0.05); // 5分で約15%減ペース（見た目用）
      bat.textContent = Math.round(level) + "%";
    }, 1000);
  }

 /* ==== 起動時間（2時間13分スタート、毎秒更新） ==== */
// 2時間13分 = 2*3600 + 13*60 = 7,980 秒
const UPTIME_START_SEC = 2 * 3600 + 13 * 60;
// 「今この瞬間に開いたとしても 2:13:00 経過している」ように見せるため、
// 壁時計から逆算した開始時刻を作る
let __uptimeEpochMs = Date.now() - UPTIME_START_SEC * 1000;

function startUptimeTimer(){
  const el = document.getElementById("uptime");
  if(!el) return;

  const fmt = (sec) => {
    const d = Math.floor(sec / 86400); sec %= 86400;
    const h = Math.floor(sec / 3600);  sec %= 3600;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (d > 0) return `${d}日${h}時間${m}分${s}秒`;
    if (h > 0) return `${h}時間${m}分${s}秒`;
    if (m > 0) return `${m}分${s}秒`;
    return `${s}秒`;
  };

  const tick = () => {
    const sec = Math.max(0, Math.floor((Date.now() - __uptimeEpochMs) / 1000));
    el.textContent = fmt(sec);
  };

  clearInterval(window.__uptimeTimer);
  window.__uptimeTimer = setInterval(tick, 1000);
  tick(); // 初回反映
}

  // ビルド番号 → 開発者モード（7回）
  const buildRow = document.getElementById("buildRow");
  const devHint = document.getElementById("devHint");
  let tap = 0;
  buildRow?.addEventListener("click", () => {
    tap++;
    if(tap >= 7){
      devHint.hidden = false;
      // 保存してもOK
      try{ Store.set("devMode", true); }catch{}
    }
  });

  // 法的情報（Regulatory / Legal）モーダル
  const modal = document.getElementById("legalModal");
  const title = document.getElementById("legalDocTitle");
  const body  = document.getElementById("legalDocBody");
  const openLegal = (kind) => {
    const docs = {
      regulatory: {
        title: "Regulatory Notice",
        text:
`本端末は各国/地域の無線規制に準拠しています（モック）。
・技適/JATE 相当の表示
・FCC ID: 2ABCD-MOCK123（架空）
・CE／UKCA 等の準拠マーク（イメージ）`
      },
      license: {
        title: "Licenses (Open-source / Third-party)",
        text:
`この端末には次のオープンソース・ソフトウェアが含まれます（モック）。
・ExampleLib 1.2（MIT）
・FooBar Core（Apache-2.0）
・Baz UI（BSD-3）

全文は設定アプリ内に同梱された LICENSES.txt を参照（モック）。`
      },
      warranty: {
        title: "Warranty（保証・重要事項）",
        text:
`保証は購入日から1年間（モック）。水没/改造/不適切な使用は保証対象外。
バッテリーは消耗品であり経年劣化は保証対象外（モック）。`
      },
      rf: {
        title: "RF Exposure（電波暴露）",
        text:
`本端末は人体への電波暴露ガイドラインに適合（モック）。
・最大SAR： 頭部 0.70 W/kg、身体 0.85 W/kg（10g, 架空）
・使用時は金属アクセサリを端末から離して利用してください（モック）。`
      }
    };
    const d = docs[kind] || {title:"Document", text:"(no data)"};
    title.textContent = d.title;
    body.textContent = d.text;
    modal.hidden = false;
  };

  document.querySelectorAll('button[data-legal]')?.forEach(b=>{
    b.addEventListener('click', () => openLegal(b.dataset.legal));
  });
  document.getElementById("legalClose")?.addEventListener("click", ()=> modal.hidden = true);
  modal?.addEventListener("click", (e)=>{ if(e.target === modal) modal.hidden = true; });
}
/* ====== 端末情報：安全なイベント委譲（開く／変更） ====== */
// 1) モーダル開閉のユーティリティ（なければ定義、あれば既存を優先）
window.openLegal = window.openLegal || function(kind){
  const modal = document.getElementById("legalModal");
  const title = document.getElementById("legalDocTitle");
  const body  = document.getElementById("legalDocBody");
  if (!modal || !title || !body) return;

  const DOCS = {
    regulatory:{ title:"Regulatory Notice", text:
`本端末は各国/地域の無線規制に準拠しています（モック）。
・技適/JATE 相当
・FCC ID: 2ABCD-MOCK123（架空）
・CE/UKCA 等（イメージ）`},
    license:{ title:"Licenses (Open-source / Third-party)", text:
`OSS/サードパーティのライセンス情報（モック）。
・ExampleLib (MIT)
・FooBar (Apache-2.0)
・Baz UI (BSD-3)`},
    warranty:{ title:"Warranty（保証）", text:
`保証は購入日から1年（モック）。水没/改造/不適切使用は対象外。`},
    rf:{ title:"RF Exposure（電波暴露）", text:
`本端末は電波暴露ガイドラインに適合（モック）。
最大SAR: 頭部0.70 / 身体0.85 W/kg（10g, 架空）`}
  };
  const d = DOCS[kind] || {title:"Document", text:""};
  title.textContent = d.title;
  body.textContent  = d.text;
  modal.hidden = false;
};
window.closeLegal = window.closeLegal || function(){
  const modal = document.getElementById("legalModal");
  if (modal) modal.hidden = true;
};

// 2) ドキュメント全体でクリックを拾う（後からDOMが変わっても効く）
document.addEventListener("click", (e) => {
  const legalBtn = e.target.closest("button[data-legal]");
  if (legalBtn) {
    e.preventDefault();
    openLegal(legalBtn.dataset.legal);
    return;
  }

  if (e.target.closest("#legalClose")) {
    e.preventDefault();
    closeLegal();
    return;
  }

  const renameBtn = e.target.closest("#btnRename");
  if (renameBtn) {
    e.preventDefault();
    const nameEl = document.getElementById("deviceName");
    const next = prompt("デバイス名を入力", nameEl?.textContent || "Yonyon Device");
    if (next && next.trim()) {
      if (nameEl) nameEl.textContent = next.trim();
      alert("デバイス名を変更しました（モック）");
    }
  }
});

// 3) モーダルの外側クリック・Escで閉じる
document.getElementById("legalModal")?.addEventListener("click", (e) => {
  if (e.target.id === "legalModal") closeLegal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLegal();
});
/* ====== 端末情報：イベントハンドラ ====== */

// ドキュメントのクリックを横取りして「開く」「閉じる」「変更」を処理
document.addEventListener("click", (e) => {
  // --- 法的文書を開く ---
  const legalBtn = e.target.closest("button[data-legal]");
  if (legalBtn) {
    e.preventDefault();
    openLegal(legalBtn.dataset.legal);
    return;
  }

  // --- 法的モーダルを閉じる ---
  if (e.target.closest("#legalClose")) {
    e.preventDefault();
    closeLegal();
    return;
  }

  // --- デバイス名を変更 ---
  if (e.target.closest("#btnRename")) {
    e.preventDefault();
    const nameEl = document.getElementById("deviceName");
    const next = prompt("デバイス名を入力", nameEl?.textContent || "Yonyon Device");
    if (next && next.trim()) {
      if (nameEl) nameEl.textContent = next.trim();
      alert("デバイス名を変更しました（モック）");
    }
    return;
  }
});

// モーダル外クリックやEscキーで閉じる
document.getElementById("legalModal")?.addEventListener("click", (e) => {
  if (e.target.id === "legalModal") closeLegal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLegal();
});

// モーダル開閉用関数（未定義なら補完）
window.openLegal = window.openLegal || function(kind){
  const modal = document.getElementById("legalModal");
  const title = document.getElementById("legalDocTitle");
  const body  = document.getElementById("legalDocBody");
  if (!modal || !title || !body) return;

  const DOCS = {
    regulatory:{ title:"Regulatory Notice", text:"規制に関する案内（モック）" },
    license:{ title:"Licenses", text:"OSS/サードパーティライセンス一覧（モック）" },
    warranty:{ title:"Warranty", text:"保証情報（モック）" },
    rf:{ title:"RF Exposure", text:"電波暴露に関する説明（モック）" }
  };
  const d = DOCS[kind] || {title:"Document", text:""};
  title.textContent = d.title;
  body.textContent  = d.text;
  modal.hidden = false;
};
window.closeLegal = window.closeLegal || function(){
  const modal = document.getElementById("legalModal");
  if (modal) modal.hidden = true;
};

// =====================================================================
// Yes4All Sales Dashboard — v3 modules (loaded after v2.js)
//   · Product Performance BI charts
//   · Tracking: live race
// =====================================================================
(function(){
'use strict';
const V3 = window.V3 = {};
const H = () => window.V2.h;

// ------------------------------------------------------------------ CSS
const css = document.createElement('style');
css.textContent = `
.chat-fab{position:fixed;right:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:250;background:var(--navy);color:#fff;border:0;border-radius:999px;padding:12px 18px;font:700 13px Calibri, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif;box-shadow:0 10px 26px rgba(0,40,89,.35);cursor:pointer;display:flex;gap:8px;align-items:center}
[hidden]{display:none !important}
.chat-fab .dot{width:9px;height:9px;border-radius:50%;background:var(--orange)}
.chat-panel{position:fixed;right:20px;bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:251;width:410px;max-width:calc(100vw - 32px);height:600px;max-height:calc(100vh - 120px);background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 18px 48px rgba(0,40,89,.28);display:flex;flex-direction:column;overflow:hidden}
.chat-panel header{background:var(--navy);color:#fff;padding:11px 14px;display:flex;align-items:center;gap:8px;box-shadow:none}
.chat-panel header b{font-size:13.5px}.chat-panel header .who{font-size:11px;color:#B9C6D6;margin-left:auto}
.chat-panel header button{border:0;background:rgba(255,255,255,.15);color:#fff;border-radius:8px;padding:4px 8px;cursor:pointer;font-size:12px}
.chat-body{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:9px;background:#F6F7F8}
.chat-msg{max-width:88%;padding:8px 11px;border-radius:12px;font-size:12.6px;line-height:1.5;word-wrap:break-word}
.chat-msg.user{align-self:flex-end;background:var(--orange);color:#fff;border-bottom-right-radius:4px;white-space:pre-wrap}
.chat-msg.ai{align-self:flex-start;background:#fff;border:1px solid var(--line);border-bottom-left-radius:4px}
.chat-msg.ai table{border-collapse:collapse;margin:6px 0;font-size:11.5px}.chat-msg.ai th,.chat-msg.ai td{border:1px solid var(--line);padding:3px 6px;position:static;background:#fff;color:var(--ink);white-space:nowrap;text-transform:none;letter-spacing:0;font-size:11.5px}
.chat-msg.ai th{background:#F1F3F6;font-weight:700}
.chat-msg.ai ul{margin:4px 0;padding-left:18px}.chat-msg.ai code{background:#F1F3F6;border-radius:4px;padding:0 4px;font-size:11px}
.chat-msg details{margin-top:6px;font-size:11px;color:var(--muted)}.chat-msg details pre{white-space:pre-wrap;background:#F6F7F8;border-radius:6px;padding:6px;font-size:10.5px;max-height:160px;overflow:auto}
.chat-suggest{display:flex;flex-wrap:wrap;gap:6px}.chat-suggest button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:5px 10px;font-size:11.5px;cursor:pointer;font-family:inherit;text-align:left}
.chat-suggest button:hover{border-color:var(--orange)}
.chat-input{display:flex;gap:8px;padding:10px;border-top:1px solid var(--line);background:#fff}
.chat-input textarea{flex:1;resize:none;height:44px;border:1px solid var(--line);border-radius:10px;padding:8px 10px;font:12.6px Calibri, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif}
.chat-input button{border:0;background:var(--orange);color:#fff;border-radius:10px;padding:0 14px;font-weight:700;cursor:pointer}
.chat-gate{padding:18px;display:flex;flex-direction:column;gap:10px;font-size:12.5px}
.chat-gate input,.chat-gate select{border:1px solid var(--line);border-radius:8px;padding:8px 10px;font:13px Calibri, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif;width:100%}
.typing{align-self:flex-start;color:var(--muted);font-size:12px;font-style:italic}
.wf-note{font-size:11.5px;color:var(--muted)}
.calc-grid{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,8fr);gap:14px}
@media (max-width:1000px){.calc-grid{grid-template-columns:minmax(0,1fr)}}
.calc-in{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.calc-in .fld{display:flex;flex-direction:column;gap:3px}.calc-in label{font-size:10.5px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.4px}
.calc-in input,.calc-in select{border:1px solid var(--line);border-radius:8px;padding:7px 9px;font:12.5px Calibri, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif;width:100%}
.cost-tbl td{padding:4px 8px;font-size:12px}.cost-tbl td.n{text-align:right;font-variant-numeric:tabular-nums}
.proj-quick textarea{width:100%;min-height:110px;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font:12.8px Calibri, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif;resize:vertical}
.pparse{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.pparse span{background:#F1F3F6;border-radius:8px;padding:4px 9px;font-size:11.8px}.pparse span b{color:var(--navy)}
.pst{font-size:10.5px;font-weight:800;border-radius:20px;padding:2px 9px;white-space:nowrap}
.pst.Done{background:var(--green-bg);color:var(--green)}.pst.Issue{background:var(--red-bg);color:var(--red)}.pst.Pending{background:var(--amber-bg);color:var(--amber)}.pst.Planned{background:#EEF1F5;color:var(--muted)}.pst.In-progress{background:#E6EEFB;color:#1F5FBF}.rs-src{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 10px}.rs-src .s{background:#F4F6F9;border:1px solid var(--line);border-radius:10px;padding:6px 10px;font-size:11.8px;line-height:1.35}.rs-src .s b{color:var(--navy)}
.rs-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:4px 0 12px}.rs-bar select,.rs-bar input{border:1px solid var(--line);border-radius:8px;padding:6px 9px;font-family:inherit;font-size:12.5px}.rs-bar input{min-width:220px;flex:1;max-width:340px}
.rs-grp{margin:2px 0}.rs-grp>summary{cursor:pointer;list-style:none}.rs-grp>summary::before{content:'▸ ';color:var(--muted)}.rs-grp[open]>summary::before{content:'▾ '}
.rs-sec{margin:12px 0 6px;font-size:12px;font-weight:800;color:var(--navy);text-transform:uppercase;letter-spacing:.3px;border-bottom:1px solid var(--line);padding-bottom:4px}
.rs-ins{border:1px solid var(--line);border-radius:10px;padding:9px 12px;margin:7px 0;background:#fff}.rs-ins .lb{font-weight:800;color:var(--ink);font-size:12.5px;margin-bottom:3px}.rs-ins .tx{font-size:12.8px;line-height:1.55;white-space:pre-wrap;color:#2B3440}
.rs-ins .tx.clip{max-height:9.5em;overflow:hidden;-webkit-mask-image:linear-gradient(#000 70%,transparent)}.rs-more{border:0;background:none;color:var(--orange);font-weight:700;cursor:pointer;padding:2px 0;font-family:inherit;font-size:12px}
.rs-tbl{border:1px solid var(--line);border-radius:10px;margin:7px 0;background:#fff}.rs-tbl>summary{cursor:pointer;padding:9px 12px;font-weight:700;font-size:12.8px;list-style:none;display:flex;gap:8px;align-items:center}
.rs-tbl>summary::before{content:'▸';color:var(--muted)}.rs-tbl[open]>summary::before{content:'▾'}.rs-tbl>summary .n{margin-left:auto;font-weight:600;color:var(--muted);font-size:11.5px;white-space:nowrap}
.rs-tw{overflow:auto;max-height:440px;border-top:1px solid var(--line)}.rs-tw table{border-collapse:collapse;width:100%;font-size:12px}.rs-tw th{position:sticky;top:0;background:#F4F6F9;text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);white-space:nowrap;font-weight:800;color:var(--navy)}
.rs-tw td{padding:5px 8px;border-bottom:1px solid #EEF0F3;vertical-align:top;white-space:normal;min-width:56px;max-width:340px;overflow-wrap:anywhere}.rs-tw td.num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.rs-empty{color:var(--muted);padding:10px 2px}

.live{--bg:#0B1220;--bg2:#121B2E;--ink:#E8EEF7;--mute:#8A97AD;--line:#223049;--gmv:#d95926;--gmv2:#FF8A3D;--mkt:#3987e5;--ok:#199e70;
  background:radial-gradient(120% 140% at 0% 0%,#16223B 0%,var(--bg) 55%,#070C16 100%);color:var(--ink);border-radius:18px;padding:18px 20px 16px;margin:0 0 18px;box-shadow:0 18px 40px rgba(7,12,22,.35);border:1px solid #1C2840;position:relative;overflow:hidden}
.live:before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.018) 0 1px,transparent 1px 64px);pointer-events:none}
.live-h{display:flex;align-items:center;gap:12px;flex-wrap:wrap;position:relative}
.live-h h2{margin:0;font-size:17px;letter-spacing:.6px;font-weight:900;text-transform:uppercase}
.live-h h2 em{font-style:normal;color:var(--gmv2)}
.live-dot{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;color:#FF6B5B;letter-spacing:1px}
.live-dot:before{content:'';width:8px;height:8px;border-radius:50%;background:#FF4D3A;box-shadow:0 0 0 0 rgba(255,77,58,.7);animation:livePulse 1.6s infinite}
@keyframes livePulse{0%{box-shadow:0 0 0 0 rgba(255,77,58,.6)}70%{box-shadow:0 0 0 9px rgba(255,77,58,0)}100%{box-shadow:0 0 0 0 rgba(255,77,58,0)}}
.live-sub{color:var(--mute);font-size:12px}
.live-ctl{margin-left:auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.live-ctl select,.live-ctl button{background:#16213A;color:var(--ink);border:1px solid #2A3A5A;border-radius:9px;padding:6px 10px;font-family:inherit;font-size:12px;cursor:pointer}
.live-ctl button.on{background:var(--gmv);border-color:var(--gmv);color:#fff}
.live-ctl button:focus-visible,.live-ctl select:focus-visible{outline:2px solid var(--gmv2);outline-offset:2px}
.live-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:14px 0 6px;position:relative}
.live-k{background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.live-k .k{font-size:10.5px;color:var(--mute);font-weight:800;letter-spacing:.6px;text-transform:uppercase}
.live-k .v{font-size:22px;font-weight:900;margin-top:2px;font-variant-numeric:tabular-nums}
.live-k .v.gmv{color:var(--gmv2);font-size:28px;text-shadow:0 0 18px rgba(255,138,61,.35)}
.live-k .d{font-size:11.5px;color:var(--mute);margin-top:2px}.live-k .d b.up{color:#3FD39B}.live-k .d b.dn{color:#FF7A6B}
.live-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:14px;position:relative}
.live-card{background:rgba(255,255,255,.025);border:1px solid var(--line);border-radius:14px;padding:12px 14px}
.live-card h3{margin:0 0 2px;font-size:13px;font-weight:800;color:var(--ink)}.live-card .hint{color:var(--mute);font-size:11.5px;margin-bottom:8px}
.lane{display:grid;grid-template-columns:150px minmax(0,1fr) 128px;gap:10px;align-items:center;padding:7px 0;border-bottom:1px dashed #1E2B44}
.lane:last-child{border-bottom:0}
.lane .nm{font-weight:800;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lane .nm small{display:block;color:var(--mute);font-weight:600;font-size:10.5px}
.track{position:relative;height:26px;border-radius:13px;background:linear-gradient(90deg,#0F1729,#152038);border:1px solid #22314F;overflow:visible}
.track .fill{position:absolute;left:0;top:0;bottom:0;border-radius:13px;background:linear-gradient(90deg,rgba(217,89,38,.25),var(--gmv) 70%,var(--gmv2));transition:width .55s cubic-bezier(.2,.8,.2,1);max-width:100%}
.track .runner{position:absolute;top:50%;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:#fff;color:#0B1220;font-weight:900;font-size:11px;display:grid;place-items:center;box-shadow:0 0 0 3px var(--gmv),0 0 16px rgba(255,138,61,.65);transition:left .55s cubic-bezier(.2,.8,.2,1);z-index:2}
.lane.lead .runner{box-shadow:0 0 0 3px #F5C542,0 0 22px rgba(245,197,66,.85)}
.track .pace{position:absolute;top:-4px;bottom:-4px;width:2px;background:#9FB3D1;opacity:.75;border-radius:2px;z-index:1}
.track .flag{position:absolute;right:-2px;top:-9px;font-size:13px}
.lane .num{text-align:right;font-variant-numeric:tabular-nums}.lane .num b{font-size:14px}.lane .num small{display:block;color:var(--mute);font-size:10.5px}
.live-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px;position:relative}
.live .plot{height:300px}.live .plot.sm{height:330px}
.live-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:11px;color:var(--mute);margin-top:6px}.live-legend span:before{content:'';display:inline-block;width:14px;height:3px;border-radius:2px;margin-right:5px;vertical-align:middle;background:var(--c)}
.live-empty{color:var(--mute);padding:18px 4px}
.live-clock{display:flex;flex-direction:column;align-items:flex-start;line-height:1.1;padding:4px 12px;border-left:1px solid #2A3A5A;margin-left:4px}
.live-clock .ck-t{font-size:20px;font-weight:900;font-variant-numeric:tabular-nums;color:#fff;letter-spacing:.5px}.live-clock .ck-t small{font-size:12px;color:var(--mute);font-weight:700}
.live-clock .ck-z{font-size:10.5px;color:#7FB2F0;font-weight:800;letter-spacing:.4px}.live-clock .ck-s{font-size:10px;color:var(--mute)}
.live-clock .ck-t:before{content:'🇺🇸 ';font-size:13px}
.live .seg{display:inline-flex;border:1px solid #2A3A5A;border-radius:9px;overflow:hidden}.live .seg button{border:0;border-radius:0;background:#16213A}.live .seg button+button{border-left:1px solid #2A3A5A}
.live .seg button.on{background:var(--gmv);color:#fff}
.live>.live-sub{margin-top:6px;position:relative}
@media (max-width:900px){.live-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.live-grid,.live-row{grid-template-columns:1fr}.lane{grid-template-columns:96px minmax(0,1fr) 92px}}
@media (prefers-reduced-motion:reduce){.track .fill,.track .runner{transition:none}.live-dot:before{animation:none}}
`;
document.head.appendChild(css);

// =====================================================================
// Product Performance: BI charts
// =====================================================================
let perfToken = 0;

// =====================================================================
// Product Performance: period filter (whole tab follows it)
// =====================================================================
const PP = {preset:'30d', from:'', to:'', key:'', data:null, loading:null};
const PP_PRESETS = [['7d', '7 ngày'], ['30d', '30 ngày'], ['90d', '90 ngày'], ['mtd', 'Tháng gần nhất'], ['lm', 'Tháng trước đó'], ['ytd', 'Từ đầu năm'], ['custom', 'Tùy chọn']];
function ppMax(){ return (window.V2 && V2.state && V2.state.maxDate) || DATA.asOfDate || todayISO(); }
function ppRange(){
  const h = H(), mx = ppMax();
  const first = mx.slice(0, 8) + '01';
  switch(PP.preset){
    case '7d': return [addDaysIso(mx, -6), mx];
    case '90d': return [addDaysIso(mx, -89), mx];
    case 'mtd': return [first, mx];
    case 'lm': { const f = h.addMonths(first, -1); return [f, addDaysIso(first, -1)]; }
    case 'ytd': return [mx.slice(0, 4) + '-01-01', mx];
    case 'custom': return [PP.from || addDaysIso(mx, -29), PP.to || mx];
    default: return [addDaysIso(mx, -29), mx];
  }
}
V3.perfLabel = function(){ const [f, t] = ppRange(); return H().dm(f) + ' → ' + H().dm(t); };
function ppBar(){
  const bar = document.getElementById('perfPeriodBar'); if(!bar) return;
  const h = H(); const [f, t] = ppRange(); const mx = ppMax();
  if(!bar.dataset.built){
    bar.dataset.built = '1';
    bar.innerHTML = `<div class="fld"><label>Kỳ phân tích</label><div class="cv-toggle" id="ppPresets">${PP_PRESETS.map(([k, l]) => `<button class="cv-btn" type="button" data-p="${k}">${l}</button>`).join('')}</div></div>
      <div class="fld"><label>Từ</label><input type="date" id="ppFrom"></div><div class="fld"><label>Đến</label><input type="date" id="ppTo"></div>
      <span class="result-count" id="ppInfo"></span>`;
    bar.querySelector('#ppPresets').onclick = e => { const b = e.target.closest('[data-p]'); if(!b) return; PP.preset = b.dataset.p; if(PP.preset === 'custom'){ const [a, z] = ppRange(); PP.from = a; PP.to = z; } renderPerfTab(); };
    const onDate = () => { PP.preset = 'custom'; PP.from = bar.querySelector('#ppFrom').value; PP.to = bar.querySelector('#ppTo').value; if(PP.from && PP.to && PP.from > PP.to){ const x = PP.from; PP.from = PP.to; PP.to = x; } renderPerfTab(); };
    bar.querySelector('#ppFrom').onchange = onDate; bar.querySelector('#ppTo').onchange = onDate;
  }
  bar.querySelectorAll('#ppPresets .cv-btn').forEach(b => b.classList.toggle('active', b.dataset.p === PP.preset));
  const fi = bar.querySelector('#ppFrom'), ti = bar.querySelector('#ppTo');
  fi.value = f; ti.value = t; fi.max = mx; ti.max = mx;
  const n = Math.round((new Date(t) - new Date(f)) / 864e5) + 1;
  bar.querySelector('#ppInfo').innerHTML = PP.loading ? 'Đang tải số liệu…' : `${h.dm(f)} → ${h.dm(t)} · ${n} ngày · so với cùng kỳ năm trước · data tới ${h.dm(mx)}`;
}
// true while the period's numbers are being fetched (renderPerfTab waits and is called again)
V3.perfEnsure = function(){
  const h = H(); const [f, t] = ppRange(); const key = f + '|' + t;
  if(PP.key === key && PP.data){ ppBar(); return false; }
  if(PP.loading === key){ ppBar(); return true; }
  PP.loading = key; PP.key = key; PP.data = null; ppBar();
  const ly = d => h.addMonths(d, -12);
  Promise.all([
    h.rpcAll('sales_by_sku', {p_from:f, p_to:t}), h.rpcAll('sales_by_sku', {p_from:ly(f), p_to:ly(t)}),
    h.rpcAll('sales_by_sku', {p_from:addDaysIso(t, -6), p_to:t}), h.rpcAll('sales_by_sku', {p_from:addDaysIso(t, -13), p_to:addDaysIso(t, -7)}),
  ]).then(([cur, lyr, w1, w2]) => {
    if(PP.loading !== key) return;
    const m = a => new Map(a.map(r => [r.sku, r]));
    PP.data = {cur:m(cur), ly:m(lyr), w1:m(w1), w2:m(w2), from:f, to:t};
  }).catch(e => { console.warn(e); PP.data = {cur:new Map(), ly:new Map(), w1:new Map(), w2:new Map(), from:f, to:t, error:e}; })
    .finally(() => { if(PP.loading === key){ PP.loading = null; renderPerfTab(); } });
  return true;
};
V3.perfApply = function(rows){
  const d = PP.data; if(!d) return rows;
  return rows.map(r => {
    const c = d.cur.get(r.sku) || {}, a = d.w1.get(r.sku), b = d.w2.get(r.sku), l = d.ly.get(r.sku);
    const gmv = +c.gmv || 0, ads = +c.ads || 0, promo = +c.promo || 0;
    const t7 = +(a && a.gmv) || 0, p7 = +(b && b.gmv) || 0;
    let trendPct = null, trendLabel = 'N/A';
    if(a || b){
      if(p7 > 0){ trendPct = +((t7 - p7) / p7 * 100).toFixed(1); trendLabel = trendPct >= 15 ? 'Growing' : trendPct <= -15 ? 'Declining' : 'Stable'; }
      else if(t7 > 0){ trendPct = Infinity; trendLabel = 'Growing'; }
      else { trendPct = 0; trendLabel = 'Stable'; }
    }
    return Object.assign({}, r, {actualGMV:gmv, actualUnits:+c.units || 0, adsActual:ads, promoActual:promo, mktActual:ads + promo,
      trailing7Gmv:t7, prior7Gmv:p7, trendPct, trendLabel, lyGMV:+(l && l.gmv) || 0, lyUnits:+(l && l.units) || 0});
  });
};

V3.renderPerfCharts = async function(rows){
  const h = H(); const host = document.getElementById('perfV3'); if(!host || typeof Plotly === 'undefined') return;
  if(!host.dataset.built){
    host.dataset.built = '1';
    host.innerHTML = `<div class="tiles" id="pvTiles"></div>
      <div class="grid2"><div class="card" style="margin:0"><h3 style="margin:0 0 3px">CM3 vs GMV</h3><div class="hint">Mỗi chấm là một SKU, số liệu của kỳ đang chọn. Kích thước = MKT fee, màu = CM3 %. Dưới đường 0 = đang lỗ sau marketing.</div><div id="pvCm3" class="plot tall"></div></div>
        <div class="card" style="margin:0"><h3 style="margin:0 0 3px">Tăng trưởng GMV so với cùng kỳ năm trước</h3><div class="hint">25 SKU thay đổi GMV lớn nhất (theo $). Vạch giữa là 0%: bên phải tăng, bên trái giảm.</div><div id="pvYoy" class="plot tall"></div></div></div>
      <div class="grid2" style="margin-top:14px"><div class="card" style="margin:0"><h3 style="margin:0 0 3px">%MKT/GMV vs CM3 % · tìm SKU “đốt tiền”</h3><div class="hint">Góc dưới-phải (vùng đỏ nhạt) = chi MKT cao hơn trung vị nhưng CM3 % thấp hơn trung vị.</div><div id="pvBurn" class="plot tall"></div></div>
        <div class="card" style="margin:0"><h3 style="margin:0 0 3px">SKU chi MKT cao, CM3 thấp</h3><div class="hint">Xếp theo MKT fee. Đề xuất xem lại bid/deal hoặc giá.</div><div class="tablewrap" style="max-height:420px"><table id="pvBurnTbl"></table></div></div></div>`;
  }
  const token = ++perfToken;
  const lyBy = PP.data ? PP.data.ly : new Map();
  if(token !== perfToken) return;
  const pts = rows.filter(r => r.actualGMV > 0 || (lyBy.get(r.sku) && +lyBy.get(r.sku).gmv > 0)).map(r => {
    const cm3 = h.isNum(r.cm3Base) ? r.actualUnits * r.cm3Base - (r.cm3Lane === 'SPT' ? 0 : r.adsActual * .985 + r.promoActual) : NaN;
    const lg = +(lyBy.get(r.sku) || {}).gmv || 0;
    return {sku:r.sku, name:r.productName || '', pl:r.mainPL, gmv:r.actualGMV, mkt:r.mktActual, cm3, cm3Pct: r.actualGMV ? cm3 / r.actualGMV : NaN, mktPct: r.actualGMV ? r.mktActual / r.actualGMV : NaN, ly:lg, yoy: lg ? r.actualGMV / lg - 1 : NaN, d: r.actualGMV - lg};
  });
  const tot = pts.reduce((a, p) => ({gmv:a.gmv + p.gmv, mkt:a.mkt + p.mkt, ly:a.ly + p.ly, cm3:a.cm3 + (h.isNum(p.cm3) ? p.cm3 : 0), cg:a.cg + (h.isNum(p.cm3) ? p.gmv : 0)}), {gmv:0, mkt:0, ly:0, cm3:0, cg:0});
  const grow = pts.filter(p => p.ly > 0 && p.d > 0).length, decl = pts.filter(p => p.ly > 0 && p.d < 0).length;
  document.getElementById('pvTiles').innerHTML = [['GMV ' + V3.perfLabel(), h.f$(tot.gmv), h.deltaHtml(tot.gmv, tot.ly) + '<span>vs LY</span>'], ['MKT fee', h.f$(tot.mkt), '<span>' + h.fP(h.div(tot.mkt, tot.gmv)) + ' GMV</span>'], ['CM3 ước tính', h.f$(tot.cm3), '<span>' + h.fP(h.div(tot.cm3, tot.cg)) + ' GMV có cost</span>'], ['SKU tăng / giảm YoY', grow + ' / ' + decl, '<span>có data năm trước</span>']]
    .map(([k, v, d]) => `<div class="tile"><div class="k">${k}</div><div class="v">${v}</div><div class="d">${d}</div></div>`).join('');
  // 1) CM3 vs GMV
  const c = pts.filter(p => h.isNum(p.cm3) && p.gmv >= 50); const mxM = Math.max(1, ...c.map(p => p.mkt)); const mxA = Math.min(.5, Math.max(.05, ...c.map(p => Math.abs(p.cm3Pct)).filter(h.isNum)));
  const top = [...c].sort((a, b) => b.gmv - a.gmv).slice(0, 6).map(p => p.sku);
  h.draw('pvCm3', [{type:'scatter', mode:'markers+text', x:c.map(p => p.gmv), y:c.map(p => p.cm3), text:c.map(p => top.includes(p.sku) ? p.sku : ''), textposition:'top center', textfont:{size:10, color:h.PAL.muted},
    marker:{size:c.map(p => 8 + 30 * Math.sqrt(Math.max(0, p.mkt) / mxM)), color:c.map(p => p.cm3Pct), colorscale:h.divScale, cmin:-mxA, cmax:mxA, cmid:0, opacity:.85, line:{width:1.4, color:'#fff'}, colorbar:{title:{text:'CM3 %', font:{size:10.5}}, tickformat:'.0%', thickness:10, len:.7, outlinewidth:0}},
    customdata:c.map(p => [p.sku, p.name.slice(0, 55), p.mkt, p.cm3Pct, p.pl]), hovertemplate:'<b>%{customdata[0]}</b> %{customdata[1]}<br>%{customdata[4]}<br>GMV %{x:$,.0f} · CM3 %{y:$,.0f} (%{customdata[3]:.1%})<br>MKT fee %{customdata[2]:$,.0f}<extra></extra>'}],
    h.lay({xaxis:h.ax({type:'log', tickprefix:'$', title:{text:'GMV (log)', font:{size:11}}}), yaxis:h.ax({tickprefix:'$', tickformat:'~s', title:{text:'CM3 $', font:{size:11}}}), shapes:[{type:'line', xref:'paper', yref:'y', x0:0, x1:1, y0:0, y1:0, line:{color:h.PAL.crit, width:1.3, dash:'dot'}}], margin:{l:60, r:8, t:8, b:46}, hovermode:'closest'}));
  // 2) YoY diverging bars
  const stopped = pts.filter(p => p.ly > 50 && p.gmv <= 0);
  const y = pts.filter(p => p.ly > 50 && p.gmv > 0 && h.isNum(p.yoy)).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 25).sort((a, b) => a.yoy - b.yoy);
  const yh = document.querySelector('#pvYoy').previousElementSibling; if(yh) yh.innerHTML = `25 SKU thay đổi GMV lớn nhất (theo $), chỉ tính SKU còn bán kỳ này. Vạch giữa là 0%: phải tăng, trái giảm.${stopped.length ? ` <b>${stopped.length} SKU không còn doanh số</b> so với cùng kỳ (GMV năm trước ${h.f$(stopped.reduce((t, p) => t + p.ly, 0))}): ${stopped.sort((a, b) => b.ly - a.ly).slice(0, 8).map(p => h.esc(p.sku)).join(', ')}${stopped.length > 8 ? '…' : ''}.` : ''}`;
  h.draw('pvYoy', [{type:'bar', orientation:'h', y:y.map(p => p.sku), x:y.map(p => Math.max(-1, Math.min(2, p.yoy))), marker:{color:y.map(p => p.yoy >= 0 ? '#2a78d6' : '#D64545')},
    text:y.map(p => (p.yoy >= 0 ? '+' : '') + (p.yoy * 100).toFixed(0) + '%'), textposition:'outside', textfont:{size:10, color:h.PAL.muted}, cliponaxis:false,
    customdata:y.map(p => [p.name.slice(0, 55), p.gmv, p.ly, p.d]), hovertemplate:'<b>%{y}</b> %{customdata[0]}<br>GMV %{customdata[1]:$,.0f} vs LY %{customdata[2]:$,.0f}<br>Δ %{customdata[3]:$,.0f}<extra></extra>'}],
    h.lay({xaxis:h.ax({tickformat:'.0%', zeroline:true, zerolinecolor:'#C9CED6', zerolinewidth:2, range:[-1.15, 2.25], title:{text:'YoY % (cắt ở −100% / +200%)', font:{size:11}}}), yaxis:h.ax({automargin:true, tickfont:{size:10}}), margin:{l:8, r:30, t:8, b:44}, showlegend:false, height:Math.max(380, y.length * 18 + 70),
      shapes:[{type:'rect', xref:'x', yref:'paper', x0:-1.15, x1:0, y0:0, y1:1, fillcolor:'rgba(214,69,69,.04)', line:{width:0}, layer:'below'}, {type:'rect', xref:'x', yref:'paper', x0:0, x1:2.25, y0:0, y1:1, fillcolor:'rgba(42,120,214,.04)', line:{width:0}, layer:'below'}]}));
  // 3) burn map
  const b = pts.filter(p => h.isNum(p.cm3Pct) && h.isNum(p.mktPct) && p.gmv >= 100);
  const med = arr => { const s = [...arr].sort((p, q) => p - q); return s[Math.floor(s.length / 2)] || 0; };
  const mM = med(b.map(p => p.mktPct)), mC = med(b.map(p => p.cm3Pct));
  const burn = b.filter(p => p.mktPct > mM && p.cm3Pct < mC);
  const mxG = Math.max(1, ...b.map(p => p.gmv));
  h.draw('pvBurn', [{type:'scatter', mode:'markers', x:b.map(p => p.mktPct), y:b.map(p => p.cm3Pct), marker:{size:b.map(p => 7 + 26 * Math.sqrt(p.gmv / mxG)), color:b.map(p => burn.includes(p) ? '#D64545' : '#2a78d6'), opacity:.75, line:{width:1.3, color:'#fff'}},
    customdata:b.map(p => [p.sku, p.name.slice(0, 55), p.gmv, p.mkt]), hovertemplate:'<b>%{customdata[0]}</b> %{customdata[1]}<br>%MKT/GMV %{x:.1%} · CM3 %{y:.1%}<br>GMV %{customdata[2]:$,.0f} · MKT %{customdata[3]:$,.0f}<extra></extra>'}],
    h.lay({xaxis:h.ax({tickformat:'.0%', title:{text:'%MKT/GMV', font:{size:11}}}), yaxis:h.ax({tickformat:'.0%', title:{text:'CM3 %', font:{size:11}}}), showlegend:false, margin:{l:56, r:8, t:8, b:46}, hovermode:'closest',
      shapes:[{type:'rect', xref:'x', yref:'y', x0:mM, x1:Math.max(mM + .01, ...b.map(p => p.mktPct)) * 1.05, y0:Math.min(mC - .01, ...b.map(p => p.cm3Pct)) * 1.1 - .02, y1:mC, fillcolor:'rgba(214,69,69,.07)', line:{width:0}, layer:'below'},
        {type:'line', xref:'x', yref:'paper', x0:mM, x1:mM, y0:0, y1:1, line:{color:'#D5D9DF', width:1.2}}, {type:'line', xref:'paper', yref:'y', x0:0, x1:1, y0:mC, y1:mC, line:{color:'#D5D9DF', width:1.2}}]}));
  document.getElementById('pvBurnTbl').innerHTML = '<thead><tr><th>SKU</th><th>Tên</th><th class="num">GMV</th><th class="num">MKT fee</th><th class="num">%MKT/GMV</th><th class="num">CM3 %</th></tr></thead><tbody>' +
    (burn.sort((a, b2) => b2.mkt - a.mkt).map(p => `<tr><td><b>${h.esc(p.sku)}</b></td><td class="name-cell" title="${h.esc(p.name)}">${h.esc(p.name.slice(0, 40))}</td><td class="num">${h.f$(p.gmv)}</td><td class="num">${h.f$(p.mkt)}</td><td class="num" style="color:var(--red);font-weight:700">${h.fP(p.mktPct)}</td><td class="num" style="color:${p.cm3Pct < 0 ? 'var(--red)' : 'var(--amber)'};font-weight:700">${h.fP(p.cm3Pct)}</td></tr>`).join('') || '<tr><td colspan="6" class="v2-note">Không có SKU nào trong vùng này.</td></tr>') + '</tbody>';
};

// =====================================================================
// Tracking: live race (hour-level sales, dark panel)
//  - Ngày: one day by hour (sales_hourly), vs the day before / same day last week
//  - MTD:  month start → chosen day by day (sales_daily), vs target pace
//  - refreshes at minute :07 of every hour (the hourly file lands late; flow loads it just before), US Pacific clock
// =====================================================================
const LV = {date:null, dates:[], follow:true, by:'team', mode:'day', rows:null, key:'', lastHour:{}, cur:null, playing:false, timer:null, clock:null, lastRefresh:0};
const LIVE_C = {gmv:'#d95926', gmv2:'#FF8A3D', mkt:'#3987e5', ok:'#199e70', ink:'#E8EEF7', mute:'#8A97AD', grid:'#1E2B44', y:'#7C8BA6', w:'#5A6A86'};
const LIVE_REFRESH_MIN = 7, LIVE_REFRESH_MM = String(LIVE_REFRESH_MIN).padStart(2, "0");
const liveLay = extra => Object.assign({paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'rgba(0,0,0,0)', font:{family:'Calibri, Segoe UI, Roboto, Arial, sans-serif', color:LIVE_C.ink, size:11.5},
  margin:{l:48, r:14, t:8, b:34}, hoverlabel:{bgcolor:'#0F1729', bordercolor:'#2A3A5A', font:{color:LIVE_C.ink, size:12}}, showlegend:false}, extra || {});
const liveAx = extra => Object.assign({gridcolor:LIVE_C.grid, zeroline:false, linecolor:'#2A3A5A', tickfont:{color:LIVE_C.mute, size:10.5}}, extra || {});
const liveMoney = v => '$' + Math.round(v).toLocaleString('en-US');
const liveDay = iso => +iso.slice(8, 10);
const liveMonthStart = iso => iso.slice(0, 8) + '01';
const liveDim = iso => new Date(+iso.slice(0, 4), +iso.slice(5, 7), 0).getDate();
async function liveLastHour(d){
  if(d in LV.lastHour) return LV.lastHour[d];
  const r = await sb.from('sales_hourly').select('hour').eq('date', d).order('hour', {ascending:false}).limit(1);
  return (LV.lastHour[d] = !r.error && r.data && r.data[0] ? +r.data[0].hour : -1);
}
async function liveLoad(){
  const h = H();
  if(!LV.dates.length){
    const r = await sb.from('sales_hourly').select('date').order('date', {ascending:false}).limit(1);
    if(r.error) throw r.error;
    const last = r.data && r.data[0] && r.data[0].date; if(!last) return false;
    LV.dates = Array.from({length:14}, (_, i) => addDaysIso(last, -i));
    if(LV.follow || !LV.dates.includes(LV.date)){
      LV.date = last; LV.follow = true;
      // just past midnight (US) the new day is nearly empty: open the previous day until 05h is in
      if(LV.mode === 'day' && await liveLastHour(last) < 5) LV.date = addDaysIso(last, -1);
    }
  }
  const d0 = LV.date;
  if(LV.mode === 'mtd'){
    const key = 'mtd|' + d0;
    if(LV.key !== key){
      LV.rows = (await h.selectAll('sales_daily', q => q.gte('date', liveMonthStart(d0)).lte('date', d0)))
        .map(r => ({sku:r.sku, date:r.date, units:r.units, gmv:r.gmv, ads:r.ads, promo:r.promo, clicks:r.total_clicks, glance_views:r.glance_views}));
      LV.key = key;
    }
  } else {
    const want = [d0, addDaysIso(d0, -1), addDaysIso(d0, -7)], key = 'day|' + want.join('|');
    if(LV.key !== key){ LV.rows = await h.selectAll('sales_hourly', q => q.in('date', want)); LV.key = key; }
  }
  await liveLastHour(d0);
  return true;
}
function liveAgg(rows){ const a = {units:0, gmv:0, ads:0, promo:0, clicks:0, gv:0}; rows.forEach(r => { a.units += +r.units || 0; a.gmv += +r.gmv || 0; a.ads += +r.ads || 0; a.promo += +r.promo || 0; a.clicks += +r.clicks || 0; a.gv += +r.glance_views || 0; }); a.mkt = a.ads + a.promo; return a; }
function liveCum(rows, upto){ const by = Array(24).fill(0); rows.forEach(r => { by[+r.hour] += +r.gmv || 0; }); let c = 0; return by.map((v, i) => i <= upto ? (c += v) : null); }
// targets of the month being raced (only when the loaded month is that month)
function liveTargets(d0){
  const month = (document.getElementById('fMonth') || {}).value || '';
  const ok = month.slice(0, 7) === d0.slice(0, 7) && typeof ROWS !== 'undefined';
  const t = {ok, gmv:0, units:0, mkt:0, by:new Map()};
  if(!ok) return t;
  ROWS.forEach(r => { t.gmv += r.targetGMV || 0; t.units += r.targetUnits || 0; t.mkt += r.mktTarget || 0;
    const g = LV.by === 'team' ? (r.team || 'Unassigned') : LV.by === 'pic' ? (r.pic || 'Unassigned') : (r.mainPL || 'Unclassified'); t.by.set(g, (t.by.get(g) || 0) + (r.targetGMV || 0)); });
  t.ok = t.gmv > 0; return t;
}
function liveClock(){
  const el = document.getElementById('lvClock'); if(!el) return;
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {timeZone:'America/Los_Angeles', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false, weekday:'short', month:'2-digit', day:'2-digit', timeZoneName:'short'}).formatToParts(now);
  const g = k => (parts.find(p => p.type === k) || {}).value || '';
  const vn = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Ho_Chi_Minh', hour:'2-digit', minute:'2-digit', hour12:false}).format(now);
  const next = new Date(now); next.setSeconds(0, 0); next.setMinutes(LIVE_REFRESH_MIN); if(next <= now) next.setHours(next.getHours() + 1);
  const mins = Math.max(0, Math.round((next - now) / 60000));
  el.innerHTML = `<span class="ck-t">${g('hour') === '24' ? '00' : g('hour')}:${g('minute')}<small>:${g('second')}</small></span><span class="ck-z">${g('timeZoneName')} · ${g('weekday')} ${g('day')}/${g('month')}</span><span class="ck-s">VN ${vn} · làm mới sau ${mins}′</span>`;
}
function liveSchedule(){
  // next run at minute :07 (same minute in VN and US: whole-hour offsets)
  const now = new Date(), next = new Date(now); next.setSeconds(5, 0); next.setMinutes(LIVE_REFRESH_MIN);
  if(next <= now) next.setHours(next.getHours() + 1);
  clearTimeout(LV.timer); LV.timer = setTimeout(() => { liveRefreshAll(); liveSchedule(); }, next - now);
}
// reload the live race and, when it is safe, the month data behind the other Tracking cards
async function liveRefreshAll(){
  if(document.visibilityState !== 'visible'){ LV.pending = true; return; }
  LV.pending = false; LV.lastRefresh = Date.now();
  if(!LV.playing){ LV.key = ''; LV.dates = []; LV.lastHour = {}; LV.cur = null; V3.renderLive().catch(e => console.warn(e)); }
  const ae = document.activeElement, typing = ae && (ae.tagName === 'TEXTAREA' || (ae.tagName === 'INPUT' && /text|search|number|date/.test(ae.type)));
  const sel = document.getElementById('fMonth');
  if(V2.activeTab === 'sales' && !typing && sel && sel.value && sel.value.slice(0, 7) === (LV.date || '').slice(0, 7)) sel.dispatchEvent(new Event('change'));
}
V3.renderLive = async function(){
  const host = document.getElementById('liveRace'); if(!host) return;
  const h = H();
  try { if(!(await liveLoad())){ host.innerHTML = ''; return; } }
  catch(e){ host.innerHTML = h.missingSchema(e) ? '' : `<div class="live"><div class="live-empty">Không tải được số theo giờ: ${h.esc(e.message || e)}</div></div>`; return; }
  if(!host.dataset.built){
    host.dataset.built = '1';
    host.innerHTML = `<div class="live" role="region" aria-label="Live race">
      <div class="live-h"><span class="live-dot">LIVE</span><h2>Prime Big Deal Days · <em>Live race</em></h2>
        <div class="live-clock" id="lvClock" title="Giờ Mỹ (Los Angeles, Pacific Time). Dashboard tự làm mới lúc phút :${LIVE_REFRESH_MM} mỗi giờ."></div>
        <div class="live-ctl"><div class="seg" role="group" aria-label="Khoảng thời gian"><button type="button" data-mode="day">Ngày</button><button type="button" data-mode="mtd">MTD</button></div>
          <select id="lvDate" aria-label="Ngày"></select>
          <div class="seg" role="group" aria-label="Nhóm theo"><button type="button" data-by="team">Team</button><button type="button" data-by="pic">PIC</button><button type="button" data-by="pl">Product line</button></div>
          <button type="button" id="lvPlay" title="Phát lại cuộc đua">▶ Replay</button></div></div>
      <div class="live-sub" id="lvSub"></div>
      <div class="live-kpis" id="lvKpis"></div>
      <div class="live-grid"><div class="live-card"><h3>Đường đua GMV</h3><div class="hint" id="lvLaneHint"></div><div id="lvLanes"></div></div>
        <div class="live-card"><h3 id="lvCumT"></h3><div class="hint" id="lvCumH"></div><div id="lvCum" class="plot"></div><div class="live-legend" id="lvLeg"></div></div></div>
      <div class="live-row"><div class="live-card"><h3>Top Product line · GMV</h3><div class="hint" id="lvTopGH"></div><div id="lvTopG" class="plot sm"></div></div>
        <div class="live-card"><h3>Top Product line · MKT spend</h3><div class="hint">Ads + promo; nhãn là %MKT/GMV — cao là đang đốt tiền. Rê chuột để xem SKU tốn nhất.</div><div id="lvTopM" class="plot sm"></div></div></div></div>`;
    host.querySelector('#lvDate').onchange = e => { LV.date = e.target.value; LV.follow = e.target.selectedIndex === 0; LV.cur = null; V3.renderLive(); };
    host.querySelectorAll('[data-by]').forEach(b => b.onclick = () => { LV.by = b.dataset.by; V3.renderLive(); });
    host.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { if(LV.mode === b.dataset.mode || LV.playing) return; LV.mode = b.dataset.mode; LV.cur = null; V3.renderLive(); });
    host.querySelector('#lvPlay').onclick = () => liveReplay();
    liveClock(); clearInterval(LV.clock); LV.clock = setInterval(liveClock, 1000);
    liveSchedule();
    document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible' && (LV.pending || Date.now() - LV.lastRefresh > 65 * 60 * 1000 && LV.lastRefresh)) liveRefreshAll(); });
    LV.lastRefresh = Date.now();
  }
  const d0 = LV.date, mtd = LV.mode === 'mtd';
  const sel = host.querySelector('#lvDate');
  sel.innerHTML = LV.dates.map(d => `<option value="${d}" ${d === d0 ? 'selected' : ''}>${mtd ? 'MTD tới ' : ''}${['CN','T2','T3','T4','T5','T6','T7'][new Date(d + 'T00:00:00').getDay()]} ${h.dm(d)}</option>`).join('');
  host.querySelectorAll('[data-by]').forEach(b => b.classList.toggle('on', b.dataset.by === LV.by));
  host.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === LV.mode));
  const lastHour = LV.lastHour[d0] ?? -1, hh = x => String(x).padStart(2, '0');
  host.querySelector('#lvSub').textContent = (mtd ? `Từ ${h.dm(liveMonthStart(d0))} tới ${h.dm(d0)}` : `Ngày ${h.dm(d0)}`) +
    (lastHour >= 0 ? ` · số tới ${hh(lastHour)}:59 ngày ${h.dm(d0)} (giờ trong file hourly)` : ' · chưa có số theo giờ cho ngày này') + ` · tự làm mới lúc phút :${LIVE_REFRESH_MM} mỗi giờ`;
  const T = liveTargets(d0);
  if(mtd) liveRenderMtd(d0, lastHour, T); else liveRenderDay(d0, lastHour, T);
};
function liveRenderDay(d0, lastHour, T){
  const h = H(), d1 = addDaysIso(d0, -1), d7 = addDaysIso(d0, -7);
  const today = LV.rows.filter(r => r.date === d0), yday = LV.rows.filter(r => r.date === d1), lw = LV.rows.filter(r => r.date === d7);
  const last = today.length ? Math.max(...today.map(r => +r.hour)) : -1;
  const upto = LV.cur === null ? last : LV.cur, hh = String(Math.max(upto, 0)).padStart(2, '0');
  const cur = today.filter(r => +r.hour <= upto);
  const t = liveAgg(cur), y = liveAgg(yday.filter(r => +r.hour <= upto));
  const dl = (a, b, inv) => { if(!b) return ''; const p = a / b - 1; const good = inv ? p < 0 : p > 0; return `<b class="${good ? 'up' : 'dn'}">${p > 0 ? '▲' : '▼'} ${Math.abs(p * 100).toFixed(1)}%</b> vs cùng giờ hôm trước`; };
  liveKpiHtml([
    ['GMV tới ' + hh + 'h', liveMoney(t.gmv), dl(t.gmv, y.gmv), 'gmv'],
    ['Units', Math.round(t.units).toLocaleString('en-US'), dl(t.units, y.units)],
    ['MKT spend', liveMoney(t.mkt), dl(t.mkt, y.mkt, true)],
    ['%MKT / GMV', t.gmv ? (t.mkt / t.gmv * 100).toFixed(1) + '%' : '—', y.gmv ? 'hôm trước ' + (y.mkt / y.gmv * 100).toFixed(1) + '%' : ''],
    ['CR (units/GV)', t.gv ? (t.units / t.gv * 100).toFixed(2) + '%' : '—', t.gv ? Math.round(t.gv).toLocaleString('en-US') + ' glance views' : ''],
  ]);
  // lanes: GMV of the day ÷ daily target (month target ÷ days); pace from yesterday's hourly curve
  const dim = liveDim(d0);
  const yc = liveCum(yday, 23), ytot = yc[23] || 0, pace = ytot ? (yc[Math.max(upto, 0)] || 0) / ytot : (upto + 1) / 24;
  liveLanes(cur, T, 1 / dim, pace, T.ok ? `Vị trí = GMV ÷ target ngày (target tháng ÷ ${dim}). Cờ 🏁 = 100%; vạch dọc = mức cần có tới ${hh}h (${Math.round(pace * 100)}% theo nhịp ngày hôm trước).` : '', '% target ngày');
  const x = Array.from({length:24}, (_, i) => i);
  document.getElementById('lvCumT').textContent = 'GMV cộng dồn theo giờ';
  document.getElementById('lvCumH').textContent = 'Đường cam = ngày đang xem · nét đứt = hôm trước · chấm = cùng ngày tuần trước.';
  document.getElementById('lvLeg').innerHTML = `<span style="--c:${LIVE_C.gmv2}">Ngày ${h.dm(d0)}</span><span style="--c:${LIVE_C.y}">Hôm trước</span><span style="--c:${LIVE_C.w}">Tuần trước</span>`;
  h.draw('lvCum', [
    {type:'scatter', mode:'lines', x, y:liveCum(lw, 23), name:'Tuần trước', line:{color:LIVE_C.w, width:1.6, dash:'dot'}, hovertemplate:'Tuần trước %{x}h: %{y:$,.0f}<extra></extra>'},
    {type:'scatter', mode:'lines', x, y:liveCum(yday, 23), name:'Hôm trước', line:{color:LIVE_C.y, width:1.8, dash:'dash'}, hovertemplate:'Hôm trước %{x}h: %{y:$,.0f}<extra></extra>'},
    {type:'scatter', mode:'lines+markers', x, y:liveCum(today, upto), name:'Ngày đang xem', line:{color:LIVE_C.gmv2, width:3, shape:'spline'}, marker:{size:6, color:LIVE_C.gmv2, line:{color:'#0B1220', width:2}}, fill:'tozeroy', fillcolor:'rgba(217,89,38,.12)', hovertemplate:'%{x}h: %{y:$,.0f}<extra></extra>'},
  ], liveLay({xaxis:liveAx({range:[-0.3, 23.3], dtick:3, ticksuffix:'h'}), yaxis:liveAx({tickprefix:'$', tickformat:'~s', rangemode:'tozero'}), hovermode:'x unified'}));
  document.getElementById('lvTopGH').textContent = `Ngày ${h.dm(d0)}, tới ${hh}h. Rê chuột để xem SKU bán chạy nhất.`;
  liveTops(cur);
}
function liveRenderMtd(d0, lastHour, T){
  const h = H(), dim = liveDim(d0), dEnd = liveDay(d0);
  const upto = LV.cur === null ? dEnd : LV.cur;
  const cur = LV.rows.filter(r => liveDay(r.date) <= upto);
  // share of the month elapsed: full days before the last one + hours of the last one
  const lastFrac = upto === dEnd ? (lastHour >= 0 ? (lastHour + 1) / 24 : 1) : 1;
  const frac = (upto - 1 + lastFrac) / dim;
  const t = liveAgg(cur);
  liveKpiHtml([
    ['GMV MTD', liveMoney(t.gmv), T.ok ? `<b class="${t.gmv >= T.gmv * frac ? 'up' : 'dn'}">${Math.round(t.gmv / (T.gmv * frac) * 100)}%</b> target tới nay · ${Math.round(t.gmv / T.gmv * 100)}% target tháng` : '', 'gmv'],
    ['Units MTD', Math.round(t.units).toLocaleString('en-US'), T.ok && T.units ? `<b class="${t.units >= T.units * frac ? 'up' : 'dn'}">${Math.round(t.units / (T.units * frac) * 100)}%</b> target tới nay` : ''],
    ['MKT spend MTD', liveMoney(t.mkt), T.ok && T.mkt ? `<b class="${t.mkt <= T.mkt * frac ? 'up' : 'dn'}">${Math.round(t.mkt / (T.mkt * frac) * 100)}%</b> ngân sách tới nay` : ''],
    ['%MKT / GMV', t.gmv ? (t.mkt / t.gmv * 100).toFixed(1) + '%' : '—', T.ok && T.mkt ? 'target ' + (T.mkt / T.gmv * 100).toFixed(1) + '%' : ''],
    ['CR (units/GV)', t.gv ? (t.units / t.gv * 100).toFixed(2) + '%' : '—', t.gv ? Math.round(t.gv).toLocaleString('en-US') + ' glance views' : ''],
  ]);
  liveLanes(cur, T, frac, null, T.ok ? `Vị trí = GMV MTD ÷ target tới ${h.dm(liveMonthStart(d0).slice(0, 8) + String(upto).padStart(2, '0'))} (target tháng × ${Math.round(frac * 100)}%). Cờ 🏁 = đúng tiến độ; qua cờ là đang vượt target. Số nhỏ bên phải: % tiến độ · % target cả tháng.` : '', '% tiến độ', frac);
  // cumulative by day vs straight-line target
  const by = Array(dim).fill(0); cur.forEach(r => { by[liveDay(r.date) - 1] += +r.gmv || 0; });
  let c = 0; const act = by.map((v, i) => i < upto ? (c += v) : null);
  const x = Array.from({length:dim}, (_, i) => i + 1);
  const tr = [];
  const xEnd = Math.min(dim, Math.max(upto + 3, 7)), xt = x.slice(0, xEnd);
  if(T.ok) tr.push({type:'scatter', mode:'lines', x:xt, y:xt.map(d => T.gmv * d / dim), name:'Target', line:{color:LIVE_C.y, width:1.8, dash:'dash'}, hovertemplate:'Target tới ngày %{x}: %{y:$,.0f}<extra></extra>'});
  tr.push({type:'scatter', mode:'lines+markers', x:xt, y:act.slice(0, xEnd), name:'Thực tế', line:{color:LIVE_C.gmv2, width:3}, marker:{size:6, color:LIVE_C.gmv2, line:{color:'#0B1220', width:2}}, fill:'tozeroy', fillcolor:'rgba(217,89,38,.12)',
    customdata:by.slice(0, xEnd).map((v, i) => i < upto ? v : null), hovertemplate:'Ngày %{x}: %{y:$,.0f} (trong ngày %{customdata:$,.0f})<extra></extra>'});
  document.getElementById('lvCumT').textContent = 'GMV cộng dồn theo ngày (MTD)';
  document.getElementById('lvCumH').textContent = T.ok ? `Đường cam = thực tế · nét đứt = target chia đều theo ngày (cả tháng ${liveMoney(T.gmv)}). Cam nằm trên nét đứt là đang vượt target.` : 'Chưa có target cho tháng này (chọn đúng tháng ở bộ lọc Tháng bên dưới để so target).';
  document.getElementById('lvLeg').innerHTML = `<span style="--c:${LIVE_C.gmv2}">Thực tế</span>` + (T.ok ? `<span style="--c:${LIVE_C.y}">Target</span>` : '');
  h.draw('lvCum', tr, liveLay({xaxis:liveAx({range:[0.5, xEnd + 0.5], dtick:xEnd > 14 ? 5 : 1}), yaxis:liveAx({tickprefix:'$', tickformat:'~s', rangemode:'tozero'}), hovermode:'x unified'}));
  document.getElementById('lvTopGH').textContent = `Từ ${h.dm(liveMonthStart(d0))} tới ngày ${upto}. Rê chuột để xem SKU bán chạy nhất.`;
  liveTops(cur);
}
function liveKpiHtml(items){
  document.getElementById('lvKpis').innerHTML = items.map(([k, v, d, c]) => `<div class="live-k"><div class="k">${k}</div><div class="v ${c || ''}">${v}</div><div class="d">${d || '&nbsp;'}</div></div>`).join('');
}
// lanes: tShare = part of the month target that counts (1/dim for a day, 1 for MTD); pace = 0..1 where the group should be by now
function liveLanes(cur, T, tShare, pace, hint, pctLabel, monthFrac){
  const h = H();
  const groupOf = sku => { const k = h.skuInfo(sku); return !k ? 'Khác' : LV.by === 'team' ? (k.team || 'Unassigned') : LV.by === 'pic' ? (k.pic || 'Unassigned') : (k.mainPL || 'Unclassified'); };
  const g = new Map(); cur.forEach(r => { const k = groupOf(r.sku); const a = g.get(k) || {k, gmv:0, mkt:0}; a.gmv += +r.gmv || 0; a.mkt += (+r.ads || 0) + (+r.promo || 0); g.set(k, a); });
  T.by.forEach((v, k) => { if(!g.has(k) && v * tShare > 50) g.set(k, {k, gmv:0, mkt:0}); });
  let list = [...g.values()].map(a => ({...a, t:(T.by.get(a.k) || 0) * tShare})).filter(a => a.gmv > 0 || a.t > 0);
  const hasT = list.some(a => a.t > 0), maxG = Math.max(1, ...list.map(a => a.gmv));
  list.forEach(a => { a.pct = a.t ? a.gmv / a.t : NaN; a.pos = hasT ? (a.t ? Math.min(1.15, a.pct) / 1.15 : 0) : a.gmv / maxG; });
  list.sort((a, b) => (hasT ? (isFinite(b.pct) ? b.pct : -1) - (isFinite(a.pct) ? a.pct : -1) : b.gmv - a.gmv) || b.gmv - a.gmv);
  list = list.slice(0, LV.by === 'pl' ? 12 : 10);
  document.getElementById('lvLaneHint').innerHTML = hasT ? hint : 'Không có target cho tháng này: vị trí so với người dẫn đầu.';
  const pacePos = pace === null ? '0' : (Math.min(1.15, pace) / 1.15 * 100).toFixed(1);
  const num = a => `<b>${liveMoney(a.gmv)}</b><small>${hasT && a.t ? Math.round(a.pct * 100) + pctLabel + (monthFrac ? ' · ' + Math.round(a.pct * monthFrac * 100) + '% tháng' : '') : ''}</small>`;
  const nm = (a, i) => `${i === 0 && a.gmv > 0 ? '🥇 ' : ''}${h.esc(a.k)}<small>MKT ${liveMoney(a.mkt)}${a.gmv ? ' · ' + Math.round(a.mkt / a.gmv * 100) + '%' : ''}</small>`;
  const lanes = document.getElementById('lvLanes');
  const same = lanes.children.length === list.length && [...lanes.children].every((c, i) => c.dataset.k === list[i].k) && lanes.dataset.t === String(hasT);
  if(same){ list.forEach((a, i) => { const c = lanes.children[i]; c.querySelector('.fill').style.width = (a.pos * 100).toFixed(1) + '%'; c.querySelector('.runner').style.left = (a.pos * 100).toFixed(1) + '%'; c.querySelector('.num').innerHTML = num(a); c.querySelector('.nm').innerHTML = nm(a, i); c.classList.toggle('lead', i === 0 && a.gmv > 0); const p = c.querySelector('.pace'); if(p) p.style.left = pacePos + '%'; }); return; }
  lanes.dataset.t = String(hasT);
  lanes.innerHTML = list.map((a, i) => `<div class="lane${i === 0 && a.gmv > 0 ? ' lead' : ''}" data-k="${h.esc(a.k)}"><div class="nm" title="${h.esc(a.k)}">${nm(a, i)}</div>
    <div class="track"><div class="fill" style="width:${(a.pos * 100).toFixed(1)}%"></div>${hasT && a.t ? `${pace === null ? '' : `<div class="pace" style="left:${pacePos}%"></div>`}<span class="flag" style="right:${(100 - 100 / 1.15).toFixed(1)}%">🏁</span>` : ''}<div class="runner" style="left:${(a.pos * 100).toFixed(1)}%">${i + 1}</div></div>
    <div class="num">${num(a)}</div></div>`).join('') || '<div class="live-empty">Chưa có doanh số.</div>';
}
// top product lines (SKU detail in the tooltip)
function liveTops(cur){
  const h = H();
  const byPl = new Map(); cur.forEach(r => { const k = h.skuInfo(r.sku); const pl = (k && k.mainPL) || 'Unclassified';
    const a = byPl.get(pl) || {pl, gmv:0, mkt:0, sk:new Map()}; const g = +r.gmv || 0, m = (+r.ads || 0) + (+r.promo || 0); a.gmv += g; a.mkt += m;
    const x = a.sk.get(r.sku) || {gmv:0, mkt:0}; x.gmv += g; x.mkt += m; a.sk.set(r.sku, x); byPl.set(pl, a); });
  const narrow = (document.getElementById('lvTopG') || {}).clientWidth < 520;
  const lab = s => narrow && s.pl.length > 14 ? s.pl.slice(0, 13) + '…' : s.pl;
  const topSk = (s, key) => [...s.sk].sort((a, b) => b[1][key] - a[1][key]).slice(0, 3).filter(([, v]) => v[key] > 0).map(([sku, v]) => sku + ' ' + liveMoney(v[key])).join(' · ') || '—';
  const tg = [...byPl.values()].filter(s => s.gmv > 0).sort((a, b) => b.gmv - a.gmv).slice(0, 10).reverse();
  const tm = [...byPl.values()].filter(s => s.mkt > 0).sort((a, b) => b.mkt - a.mkt).slice(0, 10).reverse();
  const barLay = () => liveLay({margin:{l:narrow ? 100 : 170, r:narrow ? 70 : 84, t:4, b:26}, xaxis:liveAx({tickprefix:'$', tickformat:'~s', rangemode:'tozero'}), yaxis:liveAx({automargin:false, tickfont:{color:LIVE_C.ink, size:11.5}}), bargap:.35});
  const empty = (id, msg) => { const el = document.getElementById(id); if(window.Plotly && el._fullLayout) Plotly.purge(el); el.innerHTML = `<div class="live-empty">${msg}</div>`; };
  if(tg.length) h.draw('lvTopG', [{type:'bar', orientation:'h', y:tg.map(lab), x:tg.map(s => s.gmv), marker:{color:LIVE_C.gmv, line:{color:'#0B1220', width:2}}, text:tg.map(s => liveMoney(s.gmv)), textposition:'outside', textfont:{color:LIVE_C.ink, size:11}, cliponaxis:false,
    customdata:tg.map(s => [s.mkt, s.gmv ? s.mkt / s.gmv : 0, s.pl, topSk(s, 'gmv')]), hovertemplate:'<b>%{customdata[2]}</b><br>GMV %{x:$,.0f}<br>MKT %{customdata[0]:$,.0f} (%{customdata[1]:.0%})<br>Top SKU: %{customdata[3]}<extra></extra>'}], barLay());
  else empty('lvTopG', 'Chưa có doanh số.');
  if(tm.length) h.draw('lvTopM', [{type:'bar', orientation:'h', y:tm.map(lab), x:tm.map(s => s.mkt), marker:{color:LIVE_C.mkt, line:{color:'#0B1220', width:2}}, text:tm.map(s => liveMoney(s.mkt) + (s.gmv ? ' · ' + Math.round(s.mkt / s.gmv * 100) + '%' : ' · no GMV')), textposition:'outside', textfont:{color:LIVE_C.ink, size:11}, cliponaxis:false,
    customdata:tm.map(s => [s.gmv, s.pl, topSk(s, 'mkt')]), hovertemplate:'<b>%{customdata[1]}</b><br>MKT %{x:$,.0f}<br>GMV %{customdata[0]:$,.0f}<br>Tốn nhất: %{customdata[2]}<extra></extra>'}], barLay());
  else empty('lvTopM', 'Chưa có chi phí MKT.');
}
// replay: hour by hour (Ngày) or day by day (MTD)
function liveReplay(){
  if(LV.playing || !LV.rows) return;
  const mtd = LV.mode === 'mtd';
  const rows = mtd ? LV.rows : LV.rows.filter(r => r.date === LV.date); if(!rows.length) return;
  const first = mtd ? 1 : 0, last = mtd ? liveDay(LV.date) : Math.max(...rows.map(r => +r.hour));
  const lab = v => mtd ? 'ngày ' + v : String(v).padStart(2, '0') + 'h';
  LV.playing = true; LV.cur = first;
  const btn = document.getElementById('lvPlay'); btn.classList.add('on');
  const step = () => { V3.renderLive(); btn.textContent = '■ ' + lab(LV.cur);
    if(LV.cur >= last){ LV.playing = false; LV.cur = null; btn.classList.remove('on'); btn.textContent = '▶ Replay'; V3.renderLive(); return; }
    LV.cur++; setTimeout(step, mtd ? 800 : 650); };
  step();
}
// first paint and month changes (afterLoadMonth does not go through onTab)
{ const base = V2.afterLoadMonth; V2.afterLoadMonth = async function(){ await base.apply(this, arguments); if(V2.activeTab === 'sales') V3.renderLive().catch(e => console.warn(e)); }; }

V3.onTab = function(tab){ if(tab === 'sales') V3.renderLive(); };
})();

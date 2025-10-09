/* ==========================================================================
   app-data.js — مصروفي
   النسخة: v0.1.3
   الغرض:
   - طبقة البيانات (Business Logic) منفصلة عن DOM.
   - عرض KPIs والجداول، قراءة/كتابة دفعات إلى GAS، Bootstrap من schema.
   - تعبئة القوائم (الحسابات/الفئات/المشاريع) من الحالة.
   - ✨ جديد v0.1.3: إظهار أسماء الحسابات/الفئات/المشاريع بدل الـID في كل الجداول واللوحات.
   ========================================================================== */

window.APP_DATA = (function(){

  /* ===================== Helpers ===================== */
  function sum(list, getter){
    let s = 0;
    for(let i=0;i<list.length;i++){
      const v = getter ? getter(list[i]) : list[i];
      const n = Number(v||0);
      if(!isNaN(n)) s += n;
    }
    return s;
  }
  function recent(arr, n=8){ return (arr||[]).slice(-n).reverse(); }

  // خرائط سريعة للاسم حسب الهوية
  function buildMaps(){
    const acc = new Map((STATE.S.data.accounts||[]).map(a=> [String(a.id), a.name]));
    const cat = new Map((STATE.S.data.categories||[]).map(c=> [String(c.id), c.name]));
    const prj = new Map((STATE.S.data.projects||[]).map(p=> [String(p.id), p.name]));
    return { acc, cat, prj };
  }
  function by(map, id, fallbackChar="—"){ return map.get(String(id)) || fallbackChar; }

  /* ===================== لوحة التحكم ===================== */
  function renderDashboard(){
    const tx = STATE.S.data.transactions || [];
    const {acc, cat} = buildMaps();

    const totalIncome  = sum(tx.filter(t=> Number(t.amount) > 0),  t=> t.amount);
    const totalExpense = sum(tx.filter(t=> Number(t.amount) < 0),  t=> Math.abs(Number(t.amount)));
    const net = totalIncome - totalExpense;

    const elNet   = document.getElementById("kpi-net");
    const elSave  = document.getElementById("kpi-saving");
    const elBurn  = document.getElementById("kpi-burn");
    const elFixed = document.getElementById("kpi-fixed");

    if(elNet)   elNet.textContent   = UT.fmtMoney(net);
    if(elSave)  elSave.textContent  = totalIncome ? `${((net/totalIncome)*100).toFixed(1)}%` : "—";
    if(elBurn)  elBurn.textContent  = totalExpense ? (totalIncome/Math.max(totalExpense,1)).toFixed(1) + " m" : "—";
    if(elFixed) elFixed.textContent = "—";

    // النشاط الأخير (أظهر الأسماء)
    const tbody = document.getElementById("tbl-recent");
    if(tbody){
      tbody.innerHTML = "";
      recent(tx, 8).forEach(row=>{
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.date || ""}</td>
          <td>${by(acc, row.account_id)}</td>
          <td>${by(cat, row.category_id)}</td>
          <td>${UT.fmtMoney(row.amount || 0)}</td>
          <td>${row.note ? String(row.note) : ""}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  /* ===================== جدول المعاملات ===================== */
  function renderTables(){
    const tEl = document.getElementById("tbl-tx");
    if(!tEl) return;

    const rows = STATE.S.data.transactions || [];
    const {acc, cat, prj} = buildMaps();

    tEl.innerHTML = "";
    rows.forEach((r, idx)=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${idx+1}</td>
        <td>${r.date || ""}</td>
        <td>${by(acc, r.account_id)}</td>
        <td>${by(cat, r.category_id)}</td>
        <td>${UT.fmtMoney(r.amount || 0)}</td>
        <td>${by(prj, r.project_id)}</td>
        <td>${r.note ? String(r.note) : ""}</td>
      `;
      tEl.appendChild(tr);
    });
  }

  /* ===================== تعبئة قوائم الاختيار ===================== */
  function renderSelectors(){
    const accSel = document.querySelector("[data-bind='transactions.account_id']");
    const catSel = document.querySelector("[data-bind='transactions.category_id']");
    const prjSel = document.querySelector("[data-bind='transactions.project_id']");

    const fill = (sel, items, label='name', value='id')=>{
      if(!sel) return;
      const opts = [`<option value="">—</option>`].concat(
        (items||[]).map(x=> `<option value="${x[value] ?? x[label]}">${x[label]}</option>`)
      );
      sel.innerHTML = opts.join("");
    };

    fill(accSel, STATE.S.data.accounts);
    fill(catSel, STATE.S.data.categories);
    fill(prjSel, STATE.S.data.projects);
  }

  /* ===================== Bootstrap من schema (Seeds) ===================== */
  async function bootstrapFromSchema(){
    const schema = STATE.S.schema || {};
    const seeds = schema.seeds || {};
    const d = STATE.S.data;
    const isEmpty = (a)=> !Array.isArray(a) || a.length === 0;

    if(isEmpty(d.accounts)      && Array.isArray(seeds.accounts))      d.accounts      = seeds.accounts.slice();
    if(isEmpty(d.categories)    && Array.isArray(seeds.categories))    d.categories    = seeds.categories.slice();
    if(isEmpty(d.projects)      && Array.isArray(seeds.projects))      d.projects      = seeds.projects.slice();
    if(isEmpty(d.subscriptions) && Array.isArray(seeds.subscriptions)) d.subscriptions = seeds.subscriptions.slice();

    STATE.saveLocal();
  }

  /* ===================== GAS: قراءة/كتابة ===================== */
  async function readBatch(){
    const res = await UT.fetchGAS("readBatch", {
      tables: ["accounts","categories","transactions","budgets","subscriptions","projects"]
    });
    if(!res || !res.ok) throw new Error(res && res.error || "readBatch failed");

    const got = res.data || {};
    ["accounts","categories","transactions","budgets","subscriptions","projects"].forEach(k=>{
      if(Array.isArray(got[k]) && got[k].length){
        STATE.S.data[k] = got[k];
      }
    });

    STATE.saveLocal();
    renderSelectors();
    renderDashboard();
    renderTables();
    UT.toast("تم الاستيراد من جوجل شيت ✅");
  }

  async function writeBatch(rowsByTable){
    const res = await UT.fetchGAS("writeBatch", { rowsByTable });
    if(!res || !res.ok) throw new Error(res && res.error || "writeBatch failed");
    return true;
  }

  /* ===================== واجهة عامة ===================== */
  return {
    renderDashboard,
    renderTables,
    renderSelectors,
    bootstrapFromSchema,
    readBatch,
    writeBatch
  };
})();

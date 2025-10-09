/* ==========================================================================
   app-reports.js — مصروفي
   النسخة: v0.1.4
   الغرض:
   - توليد تقارير شهرية/فورية من الحالة المحلية بدون إعادة تحميل الصفحة.
   - ✨ جديد: عرض أسماء الفئات/المشاريع بدل المعرّفات (ID) في كل الجداول.
   ========================================================================== */

window.APP_REPORTS = (function(){

  /* ===================== Helpers ===================== */
  function monthMatch(iso, ym){
    if(!ym) return true;
    return String(iso||"").slice(0,7) === ym;
  }
  function pick(arr, n){ return (arr||[]).slice(0, n|0); }
  function sum(arr, selector){
    let s = 0;
    for(let i=0;i<(arr||[]).length;i++){
      const v = selector ? selector(arr[i]) : arr[i];
      const n = Number(v||0); if(!isNaN(n)) s += n;
    }
    return s;
  }
  function escapeHTML(s){
    return String(s||"")
      .replaceAll("&","&amp;").replaceAll("<","&lt;")
      .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  }

  // خرائط اسم ← حسب الهوية
  function maps(){
    const cats = new Map((STATE.S.data.categories||[]).map(c=> [String(c.id), c.name]));
    const prjs = new Map((STATE.S.data.projects||[]).map(p=> [String(p.id), p.name]));
    const accs = new Map((STATE.S.data.accounts||[]).map(a=> [String(a.id), a.name]));
    return {cats, prjs, accs};
  }
  const by = (m,id,fallback="—") => m.get(String(id)) || fallback;

  /* ===================== تجميع شهري ===================== */
  function aggregateMonthly(ym){
    const txAll = STATE.S.data.transactions || [];
    const tx = txAll.filter(t => monthMatch(t.date, ym));

    const income  = tx.filter(t => Number(t.amount) > 0);
    const expense = tx.filter(t => Number(t.amount) < 0);

    const totals = {
      income:  sum(income,  t => Number(t.amount)),
      expense: sum(expense, t => Math.abs(Number(t.amount))),
      net:     0
    };
    totals.net = totals.income - totals.expense;

    const {cats, prjs} = maps();

    // حسب الفئة (أظهر الاسم بدل الـID)
    const byCat = {};
    tx.forEach(t=>{
      const key = by(cats, t.category_id);
      byCat[key] = (byCat[key] || 0) + Math.abs(Number(t.amount||0));
    });
    const byCatArr = Object.entries(byCat).sort((a,b)=> b[1]-a[1]);

    // حسب المشروع (أظهر الاسم بدل الـID)
    const byProject = {};
    tx.forEach(t=>{
      const key = by(prjs, t.project_id);
      byProject[key] = (byProject[key] || 0) + Math.abs(Number(t.amount||0));
    });
    const byProjectArr = Object.entries(byProject).sort((a,b)=> b[1]-a[1]);

    // أعلى 5 معاملات بقيم مطلقة (مع اسم الفئة)
    const sortedAbs = tx.slice().sort((a,b)=> Math.abs(Number(b.amount||0)) - Math.abs(Number(a.amount||0)));
    const topTx = pick(sortedAbs, 5).map(r => ({
      ...r,
      category_name: by(cats, r.category_id),
      project_name:  by(prjs, r.project_id)
    }));

    return { tx, totals, byCatArr, byProjectArr, topTx };
  }

  /* ===================== قوالب عرض ===================== */
  function kpiCard(title, value){
    return `<div class="card">
      <h4 class="font-bold">${escapeHTML(title)}</h4>
      <div class="text-2xl font-bold mt-1">${value}</div>
    </div>`;
  }

  function tableFromPairs(title, pairs){
    return `
      <div class="card overflow-x-auto">
        <h4 class="font-bold mb-2">${escapeHTML(title)}</h4>
        <table class="table w-full min-w-[420px]">
          <thead><tr><th>Item</th><th>Value</th></tr></thead>
          <tbody>
            ${pairs.map(([k,v])=> `<tr><td>${escapeHTML(k)}</td><td>${UT.fmtMoney(v)}</td></tr>`).join("") || `<tr><td colspan="2">—</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }

  function tableTopTx(title, rows){
    return `
      <div class="card overflow-x-auto">
        <h4 class="font-bold mb-2">${escapeHTML(title)}</h4>
        <table class="table w-full min-w-[680px]">
          <thead><tr>
            <th>#</th>
            <th data-i18n="date">Date</th>
            <th data-i18n="category">Category</th>
            <th>Project</th>
            <th data-i18n="amount">Amount</th>
            <th data-i18n="note">Note</th>
          </tr></thead>
          <tbody>
            ${
              rows.map((r,i)=> `
                <tr>
                  <td>${i+1}</td>
                  <td>${escapeHTML(r.date||"")}</td>
                  <td>${escapeHTML(r.category_name||"—")}</td>
                  <td>${escapeHTML(r.project_name||"—")}</td>
                  <td>${UT.fmtMoney(r.amount||0)}</td>
                  <td>${escapeHTML(r.note||"")}</td>
                </tr>
              `).join("") || `<tr><td colspan="6">—</td></tr>`
            }
          </tbody>
        </table>
      </div>
    `;
  }

  /* ===================== واجهة عامة ===================== */
  function renderMonthly(ym){
    const out = document.getElementById("report-out");
    if(!out){ return; }

    const { totals, byCatArr, byProjectArr, topTx } = aggregateMonthly(ym);
    const fmt = (n)=> UT.fmtMoney(n);

    const gridKPIs = `
      <div class="grid md:grid-cols-4 gap-3">
        ${kpiCard("Income",  fmt(totals.income))}
        ${kpiCard("Expense", fmt(totals.expense))}
        ${kpiCard("Net",     fmt(totals.net))}
        ${kpiCard("Savings Rate", totals.income ? `${((totals.net/totals.income)*100).toFixed(1)}%` : "—")}
      </div>
    `;

    const gridTables = `
      <div class="grid md:grid-cols-2 gap-3 mt-3">
        ${tableFromPairs("Top Categories", byCatArr.slice(0,5))}
        ${tableFromPairs("By Project",     byProjectArr.slice(0,5))}
      </div>
      <div class="mt-3">
        ${tableTopTx("Top 5 Transactions (abs)", topTx)}
      </div>
    `;

    out.innerHTML = gridKPIs + gridTables;

    // تطبيق i18n بعد الإدراج
    if(window.I18N && I18N.apply) I18N.apply();

    UT.toast("تم توليد التقرير ✅");
  }

  return { renderMonthly };
})();

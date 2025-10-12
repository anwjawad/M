/* ===========================================
   app.extra.js — ميزات إضافية لتطبيق "مصروفاتي"
   =========================================== */

(function () {
  // حارس بسيط: نتأكد وجود دوال الواجهة
  if (typeof window.apiPost !== 'function') {
    console.warn('[Extra] apiPost غير موجود. تأكد أن هذا الملف يُحمّل بعد سكربت الصفحة الرئيسي.');
    return;
  }

  // -------------------------------
  // إعدادات داخلية
  // -------------------------------
  const LS = {
    summary: 'mx_summary_cache_v1',
    queue: 'mx_offline_queue_v1',
  };
  const SEL = {
    tabTx: '#tab-transactions',
    txList: '#txList',
    overview: '#tab-overview',
  };

  // -------------------------------
  // 1) كاش خفيف للملخص SWR
  // -------------------------------
  function loadSummaryFromCache() {
    try {
      const raw = localStorage.getItem(LS.summary);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  async function fetchAndCacheSummary() {
    const sum = await apiPost({ action: 'summary' });
    try { localStorage.setItem(LS.summary, JSON.stringify(sum)); } catch (_) {}
    return sum;
  }
  // تحسين تجربة: عند فتح الصفحة نعرض من الكاش (إن وُجد) ثم نحدّث من السيرفر.
  document.addEventListener('DOMContentLoaded', async () => {
    const cached = loadSummaryFromCache();
    if (cached) try { paintGuidelines(cached); } catch (_) {}
    try {
      const fresh = await fetchAndCacheSummary();
      paintGuidelines(fresh);
    } catch (_) {}
  });

  // -------------------------------
  // 2) إرشادات الميزانية (Guidelines)
  // -------------------------------
  function ensureGuidelineUI() {
    const root = document.querySelector(SEL.overview);
    if (!root) return;
    if (root.querySelector('#mx-guidelines')) return;

    const wrap = document.createElement('div');
    wrap.id = 'mx-guidelines';
    wrap.className = 'card rounded-2xl p-4 lg:col-span-3 mt-4';
    wrap.innerHTML = `
      <h3 class="text-base font-bold mb-3">إرشادات الميزانية</h3>
      <div id="mx-g-bars" class="grid md:grid-cols-4 gap-3 text-sm"></div>
      <p class="text-xs text-muted mt-2">يتم حساب الحدود من الراتب الأساسي والنِّسب في الإعدادات.</p>
    `;
    root.appendChild(wrap);
  }

  function barRow(label, used, limit) {
    const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    const warnClass = pct >= 90 ? 'text-bad' : (pct >= 70 ? 'text-muted' : 'text-ok');
    return `
      <div class="chip rounded-xl p-3">
        <div class="flex items-center justify-between mb-2">
          <span>${label}</span>
          <b class="${warnClass}">${pct}%</b>
        </div>
        <div class="w-full h-2 rounded bg-black/30 overflow-hidden">
          <div style="width:${pct}%;" class="h-2" ></div>
        </div>
        <div class="mt-2 flex justify-between text-xs opacity-80">
          <span>مصروف: ${fmt(used)}</span>
          <span>حد: ${fmt(limit)}</span>
        </div>
      </div>`;
  }

  function paintGuidelines(summary) {
    ensureGuidelineUI();
    const bars = document.getElementById('mx-g-bars');
    if (!bars || !summary || !summary.settings) return;

    const s = summary.settings;
    const base = Number(s.baseSalary || 0);
    const limits = {
      fixed: base * (Number(s.alloc_fixed || 0) / 100),
      variable: base * (Number(s.alloc_variable || 0) / 100),
      savings: base * (Number(s.alloc_savings || 0) / 100),
      personal: base * (Number(s.alloc_personal || 0) / 100),
    };

    const by = summary.byCat || { fixed:0, variable:0, savings:0, personal:0 };
    bars.innerHTML =
      barRow('ثابت', by.fixed||0, limits.fixed||0) +
      barRow('متغير', by.variable||0, limits.variable||0) +
      barRow('ادخار', by.savings||0, limits.savings||0) +
      barRow('التزامات', by.personal||0, limits.personal||0);
  }

  // عند كل تحديث يدوي، أعد رسم الإرشادات من السيرفر مباشرة
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      try {
        const fresh = await fetchAndCacheSummary();
        paintGuidelines(fresh);
      } catch(_) {}
    });
  }

  // -------------------------------
  // 3) واجهة فلترة + تصدير CSV في تبويب الحركات
  // -------------------------------
  function injectTxFilterUI() {
    const tab = document.querySelector(SEL.tabTx);
    if (!tab || tab.querySelector('#mx-filter')) return;

    const wrap = document.createElement('div');
    wrap.id = 'mx-filter';
    wrap.className = 'card rounded-2xl p-4 mb-3';
    wrap.innerHTML = `
      <div class="grid md:grid-cols-6 gap-2 text-sm">
        <input id="mx-q" class="chip rounded-xl px-3 py-2 bg-transparent" placeholder="بحث في الملاحظة" />
        <select id="mx-cat" class="chip rounded-xl px-3 py-2 bg-transparent">
          <option value="">كل الفئات</option>
          <option value="fixed">ثابتة</option>
          <option value="variable">متغيرة</option>
          <option value="savings">ادخار</option>
          <option value="personal">التزامات</option>
        </select>
        <input id="mx-from" type="date" class="chip rounded-xl px-3 py-2 bg-transparent" />
        <input id="mx-to" type="date" class="chip rounded-xl px-3 py-2 bg-transparent" />
        <button id="mx-apply" class="btn rounded-xl px-3 py-2">تصفية</button>
        <div class="flex gap-2">
          <button id="mx-reset" class="btn rounded-xl px-3 py-2">إعادة</button>
          <button id="mx-export" class="btn rounded-xl px-3 py-2">تصدير CSV</button>
        </div>
      </div>
    `;
    tab.prepend(wrap);

    const q = wrap.querySelector('#mx-q');
    const cat = wrap.querySelector('#mx-cat');
    const from = wrap.querySelector('#mx-from');
    const to = wrap.querySelector('#mx-to');
    const apply = wrap.querySelector('#mx-apply');
    const reset = wrap.querySelector('#mx-reset');
    const exportBtn = wrap.querySelector('#mx-export');

    async function loadFiltered() {
      const all = await apiPost({ action:'transactions' });
      let rows = all.data || [];
      // طبق الفلاتر
      const qv = (q.value || '').trim().toLowerCase();
      const cv = (cat.value || '').trim();
      const fv = from.value ? new Date(from.value).getTime() : null;
      const tv = to.value ? new Date(to.value + 'T23:59:59').getTime() : null;

      rows = rows.filter(r => {
        const t = (r.note || '').toLowerCase();
        const inQ = qv ? t.includes(qv) : true;
        const inCat = cv ? r.category === cv : true;
        const ts = r.timestamp ? new Date(r.timestamp).getTime() : 0;
        const inFrom = fv ? (ts >= fv) : true;
        const inTo = tv ? (ts <= tv) : true;
        return inQ && inCat && inFrom && inTo;
      });

      // اعرض
      const txList = document.querySelector(SEL.txList);
      if (txList) {
        txList.innerHTML = rows.slice().reverse().map(t => `
          <div class="flex items-center justify-between chip rounded-xl px-3 py-2">
            <div class="flex items-center gap-2">
              <span class="text-xs opacity-70">${new Date(t.timestamp).toLocaleString('ar-EG')}</span>
              <span class="text-xs">${t.category}</span>
              <span class="text-xs opacity-70">${t.note||''}</span>
            </div>
            <b class="${t.type==='income'?'text-ok':'text-bad'}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</b>
          </div>
        `).join('');
      }

      // خزّن آخر نتائج لاستخدام التصدير
      window.__mx_last_filtered = rows;
    }

    apply.addEventListener('click', loadFiltered);
    reset.addEventListener('click', () => { q.value=''; cat.value=''; from.value=''; to.value=''; loadFiltered(); });

    // أول تحميل للحركات عند الدخول للتبويب
    const txTabBtn = document.querySelector('button.tab[data-tab="transactions"]');
    if (txTabBtn) txTabBtn.addEventListener('click', loadFiltered);

    // زر تصدير CSV
    exportBtn.addEventListener('click', () => {
      const rows = window.__mx_last_filtered || [];
      if (!rows.length) { alert('لا توجد نتائج لتصديرها'); return; }
      const header = ['timestamp','type','category','amount','note'];
      const csv = [header.join(',')].concat(
        rows.map(r => [
          new Date(r.timestamp).toISOString(),
          r.type, r.category, r.amount, (String(r.note||'').replace(/"/g,'""'))
        ].map(x => /[",\n]/.test(String(x)) ? `"${x}"` : x).join(','))
      ).join('\n');

      const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });
  }

  // حقن واجهة الفلترة عندما تُحمّل الصفحة
  document.addEventListener('DOMContentLoaded', injectTxFilterUI);

  // -------------------------------
  // 4) طابور غير متصل لإضافة الحركات
  // -------------------------------
  const _apiPostOrig = window.apiPost;
  window.apiPost = async function(body){
    // نلف addTransaction لنعالج الانقطاعات
    if (body && body.action === 'addTransaction') {
      try {
        const res = await _apiPostOrig(body);
        return res;
      } catch (err) {
        // خزّن الطلب في طابور محلي
        try {
          const q = JSON.parse(localStorage.getItem(LS.queue) || '[]');
          q.push({ when: Date.now(), body });
          localStorage.setItem(LS.queue, JSON.stringify(q));
          console.warn('[Extra] أُضيف الطلب إلى الطابور لعدم توفر الشبكة.');
        } catch (_){}
        // نُعيد استجابة مقبولة حتى لا تتعطل الواجهة
        return { ok:true, offline:true };
      }
    }
    // باقي الطلبات كما هي
    return _apiPostOrig(body);
  };

  async function flushQueue(){
    let q;
    try { q = JSON.parse(localStorage.getItem(LS.queue) || '[]'); } catch(_){ q = []; }
    if (!q.length) return;

    const still = [];
    for (const item of q) {
      try {
        await _apiPostOrig(item.body);
      } catch (_) {
        still.push(item); // أبقه للمرة القادمة
      }
    }
    localStorage.setItem(LS.queue, JSON.stringify(still));
    if (q.length !== still.length) {
      try {
        const fresh = await fetchAndCacheSummary();
        paintGuidelines(fresh);
        if (typeof window.refresh === 'function') window.refresh();
      } catch (_){}
    }
  }
  window.addEventListener('online', flushQueue);
  window.addEventListener('focus', flushQueue);

  // -------------------------------
  // أدوات مساعدة عامة
  // -------------------------------
  function fmt(n){ return Number(n||0).toLocaleString('ar-EG'); }
})();

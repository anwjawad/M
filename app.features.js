/* =====================================================
   app.features.js — Organized, RTL, Logic/UI separation
   ===================================================== */

(function () {
  'use strict';

  // ====== Guards ======
  if (typeof window.apiPost !== 'function' || typeof window.refresh !== 'function') {
    console.warn('[features] Missing apiPost/refresh — include after main script.');
  }

  // ====== Toast system ======
  const Toast = (() => {
    let box;
    function ensure() {
      if (!box) {
        box = document.createElement('div');
        box.dir = 'rtl';
        box.style.cssText = 'position:fixed;inset-inline-start:16px;bottom:16px;z-index:9999;display:flex;flex-direction:column;gap:8px';
        document.body.appendChild(box);
      }
    }
    function show(msg, ok=true) {
      ensure();
      const el = document.createElement('div');
      el.className = 'chip rounded-xl px-3 py-2 text-sm card';
      el.style.borderColor = ok ? 'var(--ok)' : 'var(--bad)';
      el.textContent = msg;
      box.appendChild(el);
      setTimeout(()=> { el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=> el.remove(), 300); }, 2000);
    }
    return { show };
  })();

  // ====== Offline queue wrapper (generic) ======
  const _apiPost = window.apiPost;
  window.apiPost = async function (body) {
    try {
      const res = await _apiPost(body);
      return res;
    } catch (err) {
      try {
        const q = JSON.parse(localStorage.getItem('mx_queue_v2') || '[]');
        q.push({ when: Date.now(), body });
        localStorage.setItem('mx_queue_v2', JSON.stringify(q));
        Toast.show('تمت الجدولة دون اتصال. ستُرسل لاحقًا.', true);
      } catch(_) {}
      return { ok:true, offline:true };
    }
  };
  async function flushQueue(){
    let q;
    try { q = JSON.parse(localStorage.getItem('mx_queue_v2') || '[]'); } catch(_){ q = []; }
    if (!q.length) return;
    const rest = [];
    for (const it of q) {
      try { await _apiPost(it.body); }
      catch(_) { rest.push(it); }
    }
    localStorage.setItem('mx_queue_v2', JSON.stringify(rest));
    if (q.length !== rest.length) {
      if (typeof window.refresh === 'function') window.refresh();
    }
  }
  window.addEventListener('online', flushQueue);
  window.addEventListener('focus', flushQueue);

  // ====== Helpers ======
  const fmt = (n)=> Number(n||0).toLocaleString('ar-EG');

  // ====== 1) DELETE TRANSACTIONS ======
  function injectDeleteUI() {
    const txList = document.getElementById('txList');
    if (!txList) return;

    // create confirm modal once
    if (!document.getElementById('mx-del-modal')) {
      const m = document.createElement('div');
      m.id = 'mx-del-modal';
      m.className = 'modal';
      m.innerHTML = `
        <div class="card rounded-2xl p-4 w-[92vw] max-w-md">
          <h3 class="text-lg font-bold mb-3">تأكيد الحذف</h3>
          <div id="mx-del-text" class="text-sm text-muted mb-3"></div>
          <div class="flex gap-2 justify-end">
            <button id="mx-del-cancel" class="btn rounded-xl px-3 py-2">إلغاء</button>
            <button id="mx-del-ok" class="btn rounded-xl px-3 py-2">حذف</button>
          </div>
        </div>`;
      document.body.appendChild(m);
      m.addEventListener('click', (e)=> { if(e.target===m) m.classList.remove('active'); });
      m.querySelector('#mx-del-cancel').addEventListener('click', ()=> m.classList.remove('active'));
    }

    // augment each row with delete button (id must be present)
    Array.from(txList.querySelectorAll('[data-tx-id]')).forEach(el => {}); // clear pass if rerun

    // rebuild with delete icon
    const items = Array.from(txList.children);
    txList.innerHTML = '';
    items.forEach(item => {
      // try to parse info from innerHTML when available
      // we rely on data attributes from refresh hook below
      txList.appendChild(item);
    });
  }

  // Hook after main refresh() to add delete buttons and data attributes
  const _refresh = window.refresh;
  window.refresh = async function(){
    await _refresh();

    const txList = document.getElementById('txList');
    if(!txList) return;

    // Re-render list with delete button by refetching transactions (needs ids)
    try {
      const tx = await apiPost({ action:'transactions' });
      const rows = tx.data.slice().reverse();
      txList.innerHTML = rows.map(t => `
        <div class="flex items-center justify-between chip rounded-xl px-3 py-2" data-tx-id="${t.id}" data-tx-cat="${t.category}" data-tx-amt="${t.amount}" data-tx-ts="${t.timestamp}">
          <div class="flex items-center gap-2">
            <span class="text-xs opacity-70">${new Date(t.timestamp).toLocaleString('ar-EG')}</span>
            <span class="text-xs">${t.category}</span>
            <span class="text-xs opacity-70">${t.note||''}</span>
          </div>
          <div class="flex items-center gap-3">
            <b class="${t.type==='income'?'text-ok':'text-bad'}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</b>
            <button class="btn rounded-xl px-2 py-1" data-del="${t.id}" title="حذف">🗑️</button>
          </div>
        </div>
      `).join('');

      // bind delete
      txList.querySelectorAll('button[data-del]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-del');
          const row = btn.closest('[data-tx-id]');
          const m = document.getElementById('mx-del-modal');
          m.classList.add('active');
          const info = `الفئة: ${row.getAttribute('data-tx-cat')} — المبلغ: ${fmt(row.getAttribute('data-tx-amt'))} — التاريخ: ${new Date(Number(row.getAttribute('data-tx-ts'))||row.getAttribute('data-tx-ts')).toLocaleString('ar-EG')}`;
          m.querySelector('#mx-del-text').textContent = info;
          const okBtn = m.querySelector('#mx-del-ok');
          const handler = async () => {
            okBtn.removeEventListener('click', handler);
            m.classList.remove('active');
            await apiPost({ action:'deleteTransaction', id });
            Toast.show('تم الحذف بنجاح', true);
            window.refresh();
          };
          okBtn.addEventListener('click', handler);
        });
      });

    } catch(_) {}
  };

  // ====== 2) CUSTOM CATEGORIES ======
  async function loadCategories(){
    const res = await apiPost({ action:'listCategories' });
    return (res && res.data) || [];
  }
  async function paintCategoriesUI(){
    const host = document.getElementById('tab-settings');
    if(!host || document.getElementById('mx-cat-card')) return;

    const card = document.createElement('div');
    card.id = 'mx-cat-card';
    card.className = 'card rounded-2xl p-4 space-y-3 mt-4';
    card.innerHTML = `
      <h3 class="text-base font-bold">الفئات</h3>
      <div class="grid md:grid-cols-4 gap-2 text-sm" id="mx-cat-list"></div>
      <div class="grid md:grid-cols-5 gap-2 text-sm">
        <input id="mx-cat-name" class="chip rounded-xl px-3 py-2 bg-transparent" placeholder="اسم الفئة"/>
        <input id="mx-cat-color" type="color" class="chip rounded-xl px-3 py-2 bg-transparent" value="#64748b"/>
        <input id="mx-cat-icon" class="chip rounded-xl px-3 py-2 bg-transparent" placeholder="أيقونة (اختياري) مثل: 🛒"/>
        <select id="mx-cat-enabled" class="chip rounded-xl px-3 py-2 bg-transparent"><option value="1">مفعلة</option><option value="0">معطلة</option></select>
        <button id="mx-cat-add" class="btn rounded-xl px-3 py-2">إضافة فئة</button>
      </div>
      <p class="text-xs text-muted">لا يمكن حذف فئة مستخدمة في الحركات، يمكنك تعطيلها.</p>
    `;

    host.appendChild(card);

    async function renderList(){
      const cats = await loadCategories();
      const list = card.querySelector('#mx-cat-list');
      list.innerHTML = cats.map(c => `
        <div class="chip rounded-xl px-3 py-2 flex items-center justify-between" data-cat-id="${c.id}">
          <span class="flex items-center gap-2"><span style="display:inline-block;width:12px;height:12px;border-radius:999px;background:${c.color};"></span>${c.icon||''} ${c.name}</span>
          <label class="text-xs flex items-center gap-1">
            <input type="checkbox" ${c.enabled?'checked':''} data-toggle="${c.id}"/> مفعلة
          </label>
        </div>
      `).join('');

      // toggle enabled
      list.querySelectorAll('input[data-toggle]').forEach(chk=>{
        chk.addEventListener('change', async ()=>{
          const id = chk.getAttribute('data-toggle');
          await apiPost({ action:'updateCategory', id, enabled: chk.checked });
          Toast.show('تم تحديث الفئة', true);
          await refreshCategoriesIntoModal();
          window.refresh();
        });
      });
    }

    // add category
    card.querySelector('#mx-cat-add').addEventListener('click', async ()=>{
      const name = card.querySelector('#mx-cat-name').value.trim();
      const color = card.querySelector('#mx-cat-color').value || '#64748b';
      const icon = card.querySelector('#mx-cat-icon').value || '';
      const enabled = card.querySelector('#mx-cat-enabled').value === '1';
      if(!name){ alert('اكتب اسم الفئة'); return; }
      await apiPost({ action:'addCategory', name, color, icon, enabled });
      card.querySelector('#mx-cat-name').value = '';
      card.querySelector('#mx-cat-icon').value = '';
      Toast.show('تمت إضافة الفئة', true);
      await renderList();
      await refreshCategoriesIntoModal();
    });

    await renderList();
  }

  async function refreshCategoriesIntoModal(){
    const cats = await loadCategories();
    const enabled = cats.filter(c=>c.enabled!==false);
    const select = document.getElementById('category');
    if(!select) return;
    select.innerHTML = enabled.map(c => `<option value="${c.name}">${c.icon?c.icon+' ':''}${c.name}</option>`).join('');
  }

  // override pie to support dynamic categories
  window.renderPie = function(byCat){
    const labels = Object.keys(byCat||{});
    const data = labels.map(k => byCat[k]||0);
    const ctx = document.getElementById('pie');
    if(window.__pie){ window.__pie.destroy(); }
    window.__pie = new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets: [{ data }] },
      options: { responsive:true, plugins:{ legend:{ position:'bottom' } } }
    });
  };

  // ====== 3) TABS: Orders & Pending Purchase ======
  function addTab(key, title){
    // add button
    const bar = document.querySelector('nav.flex.gap-4');
    const btn = document.createElement('button');
    btn.className = 'tab px-2 pb-2';
    btn.dataset.tab = key;
    btn.textContent = title;
    bar.appendChild(btn);
    // section
    const sec = document.createElement('section');
    sec.id = 'tab-'+key;
    sec.className = 'hidden';
    sec.innerHTML = `<div class="card rounded-2xl p-4 space-y-3"></div>`;
    document.querySelector('.max-w-5xl').appendChild(sec);

    // hook tab behavior (same as existing)
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.tab').forEach(b=> b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('section[id^="tab-"]').forEach(s=> s.classList.add('hidden'));
      sec.classList.remove('hidden');
    });
    return sec;
  }

  const ordersSec = addTab('orders', 'طلبات');
  const pendingSec = addTab('pending', 'قيد الشراء');
  const reportSec = addTab('report', 'تقرير شهري');

  // Orders UI
  function paintOrdersUI(){
    const host = ordersSec.querySelector('.card');
    host.innerHTML = `
      <h3 class="text-base font-bold">قائمة جديدة</h3>
      <div class="grid md:grid-cols-4 gap-2 text-sm">
        <input id="mx-l-name" class="chip rounded-xl px-3 py-2 bg-transparent" placeholder="اسم القائمة"/>
        <input id="mx-l-note" class="chip rounded-xl px-3 py-2 bg-transparent" placeholder="ملاحظات (اختياري)"/>
        <select id="mx-l-cat" class="chip rounded-xl px-3 py-2 bg-transparent"></select>
        <button id="mx-l-create" class="btn rounded-xl px-3 py-2">إنشاء</button>
      </div>

      <div class="grid md:grid-cols-5 gap-2 text-sm mt-3">
        <input id="mx-it-name" class="chip rounded-xl px-3 py-2 bg-transparent" placeholder="اسم العنصر"/>
        <input id="mx-it-qty" type="number" class="chip rounded-xl px-3 py-2 bg-transparent" placeholder="الكمية" value="1"/>
        <input id="mx-it-est" type="number" class="chip rounded-xl px-3 py-2 bg-transparent" placeholder="تكلفة تقديرية"/>
        <input id="mx-it-listId" class="chip rounded-xl px-3 py-2 bg-transparent" placeholder="معرّف القائمة"/>
        <button id="mx-it-add" class="btn rounded-xl px-3 py-2">إضافة عنصر</button>
      </div>

      <div id="mx-open-lists" class="mt-4"></div>
    `;

    // fill categories
    loadCategories().then(cats=>{
      const sel = host.querySelector('#mx-l-cat');
      sel.innerHTML = cats.filter(c=>c.enabled!==false).map(c=> `<option value="${c.name}">${c.icon?c.icon+' ':''}${c.name}</option>`).join('');
    });

    host.querySelector('#mx-l-create').addEventListener('click', async ()=>{
      const name = host.querySelector('#mx-l-name').value.trim();
      const note = host.querySelector('#mx-l-note').value.trim();
      const defaultCategory = host.querySelector('#mx-l-cat').value;
      if(!name){ alert('اكتب اسم القائمة'); return; }
      const r = await apiPost({ action:'createList', name, defaultCategory, note });
      host.querySelector('#mx-it-listId').value = r.id;
      Toast.show('تم إنشاء القائمة', true);
      renderOpenLists(); 
    });

    host.querySelector('#mx-it-add').addEventListener('click', async ()=>{
      const listId = host.querySelector('#mx-it-listId').value.trim();
      const name = host.querySelector('#mx-it-name').value.trim();
      const qty = Number(host.querySelector('#mx-it-qty').value||1);
      const estCost = Number(host.querySelector('#mx-it-est').value||0);
      if(!listId || !name){ alert('حدّد القائمة واسم العنصر'); return; }
      await apiPost({ action:'addListItem', listId, name, qty, estCost });
      Toast.show('تمت إضافة العنصر', true);
      host.querySelector('#mx-it-name').value='';
      host.querySelector('#mx-it-est').value='';
      renderOpenLists();
    });
  }

  async function renderOpenLists(){
    const host = ordersSec.querySelector('#mx-open-lists');
    const res = await apiPost({ action:'listOpenLists' });
    const lists = res.data || [];
    host.innerHTML = `
      <h3 class="text-base font-bold mb-2">قوائم مفتوحة</h3>
      <div class="grid md:grid-cols-3 gap-3">
        ${lists.map(l => `
          <div class="card rounded-2xl p-3">
            <div class="flex items-center justify-between">
              <b>${l.name}</b>
              <span class="text-xs text-muted">عناصر: ${l.items||0}</span>
            </div>
            <div class="text-xs mt-1">تقديري: ${fmt(l.estTotal||0)}</div>
            <button class="btn rounded-xl px-3 py-2 mt-3" data-open="${l.id}">فتح</button>
          </div>
        `).join('')}
      </div>
    `;

    host.querySelectorAll('button[data-open]').forEach(btn=>{
      btn.addEventListener('click', ()=> openListDetail(btn.getAttribute('data-open')));
    });
  }

  async function openListDetail(listId){
    // Switch to Pending tab and render items
    document.querySelector('button.tab[data-tab="pending"]').click();
    await renderPending(listId);
  }

  // Pending Purchase UI
  function ensurePurchaseModal(){
    if(document.getElementById('mx-buy-modal')) return;
    const m = document.createElement('div');
    m.id = 'mx-buy-modal';
    m.className = 'modal';
    m.innerHTML = `
      <div class="card rounded-2xl p-4 w-[92vw] max-w-md">
        <h3 class="text-lg font-bold mb-3">تسجيل شراء</h3>
        <div class="space-y-2">
          <input id="mx-buy-cost" type="number" class="chip rounded-xl px-3 py-2 bg-transparent" placeholder="التكلفة الفعلية"/>
          <select id="mx-buy-cat" class="chip rounded-xl px-3 py-2 bg-transparent"></select>
          <input id="mx-buy-note" class="chip rounded-xl px-3 py-2 bg-transparent" placeholder="ملاحظة (اختياري)"/>
          <div class="flex gap-2 justify-end">
            <button id="mx-buy-cancel" class="btn rounded-xl px-3 py-2">إلغاء</button>
            <button id="mx-buy-ok" class="btn rounded-xl px-3 py-2">حفظ</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', (e)=> { if(e.target===m) m.classList.remove('active'); });
    m.querySelector('#mx-buy-cancel').addEventListener('click', ()=> m.classList.remove('active'));
  }

  async function renderPending(listId){
    ensurePurchaseModal();
    const host = pendingSec.querySelector('.card');
    const lists = await apiPost({ action:'listOpenLists' });
    const current = (lists.data||[]).find(x => x.id===listId) || (lists.data||[])[0];
    if(!current){ host.innerHTML = '<div class="text-sm text-muted">لا توجد قوائم مفتوحة.</div>'; return; }

    const itemsRes = await apiPost({ action:'listItems', listId: current.id });
    const items = itemsRes.data || [];

    host.innerHTML = `
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold">${current.name}</h3>
        <button class="btn rounded-xl px-3 py-2" id="mx-finish">إنهاء القائمة</button>
      </div>
      <div class="mt-3 space-y-2">
        ${items.map(it => `
          <div class="chip rounded-xl px-3 py-2 flex items-center justify-between" data-item="${it.id}">
            <div class="flex items-center gap-2 text-sm">
              <input type="checkbox" ${it.status==='purchased'?'checked':''} ${it.status==='purchased'?'disabled':''} data-buy="${it.id}"/>
              <span>${it.name} × ${fmt(it.qty)}</span>
              <span class="text-xs text-muted">تقديري: ${fmt(it.estCost||0)}</span>
            </div>
            <div class="text-xs">${it.status==='purchased' ? 'تم الشراء' : ''}</div>
          </div>
        `).join('')}
      </div>
    `;

    // bind purchase
    host.querySelectorAll('input[data-buy]').forEach(chk=>{
      chk.addEventListener('change', async ()=>{
        const id = chk.getAttribute('data-buy');
        const modal = document.getElementById('mx-buy-modal');
        modal.classList.add('active');

        // fill categories
        const cats = await loadCategories();
        const sel = modal.querySelector('#mx-buy-cat');
        sel.innerHTML = cats.filter(c=>c.enabled!==false).map(c=> `<option value="${c.name}">${c.icon?c.icon+' ':''}${c.name}</option>`).join('');

        const ok = modal.querySelector('#mx-buy-ok');
        const handler = async ()=>{
          ok.removeEventListener('click', handler);
          modal.classList.remove('active');
          const cost = Number(modal.querySelector('#mx-buy-cost').value||0);
          const cat = modal.querySelector('#mx-buy-cat').value;
          const note = modal.querySelector('#mx-buy-note').value;
          await apiPost({ action:'markItemPurchased', itemId:id, actualCost:cost, category:cat, note });
          Toast.show('تم تسجيل الشراء', true);
          window.refresh();
          renderPending(current.id);
        };
        ok.addEventListener('click', handler);
      });
    });

    // finish list
    host.querySelector('#mx-finish').addEventListener('click', async ()=>{
      await apiPost({ action:'finishList', listId: current.id });
      Toast.show('تم إنهاء القائمة', true);
      renderOpenLists();
      renderPending(current.id);
      window.refresh();
    });
  }

  // ====== 4) Monthly Report tab ======
  function paintReportUI(){
    const host = reportSec.querySelector('.card');
    host.innerHTML = `
      <h3 class="text-base font-bold">تقرير الشهر الحالي</h3>
      <div class="grid md:grid-cols-3 gap-3 my-2">
        <div class="chip rounded-xl px-3 py-2">الدخل: <b id="mx-r-inc">0</b></div>
        <div class="chip rounded-xl px-3 py-2">المصاريف: <b id="mx-r-exp">0</b></div>
        <div class="chip rounded-xl px-3 py-2">الرصيد: <b id="mx-r-bal">0</b></div>
      </div>
      <canvas id="mx-report-line"></canvas>
    `;
  }
  async function renderReport(){
    const r = await apiPost({ action:'monthlyReport' });
    document.getElementById('mx-r-inc').textContent = fmt(r.income);
    document.getElementById('mx-r-exp').textContent = fmt(r.expense);
    document.getElementById('mx-r-bal').textContent = fmt((r.income||0)-(r.expense||0));
    const ctx = document.getElementById('mx-report-line');
    if(window.__report){ window.__report.destroy(); }
    window.__report = new Chart(ctx, {
      type:'line',
      data:{
        labels: r.days,
        datasets:[
          { label:'الدخل اليومي', data:r.seriesIncome },
          { label:'المصاريف اليومية', data:r.seriesExpense }
        ]
      },
      options:{ responsive:true, plugins:{ legend:{ position:'bottom' } } }
    });
  }

  // ====== Boot ======
  document.addEventListener('DOMContentLoaded', async () => {
    // delete UI will attach after first refresh()
    await refreshCategoriesIntoModal();
    injectDeleteUI();
    paintCategoriesUI();
    paintOrdersUI();
    renderOpenLists();
    paintReportUI();

    // Render report when tab opened
    const btn = document.querySelector('button.tab[data-tab="report"]');
    if(btn) btn.addEventListener('click', renderReport);
  });

})();

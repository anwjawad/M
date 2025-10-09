/* v0.1.0 — Replacement */
window.APP_SYNC = (function(){
  async function syncNow(){
    try{
      // 1) تأكد من المخطط في Google Sheets
      await UT.fetchGAS("ensureSchema",{});
      // 2) ادفع الطابور إن وُجد
      const q = UT.queueAll();
      if(q.length){
        const grouped = {};
        for(const item of q){
          const key = `${item.op}:${item.table}`;
          grouped[key] = grouped[key] || [];
          if(item.rows) grouped[key].push(...item.rows);
        }
        await APP_DATA.writeBatch(grouped);
        UT.queueClear();
      }
      // 3) اقرأ دفعة واحدة
      await APP_DATA.readBatch();
      UT.toast("المزامنة مكتملة ✅");
    }catch(err){
      console.error(err);
      UT.toast("فشل المزامنة ❌","error");
    }
  }

  // Service Worker (اختياري)
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }

  return { syncNow };
})();

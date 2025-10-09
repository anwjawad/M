/* ==========================================================================
   app-sync.js — مصروفي
   النسخة: v0.1.0
   الغرض:
   - مزامنة سريعة وآمنة مع Google Sheets عبر GAS Web App.
   - خطوات المزامنة: ensureSchema → دفع الطابور (bulk) → قراءة دفعة واحدة.
   - دعم وضع الأوفلاين (Queue) وعدم فقدان البيانات.
   - تسجيل Service Worker (للكاش الأساسي) بدون تعارض مع GitHub Pages.
   ========================================================================== */

window.APP_SYNC = (function(){

  /**
   * يجمع عناصر الطابور المحلية في مجموعات لكل جدول/عملية:
   * { "insert:transactions": [rows...], "insert:accounts": [rows...] }
   */
  function groupQueueForBatch(queue){
    const grouped = {};
    for(const item of (queue||[])){
      const key = `${item.op}:${item.table}`;
      if(!grouped[key]) grouped[key] = [];
      if(Array.isArray(item.rows)) grouped[key].push(...item.rows);
    }
    return grouped;
  }

  /**
   * محاولة مزامنة كاملة الآن.
   * - إذا لم يكن هناك gasUrl أو كنا أوفلاين → رسالة مناسبة فقط.
   * - أي خطأ في خطوة لا يمنع حفظ البيانات المحلية.
   */
  async function syncNow(){
    if(!APP_CONFIG.gasUrl){
      UT.toast("ضع رابط GAS في الإعدادات أولًا","error");
      return false;
    }
    if(!UT.isOnline()){
      UT.toast("لا يوجد اتصال—سيتم المزامنة لاحقًا","error");
      return false;
    }

    try{
      // 1) تأكد من المخطط في Google Sheets
      const sch = await UT.fetchGAS("ensureSchema", {});
      if(!sch || sch.ok !== true) throw new Error("ensureSchema failed");

      // 2) ادفع الطابور الحالي (إن وجد) على شكل دفعات
      const queue = UT.queueAll();
      if(queue.length){
        const grouped = groupQueueForBatch(queue);
        if(Object.keys(grouped).length){
          await APP_DATA.writeBatch(grouped);
          UT.queueClear();
        }
      }

      // 3) اقرأ دفعة واحدة لتحديث الحالة المحلية
      await APP_DATA.readBatch();

      UT.toast("المزامنة مكتملة ✅");
      return true;

    }catch(err){
      // لا نستخدم console.log في الإصدار النهائي؛ نظهر رسالة فقط.
      UT.toast("فشل المزامنة ❌","error");
      return false;
    }
  }

  /* ===================== تسجيل Service Worker ===================== */
  // يُساعد في الأوفلاين والكاش للملفات الأساسية.
  if("serviceWorker" in navigator){
    // نسجل SW نسبيًا ليتوافق مع GitHub Pages
    navigator.serviceWorker.register("./sw.js").catch(function(){ /* تجاهل */ });
  }

  /* ===================== تعريض الواجهة ===================== */
  return { syncNow };
})();

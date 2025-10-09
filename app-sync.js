/* ==========================================================================
   app-sync.js — مصروفي
   النسخة: v0.1.1
   الغرض:
   - مزامنة سريعة وآمنة مع Google Sheets عبر GAS Web App.
   - خطوات المزامنة: ensureSchema → دفع الطابور (bulk) → قراءة دفعة واحدة.
   - دعم وضع الأوفلاين (Queue) وعدم فقدان البيانات.
   - تسجيل Service Worker (للكاش الأساسي) بدون تعارض مع GitHub Pages.
   - ✨ جديد v0.1.1: مزامنة تلقائية ذكية (Auto Sync) تعمل بالخلفية.
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

  // قفل بسيط لمنع تشغيل مزامنتين بالتوازي
  let _syncLock = false;

  /**
   * محاولة مزامنة كاملة الآن.
   * - إذا لم يكن هناك gasUrl أو كنا أوفلاين → رسالة مناسبة فقط.
   * - أي خطأ في خطوة لا يمنع حفظ البيانات المحلية.
   */
  async function syncNow({silent=false} = {}){
    if(_syncLock) return false;
    if(!APP_CONFIG.gasUrl){
      if(!silent) UT.toast("ضع رابط GAS في الإعدادات أولًا","error");
      return false;
    }
    if(!UT.isOnline()){
      if(!silent) UT.toast("لا يوجد اتصال—سيتم المزامنة لاحقًا","error");
      return false;
    }

    _syncLock = true;
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

      if(!silent) UT.toast("المزامنة مكتملة ✅");
      return true;

    }catch(_err){
      if(!silent) UT.toast("فشل المزامنة ❌","error");
      return false;
    } finally {
      _syncLock = false;
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

/* ===================== Auto Sync (Smart Background) ===================== */
/**
 * مزامنة تلقائية ذكية:
 * - عند عودة الاتصال بالإنترنت.
 * - بعد كل تغيير بيانات محلي (حدث "data:changed").
 * - كل 3 دقائق بشكل هادئ (silent) لتحديث الحالة حتى بدون طابور.
 */
(function(){
  const AUTO_SYNC_INTERVAL = 1000 * 60 * 3; // كل 3 دقائق
  let autoSyncTimer = null;
  let _cooldown = false;

  async function tryAutoSync({force=false} = {}){
    if(!APP_CONFIG.gasUrl) return;
    if(!UT.isOnline()) return;

    // تبريد بسيط لمنع تكرار شديد
    if(_cooldown && !force) return;
    _cooldown = true;
    setTimeout(()=>{ _cooldown = false; }, 4000);

    const queue = UT.queueAll();
    if(queue.length > 0){
      // إرسال دفعة واحدة — إظهار صامت
      await APP_SYNC.syncNow({silent:true});
    }else{
      // بدون طابور: تحديث خفيف للبيانات من الشيت
      try{
        await APP_DATA.readBatch();
      }catch(_){ /* تجاهل */ }
    }
  }

  // مزامنة عند استعادة الاتصال بالإنترنت
  window.addEventListener("online", ()=> tryAutoSync({force:true}));

  // مزامنة تلقائية بعد كل حفظ جديد (الواجهة تطلق حدث data:changed)
  document.addEventListener("data:changed", ()=> tryAutoSync());

  // مزامنة مجدولة صامتة كل عدة دقائق
  autoSyncTimer = setInterval(()=> tryAutoSync(), AUTO_SYNC_INTERVAL);

  // محاولة أولى عند تحميل الصفحة إذا توفّر URL
  if(APP_CONFIG.gasUrl && UT.isOnline()){
    tryAutoSync({force:true});
  }
})();

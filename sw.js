/* ==========================================================================
   sw.js — مصروفي (Service Worker)
   النسخة: v0.1.0
   الغرض:
   - كاش أساسي للملفات الثابتة لسرعة التحميل ودعم العمل دون اتصال.
   - متوافق مع GitHub Pages (مسارات نسبية).
   - إستراتيجية: Cache, falling back to Network.
   ========================================================================== */

const CACHE_NAME = "masrofi-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./main.css",
  "./app-config.js",
  "./app-i18n.js",
  "./app-state.js",
  "./app-utils.js",
  "./app-dom.js",
  "./app-forms.js",
  "./app-data.js",
  "./app-sync.js",
  "./app-reports.js",
  "./app-modals.js"
];

// التثبيت: تخزين الأصول الأساسية
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// التفعيل: تنظيف الكاشات القديمة عند تغيير الاسم
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
});

// الجلب: محاولة من الكاش ثم شبكة
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // لا نتعامل مع طلبات غير GET
  if (req.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        // نخزّن فقط طلبات نفس الأصل (relative) لتفادي مشاكل CORS
        const url = new URL(req.url);
        if (url.origin === location.origin) {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, respClone));
        }
        return resp;
      }).catch(() => {
        // Fall back: إن لم يتوفر شيء، نحاول إعادة index.html (تطبيق SPA بسيط)
        return caches.match("./index.html");
      });
    })
  );
});

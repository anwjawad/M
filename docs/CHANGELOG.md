# CHANGELOG — مصروفي

يُسجّل هذا الملف جميع التغييرات التي تطرأ على التطبيق مع تحديد نوع التعديل:  
**Replacement** (استبدال كامل) أو **Patch** (تعديل جزئي).

---

## 🧱 النسخة: v0.1.0 — التأسيس الأولى
**النوع:** Replacement (كامل)  
**التاريخ:** 2025-10-09  

### ✨ المكونات الأساسية
- **بنية المشروع الكاملة** حسب تعليمات المستخدم:
/web, /gas, /docs, /assets, /schemas
- **فصل المنطق عن الواجهة** بشكل صارم:
- app-config.js → إعدادات عامة
- app-utils.js → أدوات عامة
- app-dom.js → واجهة المستخدم
- app-forms.js → النماذج والمعاملات
- app-data.js → المنطق البياني والقراءة/الكتابة
- app-sync.js → المزامنة مع GAS
- app-reports.js → التقارير والإحصائيات
- app-modals.js → إدارة النوافذ المنبثقة (حسابات/فئات)
- sw.js → دعم Offline Mode وCache

---

### 🧩 GAS Integration
- إنشاء `Code.gs` كملف مركزي للـ API:
- `doGet`, `doPost`, `ensureSchema`, `readBatch_`, `writeBatch_`
- إضافة `Batch.gs` لعمليات متقدمة مستقبلية (Pagination, CRUD).
- تصميم الاستجابات بصيغة `text/plain` JSON لتجنب CORS.
- اعتماد مخطط موحد مطابق لـ `/schemas/schema.json`.

---

### 🧰 واجهة المستخدم (UI/UX)
- تصميم حديث متجاوب RTL بالكامل.
- دعم الثيمات: `Neon`, `Ocean`, `Rose`, `Mint`.
- نافذة إعدادات (⚙️) للتحكم في الألوان، اللغة، الحركات.
- نظام Toast Notifications موحّد لكل العمليات.
- واجهة step-based للنماذج الطويلة (Transactions).
- دعم كامل للموبايل + سطح المكتب.

---

### 🧮 منطق التطبيق
- تخزين البيانات في LocalStorage عند العمل أوفلاين.
- إرسال كل العمليات دفعة واحدة عند المزامنة (Batch Queue).
- كتابة البيانات في Google Sheets دفعة واحدة لكل جدول.
- قراءة كل الجداول دفعة واحدة عبر `readBatch`.

---

### 🧱 بنية البيانات
- تعريف هيكل كامل في `/schemas/schema.json`.
- توثيق مفصل في `/docs/SCHEMA.md`.
- الربط الثابت عبر خاصية `data-bind="<table>.<field>"`.
- ضمان التطابق مع الأعمدة في Google Sheets.

---

### 🌍 النشر والتكامل
- **GitHub Pages** لواجهة الويب.
- **Google Apps Script** كخادم خلفي.
- روابط نسبية لتفادي CORS.
- دعم Service Worker للتخزين المؤقت والعمل دون اتصال.

---

### 📘 التوثيق المضاف
- `/docs/SCHEMA.md` — تعريف الجداول والربط والمخطط.
- `/docs/SETUP.md` — خطوات الإعداد والنشر الكامل.
- `/docs/CHANGELOG.md` — سجل الإصدارات والتعديلات.

---

### ✅ الحالة الحالية
- التطبيق يعمل بكامل الوظائف الأساسية.
- جميع الملفات أقل من 1000 سطر كما هو مطلوب.
- لا توجد تبعيات خارجية غير Tailwind/Bootstrap عند الحاجة.
- جاهز للنسخ إلى GitHub وGoogle Sheets مباشرة.

---

## 🚀 الخطط المستقبلية (v0.2.0 وما بعدها)

| المجال | التفاصيل |
|--------|-----------|
| **التحليل الذكي** | دمج رسوم بيانية (Charts.js أو ApexCharts) لعرض النفقات والإيرادات. |
| **CRUD كامل في GAS** | إضافة Update/Delete عبر `writeBatch` المحسّنة. |
| **الترجمة الديناميكية** | إضافة ملفات لغة JSON مستقلة. |
| **النسخ الاحتياطي السحابي** | تصدير Google Drive أو Dropbox. |
| **إدارة المستخدمين** | دعم تسجيل الدخول البسيط متعدد الأجهزة. |
| **تحسين الأداء** | تقليل حجم النقل عبر ضغط JSON. |

---

## 🧾 ملخص التغييرات

| الملف | نوع التعديل | الملاحظات |
|--------|--------------|------------|
| `/web/index.html` | Replacement | بناء الواجهة الكاملة RTL وتبويبات متعددة. |
| `/web/main.css` | Replacement | تصميم حديث متجاوب بثيمات قابلة للتخصيص. |
| `/web/app-config.js` | Replacement | إعدادات URL + الثيم + اللغة. |
| `/web/app-utils.js` | Replacement | أدوات عامة + إدارة الطابور + التعامل مع LocalStorage. |
| `/web/app-dom.js` | Replacement | تحكم بالواجهة والتنقل والتوستات. |
| `/web/app-forms.js` | Replacement | نموذج المعاملات step-based والتحقق. |
| `/web/app-data.js` | Replacement | إدارة البيانات (read/write/bootstrapping). |
| `/web/app-sync.js` | Replacement | إدارة المزامنة والـService Worker. |
| `/web/app-reports.js` | Replacement | توليد تقارير مالية شهرية. |
| `/web/app-modals.js` | Replacement | إدارة النوافذ المنبثقة (الحسابات والفئات). |
| `/web/sw.js` | Replacement | Service Worker للكاش والأوفلاين. |
| `/schemas/schema.json` | Replacement | هيكل البيانات الكامل والتوافق مع GAS. |
| `/gas/Code.gs` | Replacement | منطق GAS الأساسي. |
| `/gas/Batch.gs` | Replacement | أدوات دُفعية مساعدة. |
| `/docs/SCHEMA.md` | Replacement | توثيق الهيكل وربط الحقول. |
| `/docs/SETUP.md` | Replacement | دليل الإعداد والنشر الكامل. |
| `/docs/CHANGELOG.md` | Replacement | سجل الإصدارات الحالي. |

---

## 🏁 حالة المشروع
✅ الجاهزية: **100%**  
✅ متوافق مع: **GitHub Pages + Google Apps Script**  
✅ الاتجاه العربي (RTL): **مدعوم بالكامل**  
✅ الأداء: **ممتاز**  
✅ قابل للتطوير: **نعم**

> هذا الإصدار هو القاعدة الصلبة لبناء أي إضافات مستقبلية بسهولة ووضوح.


# SETUP — Replacement

## 1) Google Apps Script (GAS)
1. افتح Google Drive → New → Google Sheets (سمّه مثلًا **Masrofi**).
2. من الشيت: Extensions → Apps Script.
3. أنشئ مشروع GAS، أنشئ ملفين:
   - `Code.gs` (الصق محتوى `/gas/Code.gs`)
   - `Batch.gs` (الصق محتوى `/gas/Batch.gs`)
4. من الشيفرة: شغّل `ensureSchema()` مرة واحدة (Run) لتجهيز الأوراق.
5. نشر: **Deploy** → **Manage deployments** → **New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - انشر واحفظ **Web App URL**.

6. في مشروع الويب، افتح `/web/app-config.js` وضع قيمة `gasUrl` إلى رابط الويب آب.

> نستخدم `ContentService(JSON) + Content-Type: text/plain` لتفادي CORS preflight.

## 2) GitHub Pages
1. أنشئ مستودعًا، ضع الهيكل الكامل.
2. من Settings → Pages:
   - Source: **Deploy from a branch**
   - Branch: `main` / folder: **/web**
3. وصّل الدومين الفرعي إن أردت (اختياري).

## 3) تشغيل محلي (اختياري)
باستخدام `Live Server` VSCode أو أي خادم ثابت.

## 4) لغات (i18n)
- مضمنة في `/web/app-i18n.js`. غيّر `APP_CONFIG.locale` أو من تبويب **Preferences**.

## 5) أوفلاين
- Service Worker في `/web/sw.js` يقوم بتخزين الملفات الأساسية.

## 6) أزرار الواجهة
- **Save**: يحفظ محليًا ويدفع العملية للطابور.
- **Sync**: يضمن المخطط، يدفع الطابور، ثم يقرأ دفعة واحدة.
- **Export**: يصدّر الحالة JSON.
- **Reset**: يهيئ التخزين المحلي.

## 7) مشاكل شائعة
- CORS: تأكد أن النشر Web App → Anyone وأن `Content-Type` في الويب `text/plain`.
- RTL: الصفحة `dir="rtl"`.
- تجاوز عرض الجداول: لدينا `overflow-x:auto` في CSS.


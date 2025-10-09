/** v0.1.0 — Replacement
 * Web App (Publish: Anyone with the link) — ContentService JSON (text/plain) لتجنّب CORS preflight
 */
const SHEET_NAME = "DATA";
const META_NAME  = "META";

function doGet(e){
  return jsonOut({ ok:true, ping:true, ts: new Date().toISOString() });
}

function doPost(e){
  try{
    const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const action = body.action;
    if(action === "ensureSchema") return ensureSchema();
    if(action === "readBatch")   return readBatch(body.payload);
    if(action === "writeBatch")  return writeBatch(body.payload);
    return jsonOut({ ok:false, error:"Unknown action" }, 400);
  }catch(err){
    return jsonOut({ ok:false, error:String(err) }, 500);
  }
}

function jsonOut(obj, code){
  const out = ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  if(code) out.setContent(JSON.stringify(Object.assign(obj,{code:code})));
  return out;
}

function ensureSchema(){
  const ss = SpreadsheetApp.getActive();
  let meta = ss.getSheetByName(META_NAME); if(!meta) meta = ss.insertSheet(META_NAME);
  let data = ss.getSheetByName(SHEET_NAME); if(!data) data = ss.insertSheet(SHEET_NAME);

  // الصف الأول يحوي اسم الجدول، الصف الثاني يحوي الأعمدة، ثم البيانات
  const desired = {
    accounts: ["id","name","type","currency","opening_balance"],
    categories: ["id","name","type","parent_id"],
    transactions: ["id","date","account_id","category_id","amount","note","tags","is_recurring","receipt_url","project_id"],
    budgets: ["id","month","category_id","amount"],
    projects: ["id","name","type"],
    subscriptions: ["id","name","amount","cycle","next_due"]
  };

  // نكتب المخطط في META
  const keys = Object.keys(desired);
  meta.clear();
  meta.getRange(1,1,1,1).setValue("schema_version");
  meta.getRange(2,1,keys.length,1).setValues(keys.map(k=>[k]));
  meta.getRange(2,2,keys.length,1).setValues(keys.map(k=>[desired[k].join(",")]));

  // نهيئ شيت لكل جدول
  keys.forEach(name=>{
    let sh = ss.getSheetByName(name);
    if(!sh) sh = ss.insertSheet(name);
    const cols = desired[name];
    const head = sh.getRange(1,1,1,cols.length).getValues()[0];
    // إذا اختلفت الأعمدة، نعيد بناء الهيدر (مع الحفاظ على البيانات إن أمكن)
    if(JSON.stringify(head) !== JSON.stringify(cols)){
      sh.clear();
      sh.getRange(1,1,1,cols.length).setValues([cols]);
    }
  });

  return jsonOut({ ok:true });
}

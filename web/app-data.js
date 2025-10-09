/* v0.1.0 — Replacement */
window.APP_DATA = (function(){
  function renderDashboard(){
    const tx = STATE.S.data.transactions || [];
    const income = tx.filter(t=> Number(t.amount)>0).reduce((a,b)=> a+Number(b.amount||0),0);
    const expense = tx.filter(t=> Number(t.amount)<0).reduce((a,b)=> a+Math.abs(Number(b.amount||0)),0);
    const net = income - expense;
    document.getElementById("kpi-net").textContent = UT.formatMoney(net);
    const rate = income ? ((net/income)*100).toFixed(1)+"%" : "—";
    document.getElementById("kpi-saving").textContent = rate;
    document.getElementById("kpi-burn").textContent = expense? ( (income/Math.max(expense,1)).toFixed(1) + " m" ) : "—";
    document.getElementById("kpi-fixed").textContent = "—";

    // recent
    const recentEl = document.getElementById("tbl-recent");
    recentEl.innerHTML = "";
    tx.slice(-8).reverse().forEach((r,i)=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${r.date||""}</td><td>${r.category_id||""}</td><td>${UT.formatMoney(r.amount||0)}</td><td>${r.note||""}</td>`;
      recentEl.appendChild(tr);
    });
  }

  function renderTables(){
    const tEl = document.getElementById("tbl-tx");
    if(!tEl) return;
    tEl.innerHTML = "";
    (STATE.S.data.transactions||[]).forEach((r,idx)=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${idx+1}</td><td>${r.date||""}</td><td>${r.account_id||""}</td><td>${r.category_id||""}</td><td>${UT.formatMoney(r.amount||0)}</td><td>${r.project_id||""}</td><td>${r.note||""}</td>`;
      tEl.appendChild(tr);
    });
  }

  // GAS bulk I/O
  async function readBatch(){
    const res = await UT.fetchGAS("readBatch",{ tables:["accounts","categories","transactions","budgets","subscriptions","projects"] });
    if(res.ok){
      STATE.S.data = res.data || STATE.S.data;
      STATE.saveLocal();
      renderDashboard(); renderTables();
      UT.toast("تم الاستيراد من جوجل شيت ✅");
    }else{
      throw new Error(res.error||"readBatch failed");
    }
  }

  async function writeBatch(rowsByTable){
    const res = await UT.fetchGAS("writeBatch", { rowsByTable });
    if(!res.ok) throw new Error(res.error||"writeBatch failed");
    return true;
  }

  return { renderDashboard, renderTables, readBatch, writeBatch };
})();

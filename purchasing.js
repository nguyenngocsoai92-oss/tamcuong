"use strict";

function purchaseList() { return data.purchases?.filter(row=>row.company===session?.company)||[]; }
function purchaseStatus(po) {
  return po.status==="requested"?"Chờ duyệt":po.received===po.qty?"Đã nhận đủ":po.received?"Nhận một phần":"Đã duyệt";
}
function purchasingPage() {
  return section("Đề xuất và đơn mua",table(["Mã mua","Nhà cung cấp","Vật tư","Đơn bán","Đã nhận / Đặt","Trạng thái",""],purchaseList().slice().reverse().map(po=>
    `<tr><td>${esc(po.id)}</td><td>${esc(po.vendor)}</td><td>${stockSamples[po.index].name}</td>
    <td>${po.order?linkBtn(po.order,companyRoute(po.company)+"/ho-so/"+encodeURIComponent(po.order),{style:"quiet compact"}):"—"}</td>
    <td>${po.received} / ${po.qty}</td><td>${chip(purchaseStatus(po),po.status==="requested"?"warn":"")}</td>
    <td><div class="actions">${po.status==="requested"?btn("Duyệt mua","approve-purchase",{value:po.id,style:"light compact"}):po.received<po.qty?btn("Nhận hàng","receive-purchase",{value:po.id,style:"light compact"}):""}
    ${btn("In đơn mua","print-purchase",{value:po.id,style:"quiet compact"})}</div></td></tr>`)),
    "",btn("Đề xuất mua","new-purchase",{icon:"plus"}));
}
function purchaseDialog() {
  if(session?.area!=="company"||view!=="inventory")return;
  openDialog("Đề xuất mua vật tư",`<form id="purchase-form"><div class="form-grid">
  <label class="field wide">Nhà cung cấp mẫu<input class="input" name="vendor" maxlength="140" required></label>
  <label class="field">Vật tư<select class="input" name="index">${stockSamples.map((r,i)=>`<option value="${i}">${r.name}</option>`).join("")}</select></label>
  <label class="field">Số lượng<input class="input" type="number" name="qty" min="1" max="1000000" step="1" required></label>
  <label class="field">Giá mua chưa VAT (₫)<input class="input" type="number" name="price" min="1" max="${maxSalesValue}" step="1" required></label>
  <label class="field">VAT<select class="input" name="vat" required><option value="">Chọn</option>${vatOptions()}</select></label>
  <label class="field wide">Đơn bán liên quan<select name="order" class="input"><option value="">Mua cho tồn kho</option>${listOrders(session.company).map(o=>`<option value="${esc(o.id)}">${esc(o.id+" · "+o.title)}</option>`).join("")}</select></label>
  </div><p class="error" id="dialog-error"></p><button class="btn">Lưu đề xuất</button></form>`);
}
function savePurchase(form) {
  if(session?.area!=="company"||view!=="inventory")return;
  const value=key=>String(form.get(key)||"").trim();
  const vendor=value("vendor"), order=value("order"), index=Number(value("index")), qty=Number(value("qty")), price=Number(value("price")), vat=Number(value("vat"));
  if(!vendor||!stockSamples[index]||!Number.isInteger(qty)||qty<1||qty>1000000||!Number.isSafeInteger(price)||price<1||
    !Number.isSafeInteger(price*qty)||price*qty>maxSalesValue||!value("vat")||!vatRates.includes(vat)||(order&&!secureOrder(order))) {
    return fieldError("dialog-error","Kiểm tra vật tư, số lượng, nhà cung cấp và giá mua.");
  }
  const id="MH-"+session.company+"-"+crypto.randomUUID().slice(0,8).toUpperCase();
  (data.purchases ||= []).push({id,company:session.company,order,index,vendor,qty,price,vat,received:0,status:"requested",at:new Date().toISOString()});
  if(order)secureOrder(order).history.push(log("Đã đề xuất mua · "+id));
  modal.close();save();render();notify("Đã lưu đề xuất mua.");
}
function purchaseStep(id,approve) {
  if(session?.area!=="company"||view!=="inventory")return;
  const po=purchaseList().find(row=>row.id===id);
  if(!po||(approve?po.status!=="requested":po.status!=="approved"||po.received>=po.qty))return;
  openDialog(approve?"Duyệt đề xuất mua":"Nhận hàng từ đơn mua",`<form id="purchase-step" data-id="${esc(id)}" data-step="${approve?"approve":"receive"}">
  <p>${esc(po.id)} · ${esc(po.vendor)} · ${stockSamples[po.index].name}</p>
  ${approve?'<label class="check"><input type="checkbox" name="confirm" required>Đã kiểm tra số lượng, đơn giá và thuế.</label>':
   `<div class="form-grid"><label class="field">Số lượng đạt<input name="qty" type="number" class="input" min="1" max="${po.qty-po.received}" required></label>
   <label class="field">Số phiếu nhập<input name="ref" class="input" maxlength="100" required></label></div>`}
  <p class="error" id="dialog-error"></p><button class="btn">${approve?"Duyệt đơn mua":"Ghi nhận nhập kho"}</button></form>`);
}
function savePurchaseStep(form,el) {
  if(session?.area!=="company"||view!=="inventory")return;
  const po=purchaseList().find(row=>row.id===el.dataset.id);
  if(!po)return;
  const order=po.order&&secureOrder(po.order);
  if(el.dataset.step==="approve"&&po.status==="requested"&&form.has("confirm")) {
    po.status="approved";po.approval=log("Đã duyệt mua");
    if(order)order.history.push(log("Đã duyệt đơn mua · "+po.id));
  } else if(el.dataset.step==="receive"&&po.status==="approved"&&po.received<po.qty) {
    const qty=Number(form.get("qty")), ref=String(form.get("ref")||"").trim();
    if(!Number.isInteger(qty)||qty<1||qty>po.qty-po.received||!ref||stockMoves().some(move=>move.ref.toLowerCase()===ref.toLowerCase())){
      return fieldError("dialog-error","Kiểm tra mã phiếu và số lượng chưa nhận. Mỗi mã phiếu chỉ dùng một lần.");
    }
    (data.stockMoves ||= []).push({company:po.company,index:po.index,type:"in",ref,qty,party:po.vendor,
      order:po.order,price:po.price,vat:po.vat,purchase:po.id,actor:session.account,at:new Date().toISOString()});
    po.received+=qty;
    if(order)order.history.push(log("Nhập kho theo "+po.id+" · "+ref));
  } else return;
  modal.close();save();render();notify("Đã ghi nhận.");
}
function stockPrint(kind,id) {
  if(session?.area!=="company"||view!=="inventory")return;
  const po=kind==="purchase"?purchaseList().find(row=>row.id===id):null;
  const move=kind==="movement"?stockMoves().find(row=>row.ref===id):null;
  const value=po||move;
  if(!value)return;
  const idKey=po?(po.status==="requested"?"de-xuat":"dat-mua"):move.type==="in"?"nhap":"xuat";
  const item=[...packs.buying.items,...formalExtras("buying")].find(([key])=>key===idKey);
  const stock=stockSamples[value.index];
  const order=secureOrder(value.order)||{company:value.company,id:value.order||"—",title:"Nghiệp vụ kho",items:[]};
  const fields={ref:po?.id||move.ref,issueDate:date(value.at),partyName:po?.vendor||move.party,
    detail0:po?"Vật tư theo đơn mua":"Phiếu thao tác kho",detail1:move?.purchase||value.order||"Chưa có mã liên kết",
    lineNote:[stock.name,stock.unit,value.qty,value.price||0,value.vat||0].join(" | ")};
  const form=formalDocument(order,item,null,{fields},"buying");
  if(move?.type==="out"){
    form.headings=form.headings.slice(0,3);form.items=form.items.map(row=>row.slice(0,3));form.totals=[];
  }
  const html=formalHtml(form);
  const blob=new Blob([html],{type:"text/html;charset=utf-8"}), url=URL.createObjectURL(blob);
  if(!window.open(url,"_blank"))triggerDownload(blob,(po?.id||move.ref)+".html");
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}

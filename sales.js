"use strict";

const quoteStates = {
  draft:"Bản nháp", approved:"Đã duyệt", sent:"Đã ghi nhận gửi",
  accepted:"Khách đã chấp thuận", superseded:"Đã thay thế",
};
const quoteLabel = (status) => quoteStates[status] || "Chưa lập báo giá";
const latestQuote = (order) => order.quotes?.at(-1);
const acceptedQuote = (order) => order.quotes?.find((quote)=>quote.status==="accepted");
const dayInVietnam = (day=new Date()) => new Intl.DateTimeFormat("sv-SE",{
  timeZone:"Asia/Ho_Chi_Minh",year:"numeric",month:"2-digit",day:"2-digit",
}).format(day);
const maxSalesValue = 100000000000;
const vatRates=[0,5,8,10];
const vatOptions=(rate)=>vatRates.map(value=>`<option value="${value}" ${rate===value?"selected":""}>${value}%</option>`).join("");
const draftLinesFor = (order) => order.items?.length ? order.items : [{name:order.title,unit:"Gói",qty:1,price:order.total}];

function salesAmounts(items,discount=0,tax=0) {
  const raw=items.map(item=>Math.round(item.qty*item.price));
  const subtotal=raw.reduce((sum,value)=>sum+value,0);
  const automatic=items.some(item=>vatRates.includes(item.vat));
  let running=0,allocated=0;
  const lines=items.map((item,i)=>{
    running+=raw[i];
    const cumulative=subtotal?Math.round(discount*(running/subtotal)):0;
    const base=raw[i]-(cumulative-allocated);
    allocated=cumulative;
    const vat=Math.round(base*(item.vat||0)/100);
    return {...item,base,tax:vat,total:base+vat};
  });
  const calculated=automatic?lines.reduce((sum,item)=>sum+item.tax,0):tax;
  return {subtotal,discount,tax:calculated,total:subtotal-discount+calculated,lines};
}
function salesLines(items,discount=0) {
  return table(["Hạng mục","ĐVT","SL","Đơn giá chưa VAT","VAT","Tiền VAT","Tổng dòng"],salesAmounts(items,discount).lines.map((item)=>`<tr>
    <td>${esc(item.name)}</td><td>${esc(item.unit)}</td><td>${number.format(item.qty)}</td>
    <td class="text-right">${money(item.price)}</td><td>${item.vat===undefined?"—":item.vat+"%"}</td><td class="text-right">${money(item.tax)}</td><td class="text-right">${money(item.total)}</td></tr>`));
}
function lineRow(item={name:"",unit:"Cái",qty:1,price:""}) {
  return `<div class="sales-line">
    <label class="field">Hạng mục<input class="input" name="line-name" maxlength="120" required value="${esc(item.name)}"></label>
    <label class="field">ĐVT<input class="input" name="line-unit" maxlength="20" required value="${esc(item.unit)}"></label>
    <label class="field">Số lượng<input class="input" type="number" name="line-qty" required min=".001" max="100000" step=".001" value="${esc(item.qty)}"></label>
    <label class="field">Giá chưa VAT (₫)<input class="input" type="number" name="line-price" required min="0" max="${maxSalesValue}" step="1" value="${esc(item.price)}"></label>
    <label class="field">VAT<select class="input" name="line-vat" required><option value="" ${item.vat===undefined?"selected":""}>Chọn</option>${vatOptions(item.vat)}</select></label>
    <div class="line-sum"><small>Thành tiền</small><output data-line-total>—</output></div>
    <button type="button" class="btn light compact line-remove" data-action="remove-line" aria-label="Xóa hạng mục">${icon("close")}</button></div>`;
}
function lineEditor(items) {
  return `<div class="line-editor"><div class="line-editor-head"><h3>Hạng mục</h3>${btn("Thêm hạng mục","add-line",{icon:"plus",style:"light compact"})}</div>
  <div data-lines>${items.map(lineRow).join("")}</div></div>`;
}
function readSalesLines(form) {
  const names=form.getAll("line-name"), units=form.getAll("line-unit");
  const quantities=form.getAll("line-qty"), prices=form.getAll("line-price"), rates=form.getAll("line-vat");
  return names.map((name,i)=>({name:name.trim(),unit:units[i].trim(),qty:Number(quantities[i]),price:Number(prices[i]),vat:rates[i]===""?undefined:Number(rates[i])}));
}
function validSalesLines(items) {
  return items.length>=1 && items.length<=40 && items.every(({name,unit,qty,price,vat})=>
    name && unit && Number.isFinite(qty) && qty>=.001 && qty<=100000 &&
    Number.isSafeInteger(price) && price>=0 && price<=maxSalesValue && vatRates.includes(vat));
}
function refreshSalesForm(form) {
  const values=new FormData(form);
  const summary=salesAmounts(readSalesLines(values),Number(values.get("discount")||0));
  form.querySelectorAll("[data-line-total]").forEach((output,i)=>{output.textContent=money(summary.lines[i].total);});
  form.querySelector("[data-sales-total]").textContent=money(summary.total);
  const removes=form.querySelectorAll(".line-remove");
  for (const button of removes) button.disabled=removes.length===1;
  form.querySelector('[data-action="add-line"]').disabled=removes.length>=40;
}
function addSalesLine(removeButton=null) {
  const form=modal.querySelector("#create-order, #quote-form");
  const list=form?.querySelector("[data-lines]");
  if (!list) return;
  if (removeButton) {
    if (list.children.length<=1) return;
    removeButton.closest(".sales-line")?.remove();
  } else {
    if (list.children.length>=40) return;
    list.insertAdjacentHTML("beforeend",lineRow());
    list.lastElementChild.querySelector("input").focus();
  }
  refreshSalesForm(form);
}
function quotesPage() {
  const orders=listOrders(session.company).filter((o)=>o.step<=3||o.quotes?.length);
  const counts=["draft","sent","accepted"].map((status)=>[status,orders.filter(o=>latestQuote(o)?.status===status).length]);
  return heading("Báo giá","Quản lý phiên bản báo giá và phản hồi của khách hàng theo từng đơn.",
    btn("Lập đơn hàng","new-order",{icon:"plus"}))+
    `<div class="quote-counts">${counts.map(([status,count])=>`<article class="kpi"><span>${quoteLabel(status)}</span><strong>${count}</strong></article>`).join("")}</div>`+
    section("Báo giá theo đơn hàng",table(["Đơn hàng","Khách hàng","Phiên bản mới nhất","Trạng thái","Tổng báo giá",""],orders.map((o)=>{
      const quote=latestQuote(o);
      return `<tr><td><strong>${esc(o.title)}</strong><small>${esc(o.id)}</small></td><td>${esc(o.customer)}</td>
      <td>${quote?esc(quote.id):"—"}</td><td>${chip(quoteLabel(quote?.status),quote?"":"neutral")}</td>
      <td class="text-right">${quote?money(salesAmounts(quote.items,quote.discount,quote.tax).total):"—"}</td>
      <td>${linkBtn(quote?"Mở báo giá":"Lập báo giá",quoteRoute(o),{style:"light compact",icon:"arrow"})}</td></tr>`;
    })));
}
function quotePage() {
  const order=secureOrder(selected.order);
  if (!canWork(order)) return quotesPage();
  const root=companyRoute(order.company);
  const top=latestQuote(order);
  const quote=order.quotes?.find((item)=>item.id===selected.quote) || top;
  const amounts=quote && salesAmounts(quote.items,quote.discount,quote.tax);
  const editable=!order.paused && order.step<=3;
  const current=quote && quote===top;
  const canApprove=editable && order.step===3;
  const actions=[];
  if (editable && !top) actions.push(btn("Lập báo giá","edit-quote",{icon:"plus"}));
  if (editable && current && quote.status==="draft") actions.push(btn("Sửa báo giá","edit-quote",{style:"light"}));
  if (canApprove && current && quote.status==="draft") actions.push(btn("Duyệt báo giá","quote-transition",{value:"approved",icon:"check"}));
  if (canApprove && current && quote.status==="approved") actions.push(btn("Ghi nhận đã gửi","quote-transition",{value:"sent",icon:"mail"}));
  if (canApprove && current && quote.status==="sent") actions.push(btn("Ghi nhận khách chấp thuận","quote-transition",{value:"accepted",icon:"check"}));
  if (editable && current && ["approved","sent"].includes(quote.status)) actions.push(btn("Tạo phiên bản mới","edit-quote",{value:"revise",style:"light"}));
  if (quote && quote.status!=="draft") actions.push(btn("Tải bản báo giá","download-quote",{value:quote.id,style:"light",icon:"down"}));
  const quoteBody=quote?`<div class="quote-sheet-head"><div><div class="kicker">Công ty ${companyName(order.company)}</div><h2>${esc(quote.id)}</h2></div>
  ${chip(quoteLabel(quote.status))}</div>
  <div class="quote-facts"><div><small>Khách hàng</small><strong>${esc(order.customer)}</strong></div><div><small>Hiệu lực đến</small><strong>${date(quote.validUntil)}</strong></div>${quote.terms?`<div><small>Điều kiện báo giá</small><strong>${esc(quote.terms)}</strong></div>`:""}</div>
  ${salesLines(quote.items,quote.discount)}
  <dl class="quote-totals"><div><dt>Tạm tính</dt><dd>${money(amounts.subtotal)}</dd></div><div><dt>Chiết khấu</dt><dd>${money(amounts.discount)}</dd></div><div><dt>Tiền VAT</dt><dd>${money(amounts.tax)}</dd></div>
  <div class="grand"><dt>Tổng báo giá</dt><dd>${money(amounts.total)}</dd></div></dl>`
    : `<p class="muted">${editable?"Lập báo giá từ các hạng mục của đơn hàng.":"Hồ sơ này chưa có báo giá chi tiết trong dữ liệu minh họa."}</p>`;
  return heading("Báo giá đơn hàng",`${esc(order.id)} · ${esc(order.title)}`,
    linkBtn("Danh sách báo giá",root+"/bao-gia",{icon:"back"})+linkBtn("Mở đơn hàng",orderRoute(order),{icon:"link"}))+
    `<div class="pack-grid"><section class="panel panel-pad quote-sheet">${quoteBody}
    ${editable && order.step<3 && quote?.status==="draft"?'<p class="notice">Có thể chuẩn bị bản nháp. Hồ sơ sẽ được duyệt báo giá khi hoàn tất các bước trước đó.</p>':""}
    ${actions.length?`<div class="actions quote-actions">${actions.join("")}</div>`:""}
    ${quote?commercialActions(["approved","sent","accepted"].includes(quote.status)):""}
    ${acceptedQuote(order)?`<div class="actions quote-actions">${linkBtn("Mở hợp đồng",contractRoute(order),{icon:"arrow"})}</div>`:""}</section>
    <section class="panel panel-pad"><h2>Lịch sử phiên bản</h2><ul class="sublist">${order.quotes?.length ? order.quotes.slice().reverse().map((item)=>`<li>
      ${btn(item.id,"select-quote",{value:item.id,style:"quiet compact"})} ${chip(quoteLabel(item.status),"neutral")}
      <small>${when(item.updatedAt)}${item.reference?" · "+esc(item.reference):""}</small></li>`).join(""):"<li>Chưa có phiên bản.</li>"}</ul></section></div>`;
}
function editQuote(revise) {
  const order=secureOrder(selected.order);
  if (!canWork(order) || order.paused || order.step>3) return;
  const quote=latestQuote(order);
  if (quote && (revise ? !["approved","sent"].includes(quote.status) : quote.status!=="draft")) return;
  const values=quote||{items:draftLinesFor(order),discount:0,tax:0,validUntil:dayInVietnam(new Date(Date.now()+15*86400000)),terms:""};
  openDialog(revise?"Lập phiên bản báo giá mới":quote?"Sửa báo giá":"Lập báo giá",`<form id="quote-form" data-order="${esc(order.id)}" data-current="${esc(quote?.id)}" data-revise="${revise?"yes":"no"}">
    <p>${esc(order.id)} · ${esc(order.customer)}</p>
    ${lineEditor(values.items)}
    <div class="form-grid"><label class="field">Chiết khấu (₫)<input class="input" type="number" name="discount" min="0" max="${maxSalesValue}" step="1" value="${values.discount}" required></label>
    <label class="field">Hiệu lực đến<input class="input" type="date" name="validUntil" min="${dayInVietnam()}" value="${values.validUntil}" required></label>
    <label class="field">Điều kiện báo giá<input class="input" name="terms" maxlength="180" placeholder="Giao hàng hoặc thanh toán" value="${esc(values.terms)}"></label></div>
    <div class="sales-grand"><span>Tổng báo giá</span><output data-sales-total></output></div>
    <p class="error" id="dialog-error" aria-live="polite"></p><div class="actions"><button class="btn" type="submit">Lưu báo giá nháp</button></div></form>`);
  refreshSalesForm(modal.querySelector("#quote-form"));
}
function saveQuote(form,el) {
  const order=secureOrder(el.dataset.order);
  if (!canWork(order) || order.paused || order.step>3) return;
  const previous=latestQuote(order);
  const revise=el.dataset.revise==="yes";
  if ((previous?.id||"")!==el.dataset.current || (previous && (revise ? !["approved","sent"].includes(previous.status) : previous.status!=="draft"))) return;
  const items=readSalesLines(form);
  const discount=Number(form.get("discount"));
  const amounts=salesAmounts(items,discount);
  const tax=amounts.tax;
  const validUntil=String(form.get("validUntil"));
  if (!validSalesLines(items) || !Number.isSafeInteger(discount) || !Number.isSafeInteger(tax) ||
      discount<0 || discount>amounts.subtotal || tax<0 || amounts.total<=0 || amounts.total>maxSalesValue) {
    fieldError("dialog-error","Kiểm tra hạng mục, chiết khấu và tổng giá trị báo giá."); return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(validUntil) || validUntil<dayInVietnam()) {
    fieldError("dialog-error","Hiệu lực báo giá phải từ ngày hôm nay."); return;
  }
  order.quotes ||= [];
  const updatedAt=new Date().toISOString();
  const values={items,discount,tax,validUntil,updatedAt,terms:String(form.get("terms")||"").trim()};
  if (previous && !revise) Object.assign(previous,values);
  else {
    if (previous) { previous.status="superseded"; previous.updatedAt=updatedAt; }
    order.quotes.push({...values,id:"BG-"+order.id+"-V"+(order.quotes.length+1),status:"draft"});
  }
  const quote=latestQuote(order);
  order.history.push(log("Đã lưu báo giá nháp · "+quote.id));
  selected.quote=quote.id;
  modal.close(); save(); render(); notify("Đã lưu báo giá nháp.");
}
const quoteTransitions = {
  approved:{from:"draft",title:"Duyệt báo giá",note:"Xác nhận phạm vi, đơn giá và điều kiện báo giá mẫu."},
  sent:{from:"approved",title:"Ghi nhận đã gửi báo giá",note:"Ghi lại kênh gửi hoặc mã tham chiếu sau khi gửi báo giá."},
  accepted:{from:"sent",title:"Ghi nhận khách chấp thuận",note:"Ghi bằng chứng khách đồng ý với phiên bản này để chuyển đơn sang hợp đồng."},
};
function quoteForTransition(status) {
  const order=secureOrder(selected.order);
  if (!canWork(order) || order.paused || order.step!==3) return {};
  const quote=latestQuote(order);
  const rule=quoteTransitions[status];
  return rule && quote?.status===rule.from ? {order,quote,rule} : {};
}
function quoteTransitionDialog(status) {
  const {quote,rule}=quoteForTransition(status);
  if (!quote) return;
  openDialog(rule.title,`<form id="quote-transition-form" data-quote="${esc(quote.id)}" data-status="${status}"><p>${rule.note}</p>
    ${status==="approved"?"":'<label class="field extra-field">Mã tham chiếu hoặc ghi chú<input class="input" name="reference" maxlength="180" required></label>'}
    <label class="check"><input type="checkbox" name="confirm" required> Xác nhận thao tác cho phiên bản ${esc(quote.id)}.</label>
    <p class="error" id="dialog-error" aria-live="polite"></p><div class="actions"><button class="btn" type="submit">Xác nhận</button></div></form>`);
}
function transitionQuote(status,id,form) {
  const {order,quote,rule}=quoteForTransition(status);
  if (quote?.id!==id || !form.has("confirm")) return;
  const reference=String(form.get("reference")||"").trim();
  if (status!=="approved" && !reference) {fieldError("dialog-error","Nhập mã tham chiếu hoặc ghi chú.");return;}
  if (quote.validUntil<dayInVietnam()) {fieldError("dialog-error","Báo giá đã hết hiệu lực. Lập phiên bản mới để tiếp tục.");return;}
  quote.status=status;
  quote.updatedAt=new Date().toISOString();
  if (reference) quote.reference=reference;
  (quote.history ||= []).push(log(rule.title+(reference?" · "+reference:"")));
  order.history.push(log(rule.title+" · "+quote.id+(reference?" · "+reference:"")));
  if (status==="accepted") {
    order.total=salesAmounts(quote.items,quote.discount,quote.tax).total;
    order.items=quote.items.map(item=>({...item}));
    order.deposit=Math.round(order.total*.3);
    (order.records ||= {})[3]={reference:quote.id,actor:session.account,at:quote.updatedAt};
    order.step=4;
  }
  modal.close(); save(); render();
  notify(status==="accepted"?"Đơn hàng đã chuyển sang bước Hợp đồng.":quoteLabel(status)+".");
}
function quoteFile(order,quote) {
  const amounts=salesAmounts(quote.items,quote.discount,quote.tax);
  return `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(quote.id)}</title>
  <style>body{margin:40px auto;padding:0 18px;max-width:860px;font:14px/1.55 Arial,sans-serif;color:#192b25}header{border-top:5px solid #1d624e;padding-top:14px}h1{margin:8px 0}.demo{color:#85582c;font-weight:bold;font-size:11px}table{width:100%;border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #d9e6de;text-align:left}th{background:#eaf2e9}.text-right{text-align:right}dl{width:min(300px,100%);margin-left:auto}dl div{display:flex;justify-content:space-between;border-bottom:1px solid #d9e6de;padding:5px}dd{margin:0}footer{margin-top:24px} @media print{body{margin:0}}</style>
  <header><div>Công ty ${esc(companyName(order.company))}</div><div class="demo">BẢN MẪU · DỮ LIỆU GIẢ ĐỊNH</div><h1>Báo giá</h1><strong>${esc(quote.id)}</strong></header>
  <p>Khách hàng <strong>${esc(order.customer)}</strong> · Đơn hàng <strong>${esc(order.id)}</strong></p><p>Hiệu lực đến ${date(quote.validUntil)}</p>
  ${salesLines(quote.items,quote.discount)}<dl><div><dt>Tạm tính</dt><dd>${money(amounts.subtotal)}</dd></div><div><dt>Chiết khấu</dt><dd>${money(amounts.discount)}</dd></div>
  <div><dt>Tiền VAT</dt><dd>${money(amounts.tax)}</dd></div><div><dt><strong>Tổng báo giá</strong></dt><dd><strong>${money(amounts.total)}</strong></dd></div></dl>
  ${quote.terms?`<p>Điều kiện báo giá: ${esc(quote.terms)}</p>`:""}<footer>Hồ sơ minh họa. Có thể in hoặc lưu PDF từ trình duyệt.</footer></html>`;
}
function downloadQuote(id) {
  const order=secureOrder(selected.order);
  const quote=canWork(order) && order.quotes?.find((item)=>item.id===id);
  if (quote && quote.status!=="draft") triggerDownload(new Blob([quoteFile(order,quote)],{type:"text/html;charset=utf-8"}),quote.id+".html");
}

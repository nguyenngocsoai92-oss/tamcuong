"use strict";

const activeOrder=()=>secureOrder(selected.order);
const unidentified=(order)=>!order.customer||order.customer==="Khách chưa định danh";
const isNewFlow=(order)=>!!order.sourceControl;
const evidenceFor=(order,key)=>order.sources?.[key];
const sourceKeys={"bao-gia":"Báo giá đã chấp thuận","hop-dong":"Hợp đồng đã ký","tam-ung":"Đề nghị tạm ứng / bằng chứng thu"};
for(const pack of Object.values(DEMO.packs)) for(const [key,label] of pack.items) sourceKeys[key] ||= label;
const sourceLabel=(key)=>sourceKeys[key]||key;
function commitOperational(change,rollback) {
  change();
  try {localStorage.setItem(storeKey,JSON.stringify(data));}
  catch (_) {
    rollback();
    fieldError("dialog-error","Không đủ dung lượng lưu trên trình duyệt. Dùng tệp mẫu nhỏ hơn hoặc mở từ trình duyệt khác.");return false;
  }
  return true;
}
function operationPanels(order) {
  const editable=canWork(order)&&!order.paused;
  const receipts=order.receipts||[];
  const available=order.total-order.paid;
  return `<section class="panel panel-pad"><h2>Khách hàng và hợp đồng đã ký</h2><ul class="sublist">
  <li>${esc(order.customer)}${unidentified(order)&&editable?" "+btn("Gắn khách hàng","link-customer",{style:"light compact"}):""}</li>
  <li>${evidenceFor(order,"hop-dong")?sourceDownload(order,evidenceFor(order,"hop-dong")):"Chưa lưu bản ký"}
  ${evidenceFor(order,"hop-dong")?.signedOn?`<small>Ngày ký ${date(evidenceFor(order,"hop-dong").signedOn)}${order.effectiveOn?" · Hiệu lực "+date(order.effectiveOn):""}</small>`:""}
  ${editable&&order.contract?.final&&!evidenceFor(order,"hop-dong")?" "+btn("Lưu hợp đồng đã ký","upload-source",{value:"hop-dong",style:"light compact"}):""}</li></ul>
  </section><section class="panel panel-pad"><h2>Tiến độ thanh toán</h2><ul class="sublist">
  <li>Mốc tạm ứng <strong>${money(order.deposit)}</strong> ${editable&&order.step===4?btn("Đặt mức tạm ứng","set-deposit",{style:"light compact"}):""}</li>
  <li>Đã thu <strong>${money(order.paid)}</strong> · Còn phải thu ${money(openBalance(order))}
    ${editable&&order.step>=5&&available>0?btn("Ghi nhận lần thu","add-receipt",{style:"light compact"}):""}</li>
  ${receipts.slice().reverse().map(r=>`<li>${money(r.amount)} · ${esc(r.ref)}<small>${date(r.day)} · ${esc(r.actor)}</small></li>`).join("")}
  </ul></section>`;
}
function operationDialog(kind) {
  const order=activeOrder();
  if(!canWork(order)||order.paused)return;
  const field=(label,key,options="")=>`<label class="field wide">${label}<input class="input" name="${key}" ${options} required></label>`;
  let body, title;
  if(kind==="link-customer"&&unidentified(order)&&!order.contract?.final) {
    title="Gắn khách hàng vào đơn hàng";
    body=field("Tên cá nhân hoặc tên pháp nhân","customer",'maxlength="160"')+
      field("Địa chỉ","address",'maxlength="180"')+field("Người liên hệ","contact",'maxlength="100"')+
      field("Email mẫu","email",'type="email" maxlength="150"');
  } else if(kind==="set-deposit"&&order.step===4) {
    title="Đặt mức tạm ứng theo hợp đồng";
    body=field("Mức tạm ứng (₫)","amount",`type="number" min="0" max="${order.total}" step="1" value="${order.deposit}"`)+field("Mốc hoặc điều khoản áp dụng","ref",'maxlength="120"');
  } else if(kind==="add-receipt"&&order.step>=5&&order.paid<order.total) {
    title="Ghi nhận lần thu tiền";
    body=field("Số tiền thực nhận (₫)","amount",`type="number" min="1" max="${order.total-order.paid}" step="1"`)+
      field("Ngày nhận","day",`type="date" max="${dayInVietnam()}" value="${dayInVietnam()}"`)+field("Mã giao dịch / Phiếu thu","ref",'maxlength="120"');
  } else return;
  openDialog(title,`<form id="operation-form" data-kind="${kind}" data-order="${esc(order.id)}"><div class="form-grid">${body}</div>
  <p class="error" id="dialog-error"></p><button class="btn">Lưu thông tin</button></form>`);
}
function saveOperation(form,el) {
  const order=secureOrder(el.dataset.order);
  if(!canWork(order)||order.paused)return;
  const get=key=>String(form.get(key)||"").trim();
  const kind=el.dataset.kind, amount=Number(get("amount")), ref=get("ref");
  let label;
  if(kind==="link-customer"&&unidentified(order)&&!order.contract?.final) {
    const values=["customer","address","contact","email"].map(get);
    if(values.some(v=>!v))return fieldError("dialog-error","Nhập đủ thông tin khách hàng mẫu.");
    [order.customer,order.deliveryAddress,order.contact,order.customerEmail]=values;
    label="Đã gắn khách hàng · "+order.customer;
  } else if(kind==="set-deposit"&&order.step===4) {
    if(!Number.isSafeInteger(amount)||amount<0||amount>order.total||!ref)return fieldError("dialog-error","Kiểm tra số tiền và điều khoản.");
    order.deposit=amount;order.depositTerm=ref;
    label="Đặt mức tạm ứng "+money(amount)+" · "+ref;
  } else if(kind==="add-receipt"&&order.step>=5) {
    const day=get("day");
    if(!Number.isSafeInteger(amount)||amount<1||amount>order.total-order.paid||!ref||!day||day>dayInVietnam()||
      data.orders.some(o=>o.company===order.company&&o.receipts?.some(r=>r.ref.toLowerCase()===ref.toLowerCase()))) {
      return fieldError("dialog-error","Kiểm tra số dư, ngày thu và mã giao dịch. Mỗi mã chỉ ghi nhận một lần trong công ty.");
    }
    (order.receipts ||= []).push({amount,ref,day,actor:session.account,at:new Date().toISOString()});
    order.paid+=amount;
    label="Đã ghi nhận lần thu "+money(amount)+" · "+ref;
  } else return;
  order.history.push(log(label));modal.close();save();render();notify("Đã lưu thông tin.");
}
function sourceDownload(order,file) {
  return btn(file.name,"download-source",{value:order.id+"|"+file.key,style:"quiet compact",icon:"down"});
}
function sourceAction(key) {
  const order=view==="accounting"?currentPack().order:activeOrder();
  if(!order||!Object.hasOwn(sourceKeys,key))return;
  const allowed=view==="accounting"?canAccount(order)&&session.role==="maker"&&
    !["approved","pending"].includes(currentPack().bundle?.status):canWork(order)&&!order.paused;
  if(!allowed||(key==="hop-dong"&&!order.contract?.final&&isNewFlow(order)))return;
  openDialog("Lưu chứng từ nguồn",`<form id="source-form" data-order="${esc(order.id)}" data-key="${key}">
  <p>${esc(order.id)} · ${sourceLabel(key)}</p>
  <label class="field extra-field">Số hiệu / Mã tham chiếu<input class="input" name="ref" maxlength="120" required></label>
  ${key==="hop-dong"?`<label class="field extra-field">Ngày ký<input class="input" name="signedOn" type="date" max="${dayInVietnam()}" value="${dayInVietnam()}" required></label>`:""}
  <label class="field extra-field">Tệp PDF minh họa<input class="input" name="file" type="file" accept="application/pdf,.pdf" required></label>
  <p class="muted">Tối đa 200 KB mỗi tệp. Tệp lưu trong trình duyệt. Dùng bản đã ký minh họa cho hợp đồng.</p>
  <p class="error" id="dialog-error"></p><button class="btn">Lưu chứng từ</button></form>`);
}
async function saveSource(form,el) {
  const {order:id,key}=el.dataset;
  const order=secureOrder(id);
  const ref=String(form.get("ref")||"").trim(), file=form.get("file");
  const signedOn=key==="hop-dong"?String(form.get("signedOn")||""):"";
  if(key==="hop-dong"&&(!signedOn||signedOn>dayInVietnam()))return fieldError("dialog-error","Chọn ngày ký hợp lệ.");
  if(!order||!ref||!file?.size||file.size>200*1024||!Object.hasOwn(sourceKeys,key)||await file.slice(0,5).text()!=="%PDF-") {
    fieldError("dialog-error","Chọn PDF minh họa tối đa 200 KB và nhập mã tham chiếu.");return;
  }
  const content=base64(new Uint8Array(await file.arrayBuffer()));
  const allowed=modal.contains(el)&&(view==="accounting"?canAccount(order)&&session.role==="maker"&&currentPack().order?.id===id&&
    !["approved","pending"].includes(currentPack().bundle?.status):canWork(order)&&!order.paused);
  if(!allowed||(key==="hop-dong"&&isNewFlow(order)&&(!order.contract?.final||order.step!==4)))return;
  const item={key,ref,name:file.name,content,signedOn,actor:session.account,at:new Date().toISOString()};
  const previous=order.sources;
  const history=order.history.slice();
  if(commitOperational(()=>{order.sources={...previous,[key]:item};order.history.push(log("Đã lưu "+sourceLabel(key)+" · "+ref));},
    ()=>{order.sources=previous;order.history=history;})){
    modal.close();render();notify("Đã lưu chứng từ nguồn.");
  }
}
function downloadSource(value) {
  const [id,key]=value.split("|");
  const order=secureOrder(id);
  const bundle=view==="accounting"?currentPack().bundle:null;
  const snapshot=bundle?.snapshot;
  const file=evidenceFor(snapshot?.id===id&&bundle.status!=="returned"?snapshot:order||{},key);
  if(order&&file)triggerDownload(new Blob([Uint8Array.from(atob(file.content),c=>c.charCodeAt(0))],{type:"application/pdf"}),file.name);
}
function hasSource(order,key) {
  if(key==="bao-gia"&&acceptedQuote(order))return true;
  return !!evidenceFor(order,key);
}
const openingStock=[10,24];
function stockMoves() {return data.stockMoves?.filter(row=>row.company===session.company)||[];}
function remainingStock(index,moves) {return openingStock[index]+moves.filter(r=>r.index===index).reduce((n,row)=>n+(row.type==="in"?row.qty:-row.qty),0);}
function stockLedger() {
  const moves=stockMoves();
  return section("Tồn và phiếu nhập – xuất",table(["Vật tư","Tồn đầu","Tồn hiện tại",""],stockSamples.map((row,index)=>
    `<tr><td>${row.name}</td><td>${openingStock[index]}</td><td>${remainingStock(index,moves)} ${row.unit}</td><td>${btn("Lập phiếu kho","stock-move",{value:index,style:"light compact",icon:"plus"})}</td></tr>`)),
  "Tồn hiện tại tính từ số đầu kỳ mẫu và các phiếu đã ghi.")+
  section("Nhật ký kho",table(["Thời điểm","Mã phiếu","Vật tư","Loại","Số lượng","Đơn hàng","Đối tác / Ghi chú",""],moves.slice().reverse().map(row=>
    `<tr><td>${when(row.at)}</td><td>${esc(row.ref)}</td><td>${stockSamples[row.index].name}</td><td>${row.type==="in"?"Nhập":"Xuất"}</td><td>${row.qty}</td>
    <td>${row.order?linkBtn(row.order,companyRoute(row.company)+"/ho-so/"+encodeURIComponent(row.order),{style:"quiet compact"}):"—"}</td><td>${esc(row.party)}${row.purchase?`<small>${esc(row.purchase)}</small>`:""}</td><td>${btn("In phiếu","print-stock",{value:row.ref,style:"light compact"})}</td></tr>`)));
}
function stockMoveDialog(value) {
  const index=Number(value);
  if(session?.area!=="company"||view!=="inventory"||!stockSamples[index])return;
  openDialog("Lập phiếu kho",`<form id="stock-move-form" data-index="${index}"><p>${stockSamples[index].name}</p><div class="form-grid">
  <label class="field">Loại phiếu<select class="input" name="type"><option value="in">Nhập kho</option><option value="out">Xuất kho</option></select></label>
  <label class="field">Số lượng<input class="input" name="qty" type="number" min="1" max="1000000" step="1" required></label>
  <label class="field">Mã phiếu<input class="input" name="ref" maxlength="100" required></label>
  <label class="field">Nhà cung cấp / Ghi chú<input class="input" name="party" maxlength="140" required></label>
  <label class="field wide">Đơn hàng<select class="input" name="order"><option value="">Chọn nếu có</option>${listOrders(session.company).map(o=>`<option value="${esc(o.id)}">${esc(o.id+" · "+o.title)}</option>`).join("")}</select></label>
  </div><p class="error" id="dialog-error"></p><button class="btn">Ghi phiếu kho</button></form>`);
}
function saveStockMove(form,el) {
  const index=Number(el.dataset.index);
  if(session?.area!=="company"||view!=="inventory"||!stockSamples[index])return;
  const get=key=>String(form.get(key)||"").trim();
  const qty=Number(get("qty")), type=get("type"), ref=get("ref"), id=get("order"), party=get("party");
  const moves=stockMoves(), order=id?secureOrder(id):null;
  if(!["in","out"].includes(type)||!Number.isInteger(qty)||qty<1||qty>1000000||!ref||!party||
    (id&&!order)||(type==="out"&&(!order||qty>remainingStock(index,moves)))||moves.some(r=>r.ref.toLowerCase()===ref.toLowerCase())){
    return fieldError("dialog-error","Kiểm tra mã phiếu, số lượng và đơn hàng. Xuất kho cần gắn đơn và đủ tồn.");
  }
  (data.stockMoves ||= []).push({company:session.company,index,type,ref,qty,party,order:id,price:stockPrice(index).price,vat:stockPrice(index).vat,actor:session.account,at:new Date().toISOString()});
  if(order)order.history.push(log((type==="in"?"Nhập kho":"Xuất kho")+" · "+ref));
  modal.close();save();render();notify("Đã ghi phiếu kho.");
}

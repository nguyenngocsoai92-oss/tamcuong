"use strict";

const officeTypes={
  xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
const stockSamples=[
  {name:"Tấm vật tư A",unit:"Tấm",price:285000,vat:8},
  {name:"Khung nhôm mẫu",unit:"Thanh",price:156000,vat:10},
];
function stockPrice(index) {
  return data.stockPrices?.[session.company]?.[index] || stockSamples[index];
}
function inventoryPricing() {
  return section("Giá nhập vật tư",table(["Vật tư","ĐVT","Giá nhập chưa VAT","Thuế VAT","Tiền VAT / ĐVT","Giá gồm VAT",""],stockSamples.map((_,i)=>{
    const row=stockPrice(i);
    const tax=Math.round(row.price*row.vat/100);
    return `<tr><td>${esc(row.name)}</td><td>${row.unit}</td><td class="text-right">${money(row.price)}</td><td>${row.vat}%</td>
    <td class="text-right">${money(tax)}</td><td class="text-right">${money(row.price+tax)}</td><td>${btn("Sửa giá nhập","edit-stock-price",{value:i,style:"light compact"})}</td></tr>`;
  })),"Đơn giá mẫu theo từng công ty. Giá gồm VAT dùng để tham khảo chi phí thanh toán.");
}
function editStockPrice(value) {
  const index=Number(value);
  if(session?.area!=="company"||view!=="inventory"||!stockSamples[index]) return;
  const row=stockPrice(index);
  openDialog("Cập nhật giá nhập",`<form id="stock-price-form" data-index="${index}"><p>${esc(row.name)} · ${esc(row.unit)}</p><div class="form-grid">
  <label class="field">Giá nhập chưa VAT (₫)<input class="input" name="price" type="number" min="0" max="${maxSalesValue}" step="1" value="${row.price}" required></label>
  <label class="field">Thuế VAT<select class="input" name="vat">${vatOptions(row.vat)}</select></label></div>
  <p class="error" id="dialog-error"></p><button class="btn">Lưu giá nhập</button></form>`);
}
function saveStockPrice(form,el) {
  const index=Number(el.dataset.index);
  if(session?.area!=="company"||view!=="inventory"||!stockSamples[index]) return;
  const price=Number(form.get("price")), vat=Number(form.get("vat"));
  if(!Number.isSafeInteger(price)||price<0||price>maxSalesValue||!vatRates.includes(vat)) {
    fieldError("dialog-error","Kiểm tra giá và mức VAT.");return;
  }
  data.stockPrices ||= {};
  data.stockPrices[session.company] ||= {};
  data.stockPrices[session.company][index]={...stockSamples[index],price,vat};
  modal.close();save();render();notify("Đã cập nhật giá nhập.");
}
const xesc=(value)=>esc(String(value??"").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,""));
const xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
function officeFile(format,rows) {
  const sheet=format==="xlsx";
  const main=sheet?"xl/workbook.xml":"word/document.xml";
  const root=sheet?"spreadsheetml":"wordprocessingml";
  const ns="http://schemas.openxmlformats.org/"+root+"/2006/main";
  const relationships="http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const rel=(type,target)=>xml+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${relationships}/${type}" Target="${target}"/></Relationships>`;
  const files=[
    ["[Content_Types].xml",xml+`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/${main}" ContentType="application/vnd.openxmlformats-officedocument.${root}.${sheet?"sheet":"document"}.main+xml"/>${sheet?'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>':""}</Types>`],
    ["_rels/.rels",rel("officeDocument",main)],
  ];
  if (sheet) {
    files.push([main,xml+`<workbook xmlns="${ns}" xmlns:r="${relationships}"><sheets><sheet name="Ho so" sheetId="1" r:id="rId1"/></sheets></workbook>`],
      ["xl/_rels/workbook.xml.rels",rel("worksheet","worksheets/sheet1.xml")],
      ["xl/worksheets/sheet1.xml",xml+`<worksheet xmlns="${ns}"><cols><col min="1" max="1" width="44" customWidth="1"/><col min="2" max="9" width="19" customWidth="1"/></cols><sheetData>${rows.map((row,i)=>`<row r="${i+1}">${row.map(value=>typeof value==="number"?`<c><v>${value}</v></c>`:`<c t="inlineStr"><is><t xml:space="preserve">${xesc(value)}</t></is></c>`).join("")}</row>`).join("")}</sheetData></worksheet>`]);
  } else {
    const paragraph=(value,bold=false)=>`<w:p><w:r>${bold?"<w:rPr><w:b/><w:sz w:val=\"34\"/></w:rPr>":""}<w:t xml:space="preserve">${xesc(value)}</w:t></w:r></w:p>`;
    const printable=(value)=>typeof value==="number"?number.format(value):value;
    const start=rows.findIndex(row=>row.length===8 && row[0]==="Hạng mục");
    const end=rows.findIndex((row,i)=>i>start && !row.length);
    const regular=(items,heading=false)=>items.map((row,i)=>paragraph(row.map(printable).join("  ·  "),heading&&i===0)).join("");
    const table=start>=0?`<w:tbl><w:tblPr><w:tblBorders>${["top","left","bottom","right","insideH","insideV"].map(side=>`<w:${side} w:val="single" w:sz="4" w:color="D2E2D7"/>`).join("")}</w:tblBorders></w:tblPr>
    ${rows.slice(start,end).map((row,i)=>`<w:tr>${row.map(value=>`<w:tc>${i===0?'<w:tcPr><w:shd w:fill="E7F1EA"/></w:tcPr>':""}${paragraph(printable(value))}</w:tc>`).join("")}</w:tr>`).join("")}</w:tbl>`:"";
    files.push([main,xml+`<w:document xmlns:w="${ns}"><w:body>${start>=0?regular(rows.slice(0,start),true)+table+regular(rows.slice(end)):regular(rows,true)}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="950" w:bottom="950" w:left="950" w:right="950"/></w:sectPr></w:body></w:document>`]);
  }
  return new Blob([zip(files)],{type:officeTypes[format]});
}
function commercialRows(order,quote,contract=null) {
  const amounts=salesAmounts(quote.items,quote.discount,quote.tax);
  const rows=[[contract?"HỢP ĐỒNG MUA BÁN / DỊCH VỤ":"BÁO GIÁ",contract?.id||quote.id],
    ["Bản minh họa",contract?.final?"Bản cuối mẫu":"Mẫu nghiệp vụ"]];
  if(contract || quoteIdentity(order,quote).mode!=="anonymous") rows.push(["Mã đơn hàng",order.id]);
  if (contract) rows.push(["Bên bán",companyName(order.company)],["Khách hàng",order.customer],["Đại diện bên bán",contract.seller],["Đại diện bên mua",contract.buyer],
    ["Địa chỉ bên bán",contract.sellerAddress],["Địa chỉ bên mua",contract.buyerAddress],
    ["Mã số thuế bên bán",contract.sellerTax],["Mã số thuế bên mua",contract.buyerTax],
    ["Báo giá nguồn",quote.id],["Phạm vi",contract.scope],
    ["Giao nhận và nghiệm thu",contract.delivery],["Thanh toán",contract.payment],
    ["Bảo hành",contract.warranty],["Hiệu lực",contract.effect]);
  else rows.push(...quotePartyRows(order,quote),["Hiệu lực báo giá",date(quote.validUntil)],["Điều kiện báo giá",quote.terms||""]);
  rows.push([],["Hạng mục","ĐVT","SL","Giá chưa VAT (₫)","VAT (%)","Giá tính thuế (₫)","Tiền VAT (₫)","Tổng dòng (₫)"]);
  for (const item of amounts.lines) rows.push([item.name,item.unit,item.qty,item.price,item.vat??"",item.base,item.tax,item.total]);
  rows.push([],["Tạm tính (₫)",amounts.subtotal],["Chiết khấu (₫)",amounts.discount],["Tiền VAT (₫)",amounts.tax],["Tổng cộng (₫)",amounts.total]);
  if (contract) rows.push([],["Đại diện bên bán ký","Đại diện bên mua ký"]);
  else rows.push([],["Người lập báo giá","Người duyệt báo giá"],["Ký, ghi rõ họ tên","Ký, ghi rõ họ tên"],[],[]);
  return rows;
}
function commercialHtml(order,quote,contract) {
  const rows=commercialRows(order,quote,contract);
  const [head,...rest]=rows;
  const start=rows.findIndex(row=>row[0]==="Hạng mục"&&row.length===8);
  const end=start+quote.items.length+1;
  const fields=(entries)=>entries.filter(r=>r.length).map(([key,value])=>`<div><b>${esc(key)}</b><span>${esc(typeof value==="number"?money(value):value)}</span></div>`).join("");
  return `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(head[0])}</title>
  <style>body{margin:32px auto;padding:0 20px;max-width:850px;font:14px/1.5 Arial,sans-serif;color:#17372b}header{border-top:6px solid #246753;padding-top:14px}h1{margin:5px 0}.facts{margin:14px 0}.facts div{display:grid;grid-template-columns:185px 1fr;border-bottom:1px solid #dce8df;padding:5px;break-inside:avoid}.facts span{white-space:pre-wrap}table{border-collapse:collapse;width:100%;font-size:12px}td,th{padding:6px;border:1px solid #dce8df;text-align:left}th{background:#edf4ee}tr{break-inside:avoid}.totals{max-width:350px;margin-left:auto}.sign{display:flex;justify-content:space-between;margin:28px 20px 70px}button{margin:10px 0;padding:7px 13px}@media print{button{display:none}body{margin:0;padding:0}}</style>
  <header><small>TÀI LIỆU MINH HỌA</small><h1>${esc(head[0])}</h1><strong>${esc(head[1])}</strong></header><button onclick="window.print()">In / Lưu PDF</button>
  <section class="facts">${fields(rest.slice(0,start-1))}</section>
  <table><thead><tr>${rows[start].map(v=>`<th>${esc(v)}</th>`).join("")}</tr></thead><tbody>${rows.slice(start+1,end).map(row=>`<tr>${row.map(v=>`<td>${esc(typeof v==="number"?number.format(v):v)}</td>`).join("")}</tr>`).join("")}</tbody></table>
  <section class="facts totals">${fields(rows.slice(end+1,end+5))}</section>
  ${contract?'<div class="sign"><b>Đại diện bên bán</b><b>Đại diện bên mua</b></div>':quoteSignature()}</html>`;
}
function documentContext() {
  const order=secureOrder(selected.order);
  if (!canWork(order)) return {};
  if (view==="contract") return {order,quote:acceptedQuote(order),contract:order.contract};
  if (view==="quote") return {order,quote:order.quotes?.find(q=>q.id===selected.quote)||latestQuote(order)};
  return {};
}
function commercialActions(final) {
  return `<div class="actions quote-actions">${btn("Excel","commercial-export",{value:"xlsx",style:"light",icon:"down"})}
  ${btn("Word","commercial-export",{value:"docx",style:"light",icon:"down"})}
  ${btn("In / Lưu PDF","commercial-export",{value:"pdf",style:"light",icon:"doc"})}
  ${final?btn("Soạn email bản cuối","commercial-email",{icon:"mail"}):""}</div>`;
}
function commercialExport(format) {
  const {order,quote,contract}=documentContext();
  if (!quote || (view==="contract"&&!contract)) return;
  const id=contract?.id||quote.id;
  if (officeTypes[format]) {
    triggerDownload(officeFile(format,commercialRows(order,quote,contract)),id+"."+format);return;
  }
  if (format!=="pdf") return;
  const url=URL.createObjectURL(new Blob([commercialHtml(order,quote,contract)],{type:"text/html;charset=utf-8"}));
  const preview=window.open(url,"_blank");
  if (!preview) triggerDownload(new Blob([commercialHtml(order,quote,contract)],{type:"text/html;charset=utf-8"}),id+".html");
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
const contractFields={
  seller:"Đại diện bên bán",buyer:"Đại diện bên mua",sellerAddress:"Địa chỉ bên bán",buyerAddress:"Địa chỉ bên mua",
  sellerTax:"Mã số thuế bên bán",buyerTax:"Mã số thuế bên mua",scope:"Phạm vi công việc",delivery:"Giao nhận và nghiệm thu",
  payment:"Điều kiện thanh toán",warranty:"Điều khoản bảo hành",effect:"Hiệu lực và điều khoản khác",
};
function contractsPage() {
  const orders=listOrders(session.company).filter(order=>acceptedQuote(order));
  return heading("Hợp đồng","Danh sách hợp đồng và đơn hàng đã có báo giá được chấp thuận.")+
    section("Hợp đồng theo đơn hàng",table(["Mã đơn","Khách hàng","Báo giá nguồn","Trạng thái",""],orders.map(order=>
      `<tr><td>${esc(order.id)}<small>${esc(order.title)}</small></td><td>${esc(order.customer)}</td><td>${esc(acceptedQuote(order).id)}</td>
      <td>${chip(order.contract?.final?"Bản cuối":order.contract?"Bản nháp":"Chưa lập")}</td><td>${linkBtn("Mở hợp đồng",contractRoute(order),{style:"light compact",icon:"arrow"})}</td></tr>`)),
      "Chấp thuận báo giá để đưa đơn hàng vào danh sách.");
}
function contractPage() {
  const {order,quote,contract}=documentContext();
  if (!order || !quote) return heading("Hợp đồng","Cần báo giá đã được chấp thuận để lập hợp đồng.");
  return heading("Hợp đồng",`${esc(order.id)} · Báo giá nguồn ${esc(quote.id)}`,
    linkBtn("Danh sách hợp đồng",companyRoute(order.company)+"/hop-dong",{icon:"back"})+
    linkBtn("Mở đơn hàng",orderRoute(order),{icon:"link"})+linkBtn("Mở báo giá",quoteRoute(order),{icon:"doc"}))+
    `<div class="pack-grid"><section class="panel panel-pad"><h2>${esc(contract?.id||"Lập hợp đồng từ báo giá")}</h2>
    ${contract?`<p class="notice">${contract.final?"Bản cuối mẫu đã khóa":"Bản nháp có thể sửa"}</p><dl>${Object.entries(contractFields).map(([key,label])=>`<dt><strong>${label}</strong></dt><dd class="muted">${esc(contract[key]||"—")}</dd>`).join("")}</dl>${commercialActions(contract.final)}`:""}
    ${!contract?.final&&!order.paused&&order.step===4?btn(contract?"Sửa bản nháp":"Lập hợp đồng","edit-contract",{icon:"doc"}):""}</section>
    <section class="panel panel-pad"><h2>Nguồn và lưu trữ</h2><ul class="sublist"><li>Báo giá được chấp thuận<small>${esc(quote.id)}</small></li>
    <li>Giá trị hợp đồng mẫu<small>${money(order.total)}</small></li><li>Lưu theo mã đơn hàng<small>${esc(order.id)}</small></li></ul></section></div>`;
}
function editContract() {
  const {order,quote,contract}=documentContext();
  if (!quote||order.step!==4||order.paused||contract?.final) return;
  openDialog("Soạn hợp đồng",`<form id="contract-form" data-order="${esc(order.id)}"><div class="form-grid">
  ${Object.entries(contractFields).map(([key,label],i)=>`<label class="field ${i>=6?"wide":""}">${label}<input class="input" name="${key}" value="${esc(contract?.[key]??(key==="scope"?order.title:""))}" maxlength="300" ${["sellerTax","buyerTax"].includes(key)?"":"required"}></label>`).join("")}
  </div><label class="check"><input type="checkbox" name="verify">Đã kiểm tra nội dung để khóa bản cuối mẫu.</label><p class="error" id="dialog-error"></p>
  <div class="actions"><button class="btn light" name="intent" value="draft">Lưu bản nháp</button><button class="btn" name="intent" value="final">Khóa bản cuối</button></div></form>`);
}
function saveContract(form,el,intent) {
  const {order,quote,contract}=documentContext();
  if (!order||el.dataset.order!==order.id||!quote||order.step!==4||order.paused||contract?.final) return;
  const final=intent==="final";
  const fields=Object.fromEntries(Object.keys(contractFields).map(key=>[key,String(form.get(key)||"").trim()]));
  if (Object.entries(fields).some(([key,value])=>!key.endsWith("Tax")&&!value) || (final&&!form.has("verify"))) {
    fieldError("dialog-error","Điền đủ nội dung. Xác nhận kiểm tra nếu khóa bản cuối.");return;
  }
  order.contract={...fields,id:"HD-"+order.id,quoteId:quote.id,final,at:new Date().toISOString()};
  order.history.push(log((final?"Đã khóa bản cuối":"Đã lưu bản nháp")+" hợp đồng · "+order.contract.id));
  modal.close();save();render();
}
function commercialEmail() {
  const {order,quote,contract}=documentContext();
  if (!quote||(view==="contract"?!contract?.final:!["approved","sent","accepted"].includes(quote.status))) return;
  const id=contract?.id||quote.id;
  openDialog("Soạn email gửi bản cuối",`<form id="commercial-email" data-id="${esc(id)}"><div class="form-grid">
  <label class="field wide">Email khách hàng mẫu<input class="input" type="email" name="to" required value="khachhang@example.test"></label>
  <label class="field wide">Tiêu đề<input class="input" name="subject" maxlength="180" required value="${esc("["+companyName(order.company)+"] "+id)}"></label>
  <label class="field wide">Nội dung<textarea class="input" name="body" required maxlength="2400">Kính gửi Quý Khách hàng,&#10;&#10;Vui lòng xem ${contract?"bản hợp đồng":"bản báo giá"} đính kèm.&#10;&#10;Trân trọng.</textarea></label>
  <label class="field wide">Bản PDF mẫu đã lưu (tùy chọn)<input class="input" type="file" name="pdf" accept="application/pdf,.pdf"></label></div>
  <p class="muted">Thư mẫu có bản Word và Excel đính kèm. Chỉ dùng địa chỉ .test và tệp PDF minh họa.</p><p class="error" id="dialog-error"></p>
  <button class="btn" type="submit">Tải email .eml</button></form>`);
}
async function saveCommercialEmail(form,el) {
  const {order,quote,contract}=documentContext();
  const id=contract?.id||quote?.id;
  if (!quote||el.dataset.id!==id||(view==="contract"?!contract?.final:!["approved","sent","accepted"].includes(quote.status))) return;
  const to=String(form.get("to")||"").trim();
  const subject=String(form.get("subject")||"").trim();
  const body=String(form.get("body")||"").trim();
  if (!/^[a-z0-9._+-]+@(?:[a-z0-9-]+\.)+test$/i.test(to)||!subject||!body) {fieldError("dialog-error","Nhập email mẫu .test và nội dung thư.");return;}
  const enc=new TextEncoder(), boundary="tamcuong-"+crypto.randomUUID();
  const pdf=form.get("pdf");
  let pdfBytes;
  if (pdf?.size) {
    if (pdf.size>8*1024*1024 || await pdf.slice(0,5).text()!=="%PDF-") {
      fieldError("dialog-error","Chọn tệp PDF mẫu hợp lệ, tối đa 8 MB.");return;
    }
    pdfBytes=new Uint8Array(await pdf.arrayBuffer());
  }
  const wrap=bytes=>base64(bytes).match(/.{1,76}/g)?.join("\r\n")||"";
  const parts=["X-Unsent: 1","Date: "+new Date().toUTCString().replace("GMT","+0000"),
    "From: kinh-doanh."+order.company.toLowerCase()+"@example.test","To: "+to,"Subject: "+emailSubject(subject,enc),"MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,"","--"+boundary,'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64","",wrap(enc.encode(body))];
  for (const format of ["docx","xlsx"]) {
    const filename=id+"."+format;
    parts.push("--"+boundary,`Content-Type: ${officeTypes[format]}`,`Content-Disposition: attachment; filename="${filename}"`,
      "Content-Transfer-Encoding: base64","",wrap(new Uint8Array(await officeFile(format,commercialRows(order,quote,contract)).arrayBuffer())));
  }
  if (pdfBytes) parts.push("--"+boundary,"Content-Type: application/pdf",`Content-Disposition: attachment; filename="${id}.pdf"`,"Content-Transfer-Encoding: base64","",wrap(pdfBytes));
  parts.push("--"+boundary+"--","");
  triggerDownload(new Blob([parts.join("\r\n")],{type:"message/rfc822"}),id+".eml");
  order.history.push(log("Đã xuất email bản cuối · "+id+" · "+to));
  save();notify("Đã tải email mẫu kèm bản cuối.");
}

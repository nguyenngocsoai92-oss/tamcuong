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
    ["[Content_Types].xml",xml+`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/${main}" ContentType="application/vnd.openxmlformats-officedocument.${root}.${sheet?"sheet":"document"}.main+xml"/>${sheet?'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>':""}</Types>`],
    ["_rels/.rels",rel("officeDocument",main)],
  ];
  if (sheet) {
    files.push([main,xml+`<workbook xmlns="${ns}" xmlns:r="${relationships}"><sheets><sheet name="Ho so" sheetId="1" r:id="rId1"/></sheets></workbook>`],
      ["xl/_rels/workbook.xml.rels",rel("worksheet","worksheets/sheet1.xml").replace("</Relationships>",`<Relationship Id="rId2" Type="${relationships}/styles" Target="styles.xml"/></Relationships>`)],
      ["xl/styles.xml",xml+`<styleSheet xmlns="${ns}"><fonts count="2"><font><sz val="13"/><name val="Times New Roman"/></font><font><b/><sz val="13"/><name val="Times New Roman"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAE5D8"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`],
      ["xl/worksheets/sheet1.xml",xml+`<worksheet xmlns="${ns}"><cols><col min="1" max="1" width="44" customWidth="1"/><col min="2" max="9" width="19" customWidth="1"/></cols><sheetData>${rows.map((row,i)=>{
        const style=i===0||row[0]==="Hạng mục"||row[0]==="Tổng cộng (₫)"?' s="1"':"";
        return `<row r="${i+1}">${row.map(value=>typeof value==="number"?`<c${style}><v>${value}</v></c>`:`<c${style} t="inlineStr"><is><t xml:space="preserve">${xesc(value)}</t></is></c>`).join("")}</row>`;
      }).join("")}</sheetData></worksheet>`]);
  } else {
    const paragraph=(value,emphasis=false,title=false)=>`<w:p><w:pPr><w:spacing w:after="70" w:line="252" w:lineRule="auto"/>${title?'<w:jc w:val="center"/>':""}</w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>${emphasis?"<w:b/>":""}<w:sz w:val="${title?34:26}"/><w:szCs w:val="${title?34:26}"/></w:rPr>${String(value??"").split(/\r?\n/).map(part=>`<w:t xml:space="preserve">${xesc(part)}</w:t>`).join("<w:br/>")}</w:r></w:p>`;
    const printable=(value)=>typeof value==="number"?number.format(value):value;
    const start=rows.findIndex(row=>row.length===8 && row[0]==="Hạng mục");
    const end=rows.findIndex((row,i)=>i>start && !row.length);
    const regular=(items,heading=false)=>items.map((row,i)=>{
      if(["Đại diện bên bán ký","Người lập báo giá"].includes(row[0]))return `<w:tbl><w:tblPr><w:tblW w:w="9300" w:type="dxa"/></w:tblPr><w:tblGrid><w:gridCol w:w="4650"/><w:gridCol w:w="4650"/></w:tblGrid><w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="1450" w:hRule="atLeast"/></w:trPr>${row.map(label=>`<w:tc>${paragraph(label,true)}${paragraph("Ký, ghi rõ họ tên")}</w:tc>`).join("")}</w:tr></w:tbl>`;
      if(row[0]==="Ký, ghi rõ họ tên")return "";
      return paragraph(row.map(printable).join("  ·  "),heading&&i===0||/^Điều /.test(row[0]||""),heading&&i===0);
    }).join("");
    const widths=[2050,600,480,1120,580,1250,1130,1410];
    const table=start>=0?`<w:tbl><w:tblPr><w:tblBorders>${["top","left","bottom","right","insideH","insideV"].map(side=>`<w:${side} w:val="single" w:sz="4" w:color="BDB6A2"/>`).join("")}</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${widths.map(w=>`<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>
    ${rows.slice(start,end).map((row,i)=>`<w:tr><w:trPr><w:cantSplit/>${i===0?"<w:tblHeader/>":""}</w:trPr>${row.map((value,j)=>`<w:tc><w:tcPr><w:tcW w:w="${widths[j]}" w:type="dxa"/>${i===0?'<w:shd w:fill="EAE5D8"/>':""}</w:tcPr>${paragraph(printable(value),i===0)}</w:tc>`).join("")}</w:tr>`).join("")}</w:tbl>`:"";
    files.push([main,xml+`<w:document xmlns:w="${ns}"><w:body>${start>=0?regular(rows.slice(0,start),true)+table+regular(rows.slice(end)):regular(rows,true)}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:bottom="1134" w:left="1417" w:right="1134"/></w:sectPr></w:body></w:document>`]);
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
    ["Báo giá nguồn",quote.id],["Điều 1. Phạm vi và giá trị",contract.scope],
    ["Điều 2. Giao nhận và nghiệm thu",contract.delivery],["Điều 3. Thanh toán",contract.payment],
    ["Điều 4. Bảo hành",contract.warranty],["Điều 5. Quyền và nghĩa vụ",contract.obligations||""],
    ["Điều 6. Thay đổi, chấm dứt và tranh chấp",contract.disputes||""],["Điều 7. Hiệu lực",contract.effect]);
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
  const fields=(entries)=>entries.filter(r=>r.length&&r[1]!=="").map(([key,value])=>`<div ${/^Điều /.test(key)?'class="clause"':""}><b>${esc(key)}</b><span>${esc(typeof value==="number"?money(value):value)}</span></div>`).join("");
  return `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(head[0])}</title>
  <style>
  @page{size:A4;margin:20mm 20mm 20mm 25mm}*{box-sizing:border-box}body{max-width:210mm;margin:18px auto;padding:12mm 18mm;background:white;color:#20221e;font:13pt/1.22 "Times New Roman",Times,serif}
  header{text-align:center;border-top:2px solid #283c30;border-bottom:1px solid #bfb6a2;padding:7px 0}header small{font-size:12pt;letter-spacing:.07em;color:#51554b}h1{font-size:17pt;margin:4px 0}header strong{font-size:13pt}
  .facts{margin:8px 0}.facts div{display:grid;grid-template-columns:40mm 1fr;gap:5px;border-bottom:1px solid #e5e1d6;padding:3px 4px;break-inside:avoid}
  .facts .clause{display:block;border-bottom:0;padding:3px 0}.clause span{display:block}.facts span{white-space:pre-wrap;overflow-wrap:anywhere}
  table{border-collapse:collapse;width:100%;font:13pt/1.13 "Times New Roman",Times,serif}td,th{padding:3px 4px;border:1px solid #c9c3b2;text-align:left}th{background:#eeeade;font-weight:bold}thead{display:table-header-group}tr{break-inside:avoid}
  td:nth-child(n+3){text-align:right}.totals{width:min(100%,83mm);margin:6px 0 0 auto}.totals div{grid-template-columns:1fr auto}.totals div:last-child{border-top:1px solid #283c30;font-weight:bold}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:center;margin-top:12px;min-height:31mm;break-inside:avoid}.sign small{display:block;font-size:12pt;margin-top:3px}button{margin:7px 0;padding:5px 9px;font:inherit}
  @media print{button{display:none}body{margin:0;padding:0;max-width:none}th{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style>
  <header><small>MẪU THỬ NGHIỆM</small><h1>${esc(head[0])}</h1><strong>${esc(head[1])}</strong></header><button onclick="window.print()">In / Lưu PDF</button>
  <section class="facts">${fields(rest.slice(0,start-1))}</section>
  <table><thead><tr>${rows[start].map(v=>`<th>${esc(v)}</th>`).join("")}</tr></thead><tbody>${rows.slice(start+1,end).map(row=>`<tr>${row.map(v=>`<td>${esc(typeof v==="number"?number.format(v):v)}</td>`).join("")}</tr>`).join("")}</tbody></table>
  <section class="facts totals">${fields(rows.slice(end+1,end+5))}</section>
  ${contract?'<div class="sign"><div><b>Đại diện bên bán</b><small>Ký, ghi rõ họ tên</small></div><div><b>Đại diện bên mua</b><small>Ký, ghi rõ họ tên</small></div></div>':quoteSignature()}</html>`;
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
  payment:"Điều kiện thanh toán",warranty:"Điều khoản bảo hành",obligations:"Quyền và nghĩa vụ",disputes:"Thay đổi, chấm dứt và tranh chấp",effect:"Hiệu lực",
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
    `<div class="contract-flow">${chip("Báo giá chấp thuận")}${chip(contract?.final?"Đã khóa bản cuối":"Soạn và rà soát",contract?.final?"":"warn")}
    ${chip(evidenceFor(order,"hop-dong")?"Đã lưu bản ký":"Chờ bản ký",evidenceFor(order,"hop-dong")?"":"neutral")}
    ${chip(order.step>=5?"Đã xác nhận hiệu lực":"Chờ hiệu lực",order.step>=5?"":"neutral")}</div>
    <div class="pack-grid"><section class="panel panel-pad"><h2>${esc(contract?.id||"Lập hợp đồng từ báo giá")}</h2>
    ${contract?`<p class="notice">${contract.final?"Bản cuối mẫu đã khóa":"Bản nháp có thể sửa"}</p><dl>${Object.entries(contractFields).map(([key,label])=>`<dt><strong>${label}</strong></dt><dd class="muted">${esc(contract[key]||"—")}</dd>`).join("")}</dl>${commercialActions(contract.final)}`:""}
    ${unidentified(order)?`<p class="notice warn">Gắn tên khách hàng trước khi khóa bản cuối.</p>${btn("Gắn khách hàng","link-customer",{style:"light"})}`:""}
    ${contract?.final&&order.step===4&&!evidenceFor(order,"hop-dong")&&!order.paused?btn("Lưu hợp đồng đã ký","upload-source",{value:"hop-dong",style:"light",icon:"doc"}):""}
    ${!contract?.final&&!order.paused&&order.step===4?btn(contract?"Sửa bản nháp":"Lập hợp đồng","edit-contract",{icon:"doc"}):""}</section>
    <section class="panel panel-pad"><h2>Nguồn và lưu trữ</h2><ul class="sublist"><li>Báo giá được chấp thuận<small>${esc(quote.id)}</small></li>
    <li>Giá trị hợp đồng mẫu<small>${money(order.total)}</small></li><li>Lưu theo mã đơn hàng<small>${esc(order.id)}</small></li></ul></section></div>`;
}
function editContract() {
  const {order,quote,contract}=documentContext();
  if (!quote||order.step!==4||order.paused||contract?.final) return;
  openDialog("Soạn hợp đồng",`<form id="contract-form" data-order="${esc(order.id)}"><div class="form-grid">
  ${Object.entries(contractFields).map(([key,label],i)=>`<label class="field ${i>=6?"wide":""}">${label}${i>=6?
    `<textarea class="input" name="${key}" maxlength="1000" rows="2" required>${esc(contract?.[key]??(key==="scope"?order.title:""))}</textarea>`:
    `<input class="input" name="${key}" value="${esc(contract?.[key]||"")}" maxlength="180" ${["sellerTax","buyerTax"].includes(key)?"":"required"}>`}</label>`).join("")}
  </div><label class="check"><input type="checkbox" name="verify">Đã kiểm tra nội dung để khóa bản cuối mẫu.</label><p class="error" id="dialog-error"></p>
  <div class="actions"><button class="btn light" name="intent" value="draft">Lưu bản nháp</button><button class="btn" name="intent" value="final">Khóa bản cuối</button></div></form>`);
}
function saveContract(form,el,intent) {
  const {order,quote,contract}=documentContext();
  if (!order||el.dataset.order!==order.id||!quote||order.step!==4||order.paused||contract?.final) return;
  const final=intent==="final";
  const fields=Object.fromEntries(Object.keys(contractFields).map(key=>[key,String(form.get(key)||"").trim()]));
  if (final&&unidentified(order)) return fieldError("dialog-error","Gắn khách hàng trước khi khóa bản cuối.");
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

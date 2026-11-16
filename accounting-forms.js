"use strict";

const legalLabels={name:"Tên pháp nhân",tax:"Mã số thuế",address:"Địa chỉ đăng ký",representative:"Người đại diện",position:"Chức vụ",authority:"Căn cứ đại diện / Ủy quyền (nếu có)",phone:"Điện thoại",email:"Email",account:"Số tài khoản",bank:"Ngân hàng",place:"Địa danh lập",slogan:"Khẩu hiệu doanh nghiệp"};
const formSpecifications={
  "bao-gia":["BG",["Hiệu lực báo giá","Tiến độ và địa điểm giao","Điều kiện thanh toán","Bảo hành và phạm vi giá"],["Người lập báo giá","Người duyệt báo giá"]],
  "hop-dong":["HĐ",["Căn cứ và hồ sơ kèm theo","Đối tượng, quy cách và phạm vi","Giá trị, VAT và điều chỉnh giá","Giao nhận, nghiệm thu và chuyển rủi ro","Tạm ứng, thanh toán và hồ sơ thanh toán","Quyền và nghĩa vụ các bên","Bảo hành và xử lý khiếm khuyết","Vi phạm, bồi thường và bất khả kháng","Sửa đổi, chấm dứt và giải quyết tranh chấp","Hiệu lực, số bản và phụ lục"],["Đại diện Bên A","Đại diện Bên B"],true],
  "phu-luc":["PL",["Hợp đồng và điều khoản được sửa","Nội dung trước và sau sửa đổi","Ảnh hưởng giá trị, thuế và tiến độ","Hiệu lực, số bản và phần tiếp tục áp dụng"],["Đại diện Bên A","Đại diện Bên B"]],
  "tam-ung":["ĐNTƯ",["Căn cứ và mốc tạm ứng","Tỷ lệ / Số tiền bằng số","Số tiền bằng chữ","Hạn trả và tài khoản thụ hưởng","Chứng từ kèm theo"],["Người lập","Kế toán kiểm tra","Người duyệt"]],
  "giao":["PGH",["Kho xuất và địa điểm giao","Thời điểm giao và người nhận","Số lượng giao thực tế, thiếu hụt và tình trạng","Chứng từ kèm theo"],["Người giao","Người nhận","Thủ kho"]],
  "nghiem-thu":["BBNT",["Thời gian, địa điểm và thành phần","Hạng mục và căn cứ nghiệm thu","Khối lượng, chất lượng và kết quả đo kiểm","Kết luận, tồn tại, hạn và người khắc phục","Hồ sơ kèm theo và số bản"],["Đại diện Bên A","Đại diện Bên B","Phụ trách kỹ thuật"]],
  "ban-giao":["BBBG",["Thời điểm, địa điểm và thành phần","Hạng mục, số lượng thực giao và tình trạng","Hồ sơ, tài sản, phụ kiện kèm theo","Trách nhiệm sau bàn giao và số bản"],["Bên giao","Bên nhận"]],
  "thanh-ly":["BBTL",["Căn cứ và tình trạng thực hiện","Giá trị hợp đồng, phát sinh và đã thanh toán","Giá trị còn lại, bảo hành và hạn thanh toán","Nghĩa vụ tiếp tục và hiệu lực thanh lý"],["Đại diện Bên A","Đại diện Bên B"]],
  "de-xuat":["ĐXMH",["Bộ phận yêu cầu và công trình","Lý do mua, tồn hiện tại và nhu cầu","Thời hạn cần, ngân sách và nhà cung cấp dự kiến","Kết quả phê duyệt"],["Người đề xuất","Mua hàng","Người duyệt"]],
  "dat-mua":["ĐĐM",["Yêu cầu quy cách và dung sai","Lịch, điểm giao và điều kiện nhận","Giá, VAT và điều kiện thanh toán","Hồ sơ kèm hàng, đổi trả và xác nhận"],["Bên đặt hàng","Nhà cung cấp"]],
  "nhan":["BBNH",["Đơn mua / Phiếu giao đối chiếu","Thời gian, địa điểm và thành phần","Số lượng thực nhận, đạt và không đạt","Xử lý hàng thiếu, lỗi và chứng từ kèm"],["Người giao","Người nhận","Kiểm hàng"]],
  "nhap":["PNK",["Kho và vị trí nhập","Nguồn nhập, người giao và chứng từ gốc","Số lượng theo chứng từ và thực nhập","Giá nhập chưa VAT và ghi chú chênh lệch"],["Người lập","Người giao","Thủ kho","Kế toán"]],
  "xuat":["PXK",["Kho xuất, người nhận và đơn liên quan","Lý do xuất và địa điểm sử dụng","Số lượng yêu cầu và thực xuất","Chứng từ kèm theo"],["Người lập","Người nhận","Thủ kho","Người duyệt"]],
  "thanh-toan":["ĐNTT",["Người đề nghị và lý do chi","Căn cứ, đủ điều kiện và chứng từ kèm","Số tiền bằng số / Số tiền bằng chữ","Thông tin thụ hưởng, hạn và phương thức"],["Người đề nghị","Kế toán","Người duyệt"]],
  "doi-soat":["BBĐS",["Kỳ đối soát và chứng từ liên quan","Số dư đầu kỳ, phát sinh và đã thanh toán","Chênh lệch cần xử lý","Số dư xác nhận, hạn và đầu mối xử lý"],["Đại diện Bên A","Đại diện Bên B"]],
  "thu":["PT",["Người nộp tiền và địa chỉ","Lý do nộp và phương thức","Số tiền bằng số","Số tiền bằng chữ","Chứng từ gốc và số lượng kèm theo"],["Người lập","Người nộp tiền","Thủ quỹ","Kế toán trưởng","Người duyệt"]],
  "chi":["PC",["Người nhận tiền và địa chỉ","Lý do chi và phương thức","Số tiền bằng số","Số tiền bằng chữ","Chứng từ gốc và số lượng kèm theo"],["Người lập","Người nhận tiền","Thủ quỹ","Kế toán trưởng","Người duyệt"]],
  "bao-hanh":["PBH",["Hạng mục và mã nhận diện","Ngày bắt đầu và thời hạn bảo hành","Phạm vi, điều kiện và đầu mối tiếp nhận","Thời hạn phản hồi và bàn giao sau xử lý"],["Đơn vị bảo hành","Khách hàng"]],
};
const supplementaryForms=[
  ["mua-hang","Hợp đồng mua hàng"],["phu-luc","Phụ lục hợp đồng"],["thu","Phiếu thu"],["chi","Phiếu chi"],["xuat","Phiếu xuất kho"],["bao-hanh","Phiếu bảo hành"],
];
const specification=id=>formSpecifications[id==="mua-hang"?"hop-dong":id];
const liveLegal=company=>data.legalProfiles?.[company]||{};
const legalValue=(value,label)=>value||"["+label+"]";
const formalBuying=(id,kind)=>kind==="buying"||id==="mua-hang";
const formalExtras=(kind)=>supplementaryForms.filter(([id])=>["phu-luc","xuat"].includes(id)||(kind==="buying"?["mua-hang","chi"].includes(id):["thu","bao-hanh"].includes(id))).map(([id,title])=>[id,title,"Biểu mẫu bổ trợ",0]);
const partyTypes={business:"Doanh nghiệp",individual:"Cá nhân",household:"Hộ kinh doanh"};
const normalizePartyType=value=>value==="retail"?"individual":Object.hasOwn(partyTypes,value)?value:"";
function contractInstructions(buying,partnerType){
  const seller=buying?"Bên B":"Bên A",buyer=buying?"Bên A":"Bên B";
  return [
    "Hai bên thỏa thuận trên cơ sở Bộ luật Dân sự và quy định liên quan. Hồ sơ kèm theo: [Số, ngày báo giá/đơn đặt hàng, bản vẽ, phụ lục].",
    seller+" cung cấp cho "+buyer+" hàng hóa hoặc dịch vụ theo bảng hạng mục và [quy cách, tiêu chuẩn chất lượng, xuất xứ và phạm vi công việc]. Phát sinh chỉ thực hiện sau khi hai bên xác nhận bằng văn bản.",
    "Đơn giá trong bảng là giá chưa VAT. Tổng giá trị bằng số: [Số tiền]; bằng chữ: [Số tiền bằng chữ]. Thuế và chi phí vận chuyển, lắp đặt: [ghi rõ mức áp dụng và khoản đã bao gồm]. Thay đổi giá được xác nhận bằng phụ lục.",
    "Giao tại [địa điểm] vào [mốc thời gian]. Hai bên đối chiếu số lượng, chất lượng và hồ sơ kèm theo khi giao. Ghi kết quả, sai lệch và hạn khắc phục trong biên bản. Thời điểm chuyển quyền sở hữu và rủi ro: [thỏa thuận phù hợp pháp luật].",
    buyer+" tạm ứng [tỷ lệ/số tiền] trước [mốc]. Thanh toán phần còn lại theo [từng đợt, số tiền, hạn, điều kiện thanh toán]. Hồ sơ thanh toán: [liệt kê]. Phương thức, tài khoản và chủ tài khoản thụ hưởng: [điền].",
    seller+" giao đúng quy cách, số lượng và thời hạn, cung cấp chứng từ kèm theo. "+buyer+" bố trí người tiếp nhận, phối hợp kiểm tra và thanh toán theo Điều 5. Các bên thông báo kịp thời nếu có vướng mắc.",
    "Bảo hành trong [thời hạn] kể từ [mốc]. Phạm vi, địa điểm, chi phí và thời hạn sửa đổi/trả hàng: [điền]. Tiếp nhận phản ánh tại [đầu mối, điện thoại, email], phản hồi trong [thời hạn]."+(partnerType==="individual"?" Nếu giao kết với người tiêu dùng, ghi thêm điều kiện đổi trả, cách tiếp nhận khiếu nại và thông tin về việc bảo vệ dữ liệu cá nhân.":""),
    "Bên bị ảnh hưởng thông báo và phối hợp giảm thiểu thiệt hại. Phạt vi phạm nếu có thỏa thuận: [hành vi, mức và căn cứ tính trong giới hạn pháp luật áp dụng]. Bồi thường và miễn trách nhiệm được xác định theo thỏa thuận hợp pháp và quy định áp dụng.",
    "Sửa đổi bằng phụ lục có xác nhận của hai bên. Căn cứ và thời hạn thông báo chấm dứt: [điền]. Khi chấm dứt, đối soát phần đã thực hiện, công nợ và hồ sơ bàn giao. Tranh chấp được thương lượng trước khi chuyển cơ quan có thẩm quyền theo pháp luật hoặc thỏa thuận hợp lệ.",
    "Hiệu lực từ [ngày hoặc điều kiện]. Hợp đồng lập [số bản], mỗi bên giữ [số bản]. Danh mục phụ lục: [điền]. Các nghĩa vụ về thanh toán, bảo hành và giải quyết tranh chấp tiếp tục theo phần đã thỏa thuận.",
  ];
}
function formDefaultFields(order,item,bundle,kind="sales"){
  const id=item[0],source=bundle?.snapshot||order;
  const quote=acceptedQuote(source);
  const contract=id==="hop-dong"?source.contract:null;
  const purchase=formalBuying(id,kind);
  const [code,fields,,isContract]=specification(id);
  const basis=contract?[quote?.id&&"Báo giá "+quote.id,contract.id&&"Hợp đồng "+contract.id].filter(Boolean).join(" · "):"";
  const contractValues=[basis,contract?.scope,"",contract?.delivery,contract?.payment,contract?.obligations,contract?.warranty,"",contract?.disputes,contract?.effect];
  const counterpart=contract||{};
  const identity=quoteIdentity(source,quote);
  const anonymous=id==="bao-gia"&&identity.mode==="anonymous";
  const customer=["business","household"].includes(identity.kind)?identity.business:identity.customer||source.customer;
  const partnerType=purchase?"":normalizePartyType(identity.kind);
  const instructions=isContract?contractInstructions(purchase,partnerType):[];
  return [
    ["ref","Số hiệu",id==="hop-dong"&&contract?.id||id==="bao-gia"&&quote?.id||(anonymous?"BG-MAU":`${code}-${source.id}`)],
    ["issueDate","Ngày lập / ký (ngày/tháng/năm)",new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"Asia/Ho_Chi_Minh"}).format(new Date(bundle?.createdAt||dayInVietnam()))],
    ["partyType","Loại Bên B",partnerType],
    ["partyName","Tên đăng ký hoặc họ tên Bên B",!purchase&&!anonymous?customer:""],
    ["partyAddress","Địa chỉ bên đối tác",purchase||anonymous?"":counterpart.buyerAddress||identity.address||""],
    ["partyTax","Mã số thuế bên đối tác (nếu có)",purchase?"":counterpart.buyerTax||identity.taxId||""],
    ["partyRepresentative","Đại diện / Người liên hệ bên đối tác",purchase?"":counterpart.buyer||identity.person||""],
    ["partyPosition","Chức vụ / Tư cách ký của Bên B",""],
    ["partyRegistration","Số đăng ký hộ kinh doanh (nếu áp dụng)",""],
    ["partyAuthority","Căn cứ đại diện bên đối tác (nếu có)",""],
    ["partyContact","Điện thoại / Email bên đối tác",purchase?"":[identity.phone,identity.email].filter(Boolean).join(" · ")],
    ["partyBank","Tài khoản / Ngân hàng bên đối tác",""],
    ...fields.map((label,index)=>["detail"+index,isContract?`Điều ${index+1}. ${label}`:label,isContract?contractValues[index]||instructions[index]:id==="bao-gia"&&index===0&&quote?.validUntil?date(quote.validUntil):id==="bao-gia"&&index===3?quote?.terms||"":""]),
    ["lineNote","Chi tiết hạng mục (mỗi dòng: tên | ĐVT | số lượng | đơn giá | thuế %; để trống để dùng dữ liệu nguồn)",""],
  ].filter(([key])=>!anonymous||!key.startsWith("party"));
}
function formalDocument(order,item,bundle,edit,kind){
  const source=bundle?.snapshot||order,id=item[0],quote=acceptedQuote(source),profile=bundle?.legalProfile||liveLegal(order.company);
  const identity=quoteIdentity(source,quote),anonymous=id==="bao-gia"&&identity.mode==="anonymous";
  const [, ,signatures,isContract]=specification(id);
  const fields=Object.fromEntries(formEditableFields(order,item,bundle,edit,kind).map(([key,label,value])=>[key,[label,value]]));
  const partyType=normalizePartyType(fields.partyType?.[1]);
  const partyLabels={
    partyName:partyType==="individual"?"Họ và tên":partyType==="household"?"Tên hộ kinh doanh":"Tên đăng ký / Họ tên",
    partyAddress:"Địa chỉ",partyTax:"Mã số thuế (nếu áp dụng)",partyRepresentative:partyType==="household"?"Chủ hộ / Người được ủy quyền":"Đại diện / Đầu mối",
    partyPosition:"Chức vụ / Tư cách ký",partyRegistration:"Số đăng ký hộ kinh doanh",partyAuthority:"Căn cứ đại diện / Ủy quyền",
    partyContact:"Điện thoại / Email",partyBank:"Tài khoản / Ngân hàng",
  };
  const buying=formalBuying(id,kind);
  const knownSeller=!buying?{tax:source.contract?.sellerTax||identity.sellerTax,address:source.contract?.sellerAddress||identity.sellerAddress,representative:source.contract?.seller,phone:identity.sellerPhone,email:identity.sellerEmail}:{};
  const left=Object.entries(legalLabels).filter(([key])=>!["place","slogan"].includes(key)).map(([key,label])=>[label,legalValue(profile[key]||knownSeller[key]||(key==="name"?companyName(order.company)+" (tên hiển thị)":""),label)]);
  const right=[["Loại Bên B",partyTypes[partyType]||"[Doanh nghiệp / Cá nhân / Hộ kinh doanh]"],
    ...Object.entries(partyLabels).filter(([key])=>key==="partyRegistration"?partyType==="household":partyType!=="individual"||!["partyPosition","partyRepresentative"].includes(key)||!!fields[key]?.[1])
      .map(([key,label])=>[label,legalValue(fields[key]?.[1],label)])];
  const roles={
    "bao-gia":["Bên báo giá","Khách hàng"],"hop-dong":["Bên bán","Bên mua"],"mua-hang":["Bên mua","Nhà cung cấp"],
    "giao":["Bên giao","Bên nhận"],"ban-giao":["Bên giao","Bên nhận"],"dat-mua":["Bên đặt hàng","Nhà cung cấp"],
    "nhan":["Bên nhận","Bên giao"],"nhap":["Bên nhập kho","Bên giao"],"xuat":["Bên xuất kho","Bên nhận"],
    "thu":["Bên thu tiền","Bên nộp tiền"],"chi":["Bên chi tiền","Bên nhận tiền"],"bao-hanh":["Bên bảo hành","Khách hàng"],
  };
  const [roleA,roleB]=roles[id]||(buying?["Bên mua","Nhà cung cấp"]:["Công ty","Khách hàng"]);
  const groups=anonymous?[]:[["BÊN A · "+roleA.toUpperCase(),left],["BÊN B · "+roleB.toUpperCase(),right]];
  const explicit=parseFormalLines(fields.lineNote[1]).filter(Boolean);
  const purchase=captureFormalPurchases(order)[id]||[];
  const sourceLines=["bao-gia","hop-dong","mua-hang","dat-mua","de-xuat"].includes(id);
  const lines=explicit.length?explicit:!sourceLines?[]:buying?bundle?.formalPurchases?.[id]||purchase:quote?.items||source.items||[];
  const amounts=salesAmounts(lines,explicit.length||buying?0:quote?.discount||0,explicit.length||buying?0:quote?.tax||0);
  const showLines=["bao-gia","hop-dong","mua-hang","dat-mua","giao","nhan","nghiem-thu","ban-giao","nhap","xuat","de-xuat"].includes(id);
  const headings=["Hạng mục","ĐVT","SL","Đơn giá","VAT","Tiền VAT","Thành tiền"];
  const items=showLines?(amounts.lines.length?amounts.lines.map(row=>[row.name,row.unit,row.qty,number.format(row.price),row.vat===undefined?"—":row.vat+"%",number.format(row.tax),number.format(row.total)]):[["[Tên / Quy cách]","[ĐVT]","[SL]","[Giá]","[%]","[VAT]","[Tiền]"]]):[];
  const totals=showLines&&lines.length?[["Tạm tính",money(amounts.subtotal)],["Chiết khấu",money(amounts.discount)],["Thuế VAT",money(amounts.tax)],["Tổng thanh toán",money(amounts.total)]]:[];
  return {title:isContract?"HỢP ĐỒNG "+(buying?"MUA HÀNG":"MUA BÁN HÀNG HÓA / DỊCH VỤ"):item[1].toUpperCase(),anonymous,profile,
    header:anonymous?"":companyName(order.company),ref:fields.ref[1],issueDate:fields.issueDate[1],groups,
    references:anonymous?[]:[["Hồ sơ liên quan",source.id+" · "+source.title],["Hợp đồng / Báo giá", [source.contract?.id,quote?.id].filter(Boolean).join(" · ")||"[Mã tham chiếu]"]],
    details:Object.entries(fields).filter(([key])=>key.startsWith("detail")).map(([, [label,value]])=>[label,legalValue(value,"Điền theo hồ sơ giao dịch")]),
    headings,items,totals,signatures};
}

function formEditableFields(order,item,bundle,edit,kind="sales"){
  const oldKeys=item[0]==="hop-dong"?{partyAddress:"buyerAddress",partyTax:"buyerTax",partyRepresentative:"buyer",
    detail1:"scope",detail3:"delivery",detail4:"payment",detail5:"obligations",detail6:"warranty",detail8:"disputes",detail9:"effect"}:{detail0:"content"};
  return formDefaultFields(order,item,bundle,kind).map(([key,label,value])=>[key,label,edit?.fields?.[key]??edit?.fields?.[oldKeys[key]]??value]);
}
const nationalHeading="CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM";
const nationalMotto="Độc lập - Tự do - Hạnh phúc";
function formalHtml(doc){
  const logo=!doc.anonymous&&doc.profile.logo;
  const pair=([key,value])=>`<div class="pair"><b>${esc(key)}</b><span>${esc(value)}</span></div>`;
  return `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(doc.title)}</title>
  <style>
  @page{size:A4;margin:16mm 16mm 17mm 21mm}*{box-sizing:border-box}body{font:13pt/1.22 "Times New Roman",Times,serif;background:#fff;color:#20251e;max-width:177mm;margin:16px auto;padding:0 8px}h1,h2,p{margin:0}header,.groups,.signatures{display:grid;gap:8px;grid-template-columns:repeat(2,minmax(0,1fr))}header{border-bottom:1px solid #66736a;padding-bottom:8px;align-items:center}header img{display:block;width:auto;max-width:42mm;height:auto;max-height:17mm;margin-bottom:4px}header .national{text-align:center}header .national p{font-size:12pt;line-height:1.18}header .national strong{display:block;margin-top:3px}header small{font-size:12pt}h1{text-align:center;font-size:17pt;margin-top:9px}h2{font-size:13pt} .meta{text-align:center;margin:4px 0 9px}.meta small{font-size:12pt}.groups{margin:6px 0;grid-template-columns:1fr}.group{border:1px solid #b8bdb5;padding:6px;break-inside:avoid}.group h2{color:#233e31;background:#efefe7;margin:-6px -6px 4px;padding:4px 6px}.pair{display:grid;grid-template-columns:34% 1fr;gap:4px;margin:2px 0;break-inside:avoid}.pair span,.detail span{white-space:pre-wrap;overflow-wrap:anywhere}.references{border-block:1px solid #c9cdc6;padding:3px 0;margin:7px 0}.detail{padding:4px 0;break-inside:avoid}.detail b{display:block}table{width:100%;border-collapse:collapse;margin:6px 0;font:inherit}thead{display:table-header-group}th,td{border:1px solid #a9b2a9;padding:3px 4px;text-align:left}th{background:#efefe7}td:nth-child(n+3){text-align:right;white-space:nowrap}tr{break-inside:avoid}.totals{margin:5px 0 6px auto;width:min(100%,88mm)}.totals .pair{grid-template-columns:1fr auto}.totals .pair:last-child{border-top:1px solid #66736a;padding-top:3px;font-weight:bold}.signatures{text-align:center;grid-template-columns:repeat(var(--signers),minmax(0,1fr));margin-top:12px;min-height:29mm;break-inside:avoid}.signatures span{display:block;font-size:12pt}.print{display:block;margin:5px 0 5px auto;font:inherit}.anonymous{display:block}.group:only-child{grid-column:1/-1}@media(max-width:570px){.groups{grid-template-columns:1fr}.sheet-table{overflow:auto}}@media print{body{max-width:none;margin:0;padding:0} .print{display:none}th{print-color-adjust:exact}}
  </style><button class="print" onclick="window.print()">In / Lưu PDF</button><header class="${doc.anonymous?"anonymous":""}">
  ${doc.anonymous?"":`<div>${logo?`<img alt="Logo doanh nghiệp" src="data:${logo.type};base64,${logo.content}">`:""}<strong>${esc(doc.profile.name||doc.header)}</strong>${doc.profile.slogan?`<p><small>${esc(doc.profile.slogan)}</small></p>`:""}</div>`}
  <div class="national"><p><b>${nationalHeading}</b></p><strong>${nationalMotto}</strong></div></header>
  <h1>${esc(doc.title)}</h1><div class="meta"><p>Số ${esc(doc.ref)} · ${esc(doc.anonymous?"":doc.profile.place||"[Địa danh], ")}${esc(doc.issueDate)}</p><small>MẪU RÀ SOÁT · Kiểm tra thông tin trước khi ký</small></div>
  ${doc.groups.length?`<section class="groups">${doc.groups.map(([title,rows])=>`<div class="group"><h2>${title}</h2>${rows.map(pair).join("")}</div>`).join("")}</section>`:""}
  ${doc.references.length?`<div class="references">${doc.references.map(pair).join("")}</div>`:""}
  ${doc.details.map(([key,value])=>`<div class="detail"><b>${esc(key)}</b><span>${esc(value)}</span></div>`).join("")}
  ${doc.items.length?`<div class="sheet-table"><table><thead><tr>${doc.headings.map(v=>`<th>${esc(v)}</th>`).join("")}</tr></thead><tbody>${doc.items.map(row=>`<tr>${row.map(value=>`<td>${esc(value)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`:""}
  ${doc.totals.length?`<div class="totals">${doc.totals.map(pair).join("")}</div>`:""}
  <div class="signatures" style="--signers:${doc.signatures.length}">${doc.signatures.map(role=>`<div><b>${esc(role)}</b><span>Ký, ghi rõ họ tên</span></div>`).join("")}</div></html>`;
}
function formalWord(doc){
  const partyMarker=[];
  const rows=[[doc.title],
    ...(!doc.anonymous?[[doc.profile.name||doc.header],[doc.profile.slogan||""]]:[]),
    ["Số "+doc.ref,[!doc.anonymous&&doc.profile.place,doc.issueDate].filter(Boolean).join(", ")],["MẪU RÀ SOÁT · Kiểm tra thông tin trước khi ký"],
    partyMarker,...doc.references,...doc.details];
  if(doc.items.length)rows.push([],["Hạng mục","ĐVT","SL","Đơn giá","VAT","Giá tính thuế","Tiền VAT","Thành tiền"],
    ...doc.items.map(([name,unit,qty,price,vat,tax,total])=>[name,unit,qty,price,vat,"",tax,total]),[],...doc.totals);
  rows.push(doc.signatures);
  return officeFile("docx",rows,{signatures:doc.signatures,logo:doc.anonymous?null:doc.profile.logo,heading:[nationalHeading,nationalMotto],partyMarker,parties:doc.groups});
}
function legalProfileDialog(){
  if(session?.area!=="accounting"||session.role!=="maker")return;
  const profile=liveLegal(session.company);
  openDialog("Nhận diện và pháp nhân",`<form id="legal-profile" data-company="${session.company}"><div class="form-grid">
    ${Object.entries(legalLabels).map(([key,label])=>workforceField(label,key,{value:profile[key],required:false,max:200})).join("")}
    <label class="field wide">Logo doanh nghiệp (.png / .jpg, tối đa 200 KB)<input class="input" name="logo" type="file" accept="image/png,image/jpeg"></label>
    ${profile.logo?'<label class="check wide"><input type="checkbox" name="removeLogo"> Gỡ logo đang dùng</label>':""}</div>
    <p class="muted">Mẫu đang trình hoặc đã duyệt giữ nguyên nhận diện đã lưu cùng hồ sơ.</p>
    <p class="error" id="dialog-error"></p><button class="btn">Lưu thông tin</button></form>`);
}
async function saveLegalProfile(form,el){
  const company=session?.company;
  if(session?.area!=="accounting"||session.role!=="maker"||el.dataset.company!==company)return;
  const previous=data.legalProfiles;
  const profile={...liveLegal(company),...Object.fromEntries(Object.keys(legalLabels).map(key=>[key,String(form.get(key)||"").trim().slice(0,200)]))};
  const file=form.get("logo");
  if(form.has("removeLogo"))delete profile.logo;
  if(file?.size){
    const bytes=new Uint8Array(await file.slice(0,8).arrayBuffer());
    const png=[137,80,78,71,13,10,26,10].every((byte,index)=>bytes[index]===byte);
    const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
    if(file.size>200*1024||!(png||jpeg))return fieldError("dialog-error","Chọn ảnh PNG hoặc JPEG tối đa 200 KB.");
    let bitmap;
    try{bitmap=await createImageBitmap(file);}
    catch(_){return fieldError("dialog-error","Ảnh bị lỗi hoặc trình duyệt không đọc được.");}
    profile.logo={type:png?"image/png":"image/jpeg",content:base64(new Uint8Array(await file.arrayBuffer())),width:bitmap.width,height:bitmap.height};
    bitmap.close();
  }
  if(!modal.contains(el)||session?.area!=="accounting"||session.role!=="maker"||session.company!==company||data.legalProfiles!==previous)return;
  if(commitOperational(()=>{data.legalProfiles={...previous,[company]:profile};},()=>{data.legalProfiles=previous;})){modal.close();render();notify("Đã lưu thông tin pháp nhân.");}
}

function formalLogoDrawing(logo,relationships){
  const scale=Math.min(1330000/(logo.width||1),510000/(logo.height||1));
  const cx=Math.round((logo.width||1)*scale),cy=Math.round((logo.height||1)*scale);
  return `<w:p><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="1" name="Logo doanh nghiệp"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Logo"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip xmlns:r="${relationships}" r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

function parseFormalLines(content){
  return String(content||"").split(/\r?\n/).filter(line=>line.trim()).map(line=>{
    const [name,unit,qty,price,vat,...extra]=line.split("|").map(value=>value.trim());
    const row={name,unit,qty:Number(qty),price:Number(price),vat:Number(vat)};
    return !extra.length&&name&&unit&&qty&&price&&/^(0|5|8|10)$/.test(vat)&&
      Number.isFinite(row.qty)&&row.qty>0&&row.qty<=100000&&Number.isSafeInteger(row.price)&&row.price>=0&&row.price*row.qty<=maxSalesValue?row:null;
  });
}
function captureFormalPurchases(order){
  const orders=(data.purchases||[]).filter(row=>row.company===order.company&&row.order===order.id);
  return Object.fromEntries(["dat-mua","de-xuat","mua-hang"].map(id=>[id,orders.filter(row=>row.status==="approved"||id==="de-xuat").map(row=>({
    name:stockSamples[row.index]?.name,unit:stockSamples[row.index]?.unit,qty:row.qty,price:row.price,vat:row.vat,
  })).filter(row=>row.name)]));
}

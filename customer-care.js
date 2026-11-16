"use strict";

const careChannels={email:"Email",zalo:"Zalo OA",facebook:"Facebook Fanpage",tax:"Tra mã số thuế"};
const careEvents={delivery:"Bàn giao đủ đợt",warranty:"Hoàn tất bảo hành"};
const careStatuses={draft:"Bản nháp",scheduled:"Đã duyệt lịch thử",simulated:"Đã chạy thử",cancelled:"Đã hủy"};
const taxRegistry="https://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp";
const careField=(label,name,opts)=>workforceField(label,name,opts);
const careButton=(label,kind,id="",style="light compact")=>btn(label,"customer-care",{value:kind+"|"+id,style});
const normalizeTax=value=>String(value||"").replace(/\s/g,"");
const validTax=value=>/^\d{10}(?:-\d{3})?$/.test(value);
function taxLookup(control,quiet=false){
  const form=control.closest("form");
  if(!form||session?.area!=="company")return;
  const input=form.elements.taxId,status=form.querySelector("[data-tax-status]"),taxId=normalizeTax(input.value);
  if(!status)return;
  if(!validTax(taxId)){
    status.textContent=quiet?"":"Nhập 10 chữ số hoặc mã chi nhánh dạng 10 chữ số-3 chữ số.";
    return;
  }
  prepareWorkforceDemo();
  const match=branchRows("customers").find(row=>row.taxId===taxId);
  if(!match){status.textContent="Chưa có trong danh bạ công ty. Đối chiếu trên cổng Cục Thuế.";return;}
  const fields={business:match.business,address:match.address,person:match.person,phone:match.phone,email:match.email};
  if(quiet&&Object.entries(fields).some(([name,value])=>form.elements[name]?.value&&form.elements[name].value!==value)){
    status.textContent="Tìm thấy trong danh bạ. Chọn Điền từ danh bạ để thay thông tin.";return;
  }
  Object.entries(fields).forEach(([name,value])=>{if(form.elements[name])form.elements[name].value=value;});
  input.value=taxId;status.textContent="Đã điền từ danh bạ công ty · "+(match.source==="sample"?"Dữ liệu mẫu":"Thông tin lưu nội bộ");
}
const careDirectory=()=>branchRows("customers");
const careRecipient=(row,channel)=>channel==="email"?row?.email:channel==="zalo"?row?.zalo:"";
const careJobs=()=>branchRows("careJobs").sort((a,b)=>b.at.localeCompare(a.at));
const configRow=channel=>branchRows("careConnections").find(row=>row.channel===channel);
function carePage(split=false){
  const jobs=careJobs();
  const rules=branchRows("careRules");
  const contacts=careDirectory();
  const directory=section("Danh bạ doanh nghiệp",table(["Mã số thuế","Doanh nghiệp","Đầu mối","Kênh tiếp nhận",""],contacts.map(row=>`<tr><td>${esc(row.taxId)}</td><td><strong>${esc(row.business)}</strong>${workMeta(row.address)}</td><td>${esc(row.person||"—")}${workMeta(row.email||row.phone||"")}</td><td>${row.optOut?chip("Ngừng chăm sóc","warn"):[row.email?"Email":"",row.zalo?"Zalo":""] .filter(Boolean).join(" · ")||"—"}</td><td>${careButton("Mở hồ sơ","contact",row.id)}</td></tr>`)),`Tra mã thuế ngay khi lập báo giá hoặc thêm từ kết quả trên <a href="${taxRegistry}" target="_blank" rel="noopener">cổng Cục Thuế</a>.`);
  if(split)return heading("Khách hàng & nhà cung cấp","Danh bạ doanh nghiệp và dữ liệu nguồn cho báo giá.",careButton("Thêm khách hàng","contact","",""))+directory+
    section("Nhà cung cấp minh họa",table(["Nhà cung cấp","Nhóm","Phụ trách","Trạng thái"],modules.partners.rows.slice(2).map(row=>`<tr>${row.map(value=>`<td>${esc(value)}</td>`).join("")}</tr>`)));
  const setup=Object.entries(careChannels).map(([key,title])=>{
    const row=configRow(key);
    return `<tr><td><strong>${title}</strong>${row?workMeta(row.reference):""}</td><td>${chip(row?"Đã lưu thông tin · Chờ kết nối":"Chờ cấu hình","neutral")}</td><td>${careButton(row?"Cập nhật":"Cấu hình","connection",key)}</td></tr>`;
  });
  return heading("Chăm sóc khách hàng","Email, Zalo OA và lịch nội dung Fanpage.",careButton("Soạn nội dung","job","",""))+
    `<div class="care-notice">Chế độ thử nghiệm · Lịch và nhật ký lưu trên trình duyệt.</div>`+
    `<section class="panel panel-pad"><div class="work-filter"><div><h2>Lịch gửi và đăng bài</h2><p class="muted">Duyệt bản nháp trước khi chạy lịch. Thời gian hiển thị theo giờ Việt Nam.</p></div><div class="actions">${careButton("Chạy lịch thử","run")}</div></div>${table(["Kênh / Nội dung","Người nhận / Fanpage","Lịch","Trạng thái",""],jobs.map(row=>`<tr><td><strong>${esc(row.title)}</strong>${workMeta(careChannels[row.channel])}</td><td>${esc(row.channel==="facebook"?(row.destination||"Fanpage công ty"):(careDirectory().find(contact=>contact.id===row.contact)?.business||"—"))}</td><td>${when(row.scheduled)}${row.finishedAt?workMeta(when(row.finishedAt)):""}</td><td>${chip(careStatuses[row.status])}${row.source?workMeta(row.source):""}</td><td>${careButton("Mở","job-review",row.id)}</td></tr>`))}</section>`+
    `<section class="panel panel-pad"><div class="work-filter"><div><h2>Quy tắc tự động</h2><p class="muted">Tạo lịch thử khi đơn đạt mốc và có khách hàng phù hợp.</p></div>${careButton("Thêm quy tắc","rule")}</div>${table(["Mốc đơn hàng","Kênh","Nội dung","Trạng thái",""],rules.map(rule=>`<tr><td>${careEvents[rule.event]}</td><td>${careChannels[rule.channel]}</td><td>${esc(rule.title)}</td><td>${chip(rule.enabled?"Đang bật thử":"Tạm dừng")}</td><td>${careButton(rule.enabled?"Tạm dừng":"Bật thử","rule-toggle",rule.id)}</td></tr>`))}</section>`+
    section("Kết nối của "+companyName(session.company),table(["Dịch vụ","Trạng thái",""],setup));
}
function careAction(value,control){
  if(session?.area!=="company")return;
  const [kind,id]=value.split("|");
  if(kind==="tax"){taxLookup(control);return;}
  if(kind==="run"){runCareSchedule(true);return;}
  if(kind==="contact"){
    const row=careDirectory().find(item=>item.id===id);
    workforceForm("Hồ sơ khách hàng doanh nghiệp","care-contact",
      careField("Mã số thuế","taxId",{value:row?.taxId,max:14})+careField("Tên doanh nghiệp","business",{value:row?.business})+
      careField("Địa chỉ đăng ký","address",{value:row?.address,max:180})+careField("Người liên hệ","person",{value:row?.person,required:false})+
      careField("Điện thoại","phone",{value:row?.phone,type:"tel",required:false})+careField("Email","email",{value:row?.email,type:"email",required:false})+
      careField("Zalo UID hoặc số điện thoại đã xác nhận","zalo",{value:row?.zalo,required:false,max:40})+
      workforceSelect("Tiếp nhận chăm sóc","consent",[["yes","Đã ghi nhận đồng ý"],["no","Chưa đồng ý / Đã rút"]],row?.optOut===false?"yes":"no"),id);
  } else if(kind==="connection"&&Object.hasOwn(careChannels,id)){
    const fields={email:"Địa chỉ gửi của công ty",zalo:"OA ID hoặc đường dẫn OA",facebook:"Page ID hoặc đường dẫn Fanpage",tax:"Nhà cung cấp dữ liệu được chọn"};
    workforceForm("Cấu hình "+careChannels[id],"care-connection",careField(fields[id],"reference",{value:configRow(id)?.reference,type:id==="email"?"email":"text"})+
      '<p class="wide muted">Chỉ lưu định danh công khai. Kết nối và cấp quyền thực hiện trên máy chủ doanh nghiệp.</p>',id);
  } else if(kind==="job"||kind==="rule"){
    const rule=kind==="rule";
    workforceForm(rule?"Thêm quy tắc chăm sóc":"Soạn nội dung","care-"+kind,
      workforceSelect("Kênh","channel",Object.entries(careChannels).filter(([key])=>rule?["email","zalo"].includes(key):key!=="tax"))+
      (rule?workforceSelect("Kích hoạt khi","event",Object.entries(careEvents)):`<label class="field">Khách hàng (Email/Zalo)<select class="input" name="contact"><option value="">Chọn</option>${careDirectory().map(row=>`<option value="${esc(row.id)}">${esc(row.business)}</option>`).join("")}</select></label>`)+
      careField("Tiêu đề","title")+careField("Mã mẫu ZBS (khi gửi Zalo)","template",{required:false,max:80})+
      (rule?'':careField("Lịch chạy (giờ Việt Nam)","scheduled",{type:"datetime-local"}))+workforceNote("Nội dung","body"));
  } else if(kind==="job-review"){
    const row=careJobs().find(item=>item.id===id);
    if(!row)return;
    const preview=`<div class="wide"><p><strong>${esc(row.title)}</strong> · ${esc(careChannels[row.channel])} · ${when(row.scheduled)}</p><p class="care-copy">${esc(row.body)}</p>${row.template?workMeta("Mẫu ZBS: "+row.template):""}</div>`;
    if(["cancelled","simulated"].includes(row.status))return openDialog(careStatuses[row.status],preview);
    workforceForm("Duyệt lịch thử","care-review",preview+workforceSelect("Thao tác","decision",row.status==="draft"?[["scheduled","Duyệt lịch thử"],["cancelled","Hủy bản nháp"]]:[["cancelled","Hủy lịch"]]),id);
  } else if(kind==="rule-toggle"){
    const row=branchRows("careRules").find(item=>item.id===id);
    if(row){row.enabled=!row.enabled;save();render();}
  }
}
function saveCare(form,el){
  if(session?.area!=="company")return;
  const {kind,id}=el.dataset;
  const get=key=>String(form.get(key)||"").trim();
  const fail=message=>fieldError("dialog-error",message);
  if(kind==="care-contact"){
    const rows=careDirectory(), row=rows.find(item=>item.id===id);
    const taxId=normalizeTax(get("taxId")),business=get("business"),address=get("address");
    if(!validTax(taxId)||!business||!address||rows.some(other=>other.taxId===taxId&&other.id!==id))return fail("Kiểm tra mã số thuế, tên, địa chỉ và mã trùng trong công ty.");
    const entry={taxId,business,address,person:get("person"),phone:get("phone"),email:get("email"),zalo:get("zalo"),optOut:get("consent")!=="yes",source:row?.source==="sample"?"sample":"manual"};
    if(row)Object.assign(row,entry);else addBranchRow("customers",entry);
  } else if(kind==="care-connection"){
    const reference=get("reference");
    if(!Object.hasOwn(careChannels,id)||!reference)return fail("Điền định danh dịch vụ của công ty.");
    const row=configRow(id);
    if(row)row.reference=reference;else addBranchRow("careConnections",{channel:id,reference});
  } else if(["care-job","care-rule"].includes(kind)){
    const channel=get("channel"),title=get("title"),body=get("body"),template=get("template");
    if(!["email","zalo","facebook"].includes(channel)||!title||!body||(channel==="zalo"&&!template))return fail("Điền tiêu đề, nội dung và mã mẫu ZBS nếu chọn Zalo OA.");
    if(kind==="care-rule"){
      const event=get("event");
      if(!Object.hasOwn(careEvents,event)||channel==="facebook")return fail("Chọn mốc đơn hàng và kênh chăm sóc.");
      addBranchRow("careRules",{channel,title,body,template,event,enabled:true});
    } else {
      const contact=careDirectory().find(row=>row.id===get("contact"));
      const scheduledInput=get("scheduled");
      const schedule=new Date(scheduledInput+"+07:00");
      if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(scheduledInput)||!Number.isFinite(schedule.getTime()))return fail("Chọn thời gian chạy thử.");
      if(channel!=="facebook"&&(!contact||contact.optOut||!careRecipient(contact,channel)))return fail("Chọn khách đã đồng ý chăm sóc và có địa chỉ cho kênh này.");
      addBranchRow("careJobs",{channel,title,body,template,contact:channel==="facebook"?"":contact.id,destination:channel==="facebook"?configRow(channel)?.reference:"",scheduled:schedule.toISOString(),status:"draft",at:new Date().toISOString()});
    }
  } else if(kind==="care-review"){
    const row=careJobs().find(item=>item.id===id),decision=get("decision");
    if(!row||!(row.status==="draft"&&["scheduled","cancelled"].includes(decision)||row.status==="scheduled"&&decision==="cancelled"))return;
    row.status=decision;row.review=log(careStatuses[decision]);
  } else return;
  modal.close();save();render();notify("Đã lưu.");
}
function careOrderEvent(order,event){
  if(session?.area!=="company"||order.company!==session.company)return;
  const identity=quoteIdentity(order,acceptedQuote(order));
  const contact=careDirectory().find(row=>row.taxId===normalizeTax(identity.taxId));
  if(!contact||contact.optOut)return;
  for(const rule of branchRows("careRules").filter(row=>row.enabled&&row.event===event)){
    const unique=order.id+"|"+rule.id+"|"+event;
    if(!careRecipient(contact,rule.channel)||careJobs().some(row=>row.unique===unique))continue;
    const now=new Date().toISOString();
    const personalize=text=>text.replaceAll("{ma_don}",order.id).replaceAll("{khach_hang}",contact.business);
    addBranchRow("careJobs",{channel:rule.channel,title:personalize(rule.title),body:personalize(rule.body),template:rule.template,contact:contact.id,
      source:order.id+" · "+careEvents[event],unique,scheduled:now,status:"scheduled",at:now});
  }
}
function runCareSchedule(manual=false){
  if(session?.area!=="company"||view!=="care"||modal.open)return;
  const now=new Date().toISOString();
  let count=0;
  for(const row of careJobs().filter(row=>row.status==="scheduled"&&row.scheduled<=now)){
    const contact=careDirectory().find(item=>item.id===row.contact);
    const allowed=row.channel==="facebook"||contact&&!contact.optOut&&careRecipient(contact,row.channel);
    row.status=allowed?"simulated":"cancelled";row.finishedAt=now;row.source=allowed?row.source:"Đã dừng: khách hàng hoặc kênh không còn đủ điều kiện";
    count++;
  }
  if(count){save();render();}
  if(manual)notify(count?"Đã xử lý "+count+" lịch trong chế độ thử.":"Chưa có lịch đã duyệt đến hạn.");
}

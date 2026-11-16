"use strict";

const workLabels={assigned:"Chờ nhận",active:"Đang thực hiện",review:"Chờ nghiệm thu",done:"Hoàn tất"};
const attendanceLabels={pending:"Chờ duyệt",approved:"Đã duyệt",returned:"Trả bổ sung"};
const workDate=/^\d{4}-\d{2}-\d{2}$/;
const workTime=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
const branchRows=key=>(data[key]||[]).filter(row=>row.company===session?.company);
const addBranchRow=(key,row)=>(data[key]||=[]).push({id:crypto.randomUUID(),company:session.company,...row});
const workforceField=(label,name,{type="text",value="",max=160,required=true,attrs=""}={})=>`<label class="field">${esc(label)}<input class="input" name="${name}" type="${type}" value="${esc(value)}" maxlength="${max}" ${required?"required":""} ${attrs}></label>`;
const workforceSelect=(label,name,options,value="")=>`<label class="field">${esc(label)}<select class="input" name="${name}" required><option value="">Chọn</option>${options.map(([id,text])=>`<option value="${esc(id)}" ${id===value?"selected":""}>${esc(text)}</option>`).join("")}</select></label>`;
const workforceNote=(label,name,value="",required=true)=>`<label class="field wide">${esc(label)}<textarea class="input" rows="3" name="${name}" maxlength="1600" ${required?"required":""}>${esc(value)}</textarea></label>`;
function workforceForm(title,kind,fields,id="",label="Lưu") {
  openDialog(title,`<form id="workforce-form" data-kind="${esc(kind)}" data-id="${esc(id)}"><div class="form-grid">${fields}</div><p id="dialog-error" class="error" aria-live="polite"></p><button class="btn">${esc(label)}</button></form>`);
}
const workButton=(label,kind,id="",style="light compact")=>btn(label,"workforce",{value:kind+"|"+id,style});
const workMeta=(text)=>`<small>${esc(text)}</small>`;
const staffName=id=>branchRows("employees").find(row=>row.id===id)?.name||"—";
const staffOptions=()=>branchRows("employees").filter(row=>row.active).map(row=>[row.id,`${row.code} · ${row.name}`]);
const branchPath=slug=>companyRoute(session.company)+"/"+slug;
const projects=()=>listOrders(session.company).filter(row=>["project","production"].includes(row.type));
const workMinutes=(start,end,breakMinutes)=> {
  const mins=time=>Number(time.slice(0,2))*60+Number(time.slice(3));
  return mins(end)-mins(start)-breakMinutes;
};
const minutesLabel=minutes=>`${Math.floor(minutes/60)} giờ ${minutes%60} phút`;
const workState=Object.create(null);
function workFilter(key,value) {workState[session.company+":"+key]=value;render();}
function workforcePage(key) {
  const employees=branchRows("employees");
  if(key==="people") return heading("Quản lý nhân viên","Hồ sơ nhân viên theo công ty.",workButton("Thêm nhân viên","employee","",""))+
    section("Danh sách nhân viên",table(["Mã / Họ tên","Bộ phận / Chức danh","Email","Trạng thái",""],employees.map(row=>`<tr><td><strong>${esc(row.name)}</strong>${workMeta(row.code)}</td><td>${esc(row.department)}${workMeta(row.role)}</td><td>${esc(row.email||"—")}</td><td>${chip(row.active?"Đang làm":"Ngừng làm",row.active?"":"neutral")}</td><td>${workButton("Mở hồ sơ","employee",row.id)}</td></tr>`)));
  if(key==="attendance"){
    const month=workState[session.company+":month"]||dayInVietnam().slice(0,7);
    const rows=branchRows("attendance").filter(row=>row.day.startsWith(month)).sort((a,b)=>b.day.localeCompare(a.day));
    const approved=rows.filter(row=>row.status==="approved");
    return heading("Chấm công","Nhập, đối soát và duyệt theo ngày.",`<div class="actions">${workButton("Tải bảng đã duyệt","attendance-export",month)}${workButton("Nhập chấm công","attendance","","")}</div>`)+
      `<section class="panel panel-pad work-filter"><label>Tháng <input class="input" type="month" data-work-filter="month" value="${esc(month)}"></label><span>${approved.length} lượt đã duyệt · ${minutesLabel(approved.reduce((sum,row)=>sum+row.minutes,0))}</span></section>`+
      section("Bảng chấm công", table(["Ngày / Nhân viên","Ca làm","Thời lượng","Trạng thái","Xử lý"],rows.map(row=>`<tr><td>${date(row.day)}${workMeta(staffName(row.employee))}</td><td>${row.start} – ${row.end}${workMeta(`Nghỉ ${row.breakMinutes} phút`)}</td><td>${minutesLabel(row.minutes)}</td><td>${chip(attendanceLabels[row.status],row.status==="approved"?"":"warn")}${workMeta(row.reviewNote||row.note||"")}</td><td><div class="actions">${row.status==="pending"?workButton("Đối soát","attendance-review",row.id):row.status==="returned"?workButton("Sửa và trình lại","attendance",row.id):""}</div></td></tr>`)));
  }
  const all=branchRows("jobs");
  if(key==="jobs"){
    const person=workState[session.company+":assignee"]||"";
    const rows=person?all.filter(row=>row.assignee===person):all;
    return heading("Giao việc và nhận việc","Theo dõi đầu việc từ lúc giao đến nghiệm thu.",workButton("Giao việc","job","",""))+
      `<section class="panel panel-pad work-filter"><label>Người thực hiện <select class="input" data-work-filter="assignee"><option value="">Tất cả</option>${employees.map(row=>`<option value="${esc(row.id)}" ${person===row.id?"selected":""}>${esc(row.name)}</option>`).join("")}</select></label></section>`+
      section("Danh sách công việc",table(["Công việc","Người thực hiện","Hạn","Trạng thái",""],rows.map(jobRow)));
  }
  return heading("Tiến độ công trình","Tiến độ tính theo khối lượng kế hoạch của các đầu việc đã nghiệm thu.")+
    (projects().map(order=>progressPanel(order,all.filter(job=>job.order===order.id))).join("")||section("Công trình",table(["Hồ sơ"],[])));
}
function jobRow(row){
  const overdue=row.status!=="done"&&row.due<dayInVietnam();
  const label={assigned:"Nhận việc",active:"Cập nhật",review:"Nghiệm thu",done:"Xem nhật ký"}[row.status];
  return `<tr><td><strong>${esc(row.title)}</strong>${workMeta(row.order||"Việc nội bộ")}${row.updates.length?workMeta(row.updates.at(-1).note):""}</td><td>${esc(staffName(row.assignee))}</td><td>${date(row.due)}${overdue?chip("Quá hạn","warn"):""}</td><td>${chip(workLabels[row.status])}${workMeta(row.percent+"% người thực hiện báo cáo")}</td><td>${workButton(label,"job-update",row.id)}</td></tr>`;
}
function progressPanel(order,jobs=branchRows("jobs").filter(job=>job.order===order.id)){
  const total=jobs.reduce((sum,row)=>sum+row.weight,0);
  const done=jobs.filter(row=>row.status==="done");
  const percent=total?Math.round(100*done.reduce((sum,row)=>sum+row.weight,0)/total):0;
  const late=jobs.filter(row=>row.status!=="done"&&row.due<dayInVietnam()).length;
  return `<section class="panel panel-pad project-report"><div class="work-filter"><div><h2>${esc(order.title)}</h2><p class="muted">${esc(order.id)} · ${esc(order.customer)} · Hạn ${date(order.due)}</p></div><div class="actions">${linkBtn("Mở hồ sơ",orderRoute(order),{style:"light compact"})}${workButton("Giao việc","job",order.id)}</div></div>
    ${total?`<div class="progress-line"><strong>${percent}%</strong><progress aria-label="Tiến độ nghiệm thu" max="100" value="${percent}"></progress><span>${done.length}/${jobs.length} đã nghiệm thu · ${late} quá hạn</span></div>`:"<p>Chưa có đầu việc để tính tiến độ.</p>"}
    ${jobs.length?table(["Công việc","Người thực hiện","Hạn","Trạng thái",""],jobs.map(jobRow)):""}</section>`;
}
function workforceAction(value){
  if(session?.area!=="company")return;
  const [kind,id]=value.split("|");
  if(kind==="attendance-export"){
    const rows=branchRows("attendance").filter(row=>row.status==="approved"&&row.day.startsWith(id));
    if(!rows.length)return notify("Tháng này chưa có bảng công được duyệt.");
    const escapeCell=value=>{
      const text=String(value);
      return '"'+(/^[=+@-]/.test(text)?"'":"")+text.replaceAll('"','""')+'"';
    };
    const csv=[["Ngày","Nhân viên","Giờ vào","Giờ ra","Phút nghỉ","Phút làm"],
      ...rows.map(row=>[row.day,staffName(row.employee),row.start,row.end,row.breakMinutes,row.minutes])]
      .map(row=>row.map(escapeCell).join(",")).join("\r\n");
    return triggerDownload(new Blob(["\ufeff",csv],{type:"text/csv;charset=utf-8"}),`Cham-cong-${session.company}-${id}.csv`);
  }
  if(kind==="employee"){
    const row=branchRows("employees").find(item=>item.id===id);
    workforceForm(row?"Hồ sơ nhân viên":"Thêm nhân viên",kind,workforceField("Mã nhân viên","code",{value:row?.code,max:24})+workforceField("Họ và tên","name",{value:row?.name})+
      workforceField("Bộ phận","department",{value:row?.department})+workforceField("Chức danh","role",{value:row?.role})+
      workforceField("Email công việc","email",{type:"email",value:row?.email,required:false})+
      workforceSelect("Trạng thái","active",[["yes","Đang làm"],["no","Ngừng làm"]],row?.active===false?"no":"yes"),id);
  } else if(kind==="attendance"||kind==="attendance-review"){
    const row=branchRows("attendance").find(item=>item.id===id);
    if(kind==="attendance-review"){
      if(row?.status!=="pending")return;
      return workforceForm("Đối soát chấm công",kind,`<p class="wide">${esc(staffName(row.employee))} · ${date(row.day)} · ${row.start}–${row.end} · ${minutesLabel(row.minutes)}</p>`+
        workforceSelect("Kết quả","decision",[["approved","Duyệt"],["returned","Trả bổ sung"]])+workforceNote("Ghi chú đối soát","note","",false),id);
    }
    if(id&&row?.status!=="returned")return;
    const options=staffOptions();
    if(row&&!options.some(([id])=>id===row.employee))options.push([row.employee,staffName(row.employee)]);
    workforceForm("Nhập chấm công",kind,workforceSelect("Nhân viên","employee",options,row?.employee)+
      workforceField("Ngày làm","day",{type:"date",value:row?.day||dayInVietnam(),attrs:`max="${dayInVietnam()}"`})+
      workforceField("Giờ vào","start",{type:"time",value:row?.start||"08:00"})+workforceField("Giờ ra","end",{type:"time",value:row?.end||"17:00"})+
      workforceField("Nghỉ giữa ca (phút)","break",{type:"number",value:row?.breakMinutes??60,attrs:'min="0" max="720"'})+workforceNote("Ghi chú","note",row?.note,false),id,"Trình duyệt");
  } else if(kind==="job"){
    const orders=projects().map(row=>[row.id,row.id+" · "+row.title]);
    workforceForm("Giao việc",kind,workforceField("Tên đầu việc","title")+workforceSelect("Người thực hiện","assignee",staffOptions())+
      workforceSelect("Công trình","order",[["internal","Việc nội bộ"],...orders],id||"internal")+
      workforceField("Hạn hoàn thành","due",{type:"date",value:dayInVietnam()})+
      workforceField("Trọng số khối lượng","weight",{type:"number",value:1,attrs:'min="1" max="1000"'})+workforceNote("Đầu ra cần bàn giao","scope"),"","Giao việc");
  } else if(kind==="job-update"){
    const row=branchRows("jobs").find(item=>item.id===id);
    if(!row)return;
    const details=`<div class="wide"><strong>${esc(row.title)}</strong><p>${esc(staffName(row.assignee))} · ${date(row.due)} · ${esc(row.scope)}</p><ul class="sublist">${row.updates.map(update=>`<li>${esc(update.note)}${workMeta(update.actor+" · "+when(update.at))}</li>`).join("")}</ul></div>`;
    if(row.status==="done")return openDialog("Nhật ký công việc",details);
    const fields={assigned:workforceNote("Ghi chú nhận việc","note","",false),
      active:workforceField("Tiến độ báo cáo (%)","percent",{type:"number",value:row.percent,attrs:'min="0" max="100"'})+
        workforceSelect("Thao tác","decision",[["update","Lưu tiến độ"],["submit","Trình nghiệm thu"]],"update")+workforceNote("Kết quả, vướng mắc hoặc mã hồ sơ","note"),
      review:workforceSelect("Kết quả","decision",[["done","Nghiệm thu"],["active","Yêu cầu làm lại"]])+workforceNote("Kết quả đối soát","note")};
    workforceForm(workLabels[row.status],kind,details+fields[row.status],id,row.status==="assigned"?"Xác nhận nhận việc":"Lưu kết quả");
  }
}
function saveWorkforce(form,el){
  if(session?.area!=="company")return;
  const {kind,id}=el.dataset;
  const get=key=>String(form.get(key)||"").trim();
  const fail=message=>fieldError("dialog-error",message);
  if(kind==="employee"){
    const rows=branchRows("employees"),row=rows.find(item=>item.id===id);
    const code=get("code").toUpperCase(),name=get("name"),department=get("department"),role=get("role"),email=get("email"),active=get("active")==="yes";
    if(!code||!name||!department||!role||rows.some(other=>other.id!==id&&other.code===code))return fail("Kiểm tra hồ sơ và mã nhân viên trùng trong công ty.");
    if(!active&&branchRows("jobs").some(job=>job.assignee===id&&job.status!=="done"))return fail("Cần hoàn tất công việc còn mở của nhân viên trước khi chuyển trạng thái.");
    const entry={code,name,department,role,email,active};
    if(row)Object.assign(row,entry);else addBranchRow("employees",entry);
  } else if(kind==="attendance"){
    const rows=branchRows("attendance"),row=rows.find(item=>item.id===id),employee=get("employee"),day=get("day"),start=get("start"),end=get("end"),breakMinutes=Number(get("break"));
    const minutes=workMinutes(start,end,breakMinutes);
    if((id&&row?.status!=="returned")||!branchRows("employees").some(item=>item.id===employee&&(item.active||row?.employee===employee))||
      !workDate.test(day)||day>dayInVietnam()||!workTime.test(start)||!workTime.test(end)||!get("break")||!Number.isInteger(breakMinutes)||breakMinutes<0||
      !(minutes>0)||rows.some(item=>item.id!==id&&item.employee===employee&&item.day===day))return fail("Kiểm tra ngày, ca trong ngày và thời gian nghỉ. Mỗi nhân viên có một bản ghi mỗi ngày.");
    const entry={employee,day,start,end,breakMinutes,minutes,status:"pending",note:get("note"),reviewNote:"",history:[...(row?.history||[]),log("Trình bảng công")]};
    if(row)Object.assign(row,entry);else addBranchRow("attendance",entry);
    workState[session.company+":month"]=day.slice(0,7);
  } else if(kind==="attendance-review"){
    const row=branchRows("attendance").find(item=>item.id===id);
    const decision=get("decision"),note=get("note");
    if(row?.status!=="pending"||!["approved","returned"].includes(decision)||(decision==="returned"&&!note))return fail("Chọn kết quả và ghi lý do nếu trả bổ sung.");
    Object.assign(row,{status:decision,reviewNote:note});row.history.push(log(attendanceLabels[decision]+" · "+note));
  } else if(kind==="job"){
    const title=get("title"),assignee=get("assignee"),due=get("due"),scope=get("scope"),order=get("order"),weight=Number(get("weight"));
    if(!title||!staffOptions().some(([id])=>id===assignee)||!workDate.test(due)||!scope||!Number.isInteger(weight)||weight<1||weight>1000||
      !(order==="internal"||projects().some(item=>item.id===order)))return fail("Điền người thực hiện, hạn, công trình, khối lượng và đầu ra.");
    addBranchRow("jobs",{title,assignee,due,scope,order:order==="internal"?"":order,weight,status:"assigned",percent:0,updates:[{...log("Giao việc"),note:"Đã giao việc"}]});
  } else if(kind==="job-update"){
    const row=branchRows("jobs").find(item=>item.id===id),decision=get("decision"),note=get("note");
    if(!row||row.status==="done")return;
    let message;
    if(row.status==="assigned"){row.status="active";message="Đã nhận việc";}
    else if(row.status==="active"){
      const percent=Number(get("percent"));
      if(!note||!get("percent")||!Number.isInteger(percent)||percent<0||percent>100||!["update","submit"].includes(decision)||(decision==="submit"&&percent!==100))return fail("Ghi kết quả và báo cáo đủ 100% để trình nghiệm thu.");
      row.percent=percent;row.status=decision==="submit"?"review":"active";message=decision==="submit"?"Trình nghiệm thu":"Cập nhật "+percent+"%";
    } else {
      if(!note||!["done","active"].includes(decision))return fail("Chọn kết quả và ghi nội dung đối soát.");
      row.status=decision;message=decision==="done"?"Đã nghiệm thu":"Yêu cầu làm lại";
    }
    row.updates.push({...log(message),note:message+(note?" · "+note:"")});
  } else return;
  modal.close();save();render();notify("Đã lưu.");
}

function prepareWorkforceDemo(){
  const company=session.company;
  if(data.workforceDemo?.[company])return;
  (data.workforceDemo||={})[company]=true;
  const staff=company+"-STAFF-DEMO";
  const customer=company+"-CUSTOMER-DEMO";
  (data.employees||=[]).push({id:staff,company,code:"NV-MAU-01",name:"Nguyễn Minh An (mẫu)",department:"Kỹ thuật",role:"Phụ trách hiện trường",email:"minhan."+company.toLowerCase()+"@example.test",active:true});
  (data.customers||=[]).push({id:customer,company,taxId:({TC:"0000000001",NC:"0000000002",HC:"0000000003"})[company],
    business:"Công ty An Phát (mẫu)",address:"Địa chỉ minh họa tại Hà Nội",person:"Trần Minh Hà (mẫu)",phone:"0000000000",email:"khach."+company.toLowerCase()+"@example.test",zalo:"UID-MAU",optOut:false,source:"sample"});
  const project=projects()[0];
  if(project)addBranchRow("jobs",{title:"Kiểm tra mặt bằng (mẫu)",assignee:staff,due:dayInVietnam(),scope:"Ghi kích thước và ảnh hiện trạng.",order:project.id,weight:2,status:"assigned",percent:0,updates:[{...log("Giao việc mẫu"),note:"Đã giao việc mẫu"}]});
  save();
}

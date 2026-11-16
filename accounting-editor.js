"use strict";

const accountingFileLimit=200*1024;
const accountingEdits=(key)=>data.accountingEdits?.[key]||{};
const accountingVersions=key=>data.accountingVersions?.[key]||[];
const accountingFields=(order,item,bundle,edit)=>{
  const source=bundle?.snapshot||order;
  if(item[0]==="hop-dong")return Object.entries(contractFields).map(([key,label])=>[key,label,edit?.fields?.[key]??source.contract?.[key]??(key==="scope"?order.title:"")]);
  return [["ref","Số hiệu / Mã tham chiếu",edit?.fields?.ref??documentDetails(order,item,bundle).rows[0][1]],
    ["content","Nội dung chứng từ",edit?.fields?.content??documentDetails(order,item,bundle).rows.find(([label])=>label==="Nội dung")[1]],
    ["note","Ghi chú",edit?.fields?.note??""]];
};
function accountingWorkbench(order,template,bundle){
  const key=packKey(order,selected.kind);
  const editable=session.role==="maker"&&!["pending","approved"].includes(bundle?.status);
  const versions=accountingVersions(key);
  const edits=["pending","approved"].includes(bundle?.status)?bundle.edits||{}:accountingEdits(key);
  const actions=session.role==="maker"&&bundle?.status==="approved"?btn("Tạo bản chỉnh sửa","account-revise",{style:"light"}):"";
  const rows=template.items.map(item=>{
    const [id,label]=item,edit=edits[id];
    const status=edit?.finalFile?"Có PDF final":edit?.needsFinal?"Chờ PDF final":edit?.fields?"Đã lưu bản làm việc":"Mẫu có sẵn";
    return `<tr><td><strong>${esc(label)}</strong><small>${esc(edit?.finalFile?.name||edit?.workingFile?.name||"")}</small></td><td>${chip(status)}</td><td><div class="actions">
      ${btn(editable?"Mở và chỉnh sửa":"Xem mẫu / tệp","account-document",{value:id,style:"light compact"})}
      ${btn("Tải Word","account-template",{value:id,style:"quiet compact",icon:"down"})}
      ${edit?.finalFile?btn("Tải PDF final","account-doc-file",{value:id+"|finalFile",style:"quiet compact",icon:"down"}):""}
      </div></td></tr>`;
  });
  return `<div id="accounting-workbench">`+section("Hợp đồng và chứng từ mẫu",table(["Tên tài liệu","Bản làm việc","Thao tác"],rows),
    "Sửa nội dung mẫu hoặc tải Word lên để lưu bản làm việc. Bản PDF final được đưa vào bộ hồ sơ sau khi duyệt.",actions)+
    (versions.length?section("Các bộ hồ sơ đã duyệt trước",table(["Phiên bản","Ngày duyệt",""],versions.map((old,index)=>`<tr><td>Bản ${index+1}</td><td>${when(old.approvedAt)}</td><td>${btn("Tải bộ hồ sơ","account-old-pack",{value:index,style:"light compact"})}</td></tr>`))):"")+"</div>";
}
function accountingDocument(id){
  const {order,key,bundle,template}=currentPack();
  const item=template?.items.find(entry=>entry[0]===id);
  if(!item)return {};
  const locked=["pending","approved"].includes(bundle?.status);
  const edit=(locked?bundle.edits||{}:accountingEdits(key))[id];
  return {order,key,bundle,template,item,edit,editable:session.role==="maker"&&!locked};
}
function accountingEditDialog(id){
  const {order,key,bundle,item,edit,editable}=accountingDocument(id);
  if(!item)return;
  const fields=accountingFields(order,item,bundle,edit);
  const working=edit?.workingFile?btn("Tải Word đã tải lên","account-doc-file",{value:id+"|workingFile",style:"light compact",icon:"down"}):"";
  const final=edit?.finalFile?btn("Tải PDF final","account-doc-file",{value:id+"|finalFile",style:"light compact",icon:"down"}):"";
  const files=`<div class="actions">${working}${final}</div>`;
  const content=fields.map(([name,label,value])=>editable?workforceNote(label,name,value,false):
    `<p><strong>${esc(label)}</strong></p><p class="care-copy">${esc(value||"—")}</p>`).join("");
  openDialog(esc(item[1]),editable?`<form id="account-editor" data-item="${esc(id)}" data-key="${esc(key)}">
    <p class="muted">${esc(order.id)} · Bản làm việc của kế toán</p><div class="form-grid">${content}
    <label class="field">Word đã chỉnh (.docx)<input class="input" type="file" name="workingFile" accept=".docx"></label>
    <label class="field">Bản final (.pdf)<input class="input" type="file" name="finalFile" accept=".pdf,application/pdf"></label></div>
    ${id==="hop-dong"?'<label class="check"><input type="checkbox" name="verified"> PDF mới là bản đã ký và đã đối chiếu với hợp đồng.</label>':""}
    ${edit?.finalFile?'<label class="check"><input type="checkbox" name="removeFinal"> Gỡ PDF final khỏi bản làm việc</label>':""}
    <p class="muted">Tối đa 200 KB mỗi tệp. Chỉnh Word trên máy rồi tải lại. Với hồ sơ cần chữ ký, chọn bản PDF đã ký.</p>
    ${files}<p id="dialog-error" class="error" aria-live="polite"></p><button class="btn">Lưu bản làm việc</button></form>`:files+content);
}
async function saveAccountingDocument(form,el){
  const {item:id,key}=el.dataset;
  const original=accountingDocument(id);
  if(!original.editable||original.key!==key)return;
  const fail=message=>fieldError("dialog-error",message);
  const fields=Object.fromEntries(accountingFields(original.order,original.item,original.bundle,original.edit).map(([name])=>[name,String(form.get(name)||"").trim()]));
  if(Object.values(fields).some(value=>value.length>1600))return fail("Mỗi mục có tối đa 1.600 ký tự.");
  const next={...original.edit,fields,at:new Date().toISOString(),actor:session.account};
  const changed=accountingFields(original.order,original.item,original.bundle,original.edit).some(([name,,value])=>fields[name]!==String(value).trim());
  if(form.has("removeFinal")||changed||form.get("workingFile")?.size)delete next.finalFile;
  if(form.get("finalFile")?.size&&id==="hop-dong"&&!form.has("verified"))return fail("Xác nhận PDF hợp đồng đã ký và đã đối chiếu.");
  for(const [key,ext,signature] of [["workingFile",".docx","PK\x03\x04"],["finalFile",".pdf","%PDF-"]]){
    const file=form.get(key);
    if(!file?.size)continue;
    if(file.size>accountingFileLimit||!file.name.toLowerCase().endsWith(ext)||await file.slice(0,signature.length).text()!==signature)return fail("Kiểm tra định dạng Word/PDF và dung lượng tối đa 200 KB mỗi tệp.");
    next[key]={name:file.name,content:base64(new Uint8Array(await file.arrayBuffer()))};
  }
  next.needsFinal=!next.finalFile&&(form.has("removeFinal")||!!next.workingFile||((changed||original.edit?.needsFinal)&&!!evidenceFor(original.order,id)));
  const latest=accountingDocument(id);
  if(!modal.contains(el)||!latest.editable||latest.key!==key||latest.edit!==original.edit)return;
  const previous=data.accountingEdits;
  if(commitOperational(()=>{data.accountingEdits={...previous,[key]:{...previous?.[key],[id]:next}};},()=>{data.accountingEdits=previous;})){
    modal.close();render();notify("Đã lưu bản làm việc của kế toán.");
  }
}
function accountingTemplate(id){
  const {order,bundle,item,edit}=accountingDocument(id);
  if(!item)return;
  const source=bundle?.snapshot||order,quote=acceptedQuote(source);
  const rows=item[0]==="bao-gia"&&quote?commercialRows(source,quote):
    item[0]==="hop-dong"&&quote?commercialRows(source,quote,{id:source.contract?.id||order.id+"-HD-MAU",...source.contract,...edit?.fields,final:false}):
    [[item[1].toUpperCase(),order.id],["Bản làm việc","Dữ liệu minh họa"],...accountingFields(order,item,bundle,edit).map(([,label,value])=>[label,value]),[],["Đại diện bên bán ký","Đại diện bên mua ký"]];
  triggerDownload(officeFile("docx",rows),`${order.id}-${id}-ban-lam-viec.docx`);
}
const accountingFileBytes=file=>Uint8Array.from(atob(file.content),character=>character.charCodeAt(0));
function accountingDownloadFile(value){
  const [id,type]=value.split("|");
  if(!["workingFile","finalFile"].includes(type))return;
  const file=accountingDocument(id).edit?.[type];
  if(file)triggerDownload(new Blob([accountingFileBytes(file)],{type:type==="finalFile"?"application/pdf":officeTypes.docx}),file.name);
}
function accountingRevise(){
  const {order,key,bundle}=currentPack();
  if(!order||session.role!=="maker"||bundle?.status!=="approved")return;
  openDialog("Tạo bản chỉnh sửa",`<form id="account-revise-form"><p>Bộ đã duyệt được giữ trong lịch sử. Bản mới cần được duyệt lại trước khi gửi.</p>
    <p class="error" id="dialog-error"></p><button class="btn">Tạo bản nháp mới</button></form>`);
}
function saveAccountingRevision(){
  const {order,key,bundle}=currentPack();
  if(!order||session.role!=="maker"||bundle?.status!=="approved")return;
  const previous=data.accountingVersions, previousEdits=data.accountingEdits;
  if(commitOperational(()=>{
    data.accountingVersions={...previous,[key]:[...accountingVersions(key),bundle]};
    data.accountingEdits={...previousEdits,[key]:bundle.edits||{}};
    data.packs[key]={status:"draft",docs:bundle.docs.slice(),evidence:false,maker:session.account,createdAt:new Date().toISOString(),history:[log("Tạo bản chỉnh sửa từ bộ đã duyệt")]};
  },()=>{data.accountingVersions=previous;data.accountingEdits=previousEdits;data.packs[key]=bundle;})){
    modal.close();render();notify("Đã tạo bản nháp mới.");
  }
}
function accountingDownloadOld(index){
  const {order,key,template}=currentPack();
  const version=accountingVersions(key)[Number(index)];
  if(!order||!version)return;
  const file=packageFiles(order,version,template);
  triggerDownload(file.blob,file.filename.replace(".zip",`-ban-${Number(index)+1}.zip`));
}

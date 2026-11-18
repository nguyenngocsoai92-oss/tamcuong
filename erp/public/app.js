'use strict';
const root=document.querySelector('#root'),who=document.querySelector('#who'),notice=document.querySelector('#notice');
let user=null,csrf='',companies=[],company='TC',modules=[],active='dashboard',rows=[],materials=[],accounts=[];
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const money=n=>new Intl.NumberFormat('vi-VN').format(Number(n||0))+' ₫';
const statusLabels={draft:'Nháp',pending:'Chờ duyệt',approved:'Đã duyệt',in_progress:'Đang xử lý',completed:'Hoàn thành',rejected:'Từ chối',cancelled:'Hủy'};
function alertUser(msg,error=false){notice.textContent=msg;notice.className=error?'error':'';setTimeout(()=>{if(notice.textContent===msg)notice.textContent=''},6000)}
async function api(endpoint,method='GET',body){
 const response=await fetch('/api/'+endpoint,{method,credentials:'same-origin',headers:{...(body?{'Content-Type':'application/json'}:{}),...(method!=='GET'?{'X-CSRF-Token':csrf}:{})},body:body?JSON.stringify(body):undefined});
 const json=await response.json().catch(()=>({error:'Phản hồi máy chủ không hợp lệ'}));
 if(!response.ok)throw Error(json.error||'Lỗi '+response.status);
 return json;
}
const wrap=(fn)=>async(...args)=>{try{await fn(...args)}catch(e){alertUser(e.message,true)}};
function field(name,label,type='text',value='',options=[]){
 const input=type==='textarea'?'<textarea name="'+esc(name)+'">'+esc(value)+'</textarea>'
 :type==='select'?'<select name="'+esc(name)+'">'+options.map(x=>'<option value="'+esc(x)+'" '+(String(x)===String(value)?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select>'
 :'<input name="'+esc(name)+'" type="'+(['number','money'].includes(type)?'number':type)+'" '+(['number','money'].includes(type)?'min="0" step="'+(type==='money'?'1':'any')+'"':'')+' value="'+esc(value)+'">';
 return '<label class="field">'+esc(label)+input+'</label>';
}
const buttons=(...content)=>'<div class="actions">'+content.join('')+'</div>';
const button=(label,action,extra='')=>'<button type="button" class="btn '+extra+'" data-action="'+esc(action)+'">'+esc(label)+'</button>';
function loginPage(){
 who.innerHTML='';
 root.innerHTML='<main class="login panel"><h1>Đăng nhập Tâm Cường ERP</h1><p class="muted">Một hệ thống quản lý ba pháp nhân; tài khoản được xác thực tại máy chủ.</p><form id="login-form" class="form-grid">'+field('username','Tên đăng nhập')+field('password','Mật khẩu','password')+'<div class="wide">'+buttons('<button class="btn" type="submit">Đăng nhập</button>')+'</div></form><p class="help">Tài khoản phải được cấp bằng lệnh bootstrap trên máy chủ. Không có mật khẩu mặc định.</p></main>';
 document.querySelector('#login-form').addEventListener('submit',wrap(async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const result=await api('auth/login','POST',{username:f.get('username'),password:f.get('password')});user=result.user;csrf=result.csrf;await start()}));
}
function passwordPage(){
 root.innerHTML='<main class="login panel"><h2>Đổi mật khẩu lần đầu</h2><p>Để bảo mật, anh/chị cần thay mật khẩu khởi tạo trước khi sử dụng.</p><form id="pass-form" class="form-grid">'+field('current','Mật khẩu hiện tại','password')+field('next','Mật khẩu mới – từ 14 ký tự','password')+field('repeat','Nhập lại mật khẩu mới','password')+'<div class="wide"><button class="btn" type="submit">Lưu mật khẩu</button></div></form></main>';
 document.querySelector('#pass-form').addEventListener('submit',wrap(async e=>{e.preventDefault();const f=new FormData(e.currentTarget);if(f.get('next')!==f.get('repeat'))throw Error('Hai mật khẩu mới không khớp');await api('auth/password','POST',{currentPassword:f.get('current'),newPassword:f.get('next')});user=null;csrf='';alertUser('Đã đổi mật khẩu. Đăng nhập lại để tiếp tục.');loginPage()}));
}
const groups=[...new Set(['Tổng quan','Kinh doanh','Công trình','Sản xuất','Cung ứng','Kho','Tài chính','Nhân sự','Quản trị'])];
function shell(){
 who.innerHTML='<div class="row"><span>'+esc(user.username)+' · '+esc(user.role==='super_admin'?'Super Admin':user.role==='accountant'?'Kế toán':'Nhân viên')+'</span>'+button('Đăng xuất','logout','secondary')+'</div>';
 let nav='<button class="nav '+(active==='dashboard'?'active':'')+'" data-view="dashboard">Tổng quan điều hành</button>';
 for(const g of groups.slice(1)){
  let list=modules.filter(m=>m.group===g).map(m=>({key:m.key,label:m.label}));
  if(g==='Kho')list=[{key:'materials',label:'Danh mục vật tư'},{key:'stock',label:'Nhập – xuất – tồn'}];
  if(g==='Tài chính')list.push({key:'accounts',label:'Hệ thống tài khoản'},{key:'journal',label:'Sổ nhật ký chung'},{key:'trial',label:'Bảng cân đối phát sinh'});
  if(g==='Quản trị'&&user.role==='super_admin')list.push({key:'audit',label:'Nhật ký kiểm soát'});
  if(!list.length)continue;
  nav+='<h3>'+esc(g)+'</h3>'+list.map(m=>'<button class="nav '+(active===m.key?'active':'')+'" data-view="'+esc(m.key)+'">'+esc(m.label)+'</button>').join('');
 }
 root.innerHTML='<div class="shell"><aside class="sidebar">'+nav+'</aside><main class="main"><div class="row space"><h1 id="page-title">Tâm Cường ERP</h1><label class="row">Công ty <select id="company" class="company-picker">'+companies.map(c=>'<option value="'+esc(c.id)+'" '+(c.id===company?'selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></label></div><div id="content"></div></main></div>';
 root.querySelector('#company').addEventListener('change',wrap(async e=>{company=e.target.value;await show(active)}));
}
async function show(view){
 active=view;shell();
 const content=document.querySelector('#content');
 const spec=modules.find(m=>m.key===view);
 document.querySelector('#page-title').textContent=spec?.label||({dashboard:'Tổng quan điều hành',materials:'Danh mục vật tư',stock:'Nhập – xuất – tồn',accounts:'Hệ thống tài khoản kế toán',journal:'Sổ nhật ký chung',trial:'Bảng cân đối phát sinh',audit:'Nhật ký kiểm soát'}[view]||view);
 if(view==='dashboard'){
  const data=await api('dashboard');content.innerHTML='<div class="grid">'+data.companies.map(c=>'<div class="stat"><span>'+esc(c.name)+'</span><strong>'+c.records+'</strong><span>Hồ sơ · '+c.open+' đang mở</span><p class="help">'+c.materials+' mã vật tư · '+c.journalCount+' bút toán</p></div>').join('')+'</div><div class="panel"><h2>Nguyên tắc vận hành</h2><p>Ba pháp nhân dùng chung nền tảng nhưng độc lập dữ liệu. Báo cáo tổng không tự động cộng gộp các số dư nội bộ. Mỗi phiếu kho và bút toán kế toán ghi trực tiếp vào cơ sở dữ liệu, không phải dữ liệu mô phỏng.</p></div>';
  return;
 }
 if(spec){await renderRecords(spec);return;}
 if(view==='materials'){await renderMaterials();return;}
 if(view==='stock'){await renderStock();return;}
 if(view==='accounts'){await renderAccounts();return;}
 if(view==='journal'){await renderJournal();return;}
 if(view==='trial'){await renderTrial();return;}
 if(view==='audit'){const d=await api('audit');content.innerHTML=table(['Thời điểm','Người dùng','Pháp nhân','Đối tượng','Thao tác'],d.rows.map(x=>[x.at,x.actor,x.company_id,x.entity+' / '+x.entity_id,x.action]));return;}
}
function table(cols,values){
 return '<div class="panel table-scroll"><table><thead><tr>'+cols.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+values.map(row=>'<tr>'+row.map(cell=>'<td>'+cell+'</td>').join('')+'</tr>').join('')+(values.length?'':'<tr><td class="empty" colspan="'+cols.length+'">Chưa có dữ liệu.</td></tr>')+'</tbody></table></div>';
}
async function renderRecords(spec){
 const d=await api('companies/'+company+'/records/'+spec.key);rows=d.rows;
 let html='<div class="panel"><div class="row space"><p class="muted">Danh sách hồ sơ thực tế thuộc pháp nhân đang chọn. Có theo dõi trạng thái, phiên bản và nhật ký.</p>'+button('Tạo hồ sơ','record-new')+'</div></div>';
 html+=table(['Mã hồ sơ','Tên hồ sơ','Trạng thái','Ngày cập nhật','Thao tác'],rows.map(r=>[
  esc(r.code),esc(r.title),'<span class="pill '+esc(r.status)+'">'+esc(statusLabels[r.status]||r.status)+'</span>',esc(r.updated_at.slice(0,16).replace('T',' ')),
  '<div class="row">'+button('Chi tiết','record:'+r.id,'secondary')+'</div>'
 ]));
 document.querySelector('#content').innerHTML=html;
}
function recordEditor(spec,record){
 const isNew=!record;
 const html='<div class="panel"><div class="row space"><h2>'+(isNew?'Tạo hồ sơ':'Chi tiết hồ sơ')+'</h2>'+button('Quay lại','back','secondary')+'</div><form id="record-form"><div class="form-grid">'+field('title','Tên hồ sơ', 'text',record?.title||'')+(isNew?field('code','Mã hồ sơ (để trống để tự sinh)'): '<div class="field">Mã hồ sơ<strong>'+esc(record.code)+'</strong></div>')+spec.fields.map(x=>field(x.key,x.label,x.type,record?.payload?.[x.key]??'',x.options||[])).join('')+'</div>'+(isNew||['draft','rejected'].includes(record.status)?buttons('<button class="btn" type="submit">Lưu hồ sơ</button>'):'<p class="help">Hồ sơ đã trình/duyệt chỉ được chỉnh sửa qua quy trình điều chỉnh và phê duyệt.</p>')+'</form></div>';
 document.querySelector('#content').innerHTML=html+(record?'<div class="panel"><h3>Luồng trạng thái · '+esc(statusLabels[record.status])+'</h3>'+buttons(...({draft:['pending','cancelled'],pending:['approved','rejected','cancelled'],rejected:['draft','cancelled'],approved:['in_progress','completed','cancelled'],in_progress:['completed','cancelled']}[record.status]||[]).filter(st=>!['approved','rejected'].includes(st)||user.role==='super_admin').map(st=>button(statusLabels[st],'status:'+record.id+':'+st,st==='cancelled'?'danger':'secondary')))+'</div>':'');
 const form=document.querySelector('#record-form');
 form?.addEventListener('submit',wrap(async e=>{
  e.preventDefault();const data=new FormData(e.currentTarget),payload={};for(const x of spec.fields)payload[x.key]=data.get(x.key);
  const body={title:data.get('title'),payload,...(record?{version:record.version}:{code:data.get('code')})};
  const result=await api('companies/'+company+'/records/'+spec.key+(record?'/'+record.id:''),record?'PUT':'POST',body);
  alertUser('Đã lưu vào cơ sở dữ liệu');await show(spec.key);recordEditor(spec,result.row);
 }));
}
async function renderMaterials(){
 const d=await api('companies/'+company+'/materials');materials=d.rows;
 document.querySelector('#content').innerHTML='<div class="panel"><h2>Tạo vật tư</h2><form id="material-form" class="form-grid">'+field('sku','Mã vật tư')+field('name','Tên vật tư')+field('unit','Đơn vị tính')+field('minQty','Tồn tối thiểu','number',0)+'<div class="wide"><button class="btn" type="submit">Lưu vật tư</button></div></form></div>'+table(['Mã','Vật tư','ĐVT','Tồn thực tế','Cảnh báo'],materials.map(x=>[esc(x.sku),esc(x.name),esc(x.unit),esc(x.balance),Number(x.balance)<Number(x.min_qty)?'Dưới định mức':'—']));
 document.querySelector('#material-form').addEventListener('submit',wrap(async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));await api('companies/'+company+'/materials','POST',d);alertUser('Đã tạo vật tư');await show('materials')}));
}
async function renderStock(){
 const [m,s]=await Promise.all([api('companies/'+company+'/materials'),api('companies/'+company+'/stock')]);
 materials=m.rows;
 document.querySelector('#content').innerHTML='<div class="panel"><h2>Lập phiếu nhập / xuất kho</h2><form id="stock-form" class="form-grid">'+field('materialId','Vật tư','select','',materials.map(x=>x.id)).replace(/<option value="([^"]+)"[^>]*>[^<]*<\/option>/g,(match,id)=>{const item=materials.find(x=>x.id===id);return '<option value="'+id+'">'+esc(item.sku+' – '+item.name+' | Tồn '+item.balance)+'</option>'})+field('direction','Loại phiếu','select','in',['in','out'])+field('quantity','Số lượng','number')+field('unitCost','Đơn giá VND (nhập kho)','money',0)+field('sourceRef','Mã chứng từ nguồn')+'<div class="wide"><button class="btn" type="submit">Ghi phiếu kho</button></div></form></div>'+table(['Ngày','Vật tư','Loại','Số lượng','Đơn giá','Nguồn'],s.rows.map(x=>[esc(x.created_at.slice(0,16)),esc(x.sku+' – '+x.name),x.direction==='in'?'Nhập':'Xuất',esc(x.quantity),money(x.unit_cost),esc(x.source_ref)]));
 document.querySelector('#stock-form').addEventListener('submit',wrap(async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));if(!confirm('Xác nhận ghi phiếu kho? Phiếu đã ghi không được xóa trực tiếp.'))return;await api('companies/'+company+'/stock','POST',data);alertUser('Đã ghi sổ kho');await show('stock')}));
}
async function renderAccounts(){
 const d=await api('companies/'+company+'/accounts');accounts=d.rows;
 document.querySelector('#content').innerHTML='<div class="panel"><h2>Thêm tài khoản kế toán</h2><form id="account-form" class="form-grid">'+field('code','Số hiệu tài khoản')+field('name','Tên tài khoản')+'<div class="wide"><button class="btn" type="submit">Lưu tài khoản</button></div></form></div>'+table(['Tài khoản','Tên'],accounts.map(x=>[esc(x.code),esc(x.name)]));
 document.querySelector('#account-form').addEventListener('submit',wrap(async e=>{e.preventDefault();await api('companies/'+company+'/accounts','POST',Object.fromEntries(new FormData(e.currentTarget)));alertUser('Đã lưu tài khoản');await show('accounts')}));
}
const journalLine=i=>'<div class="form-grid" style="margin:9px 0;padding:9px;background:#f5f8f6;border-radius:9px"><label class="field">Tài khoản<select name="account_'+i+'">'+accounts.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.code+' – '+a.name)+'</option>').join('')+'</select></label>'+field('debit_'+i,'Nợ (VND)','money',0)+field('credit_'+i,'Có (VND)','money',0)+field('memo_'+i,'Diễn giải dòng')+'</div>';
async function renderJournal(){
 const [a,j]=await Promise.all([api('companies/'+company+'/accounts'),api('companies/'+company+'/journal')]);accounts=a.rows;
 document.querySelector('#content').innerHTML='<div class="panel"><h2>Ghi bút toán kép (Nợ = Có)</h2><p class="help">Mọi số tiền theo đơn vị đồng Việt Nam, nguyên đồng. Bút toán đã ghi không chỉnh sửa trực tiếp.</p><form id="journal-form">'+field('reference','Số chứng từ')+field('description','Diễn giải')+field('bookedOn','Ngày hạch toán','date',new Date().toISOString().slice(0,10))+'<div id="journal-lines">'+journalLine(0)+journalLine(1)+'</div>'+buttons(button('Thêm dòng','line-new','secondary'),'<button class="btn" type="submit">Ghi sổ kế toán</button>')+'</form></div>'+table(['Chứng từ','Ngày','Diễn giải','Tổng Nợ = Có'],j.rows.map(x=>[esc(x.reference),esc(x.booked_on),esc(x.description),money(x.total)]));
 document.querySelector('#journal-form').addEventListener('submit',wrap(async e=>{
  e.preventDefault();const data=new FormData(e.currentTarget);const lines=[];
  for(let i=0;i<document.querySelector('#journal-lines').children.length;i++)lines.push({accountId:data.get('account_'+i),debit:Number(data.get('debit_'+i)||0),credit:Number(data.get('credit_'+i)||0),memo:data.get('memo_'+i)});
  if(!confirm('Xác nhận ghi sổ bút toán? Dữ liệu đã ghi phải điều chỉnh bằng chứng từ kế toán mới.'))return;
  await api('companies/'+company+'/journal','POST',{reference:data.get('reference'),description:data.get('description'),bookedOn:data.get('bookedOn'),lines});alertUser('Đã ghi sổ kế toán');await show('journal');
 }));
}
async function renderTrial(){
 const d=await api('companies/'+company+'/trial-balance');
 document.querySelector('#content').innerHTML=table(['Số tài khoản','Tên tài khoản','Phát sinh Nợ','Phát sinh Có'],d.rows.map(x=>[esc(x.code),esc(x.name),money(x.debit),money(x.credit)]))+'<p class="help">Bảng tổng phát sinh tài khoản; chưa phải báo cáo tài chính đầy đủ hoặc bảng cân đối số dư đầu/cuối kỳ.</p>';
}
async function start(){
 if(user.mustChangePassword){passwordPage();return}
 const [c,m]=await Promise.all([api('companies'),api('modules')]);
 companies=c.companies;modules=m.modules;
 if(!companies.some(x=>x.id===company))company=companies[0]?.id||'TC';
 await show('dashboard');
}
document.addEventListener('click',wrap(async e=>{
 const target=e.target.closest('[data-view],[data-action]');if(!target)return;
 if(target.dataset.view){await show(target.dataset.view);return}
 const action=target.dataset.action;
 if(action==='logout'){await api('auth/logout','POST');user=null;csrf='';loginPage();return}
 if(action==='back'){await show(active);return}
 if(action==='record-new'){recordEditor(modules.find(x=>x.key===active));return}
 if(action.startsWith('record:')){const r=rows.find(x=>x.id===action.split(':')[1]);if(r)recordEditor(modules.find(x=>x.key===active),r);return}
 if(action.startsWith('status:')){
  const [,id,status]=action.split(':');const r=rows.find(x=>x.id===id);if(!r)return;
  if(!confirm('Chuyển hồ sơ '+r.code+' sang "'+statusLabels[status]+'"?'))return;
  await api('companies/'+company+'/records/'+active+'/'+id+'/status','POST',{status,version:r.version});
  alertUser('Đã chuyển trạng thái');await show(active);return;
 }
 if(action==='line-new'){document.querySelector('#journal-lines').insertAdjacentHTML('beforeend',journalLine(document.querySelector('#journal-lines').children.length));return}
}));
wrap(async()=>{const result=await api('auth/me');user=result.user;csrf=result.csrf;await start()})().catch(()=>loginPage());

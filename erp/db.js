'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {DatabaseSync} = require('node:sqlite');
const {modules,moduleMap,transitions} = require('./modules');
const ROOT = path.resolve(__dirname,'..');
const DATA_DIR = path.resolve(process.env.ERP_DATA_DIR || path.join(ROOT,'.private-data'));
fs.mkdirSync(DATA_DIR,{recursive:true,mode:0o700});
const db = new DatabaseSync(path.join(DATA_DIR,'tamcuong.sqlite'));
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
db.exec(`
CREATE TABLE IF NOT EXISTS companies(
 id TEXT PRIMARY KEY, name TEXT NOT NULL, tax_id TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(
 id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('super_admin','accountant','staff')),
 active INTEGER NOT NULL DEFAULT 1, must_change_password INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS user_companies(
 user_id TEXT NOT NULL REFERENCES users(id), company_id TEXT NOT NULL REFERENCES companies(id),
 PRIMARY KEY(user_id,company_id));
CREATE TABLE IF NOT EXISTS sessions(
 id_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
 csrf TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS records(
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id),
 module TEXT NOT NULL, code TEXT NOT NULL, title TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft',
 payload TEXT NOT NULL DEFAULT '{}', version INTEGER NOT NULL DEFAULT 1,
 created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL, UNIQUE(company_id,module,code));
CREATE INDEX IF NOT EXISTS idx_records_scope ON records(company_id,module,status);
CREATE TABLE IF NOT EXISTS audit(
 id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL,
 company_id TEXT, entity TEXT NOT NULL, entity_id TEXT NOT NULL,
 action TEXT NOT NULL, before_json TEXT, after_json TEXT, at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS materials(
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id),
 sku TEXT NOT NULL, name TEXT NOT NULL, unit TEXT NOT NULL,
 min_qty REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
 UNIQUE(company_id,sku));
CREATE TABLE IF NOT EXISTS stock_moves(
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id),
 material_id TEXT NOT NULL REFERENCES materials(id),
 direction TEXT NOT NULL CHECK(direction IN ('in','out')),
 quantity REAL NOT NULL CHECK(quantity > 0),
 unit_cost INTEGER NOT NULL DEFAULT 0 CHECK(unit_cost >= 0),
 source_ref TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES users(id),
 created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_stock_scope ON stock_moves(company_id,material_id);
CREATE TABLE IF NOT EXISTS accounts(
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id),
 code TEXT NOT NULL, name TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1,
 UNIQUE(company_id,code));
CREATE TABLE IF NOT EXISTS journal_entries(
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id),
 reference TEXT NOT NULL, description TEXT NOT NULL, booked_on TEXT NOT NULL,
 created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL,
 UNIQUE(company_id,reference));
CREATE TABLE IF NOT EXISTS journal_lines(
 entry_id TEXT NOT NULL REFERENCES journal_entries(id),
 line_no INTEGER NOT NULL, account_id TEXT NOT NULL REFERENCES accounts(id),
 debit INTEGER NOT NULL DEFAULT 0 CHECK(debit >= 0),
 credit INTEGER NOT NULL DEFAULT 0 CHECK(credit >= 0),
 memo TEXT, PRIMARY KEY(entry_id,line_no),
 CHECK(NOT (debit > 0 AND credit > 0)));
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
`);
const now=()=>new Date().toISOString();
const uid=()=>crypto.randomUUID();
const cleanup=()=>db.prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());
const one=(sql,...args)=>db.prepare(sql).get(...args);
const all=(sql,...args)=>db.prepare(sql).all(...args);
const run=(sql,...args)=>db.prepare(sql).run(...args);
const transaction=(fn)=>{db.exec('BEGIN IMMEDIATE');try{const value=fn();db.exec('COMMIT');return value;}catch(e){db.exec('ROLLBACK');throw e;}};
const hashPassword=(password)=>{const salt=crypto.randomBytes(16).toString('hex');return salt+':'+crypto.scryptSync(password,salt,64).toString('hex');};
const verifyPassword=(password,stored)=>{const [salt,hex]=String(stored).split(':');if(!salt||!/^[a-f0-9]{128}$/.test(hex||''))return false;const actual=crypto.scryptSync(password,salt,64), expected=Buffer.from(hex,'hex');return crypto.timingSafeEqual(actual,expected);};
const publicUser=u=>({id:u.id,username:u.username,role:u.role,mustChangePassword:!!u.must_change_password,
 companies:u.role==='super_admin'?all('SELECT id,name FROM companies ORDER BY id'):all('SELECT c.id,c.name FROM companies c JOIN user_companies uc ON uc.company_id=c.id WHERE uc.user_id=? ORDER BY c.id',u.id)});
function bootstrapCompanies(){
 const existing=one('SELECT COUNT(*) AS n FROM companies').n;
 if(existing)return;
 transaction(()=>{for(const [id,name] of [['TC','Tâm Cường'],['HC','Hùng Cường'],['NC','Nam Cường']])run('INSERT INTO companies(id,name,created_at) VALUES(?,?,?)',id,name,now());});
}
bootstrapCompanies();
const allowedCompany=(user,id)=>!!id&&(user.role==='super_admin'||!!one('SELECT 1 FROM user_companies WHERE user_id=? AND company_id=?',user.id,id));
const requireCompany=(user,id)=>{if(!allowedCompany(user,id))throw httpError(403,'Không có quyền trên pháp nhân này');};
const requireRole=(user,roles)=>{if(!roles.includes(user.role))throw httpError(403,'Không có quyền thực hiện nghiệp vụ');};
const httpError=(status,message)=>Object.assign(new Error(message),{status});
function audit(user,company,entity,id,action,before,after){run('INSERT INTO audit(actor,company_id,entity,entity_id,action,before_json,after_json,at) VALUES(?,?,?,?,?,?,?,?)',user.id,company||null,entity,id,action,before?JSON.stringify(before):null,after?JSON.stringify(after):null,now());}
function login(username,password){
 const user=one('SELECT * FROM users WHERE username=? AND active=1',String(username||'').trim().toLowerCase());
 if(!user||!verifyPassword(String(password||''),user.password_hash))throw httpError(401,'Sai tài khoản hoặc mật khẩu');
 const token=crypto.randomBytes(32).toString('base64url'),csrf=crypto.randomBytes(32).toString('base64url');
 cleanup();
 run('INSERT INTO sessions(id_hash,user_id,csrf,expires_at) VALUES(?,?,?,?)',crypto.createHash('sha256').update(token).digest('hex'),user.id,csrf,Date.now()+8*3600*1000);
 return {token,csrf,user:publicUser(user)};
}
function auth(token){
 if(!token)return null;
 const session=one('SELECT s.*,u.username,u.role,u.active,u.must_change_password FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id_hash=? AND s.expires_at>? AND u.active=1',crypto.createHash('sha256').update(token).digest('hex'),Date.now());
 return session?{...session,id:session.user_id}:null;
}
const readRecord=row=>({...row,payload:JSON.parse(row.payload)});
function validateRecord(module,body){
 const spec=moduleMap[module];if(!spec)throw httpError(404,'Phân hệ không tồn tại');
 const allowed=new Set(spec.fields.map(f=>f.key));
 const payload={};for(const [key,value] of Object.entries(body.payload||{})){
  if(!allowed.has(key))throw httpError(400,'Trường dữ liệu không hợp lệ: '+key);
  if(value!==null&&typeof value!=='string'&&typeof value!=='number')throw httpError(400,'Giá trị không hợp lệ');
  if(typeof value==='string'&&value.length>10000)throw httpError(400,'Giá trị quá dài');
  const field=spec.fields.find(f=>f.key===key);
  if(['number','money'].includes(field.type)&&value!==''&&value!==null&&(!Number.isFinite(Number(value))||Number(value)<0))throw httpError(400,'Số lượng/tiền phải không âm');
  if(field.type==='select'&&value&& !field.options.includes(value))throw httpError(400,'Giá trị lựa chọn không hợp lệ');
  payload[key]=value;
 }
 for(const field of spec.fields.filter(f=>f.required))if(payload[field.key]===undefined||payload[field.key]==='')throw httpError(400,'Thiếu '+field.label);
 const title=String(body.title||'').trim();if(title.length<2||title.length>180)throw httpError(400,'Tiêu đề cần từ 2–180 ký tự');
 return {title,payload,spec};
}
function createRecord(user,company,module,body){
 requireCompany(user,company);
 const {title,payload,spec}=validateRecord(module,body);
 if(spec.roles)requireRole(user,spec.roles);
 const id=uid(),code=String(body.code||'').trim()||module.toUpperCase()+'-'+Date.now()+'-'+id.slice(0,5);
 if(code.length>90)throw httpError(400,'Mã hồ sơ quá dài');
 const t=now();
 return transaction(()=>{
  run("INSERT INTO records(id,company_id,module,code,title,payload,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)",id,company,module,code,title,JSON.stringify(payload),user.id,t,t);
  const record=readRecord(one('SELECT * FROM records WHERE id=?',id));
  audit(user,company,module,id,'create',null,record);return record;
 });
}
function updateRecord(user,company,id,body){
 requireCompany(user,company);
 return transaction(()=>{
  const original=one('SELECT * FROM records WHERE id=? AND company_id=?',id,company);
  if(!original)throw httpError(404,'Không tìm thấy hồ sơ');
  const spec=moduleMap[original.module];if(spec.roles)requireRole(user,spec.roles);
  if(!['draft','rejected'].includes(original.status))throw httpError(409,'Chỉ sửa hồ sơ nháp hoặc bị từ chối');
  if(Number(body.version)!==original.version)throw httpError(409,'Hồ sơ đã được cập nhật ở phiên khác');
  const {title,payload}=validateRecord(original.module,body);
  run('UPDATE records SET title=?,payload=?,version=version+1,updated_at=? WHERE id=?',title,JSON.stringify(payload),now(),id);
  const record=readRecord(one('SELECT * FROM records WHERE id=?',id));
  audit(user,company,original.module,id,'update',readRecord(original),record);return record;
 });
}
function transitionRecord(user,company,id,status,expectedVersion){
 requireCompany(user,company);
 return transaction(()=>{
  const original=one('SELECT * FROM records WHERE id=? AND company_id=?',id,company);
  if(!original)throw httpError(404,'Không tìm thấy hồ sơ');
  const spec=moduleMap[original.module];if(spec.roles)requireRole(user,spec.roles);
  if(Number(expectedVersion)!==original.version)throw httpError(409,'Hồ sơ đã được cập nhật');
  if(!(transitions[original.status]||[]).includes(status))throw httpError(400,'Chuyển trạng thái không hợp lệ');
  if(['approved','rejected'].includes(status))requireRole(user,['super_admin']);
  if(['approved','rejected'].includes(status)&&original.created_by===user.id)
   throw httpError(403,'Người lập không được tự phê duyệt hồ sơ của mình');
  run('UPDATE records SET status=?,version=version+1,updated_at=? WHERE id=?',status,now(),id);
  const record=readRecord(one('SELECT * FROM records WHERE id=?',id));
  audit(user,company,original.module,id,'transition',readRecord(original),record);return record;
 });
}
function createMaterial(user,company,body){
 requireCompany(user,company);
 const sku=String(body.sku||'').trim(),name=String(body.name||'').trim(),unit=String(body.unit||'').trim();
 const min=Number(body.minQty||0);
 if(!sku||!name||!unit||sku.length>70||name.length>180||!Number.isFinite(min)||min<0)throw httpError(400,'Vật tư không hợp lệ');
 const id=uid();
 return transaction(()=>{
  run('INSERT INTO materials(id,company_id,sku,name,unit,min_qty,created_at) VALUES(?,?,?,?,?,?,?)',id,company,sku,name,unit,min,now());
  audit(user,company,'materials',id,'create',null,{sku,name,unit,minQty:min});
  return one('SELECT * FROM materials WHERE id=?',id);
 });
}
function stockBalance(company,material){
 return Number(one("SELECT COALESCE(SUM(CASE WHEN direction='in' THEN quantity ELSE -quantity END),0) AS qty FROM stock_moves WHERE company_id=? AND material_id=?",company,material).qty);
}
function moveStock(user,company,body){
 requireCompany(user,company);
 const material=one('SELECT * FROM materials WHERE id=? AND company_id=?',body.materialId,company);
 if(!material)throw httpError(404,'Vật tư không thuộc công ty này');
 const direction=String(body.direction),qty=Number(body.quantity),cost=Number(body.unitCost||0),ref=String(body.sourceRef||'').trim();
 if(!['in','out'].includes(direction)||!Number.isFinite(qty)||qty<=0||!Number.isSafeInteger(cost)||cost<0||!ref||ref.length>160)throw httpError(400,'Phiếu kho không hợp lệ');
 return transaction(()=>{
  if(direction==='out'&&stockBalance(company,material.id)+1e-8<qty)throw httpError(409,'Không đủ tồn kho');
  const id=uid(),t=now();
  run('INSERT INTO stock_moves VALUES(?,?,?,?,?,?,?,?,?)',id,company,material.id,direction,qty,cost,ref,user.id,t);
  audit(user,company,'stock_moves',id,direction,null,{material:material.sku,quantity:qty,unitCost:cost,sourceRef:ref});
  return {id,companyId:company,materialId:material.id,direction,quantity:qty,unitCost:cost,sourceRef:ref,createdAt:t};
 });
}
function createAccount(user,company,body){
 requireCompany(user,company);requireRole(user,['super_admin','accountant']);
 const code=String(body.code||'').trim(),name=String(body.name||'').trim();
 if(!/^[0-9A-Za-z.]{2,20}$/.test(code)||name.length<2||name.length>180)throw httpError(400,'Tài khoản không hợp lệ');
 const id=uid();
 return transaction(()=>{
  run('INSERT INTO accounts(id,company_id,code,name) VALUES(?,?,?,?)',id,company,code,name);
  audit(user,company,'accounts',id,'create',null,{code,name});return one('SELECT * FROM accounts WHERE id=?',id);
 });
}
function postJournal(user,company,body){
 requireCompany(user,company);requireRole(user,['super_admin','accountant']);
 const reference=String(body.reference||'').trim(),description=String(body.description||'').trim(),date=String(body.bookedOn||'');
 if(!reference||reference.length>120||description.length<2||description.length>400||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date)))throw httpError(400,'Chứng từ không hợp lệ');
 const lines=body.lines;
 if(!Array.isArray(lines)||lines.length<2||lines.length>200)throw httpError(400,'Cần ít nhất hai dòng hạch toán');
 let debit=0n,credit=0n;
 const parsed=lines.map((l,i)=>{
  const d=Number(l.debit||0),c=Number(l.credit||0);
  if(!Number.isSafeInteger(d)||!Number.isSafeInteger(c)||d<0||c<0||(!d&&!c)||(d&&c))throw httpError(400,'Số tiền bút toán phải là số nguyên VND, chỉ ghi Nợ hoặc Có');
  const a=one('SELECT * FROM accounts WHERE id=? AND company_id=? AND active=1',l.accountId,company);
  if(!a)throw httpError(403,'Tài khoản kế toán không thuộc pháp nhân');
  debit+=BigInt(d);credit+=BigInt(c);
  return {number:i+1,accountId:a.id,debit:d,credit:c,memo:String(l.memo||'').slice(0,200)};
 });
 if(debit!==credit||debit===0n||debit>BigInt(Number.MAX_SAFE_INTEGER))throw httpError(400,'Tổng Nợ và Có phải bằng nhau');
 return transaction(()=>{
  const id=uid(),t=now();
  run('INSERT INTO journal_entries VALUES(?,?,?,?,?,?,?)',id,company,reference,description,date,user.id,t);
  for(const line of parsed)run('INSERT INTO journal_lines VALUES(?,?,?,?,?,?)',id,line.number,line.accountId,line.debit,line.credit,line.memo);
  audit(user,company,'journal_entries',id,'post',null,{reference,description,date,lines:parsed});
  return {id,reference,description,bookedOn:date,lines:parsed,total:Number(debit)};
 });
}
function changePassword(user,current,next){
 if(typeof next!=='string'||next.length<14||next.length>256)throw httpError(400,'Mật khẩu mới cần tối thiểu 14 ký tự');
 const existing=one('SELECT * FROM users WHERE id=?',user.id);
 if(!verifyPassword(current,existing.password_hash))throw httpError(401,'Mật khẩu hiện tại không đúng');
 transaction(()=>{
  run('UPDATE users SET password_hash=?,must_change_password=0 WHERE id=?',hashPassword(next),user.id);
  run('DELETE FROM sessions WHERE user_id=?',user.id);
  audit(user,null,'users',user.id,'password_changed',null,null);
 });
}
function bootstrapUser(username,password,role,companies){
 const normalized=username.toLowerCase().trim();
 if(!/^[a-z0-9_.-]{4,50}$/.test(normalized)||password.length<14)throw new Error('Tên đăng nhập hoặc mật khẩu bootstrap không hợp lệ');
 if(!['super_admin','accountant'].includes(role))throw new Error('Chỉ bootstrap tài khoản quản trị hoặc kế toán');
 if(role==='super_admin'&&one("SELECT 1 FROM users WHERE role='super_admin'"))throw new Error('Chỉ được có một tài khoản Super Admin');
 const id=uid();
 transaction(()=>{
  run('INSERT INTO users(id,username,password_hash,role,created_at) VALUES(?,?,?,?,?)',id,normalized,hashPassword(password),role,now());
  if(role==='accountant')for(const company of companies){
   if(!one('SELECT 1 FROM companies WHERE id=?',company))throw new Error('Công ty không tồn tại: '+company);
   run('INSERT INTO user_companies VALUES(?,?)',id,company);
  }
  audit({id},null,'users',id,'bootstrap',null,{username:normalized,role,companies:role==='super_admin'?['TC','HC','NC']:companies});
 });
 return {id,username:normalized,role};
}
function resetTestData(confirm,actor){
 if(confirm!=='RESET-TEST-DATA')throw new Error('Thiếu xác nhận RESET-TEST-DATA');
 if(one("SELECT value FROM settings WHERE key='production_locked'")?.value==='1')throw new Error('Đã khóa xóa dữ liệu tại production');
 return transaction(()=>{
  const counts={};for(const name of ['records','stock_moves','journal_entries','journal_lines','materials','accounts'])counts[name]=one(`SELECT COUNT(*) AS n FROM ${name}`).n;
  run('DELETE FROM journal_lines');run('DELETE FROM journal_entries');
  run('DELETE FROM stock_moves');run('DELETE FROM materials');run('DELETE FROM accounts');run('DELETE FROM records');
  audit({id:actor},null,'system','reset','test_data_reset',null,counts);
  return counts;
 });
}
module.exports={db,all,one,run,modules,moduleMap,transitions,now,uid,hashPassword,verifyPassword,publicUser,login,auth,requireCompany,requireRole,httpError,createRecord,updateRecord,transitionRecord,createMaterial,stockBalance,moveStock,createAccount,postJournal,changePassword,bootstrapUser,resetTestData,DATA_DIR,transaction,audit};

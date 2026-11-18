'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const core=require('./db');
const PORT=Number(process.env.PORT||3000);
const HOST=process.env.HOST||'127.0.0.1';
const COOKIE='tc_session';
const publicRoot=path.join(__dirname,'public');
const send=(res,status,payload,extra={})=>{
 const body=JSON.stringify(payload);
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra});
 res.end(body);
};
const fail=(res,e)=>{
 const status=e.status||((e.code==='SQLITE_CONSTRAINT_UNIQUE'||e.code==='SQLITE_CONSTRAINT_PRIMARYKEY')?409:500);
 if(status>=500)console.error('ERP API error:',e);
 send(res,status,{error:status===500?'Lỗi máy chủ. Kiểm tra nhật ký vận hành.':e.message});
};
const readBody=async(req)=>{
 let size=0,buf=[];
 for await(const chunk of req){size+=chunk.length;if(size>1024*1024)throw core.httpError(413,'Dữ liệu yêu cầu quá lớn');buf.push(chunk);}
 try{return JSON.parse(Buffer.concat(buf).toString('utf8')||'{}');}catch{throw core.httpError(400,'JSON không hợp lệ');}
};
const getCookies=req=>Object.fromEntries(String(req.headers.cookie||'').split(';').map(s=>s.trim().split('=').map(x=>decodeURIComponent(x||''))).filter(k=>k[0]));
const securityHeaders=(res)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");};
function requireUser(req,method){
 const token=getCookies(req)[COOKIE],user=core.auth(token);
 if(!user)throw core.httpError(401,'Vui lòng đăng nhập');
 if(method!=='GET'&&method!=='HEAD'){
  const csrf=String(req.headers['x-csrf-token']||'');
  if(!csrf||!crypto.timingSafeEqual(Buffer.from(csrf.padEnd(44,'_').slice(0,44)),Buffer.from(user.csrf.padEnd(44,'_').slice(0,44))))throw core.httpError(403,'Thiếu hoặc sai mã bảo vệ CSRF');
 }
 return user;
}
function cookie(token,req,clear=false){
 const secure=(process.env.COOKIE_SECURE==='true'||String(req.headers['x-forwarded-proto']||'').toLowerCase()==='https');
 return `${COOKIE}=${clear?'':encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear?0:28800}${secure?'; Secure':''}`;
}
const loginAttempts=new Map();
function throttle(req,username){
 const key=String(req.socket.remoteAddress||'')+':'+String(username||'').toLowerCase();
 const t=Date.now(),old=loginAttempts.get(key)||[];
 const recent=old.filter(x=>t-x<15*60*1000);
 if(recent.length>=8)throw core.httpError(429,'Đăng nhập sai quá nhiều lần. Hãy thử lại sau.');
 recent.push(t);loginAttempts.set(key,recent);
 if(loginAttempts.size>3000)loginAttempts.clear();
}
function router(req,res,url,body,user){
 const p=url.pathname.split('/').filter(Boolean),method=req.method;
 if(p[0]==='auth'){
  if(p[1]==='me'&&method==='GET')return {user:core.publicUser(user),csrf:user.csrf};
  if(p[1]==='logout'&&method==='POST'){
   core.run('DELETE FROM sessions WHERE id_hash=?',user.id_hash);
   res.setHeader('Set-Cookie',cookie('',req,true));return {ok:true};
  }
  if(p[1]==='password'&&method==='POST'){
   core.changePassword(user,body.currentPassword,body.newPassword);
   res.setHeader('Set-Cookie',cookie('',req,true));return {ok:true,relogin:true};
  }
 }
 if(p[0]==='modules'&&method==='GET')return {modules:core.modules.filter(m=>!m.roles||m.roles.includes(user.role))};
 if(p[0]==='companies'&&method==='GET')return {companies:core.publicUser(user).companies};
 if(p[0]==='dashboard'&&method==='GET'){
  const scope=core.publicUser(user).companies.map(c=>c.id);
  return {companies:scope.map(id=>({
   id,name:core.one('SELECT name FROM companies WHERE id=?',id).name,
   records:core.one('SELECT COUNT(*) AS n FROM records WHERE company_id=?',id).n,
   open:core.one("SELECT COUNT(*) AS n FROM records WHERE company_id=? AND status NOT IN ('completed','cancelled')",id).n,
   materials:core.one('SELECT COUNT(*) AS n FROM materials WHERE company_id=?',id).n,
   journalCount:core.one('SELECT COUNT(*) AS n FROM journal_entries WHERE company_id=?',id).n
  }))};
 }
 if(p[0]==='audit'&&method==='GET'){
  core.requireRole(user,['super_admin']);
  const company=url.searchParams.get('company');
  if(company)core.requireCompany(user,company);
  return {rows:company?core.all('SELECT * FROM audit WHERE company_id=? ORDER BY id DESC LIMIT 200',company):core.all('SELECT * FROM audit ORDER BY id DESC LIMIT 200')};
 }
 const company=p[1];
 if(p[0]!=='companies'||!company||p.length<3)throw core.httpError(404,'Không tìm thấy API');
 core.requireCompany(user,company);
 if(p[2]==='records'){
  const module=p[3];
  if(!core.moduleMap[module])throw core.httpError(404,'Phân hệ không tồn tại');
  const spec=core.moduleMap[module];
  if(spec.roles)core.requireRole(user,spec.roles);
  if(p.length===4&&method==='GET'){
   const rows=core.all('SELECT * FROM records WHERE company_id=? AND module=? ORDER BY created_at DESC LIMIT 500',company,module).map(r=>({...r,payload:JSON.parse(r.payload)}));
   return {rows};
  }
  if(p.length===4&&method==='POST')return {row:core.createRecord(user,company,module,body)};
  const id=p[4];
  if(p.length===5&&method==='PUT')return {row:core.updateRecord(user,company,id,body)};
  if(p.length===6&&p[5]==='status'&&method==='POST')return {row:core.transitionRecord(user,company,id,body.status,body.version)};
 }
 if(p[2]==='materials'){
  if(method==='GET'&&p.length===3)return {rows:core.all(`SELECT m.*,COALESCE((SELECT SUM(CASE WHEN s.direction='in' THEN s.quantity ELSE -s.quantity END) FROM stock_moves s WHERE s.material_id=m.id AND s.company_id=m.company_id),0) AS balance FROM materials m WHERE m.company_id=? ORDER BY m.sku`,company)};
  if(method==='POST'&&p.length===3)return {row:core.createMaterial(user,company,body)};
 }
 if(p[2]==='stock'){
  if(method==='GET'&&p.length===3)return {rows:core.all('SELECT s.*,m.sku,m.name,m.unit FROM stock_moves s JOIN materials m ON m.id=s.material_id WHERE s.company_id=? ORDER BY s.created_at DESC LIMIT 500',company)};
  if(method==='POST'&&p.length===3)return {row:core.moveStock(user,company,body)};
 }
 if(p[2]==='accounts'){
  core.requireRole(user,['super_admin','accountant']);
  if(method==='GET'&&p.length===3)return {rows:core.all('SELECT * FROM accounts WHERE company_id=? ORDER BY code',company)};
  if(method==='POST'&&p.length===3)return {row:core.createAccount(user,company,body)};
 }
 if(p[2]==='journal'){
  core.requireRole(user,['super_admin','accountant']);
  if(method==='GET'&&p.length===3)return {rows:core.all(`SELECT j.*, (SELECT SUM(l.debit) FROM journal_lines l WHERE l.entry_id=j.id) AS total FROM journal_entries j WHERE j.company_id=? ORDER BY j.booked_on DESC,j.created_at DESC LIMIT 500`,company)};
  if(method==='GET'&&p.length===4){
   const entry=core.one('SELECT * FROM journal_entries WHERE id=? AND company_id=?',p[3],company);
   if(!entry)throw core.httpError(404,'Chứng từ không tồn tại');
   return {entry,lines:core.all('SELECT l.*,a.code,a.name FROM journal_lines l JOIN accounts a ON a.id=l.account_id WHERE l.entry_id=? ORDER BY l.line_no',entry.id)};
  }
  if(method==='POST'&&p.length===3)return {row:core.postJournal(user,company,body)};
 }
 if(p[2]==='trial-balance'&&method==='GET'){
  core.requireRole(user,['super_admin','accountant']);
  return {rows:core.all(`SELECT a.code,a.name,COALESCE(SUM(l.debit),0) AS debit,COALESCE(SUM(l.credit),0) AS credit
    FROM accounts a LEFT JOIN journal_lines l ON l.account_id=a.id
    WHERE a.company_id=? GROUP BY a.id ORDER BY a.code`,company)};
 }
 throw core.httpError(404,'API không tồn tại');
}
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 securityHeaders(res);
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/health'){send(res,200,{ok:true,service:'tamcuong-erp'});return;}
 if(url.pathname.startsWith('/api/')){
  try{
   if(req.method==='POST'&&url.pathname==='/api/auth/login'){
    const body=await readBody(req);throttle(req,body.username);
    const {token,csrf,user}=core.login(body.username,body.password);
    res.setHeader('Set-Cookie',cookie(token,req));
    send(res,200,{user,csrf});return;
   }
   const user=requireUser(req,req.method);
   if(user.must_change_password&&!['/api/auth/password','/api/auth/me'].includes(url.pathname))throw core.httpError(403,'Bắt buộc đổi mật khẩu trước khi thao tác');
   const body=['POST','PUT','PATCH'].includes(req.method)?await readBody(req):{};
   send(res,200,router(req,res,url,body,user));return;
  }catch(e){fail(res,e);return;}
 }
 if(req.method!=='GET'&&req.method!=='HEAD'){send(res,405,{error:'Method not allowed'});return;}
 const file=url.pathname==='/'||url.pathname==='/erp'?'index.html':url.pathname.slice(1);
 if(!['index.html','app.js','style.css'].includes(file)){send(res,404,{error:'Không tìm thấy'});return;}
 const full=path.join(publicRoot,file);
 try{const bytes=fs.readFileSync(full);res.writeHead(200,{'Content-Type':MIME[path.extname(file)],'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:bytes);}catch(e){fail(res,e);}
});
if(require.main===module){server.listen(PORT,HOST,()=>console.log(`Tam Cuong ERP listening on http://${HOST}:${PORT}`));}
module.exports={server};

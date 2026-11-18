'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const readline=require('node:readline/promises');
const {stdin,stdout}=require('node:process');
const core=require('./db');
async function main(){
 const command=process.argv[2];
 if(command==='bootstrap'){
  const existing=core.one('SELECT COUNT(*) AS n FROM users').n;
  if(existing){console.error('Đã có tài khoản. Bootstrap chỉ thực hiện khi database chưa có người dùng.');process.exitCode=1;return;}
  const rl=readline.createInterface({input:stdin,output:stdout});
  try{
   console.log('Khởi tạo 1 Super Admin cho cả ba công ty và 1 tài khoản kế toán.');
   console.log('Không nhập mật khẩu vào tham số dòng lệnh hoặc lưu vào Git.');
   const adminName=(await rl.question('Tên đăng nhập Super Admin [admin]: ')).trim()||'admin';
   const adminPassword=await rl.question('Mật khẩu tạm Super Admin (>=14 ký tự): ');
   const accountantName=(await rl.question('Tên đăng nhập kế toán [ketoan]: ')).trim()||'ketoan';
   const accountantPassword=await rl.question('Mật khẩu tạm kế toán (>=14 ký tự): ');
   const companies=(await rl.question('Công ty kế toán được phép truy cập [TC,HC,NC]: ')).trim()||'TC,HC,NC';
   const scope=[...new Set(companies.split(',').map(s=>s.trim().toUpperCase()).filter(Boolean))];
   if(adminPassword.length<14||accountantPassword.length<14||adminPassword===accountantPassword)throw Error('Mỗi mật khẩu phải dài ít nhất 14 ký tự và khác nhau');
   const created=core.transaction(()=>{
    // Outer transaction protects against partially created accounts, so validate both before writes.
    if(adminName===accountantName)throw Error('Hai tên đăng nhập phải khác nhau');
    if(!scope.every(c=>['TC','HC','NC'].includes(c)))throw Error('Phạm vi công ty không hợp lệ');
    return true;
   });
   if(!created)throw Error('Khởi tạo không thành công');
   core.bootstrapUser(adminName,adminPassword,'super_admin',['TC','HC','NC']);
   core.bootstrapUser(accountantName,accountantPassword,'accountant',scope);
   console.log('Khởi tạo hoàn tất. Đổi mật khẩu trong lần đăng nhập đầu.');
  } finally {rl.close();}
  return;
 }
 if(command==='backup'){
  const folder=path.resolve(process.env.ERP_BACKUP_DIR||path.join(core.DATA_DIR,'backups'));
  fs.mkdirSync(folder,{recursive:true,mode:0o700});
  const dest=path.join(folder,'tamcuong-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite');
  await core.db.backup(dest);
  fs.chmodSync(dest,0o600);
  console.log('Đã tạo backup '+dest);return;
 }
 if(command==='production-lock'){
  core.run("INSERT INTO settings(key,value) VALUES('production_locked','1') ON CONFLICT(key) DO UPDATE SET value='1'");
  console.log('Đã khóa thao tác reset dữ liệu');return;
 }
 if(command==='reset-test-data'){
  if(process.env.ERP_ENV!=='staging')throw Error('Chỉ được reset khi ERP_ENV=staging');
  const backupDir=path.resolve(process.env.ERP_BACKUP_DIR||path.join(core.DATA_DIR,'backups'));
  fs.mkdirSync(backupDir,{recursive:true,mode:0o700});
  const backup=path.join(backupDir,'pre-reset-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite');
  await core.db.backup(backup);fs.chmodSync(backup,0o600);
  const result=core.resetTestData(process.env.RESET_CONFIRM,'system');
  console.log('Đã backup '+backup);
  console.log('Đã làm rỗng dữ liệu nghiệp vụ, giữ người dùng/pháp nhân/nhật ký:',result);
  return;
 }
 console.log('Sử dụng: node erp/cli.js bootstrap | backup | production-lock | reset-test-data');
}
main().catch(e=>{console.error(e.message);process.exitCode=1});

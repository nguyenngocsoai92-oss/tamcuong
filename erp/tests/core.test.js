'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
process.env.ERP_DATA_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'tamcuong-erp-test-'));
const erp=require('../db');
const mock=(id,role='super_admin')=>({id,role});
test('three legal entities are initialized separately',()=>{
 const companies=erp.all('SELECT id,name FROM companies ORDER BY id');
 assert.deepEqual(companies.map(x=>x.id),['HC','NC','TC']);
});
test('one super admin and company-scoped accountant are bootstrapped',()=>{
 const a=erp.bootstrapUser('admin_test','very-long-admin-password-2026','super_admin',['TC','HC','NC']);
 const k=erp.bootstrapUser('ketoan_test','very-long-accounting-password-2026','accountant',['TC']);
 assert.throws(()=>erp.bootstrapUser('another_admin','long-enough-password-2026','super_admin',[]),/Chỉ được có một/);
 assert.equal(erp.login('admin_test','very-long-admin-password-2026').user.companies.length,3);
 assert.equal(erp.login('ketoan_test','very-long-accounting-password-2026').user.companies.length,1);
 assert.throws(()=>erp.createRecord(mock(k.id,'accountant'),'HC','customers',{title:'Khách test'}),/Không có quyền/);
});
test('records enforce company scope, optimistic versions and status changes',()=>{
 const admin=erp.one("SELECT * FROM users WHERE username='admin_test'");
 const record=erp.createRecord(mock(admin.id),'TC','projects',{title:'Công trình thử',payload:{amount:1000}});
 assert.equal(record.version,1);
 assert.throws(()=>erp.updateRecord(mock(admin.id),'HC',record.id,{title:'Sửa sai',version:1}),/Không tìm thấy/);
 const updated=erp.updateRecord(mock(admin.id),'TC',record.id,{title:'Công trình mới',version:1,payload:{amount:2000}});
 assert.equal(updated.version,2);
 assert.throws(()=>erp.updateRecord(mock(admin.id),'TC',record.id,{title:'Lỗi',version:1}),/đã được cập nhật/);
 const pending=erp.transitionRecord(mock(admin.id),'TC',record.id,'pending',2);
 assert.equal(pending.status,'pending');
 assert.throws(()=>erp.transitionRecord(mock(admin.id),'TC',record.id,'approved',3),/Người lập không được tự/);
});
test('stock movements prevent negative stock and cross-company mixing',()=>{
 const admin=erp.one("SELECT * FROM users WHERE username='admin_test'");
 const m=erp.createMaterial(mock(admin.id),'TC',{sku:'STEEL-01',name:'Thép hộp',unit:'m',minQty:2});
 assert.throws(()=>erp.moveStock(mock(admin.id),'TC',{materialId:m.id,direction:'out',quantity:1,sourceRef:'OUT-1'}),/Không đủ tồn/);
 erp.moveStock(mock(admin.id),'TC',{materialId:m.id,direction:'in',quantity:5,unitCost:10000,sourceRef:'IN-1'});
 erp.moveStock(mock(admin.id),'TC',{materialId:m.id,direction:'out',quantity:3,sourceRef:'OUT-2'});
 assert.equal(erp.stockBalance('TC',m.id),2);
 assert.throws(()=>erp.moveStock(mock(admin.id),'NC',{materialId:m.id,direction:'out',quantity:1,sourceRef:'OUT-3'}),/không thuộc/);
});
test('double-entry journals reject imbalance and cross-company accounts',()=>{
 const accountant=erp.one("SELECT * FROM users WHERE username='ketoan_test'");
 const u=mock(accountant.id,'accountant');
 const cash=erp.createAccount(u,'TC',{code:'111',name:'Tiền mặt'});
 const payable=erp.createAccount(u,'TC',{code:'331',name:'Phải trả'});
 const base={reference:'JV-001',description:'Ghi nhận công nợ',bookedOn:'2026-11-18',lines:[{accountId:cash.id,debit:1000,credit:0},{accountId:payable.id,debit:0,credit:900}]};
 assert.throws(()=>erp.postJournal(u,'TC',base),/phải bằng nhau/);
 const posted=erp.postJournal(u,'TC',{...base,lines:[{accountId:cash.id,debit:1000},{accountId:payable.id,credit:1000}]});
 assert.equal(posted.total,1000);
 assert.equal(erp.one('SELECT COUNT(*) AS n FROM journal_entries WHERE company_id=?','TC').n,1);
 assert.throws(()=>erp.postJournal(u,'TC',{...base,reference:'JV-002',lines:[{accountId:cash.id,debit:1},{accountId:cash.id,credit:1},{accountId:payable.id,debit:1}]}),/phải bằng nhau/);
});
test('protected reset requires explicit confirmation and preserves legal entities and users',()=>{
 assert.throws(()=>erp.resetTestData('wrong','system'),/Thiếu xác nhận/);
 const result=erp.resetTestData('RESET-TEST-DATA','system');
 assert.ok(result.records>0);
 assert.equal(erp.one('SELECT COUNT(*) AS n FROM records').n,0);
 assert.equal(erp.one('SELECT COUNT(*) AS n FROM companies').n,3);
 assert.equal(erp.one("SELECT COUNT(*) AS n FROM users WHERE role='super_admin'").n,1);
});
test.after(()=>{erp.db.close();fs.rmSync(process.env.ERP_DATA_DIR,{recursive:true,force:true})});

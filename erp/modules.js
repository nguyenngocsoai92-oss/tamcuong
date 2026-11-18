'use strict';

const f = (key, label, type = 'text', required = false, options = []) => ({ key, label, type, required, options });
const common = {
  partner: f('partner', 'Khách hàng / đối tác'),
  customer: f('customer', 'Mã khách hàng'),
  project: f('project', 'Mã công trình'),
  order: f('order', 'Mã đơn hàng'),
  amount: f('amount', 'Giá trị (VND)', 'money'),
  due: f('due', 'Hạn hoàn thành', 'date'),
  description: f('description', 'Mô tả / ghi chú', 'textarea'),
  assignee: f('assignee', 'Người phụ trách')
};
const F = common;
const modules = [
  { key:'customers', group:'Kinh doanh', label:'Khách hàng – CRM', fields:[f('taxId','Mã số thuế'),f('contact','Người liên hệ'),f('phone','Điện thoại'),f('email','Email'),f('address','Địa chỉ'),F.description] },
  { key:'surveys', group:'Kinh doanh', label:'Khảo sát – Thiết kế', fields:[F.customer,F.project,f('location','Địa điểm khảo sát'),f('dimensions','Kích thước / hiện trạng'),f('drawing','Tham chiếu bản vẽ'),F.due,F.assignee,F.description] },
  { key:'quotes', group:'Kinh doanh', label:'Dự toán – Báo giá', fields:[F.customer,F.project,F.amount,f('costEstimate','Giá vốn dự toán (VND)','money'),f('version','Phiên bản'),f('validUntil','Hiệu lực đến','date'),F.description] },
  { key:'contracts', group:'Kinh doanh', label:'Hợp đồng – Phụ lục', fields:[F.customer,F.project,F.amount,f('signedOn','Ngày ký','date'),f('paymentTerms','Điều kiện thanh toán','textarea'),F.due,F.description] },
  { key:'projects', group:'Công trình', label:'Dự án – Công trình', fields:[F.customer,F.amount,f('budget','Ngân sách (VND)','money'),F.assignee,f('startOn','Khởi công','date'),F.due,F.description] },
  { key:'project_materials', group:'Công trình', label:'Vật tư theo công trình', fields:[F.project,f('material','Mã vật tư'),f('plannedQty','Số lượng dự toán','number'),f('actualQty','Số lượng thực tế','number'),F.description] },
  { key:'site_diaries', group:'Công trình', label:'Nhật ký thi công', fields:[F.project,f('workDate','Ngày thi công','date'),F.assignee,f('workVolume','Khối lượng thực hiện'),F.description] },
  { key:'deliveries', group:'Công trình', label:'Giao hàng – Vận chuyển', fields:[F.project,F.order,f('recipient','Người nhận'),f('deliveryDate','Ngày giao','date'),f('vehicle','Phương tiện'),F.description] },
  { key:'acceptances', group:'Công trình', label:'Nghiệm thu – Bàn giao', fields:[F.project,f('acceptedOn','Ngày nghiệm thu','date'),f('acceptedAmount','Giá trị nghiệm thu (VND)','money'),f('recipient','Người xác nhận'),F.description] },
  { key:'warranties', group:'Công trình', label:'Bảo hành – Hậu mãi', fields:[F.project,F.customer,f('startOn','Bắt đầu','date'),f('endOn','Hết hạn','date'),F.assignee,F.description] },
  { key:'boms', group:'Sản xuất', label:'Định mức vật tư – BOM', fields:[f('product','Sản phẩm / quy cách'),f('version','Phiên bản'),f('quantity','Số lượng cơ sở','number'),f('components','Danh mục vật tư, định mức và hao hụt','textarea'),F.description] },
  { key:'production_plans', group:'Sản xuất', label:'Kế hoạch sản xuất – MRP', fields:[F.order,F.project,f('product','Sản phẩm'),f('quantity','Số lượng','number'),f('workshop','Xưởng'),F.due,F.description] },
  { key:'production_orders', group:'Sản xuất', label:'Lệnh sản xuất – MES', fields:[F.order,F.project,f('bom','Mã BOM'),f('product','Sản phẩm'),f('quantity','Số lượng','number'),f('completedQty','Đã hoàn thành','number'),f('workshop','Xưởng'),F.assignee,F.due,F.description] },
  { key:'subcontracting', group:'Sản xuất', label:'Gia công ngoài', fields:[F.project,f('supplier','Nhà gia công'),f('scope','Phạm vi gia công'),F.amount,F.due,F.description] },
  { key:'quality_checks', group:'Sản xuất', label:'Kiểm tra chất lượng – QC', fields:[f('sourceRef','Mã lệnh / lô hàng'),f('checkType','Loại kiểm tra','select',false,['IQC','IPQC','OQC']),f('result','Kết quả','select',false,['Đạt','Cần sửa','Không đạt']),F.assignee,F.description] },
  { key:'maintenance', group:'Sản xuất', label:'Máy móc – Bảo trì', fields:[f('machine','Mã máy'),f('location','Vị trí máy'),f('maintenanceDate','Ngày bảo trì','date'),F.amount,F.assignee,F.description] },
  { key:'purchase_requests', group:'Cung ứng', label:'Đề nghị mua hàng', fields:[F.project,f('supplier','Nhà cung cấp dự kiến'),f('materialList','Danh sách vật tư','textarea'),F.amount,F.due,F.description] },
  { key:'purchase_orders', group:'Cung ứng', label:'Đơn đặt hàng – PO', fields:[f('supplier','Mã nhà cung cấp'),F.project,F.amount,f('deliveryDate','Ngày giao dự kiến','date'),F.description] },
  { key:'suppliers', group:'Cung ứng', label:'Nhà cung cấp', fields:[f('taxId','Mã số thuế'),f('contact','Liên hệ'),f('phone','Điện thoại'),f('address','Địa chỉ'),F.description] },
  { key:'costs', group:'Tài chính', label:'Giá thành – Chi phí', roles:['super_admin','accountant'], fields:[F.project,F.order,f('costType','Loại chi phí'),F.amount,f('costDate','Ngày phát sinh','date'),F.description] },
  { key:'payments', group:'Tài chính', label:'Thu chi – Công nợ', roles:['super_admin','accountant'], fields:[F.customer,F.project,F.amount,f('direction','Loại','select',true,['Thu','Chi']),f('paidOn','Ngày giao dịch','date'),f('bankRef','Mã giao dịch ngân hàng'),F.description] },
  { key:'invoices', group:'Tài chính', label:'Hóa đơn – Thuế', roles:['super_admin','accountant'], fields:[f('invoiceNumber','Số hóa đơn'),F.customer,F.project,F.amount,f('taxAmount','Tiền thuế (VND)','money'),f('issuedOn','Ngày phát hành','date'),f('providerRef','Mã hóa đơn nhà cung cấp'),F.description] },
  { key:'budgets', group:'Tài chính', label:'Ngân sách', roles:['super_admin','accountant'], fields:[F.project,F.amount,f('period','Kỳ ngân sách'),f('department','Đơn vị sử dụng'),F.description] },
  { key:'employees', group:'Nhân sự', label:'Nhân viên – Chấm công', fields:[f('department','Phòng ban'),f('jobTitle','Chức danh'),f('employeeId','Mã nhân sự'),f('phone','Điện thoại'),f('joinedOn','Ngày vào làm','date'),F.description] },
  { key:'tasks', group:'Nhân sự', label:'Công việc – Văn bản', fields:[F.project,F.assignee,F.due,f('priority','Mức ưu tiên','select',false,['Thấp','Trung bình','Cao']),F.description] },
  { key:'safety', group:'Nhân sự', label:'An toàn – Tuân thủ', fields:[F.project,f('inspectionDate','Ngày kiểm tra','date'),F.assignee,f('risk','Nguy cơ'),f('correctiveAction','Biện pháp khắc phục','textarea')] },
  { key:'approvals', group:'Quản trị', label:'Đề nghị – Phê duyệt', fields:[f('sourceRef','Mã hồ sơ'),f('requester','Người đề nghị'),F.amount,F.due,F.description] },
  { key:'workflows', group:'Quản trị', label:'Quy trình – Workflow', fields:[f('trigger','Điều kiện kích hoạt'),f('stepOwners','Vai trò xử lý'),f('actions','Các bước thực hiện','textarea'),F.description] }
];
const moduleMap = Object.fromEntries(modules.map(m => [m.key, m]));
const statuses = ['draft','pending','approved','in_progress','completed','rejected','cancelled'];
const transitions = {
  draft:['pending','cancelled'], pending:['approved','rejected','cancelled'],
  rejected:['draft','cancelled'], approved:['in_progress','completed','cancelled'],
  in_progress:['completed','cancelled'], completed:[], cancelled:[]
};
module.exports = {modules,moduleMap,statuses,transitions};

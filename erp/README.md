# Tâm Cường ERP – Backend chạy thực tế (bản nền tảng)

**Trạng thái:** Đang phát triển, chưa nghiệm thu production. Trang root là bản demo GitHub Pages cũ. ERP mới chạy trong thư mục erp/ trên máy chủ Node.js, không chạy được trên GitHub Pages.

## Đã triển khai
- SQLite WAL lưu thực tế dữ liệu 3 pháp nhân TC, HC, NC.
- Một Super Admin toàn hệ thống, tài khoản kế toán theo phạm vi, tạo bằng CLI không hardcode mật khẩu.
- Đăng nhập server, scrypt hash, cookie HttpOnly/SameSite, chống CSRF, buộc đổi mật khẩu lần đầu.
- Tạo/sửa/xem/chuyển trạng thái hồ sơ theo các phân hệ, audit và phân tách pháp nhân.
- Kho nhập/xuất theo phiếu và kiểm tra tồn, thực hiện trong transaction.
- Kế toán ghi bút toán Nợ/Có cân bằng từng pháp nhân, tổng phát sinh, nhật ký kế toán.
- Backup, chốt xóa dữ liệu thử nghiệm.

## Chưa hoàn thành
Những phân hệ BOM/MRP/MES/QC, dự án, giá thành, nhân sự, bảo hành, CRM... hiện là bộ hồ sơ có trạng thái và trường dữ liệu, CHƯA có logic chuyên biệt đầy đủ. Chưa có: điều phối MRP, WIP, tính giá thành tự động, luồng mua bán nội bộ, sổ cái/báo cáo tài chính hoàn chỉnh, gửi hóa đơn điện tử, AI, Zalo/email, RBAC chi tiết, cấp tài khoản nhân viên, MFA, quy trình duyệt đa cấp. Không được xem đây là hệ thống hoàn thiện production.

## Chạy trên máy chủ Node.js 24 LTS
1. Clone repository, checkout branch feat/erp-backend-rbac-foundation-20261118.
2. Chạy npm run check và npm test.
3. Tạo thư mục ERP_DATA_DIR và ERP_BACKUP_DIR bền vững có quyền truy cập hạn chế.
4. Cấu hình ERP_ENV=staging; COOKIE_SECURE=true khi dùng HTTPS.
5. Chạy npm run bootstrap để khởi tạo duy nhất một admin cùng tài khoản ketoan. CLI hỏi mật khẩu riêng (tối thiểu 14 ký tự), không đưa mật khẩu vào Git.
6. Chạy npm start; dịch vụ mặc định 127.0.0.1:3000. Dùng reverse proxy HTTPS và DNS để truy cập từ Internet.

## Go-live
- Backup: npm run backup.
- Chỉ staging mới được xóa dữ liệu nghiệp vụ bằng lệnh: ERP_ENV=staging RESET_CONFIRM=RESET-TEST-DATA npm run reset-staging.
- Lệnh reset backup trước; giữ pháp nhân, tài khoản, nhật ký; xóa hồ sơ, sổ kho, vật tư, tài khoản và chứng từ kế toán staging.
- Dùng npm run lock-production để khóa vĩnh viễn reset dữ liệu tại DB đang sử dụng.
- Khuyến nghị tạo DB production mới và bootstrap lại tài khoản, thay vì mang database thử nghiệm lên production.

## Trước production
Phải nghiệm thu nghiệp vụ toàn tuyến, test xâm nhập, migration DB có phiên bản, backup ngoại vi/khôi phục, giám sát, chính sách RBAC/MFA, đối chiếu kế toán – thuế và xác định các tích hợp hóa đơn/ngân hàng. Không dùng phiên bản nền tảng này để hạch toán kinh doanh thực tế trước khi hoàn tất kiểm thử.
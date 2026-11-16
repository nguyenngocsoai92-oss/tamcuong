# Cổng điều hành Tam Cường

Bản demo để Tam Cường, Nam Cường và Hùng Cường rà soát nghiệp vụ. Mở `index.html` hoặc phục vụ thư mục bằng máy chủ tệp tĩnh. GitHub Pages có thể dùng nhánh `main` và thư mục gốc.

## Cách dùng thử

1. Mở **Báo cáo dành cho HĐQT**, lọc từng công ty và xem số liệu quản trị. Giá trị tổng là phép cộng minh họa, chưa loại giao dịch nội bộ.
2. Mở một trong ba **Công ty**. Xem **Quy trình nghiệp vụ**, chọn bán hàng có sẵn hoặc sản xuất và thi công. Trong hồ sơ đơn hàng, chọn bước để xem đầu vào, cách thực hiện, đầu ra và điều kiện chuyển tiếp. Khi xác nhận, lưu mã tham chiếu đầu ra. Các tình huống thử có tạm ứng một phần, ngoại lệ, tạm dừng và bàn giao nhiều đợt.
3. Trong hồ sơ đơn hàng, mở bộ chứng từ liên quan, hoặc mở **Dành cho kế toán** rồi chọn công ty. Chọn hồ sơ đủ mốc, kiểm danh mục và trình duyệt. Đổi sang tài khoản người duyệt của cùng công ty để yêu cầu bổ sung hoặc duyệt. Liên kết **Mở hồ sơ nguồn** dẫn về đúng mã đơn hàng và yêu cầu đúng vai trò ở khu đích.
4. Sau khi bộ hồ sơ được duyệt, đổi lại người lập và chọn **Soạn email gửi hồ sơ**. Kiểm tra địa chỉ mẫu `.test`, tiêu đề, nội dung và tệp đính kèm. **Gửi thử** ghi vào nhật ký. **Tải email .eml** tạo thư mẫu chứa ZIP đã lọc theo nhóm giấy tờ dành cho người nhận. Bộ mua hàng giữ nội bộ đề xuất mua, phiếu nhập và chứng từ đối soát. Nút **Tải bộ hồ sơ nội bộ** chứa danh mục đầy đủ.
5. Mở **Góp ý nghiệp vụ**, điền các câu hỏi cần chốt và tải tệp phản hồi để gửi lại đầu mối.

Chỉ dùng dữ liệu giả định. Tài khoản, quyền, gửi email và nhật ký là mô phỏng trên trình duyệt. Phiên đăng nhập giữ trong trang, thay đổi lưu trong bộ nhớ cục bộ nếu trình duyệt cho phép. Khi vận hành thật phải áp quyền ở máy chủ theo công ty và hồ sơ, tách người lập với người duyệt, giữ bản gốc và nhật ký tập trung. Chốt địa chỉ gửi từng công ty, danh mục được gửi cho mỗi người nhận và cấu hình dịch vụ email trước khi gửi thật.

## Kiểm tra trước khi sử dụng thật

| Hạng mục | Việc cần xác nhận với doanh nghiệp | Căn cứ để đối chiếu |
| --- | --- | --- |
| Chứng từ kế toán và lưu trữ | Chế độ kế toán áp dụng ở từng pháp nhân. Nội dung bắt buộc và người ký theo loại chứng từ. Bản ghi phải truy được về nghiệp vụ, chứng từ gốc và thời hạn lưu theo phân loại. | [Luật Kế toán 88/2015/QH13](https://vanban.chinhphu.vn/?docid=183198&pageid=27160), [Luật sửa đổi 56/2024/QH15](https://vanban.chinhphu.vn/?docid=212484&pageid=27160), [Nghị định 174/2016/NĐ-CP](https://vanban.chinhphu.vn/?docid=187897&pageid=27160), [hướng dẫn về Thông tư 99/2025/TT-BTC](https://www.mof.gov.vn/tin-tuc-tai-chinh/tin-chinh-sach-tai-chinh/quy-dinh-moi-ve-che-do-ke-toan-doanh-nghiep) |
| Hóa đơn điện tử | Chốt nhà cung cấp, pháp nhân phát hành, thời điểm lập theo từng giao dịch, cách nhận và đối chiếu dữ liệu gốc, cách xử lý sai sót. Bản demo xuất mẫu HTML và danh mục, còn hóa đơn điện tử thuộc hệ thống phát hành chính thức. | [Luật Quản lý thuế 108/2025/QH15](https://vanban.chinhphu.vn/?docid=216541&pageid=27160), [Nghị định 254/2026/NĐ-CP](https://vanban.chinhphu.vn/?docid=218689&pageid=27160), [Thông tư 91/2026/TT-BTC](https://vanban.chinhphu.vn/?docid=219006&pageid=27160) |
| Giao dịch điện tử và chữ ký | Chốt người được ký theo pháp nhân và loại tài liệu. Xác định cách ký, xác minh chữ ký, bảo toàn nội dung và truy xuất bản gốc. Xác nhận trên demo là thao tác minh họa. | [Luật Giao dịch điện tử 20/2023/QH15](https://vanban.chinhphu.vn/?docid=208421&pageid=27160) |
| Dữ liệu cá nhân | Kiểm kê dữ liệu khách hàng, người nhận, nhân sự và bảo hiểm. Chốt mục đích, căn cứ xử lý, phạm vi cấp quyền, lưu giữ và xóa, đáp ứng quyền của chủ thể và đánh giá tác động theo trường hợp áp dụng. | [Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15](https://vanban.chinhphu.vn/?docid=214590&pageid=27160), [Nghị định 356/2025/NĐ-CP](https://vanban.chinhphu.vn/?docid=216387&pageid=27160) |

Mẫu xuất chưa có thông tin đăng ký và chữ ký thật. Kế toán phụ trách từng pháp nhân cần duyệt bộ mẫu và quy tắc trước khi sử dụng vào giao dịch, ghi sổ hoặc nộp hồ sơ. Công nợ, giữ lại bảo hành, kho, nhân sự, KPI và nhắc việc được minh họa để xác nhận phạm vi.

# Cổng điều hành Tam Cường

Bản demo để Tam Cường, Nam Cường và Hùng Cường rà soát nghiệp vụ. Mở `index.html` hoặc phục vụ thư mục bằng máy chủ tệp tĩnh. GitHub Pages có thể dùng nhánh `main` và thư mục gốc.

## Cách dùng thử

1. Mở **Báo cáo dành cho HĐQT**, lọc từng công ty và xem số liệu quản trị. Giá trị tổng là phép cộng minh họa, chưa loại giao dịch nội bộ.
2. Mở một trong ba **Công ty**, chọn **Lập đơn hàng** và thêm hạng mục, số lượng, đơn giá. Có thể lưu và lập báo giá ngay. Xác nhận tiếp nhận để chuyển đơn bán hàng có sẵn sang báo giá. Đơn sản xuất và thi công đi qua khảo sát và thiết kế.
3. Trong **Báo giá**, cập nhật hạng mục, chiết khấu, tiền thuế nếu áp dụng và thời hạn. Khi đơn đến bước báo giá, duyệt và tải bản HTML để in hoặc lưu PDF. Ghi nhận đã gửi và khách chấp thuận. Bản được chấp thuận trở thành đầu vào bước hợp đồng.
4. Trong hồ sơ đơn hàng, mở bộ chứng từ liên quan, hoặc mở **Dành cho kế toán** rồi chọn công ty. Chọn hồ sơ đủ mốc, kiểm danh mục và gửi phê duyệt. Đổi sang tài khoản người duyệt của cùng công ty để yêu cầu bổ sung hoặc duyệt. Liên kết **Mở hồ sơ nguồn** dẫn về đúng mã đơn hàng và yêu cầu đúng vai trò ở khu đích.
5. Sau khi bộ hồ sơ được duyệt, đổi lại người lập và chọn **Soạn email gửi hồ sơ**. Kiểm tra địa chỉ mẫu `.test`, tiêu đề, nội dung và tệp đính kèm. **Gửi thử** ghi vào nhật ký. **Tải email .eml** tạo thư mẫu chứa ZIP đã lọc theo nhóm giấy tờ dành cho người nhận. Bộ mua hàng giữ nội bộ đề xuất mua, phiếu nhập và chứng từ đối soát. Nút **Tải bộ hồ sơ nội bộ** chứa danh mục đầy đủ.

Chỉ dùng dữ liệu giả định. Tài khoản, quyền, gửi email và nhật ký là mô phỏng trên trình duyệt. Phiên đăng nhập giữ trong trang, thay đổi lưu trong bộ nhớ cục bộ nếu trình duyệt cho phép. Khi vận hành thật phải áp quyền ở máy chủ theo công ty và hồ sơ, tách người lập với người duyệt, giữ bản gốc và nhật ký tập trung. Chốt địa chỉ gửi từng công ty, danh mục được gửi cho mỗi người nhận và cấu hình dịch vụ email trước khi gửi thật.

## Kiểm tra trước khi sử dụng thật

| Hạng mục | Việc cần xác nhận với doanh nghiệp | Căn cứ để đối chiếu |
| --- | --- | --- |
| Chứng từ kế toán và lưu trữ | Chế độ kế toán áp dụng ở từng pháp nhân. Nội dung bắt buộc và người ký theo loại chứng từ. Bản ghi phải truy được về nghiệp vụ, chứng từ gốc và thời hạn lưu theo phân loại. | [Luật Kế toán 88/2015/QH13](https://vanban.chinhphu.vn/?docid=183198&pageid=27160), [Luật sửa đổi 56/2024/QH15](https://vanban.chinhphu.vn/?docid=212484&pageid=27160), [Nghị định 174/2016/NĐ-CP](https://vanban.chinhphu.vn/?docid=187897&pageid=27160), [hướng dẫn về Thông tư 99/2025/TT-BTC](https://www.mof.gov.vn/tin-tuc-tai-chinh/tin-chinh-sach-tai-chinh/quy-dinh-moi-ve-che-do-ke-toan-doanh-nghiep) |
| Hóa đơn điện tử | Chốt nhà cung cấp, pháp nhân phát hành, thời điểm lập theo từng giao dịch, cách nhận và đối chiếu dữ liệu gốc, cách xử lý sai sót. Bản demo xuất mẫu HTML và danh mục, còn hóa đơn điện tử thuộc hệ thống phát hành chính thức. | [Luật Quản lý thuế 108/2025/QH15](https://vanban.chinhphu.vn/?docid=216541&pageid=27160), [Nghị định 254/2026/NĐ-CP](https://vanban.chinhphu.vn/?docid=218689&pageid=27160), [Thông tư 91/2026/TT-BTC](https://vanban.chinhphu.vn/?docid=219006&pageid=27160) |
| Giao dịch điện tử và chữ ký | Chốt người được ký theo pháp nhân và loại tài liệu. Xác định cách ký, xác minh chữ ký, bảo toàn nội dung và truy xuất bản gốc. Xác nhận trên demo là thao tác minh họa. | [Luật Giao dịch điện tử 20/2023/QH15](https://vanban.chinhphu.vn/?docid=208421&pageid=27160) |
| Dữ liệu cá nhân | Kiểm kê dữ liệu khách hàng, người nhận, nhân sự và bảo hiểm. Chốt mục đích, căn cứ xử lý, phạm vi cấp quyền, lưu giữ và xóa, đáp ứng quyền của chủ thể và đánh giá tác động theo trường hợp áp dụng. | [Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15](https://vanban.chinhphu.vn/?docid=214590&pageid=27160), [Nghị định 356/2025/NĐ-CP](https://vanban.chinhphu.vn/?docid=216387&pageid=27160) |

Mẫu xuất chưa có thông tin đăng ký và chữ ký thật. Kế toán phụ trách từng pháp nhân cần duyệt bộ mẫu và quy tắc trước khi sử dụng vào giao dịch, ghi sổ hoặc nộp hồ sơ. Công nợ, giữ lại bảo hành, kho, nhân sự, KPI và nhắc việc được minh họa để xác nhận phạm vi.

Đơn hàng và báo giá cho chọn VAT 0%, 5%, 8% hoặc 10% theo hạng mục. Bản demo tính trên giá chưa VAT sau khi phân bổ chiết khấu của đơn. Người lập phải xác định mức áp dụng theo hàng hóa, dịch vụ và thời điểm. Mức 8% thuộc chính sách giảm thuế có phạm vi và thời hạn. [Luật Thuế GTGT](https://vanban.chinhphu.vn/?docid=212476&pageid=27160), [Nghị quyết 204/2025/QH15](https://vanban.chinhphu.vn/?docid=214209&pageid=27160) và [Nghị định 174/2025/NĐ-CP](https://vanban.chinhphu.vn/?docid=214310&pageid=27160).

Báo giá và hợp đồng có mẫu Excel, Word và mẫu in/lưu PDF. Bản hợp đồng cuối được khóa theo báo giá đã chấp thuận. Thư .eml kèm bản Word và Excel mở trong ứng dụng thư. Kho theo dõi giá nhập chưa VAT và giá gồm VAT theo công ty. Sổ lưu trữ trong khu kế toán tra cứu bộ đã duyệt theo mã đơn. Dữ liệu demo lưu trên trình duyệt.

Khi lập đơn hoặc sửa báo giá nháp, chọn mẫu ẩn tên hai bên hoặc mẫu có thông tin bên bán, bên mua. Mẫu có thông tin hỗ trợ khách lẻ và doanh nghiệp. Với doanh nghiệp, điền tên công ty, mã số thuế, địa chỉ, người đặt hàng, điện thoại và email. Cả hai mẫu có chỗ ký của người lập và người duyệt báo giá.

Đơn tạo từ bản v7 được kiểm tra chứng từ nguồn. Gắn khách hàng trước khi khóa hợp đồng. Lưu PDF hợp đồng đã ký mẫu và đặt mốc tạm ứng trước khi chuyển sang thu tiền. Ghi mỗi lần thu theo mã giao dịch. Kế toán duyệt dựa trên chứng từ nguồn và tải chính tệp PDF đã lưu trong bộ đã duyệt. PDF mẫu tối đa 200 KB mỗi tệp, phụ thuộc dung lượng trình duyệt. Đơn minh họa đời trước vẫn mở được.

Trong Mua hàng và kho, lập phiếu nhập hoặc xuất trên hai vật tư có sẵn. Xuất kho cần gắn đơn và đủ tồn. Báo cáo nhà cung cấp lấy số phiếu và giá trị từ các lần nhập đã ghi. Bản demo chưa có máy chủ dùng chung, dịch vụ gửi thư thật, kết nối hóa đơn hoặc sổ kế toán.

## Mua hàng, kho và hồ sơ hợp đồng

- Trong **Mua hàng và kho**, lập đề xuất mua, ghi nhận duyệt rồi nhập theo đề xuất. Có thể nhập từng đợt với mã phiếu riêng. Phiếu lưu giá chưa VAT và thuế của lần mua. Sổ kho tra được mã đề xuất, phiếu nhập và đơn xuất. In đề xuất, phiếu nhập, phiếu xuất hoặc sổ kho ngay tại màn hình.
- Trong hồ sơ đơn, lấy báo giá đã chấp thuận làm căn cứ soạn hợp đồng. Điền điều khoản và khóa bản cuối, lưu PDF đã ký cùng ngày ký, sau đó ghi ngày hiệu lực khi chuyển sang thu tiền. Mẫu hợp đồng bán hàng in khổ A4, dùng Times New Roman 13 pt cho nội dung, có vị trí ký cho hai bên.
- Đối chiếu mẫu với [Bộ luật Dân sự 2015](https://vanban.chinhphu.vn/?docid=183188&pageid=27160) và [Điều 6 Nghị định 55/2024/NĐ-CP](https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-55--2024-nd-cp-quy-dinh-chi-tiet-mot-so-dieu-cua-luat-bao-ve-quyen-loi-nguoi-tieu-dung-119240521113013883.htm) khi giao dịch thuộc phạm vi bảo vệ người tiêu dùng. Xác nhận người ký, điều khoản và bộ chứng từ theo giao dịch trước khi áp dụng.

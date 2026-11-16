const DEMO = (() => {
  const companies = {
    TC: { name: "Tam Cường", initials: "TC", color: "#20745e", focus: "Sản xuất và thi công" },
    NC: { name: "Nam Cường", initials: "NC", color: "#4d6d9a", focus: "Kinh doanh và giao hàng" },
    HC: { name: "Hùng Cường", initials: "HC", color: "#a26032", focus: "Dự án và lắp đặt" },
  };
  const stages = [
    { name: "Tiếp nhận", owner: "Kinh doanh", action: "Xác minh nhu cầu", gate: "Đã có người phụ trách, nhu cầu và loại đơn.", output: "Phiếu tiếp nhận" },
    { name: "Khảo sát", owner: "Kỹ thuật", action: "Xác nhận hiện trạng", gate: "Đã kiểm tra số đo, ảnh và điều kiện hiện trường.", output: "Biên bản khảo sát" },
    { name: "Thiết kế", owner: "Kỹ thuật / Quản lý dự án", action: "Chốt phương án", gate: "Đã soát kỹ thuật và lưu xác nhận của khách cho đúng phiên bản.", output: "Xác nhận thiết kế" },
    { name: "Báo giá", owner: "Kinh doanh / Người duyệt giá", action: "Xác nhận báo giá", gate: "Báo giá đã duyệt, còn hiệu lực và có xác nhận của khách.", output: "Báo giá" },
    { name: "Hợp đồng", owner: "Kinh doanh / Người có thẩm quyền", action: "Xác nhận hợp đồng", gate: "Đã có bản ký, ngày hiệu lực và lịch thu theo mốc.", output: "Hợp đồng" },
    { name: "Tạm ứng", owner: "Kế toán / Người duyệt ngoại lệ", action: "Đối soát tạm ứng", gate: "Có số thực nhận hoặc lý do và mã duyệt ngoại lệ.", output: "Đề nghị tạm ứng" },
    { name: "Mua hàng và kho", owner: "Mua hàng / Thủ kho", action: "Xác nhận đủ vật tư", gate: "Đã kiểm tồn, duyệt phần mua thiếu, kiểm hàng đạt và xác nhận xuất kho.", output: "Đề xuất mua / Phiếu nhập xuất" },
    { name: "Sản xuất / Thi công", owner: "Quản lý dự án / Đội triển khai", action: "Xác nhận hoàn thành", gate: "Đã hoàn thành phần việc theo bản vẽ hiệu lực và kiểm tra chất lượng.", output: "Phiếu sản xuất – thi công" },
    { name: "Giao và nghiệm thu", owner: "Giao nhận / Quản lý dự án", action: "Ghi nhận một đợt bàn giao", gate: "Có bằng chứng thực nhận, biên bản nghiệm thu và xác nhận bàn giao theo đợt.", output: "Phiếu giao / Biên bản bàn giao" },
    { name: "Thanh lý và công nợ", owner: "Kinh doanh / Kế toán", action: "Xác nhận thanh lý", gate: "Đã đối chiếu số thực thu, dư nợ và khoản giữ lại. Khoản còn mở có người theo dõi.", output: "Biên bản thanh lý / Đối chiếu công nợ" },
    { name: "Bảo hành", owner: "Chăm sóc khách hàng", action: "Hoàn tất theo dõi bảo hành", gate: "Đã xử lý các yêu cầu còn mở và kiểm tra ngày kết thúc theo điều khoản.", output: "Hồ sơ bảo hành" },
    { name: "Đã hoàn tất", owner: "Quản lý dự án", output: "Hồ sơ đã lưu" },
  ];
  const tracks = {
    project: { label: "Sản xuất và thi công", path: [0,1,2,3,4,5,6,7,8,9,10,11] },
    direct: { label: "Bán hàng có sẵn", path: [0,3,4,5,6,8,9,10,11] },
  };
  const packs = {
    sales: {
      label: "Bán hàng và bàn giao", prefix: "BH",
      items: [
        ["bao-gia","Báo giá","Nội bộ",4], ["hop-dong","Hợp đồng","Hồ sơ giao dịch",5],
        ["tam-ung","Đề nghị tạm ứng","Nội bộ",6], ["giao","Phiếu giao hàng","Giao nhận",9],
        ["nghiem-thu","Biên bản nghiệm thu","Giao nhận",9], ["ban-giao","Biên bản bàn giao","Giao nhận",9],
        ["thanh-ly","Biên bản thanh lý","Hồ sơ giao dịch",10],
      ],
      evidence: "Đã kiểm tra tham chiếu hóa đơn điện tử bán ra theo tình huống demo.",
    },
    buying: {
      label: "Mua hàng – thanh toán", prefix: "MH",
      items: [
        ["de-xuat","Đề xuất mua hàng","Nội bộ",7], ["dat-mua","Đơn đặt mua","Hồ sơ giao dịch",7],
        ["nhan","Biên bản nhận và kiểm hàng","Giao nhận",7], ["nhap","Phiếu nhập kho","Kho",7],
        ["thanh-toan","Đề nghị thanh toán","Nội bộ",7], ["doi-soat","Bảng đối soát thanh toán","Nội bộ",7],
      ],
      evidence: "Đã kiểm tra tham chiếu hóa đơn bên bán và bằng chứng thanh toán theo tình huống demo.",
    },
  };
  const sampleRows = {
    TC: [
      ["Bộ nhận diện mặt tiền","Khách mẫu A",128000000,7,48000000,2,"project"],
      ["Biển chỉ dẫn khu dịch vụ","Khách mẫu B",64000000,9,48000000,2,"project"],
      ["Quầy trưng bày mô-đun","Khách mẫu C",96000000,5,12000000,1,"project"],
      ["Kệ trưng bày có sẵn","Khách mẫu D",42000000,10,40000000,1,"direct"],
      ["Biển thông tin sảnh","Khách mẫu E",32000000,0,0,1,"project"],
    ],
    NC: [
      ["Vật tư trang trí showroom","Khách mẫu F",82000000,9,60000000,2,"direct"],
      ["Biển tên theo bộ","Khách mẫu G",46000000,3,0,1,"project"],
      ["Kệ trưng bày khu A","Khách mẫu H",68000000,6,25000000,2,"direct"],
      ["Bộ bảng hướng dẫn có sẵn","Khách mẫu I",27000000,10,27000000,1,"direct"],
    ],
    HC: [
      ["Lắp đặt bảng hiệu khu B","Khách mẫu J",118000000,8,48000000,2,"project"],
      ["Hạng mục trang trí nội thất","Khách mẫu K",72000000,2,0,2,"project"],
      ["Biển quảng bá điểm bán","Khách mẫu L",58000000,10,55000000,1,"project"],
      ["Khung trưng bày triển lãm","Khách mẫu M",34000000,4,0,1,"project"],
    ],
  };
  const modules = {
    partners: { name: "Khách hàng & nhà cung cấp", icon: "users", fields: ["Đối tác", "Phân loại", "Phụ trách"], next: "Đã đối chiếu", rows: [
      ["Khách hàng mẫu A", "Khách truyền thống", "Kinh doanh", "Cần đối chiếu"],
      ["Khách hàng mẫu B", "Khách lẻ", "Kinh doanh", "Đã đối chiếu"],
      ["Nhà cung cấp mẫu A", "NCC truyền thống", "Mua hàng", "Cần đối chiếu"],
      ["Nhà cung cấp mẫu B", "NCC lẻ", "Mua hàng", "Đã đối chiếu"],
    ] },
    inventory: { name: "Mua hàng & kho", icon: "box", fields: ["Vật tư / Phiếu mua", "Số lượng", "Phụ trách"], next: "Đã kiểm tra", rows: [
      ["Tấm vật tư A", "Tồn 10 · Giữ 6 · Khả dụng 4", "Kho demo", "Cần kiểm tra"],
      ["Khung nhôm mẫu", "Tồn 24 · Giữ 5 · Khả dụng 19", "Kho demo", "Đã kiểm tra"],
      ["Phiếu mua mẫu 01", "Đặt 8 · Nhận đạt 6 · Còn thiếu 2", "Mua hàng", "Cần kiểm tra"],
    ] },
    finance: { name: "Tài chính", icon: "wallet", fields: ["Khoản theo dõi", "Giá trị mẫu", "Phụ trách"], next: "Đã đối chiếu", rows: [
      ["Thu chi và tiền chờ đối soát", "24.000.000 ₫", "Kế toán", "Cần đối chiếu"],
      ["Phải trả nhà cung cấp", "38.000.000 ₫", "Kế toán", "Cần đối chiếu"],
      ["Nợ ngân hàng và khoản vay", "125.000.000 ₫", "Kế toán trưởng", "Đã đối chiếu"],
      ["Khoản cho vay", "30.000.000 ₫", "Kế toán trưởng", "Cần đối chiếu"],
      ["Chi phí cố định", "12.500.000 ₫ / kỳ mẫu", "Kế toán", "Đã đối chiếu"],
      ["Tài sản đang sử dụng", "3 tài sản mẫu", "Kế toán", "Cần đối chiếu"],
    ] },
    people: { name: "Nhân sự & bảo hiểm", icon: "users", fields: ["Hồ sơ", "Nội dung", "Phụ trách"], next: "Đã rà soát", rows: [
      ["Nhân sự mẫu A", "Phân công kỹ thuật", "Nhân sự", "Đã rà soát"],
      ["Nhân sự mẫu B", "Kiểm tra hồ sơ bảo hiểm", "Nhân sự", "Chờ rà soát"],
      ["Bàn giao công việc mẫu", "Chuyển việc đang mở", "Quản lý bộ phận", "Chờ rà soát"],
    ] },
    admin: { name: "Quản trị", icon: "settings", fields: ["Danh mục", "Nội dung", "Phụ trách"], next: "Đã rà soát", rows: [
      ["Phân quyền theo công ty", "Kinh doanh, kỹ thuật, kho và kế toán", "Quản trị", "Chờ rà soát"],
      ["Phiên bản biểu mẫu", "Mẫu nội bộ theo công ty", "Chủ quy trình", "Chờ rà soát"],
      ["Nhập dữ liệu đầu kỳ", "Danh mục, số dư và tệp cần đối chiếu", "Kế toán / Chủ dữ liệu", "Chờ rà soát"],
    ] },
    reminders: { name: "Nhắc việc", icon: "bell", fields: ["Việc cần nhắc", "Mốc giả định", "Người nhận"], next: "Đã xử lý", rows: [
      ["Kiểm tra lịch giao hàng", "Trước mốc bàn giao 2 ngày", "Quản lý dự án", "Chờ xử lý"],
      ["Xác nhận hạn bảo hành", "Trước ngày hết hạn 7 ngày", "Chăm sóc khách hàng", "Chờ xử lý"],
      ["Nhắc sinh nhật mẫu", "Đến ngày đã cấu hình", "Nhân sự", "Chờ xử lý"],
      ["Đối chiếu công nợ đến hạn", "Trước hạn 3 ngày", "Kế toán", "Chờ xử lý"],
    ] },
  };
  const questions = [
    ["Q01","Dashboard HĐQT","Chỉ số nào cần xem theo công ty? Có giao dịch nội bộ cần loại khi tổng hợp quản trị không?"],
    ["Q02","Tài khoản và quyền","Ai duyệt đơn, chứng từ và quyền truy cập ở từng công ty? HĐQT được xem sâu tới mức nào?"],
    ["Q03","Hai bộ chứng từ","Gửi một bộ bán hàng và một bộ mua hàng – thanh toán đã che dữ liệu. Cho biết ai lập, duyệt và ký từng mẫu."],
    ["Q04","Hóa đơn, ký số và kế toán","Mỗi công ty đang dùng chế độ kế toán, nhà cung cấp hóa đơn điện tử và chữ ký số nào?"],
    ["Q05","Tạm ứng và triển khai","Mức ứng bao nhiêu thì được mở việc? Ai duyệt đơn gấp, bỏ bước hoặc phát sinh sau ký?"],
    ["Q06","Kho và giao từng đợt","Có dùng chung kho, điều chuyển nội bộ hoặc giao và nghiệm thu theo đợt? Ai ký nhận?"],
    ["Q07","Công nợ và bảo hành","Mốc nào phát sinh phải thu? “Nợ bảo hành” là tiền giữ lại, nghĩa vụ bảo hành hay cả hai?"],
    ["Q08","Cây PI và nhắc việc","Cây PI đang theo dõi điều gì? Mục “ZZZZZ” trong danh mục là loại nhắc nào?"],
    ["Q09","Dữ liệu và tài liệu gốc","Dữ liệu nào được nhập hoặc dùng chung? Cần lưu chứng từ, tệp ký và hồ sơ nhân sự theo chính sách nào?"],
  ];
  function initialState() {
    const orders = Object.entries(sampleRows).flatMap(([company, rows]) => rows.map((row, index) => {
      const [title, customer, total, step, paid, batches, type] = row;
      return {
        id: company + "-260" + (index + 1), company, title, customer, total, step, paid, batches, type,
        delivered: step >= 9 ? batches : 0, deposit: Math.round(total * .3), due: "2026-11-" + (20 + index),
        retention: index === 3 && company !== "NC" ? Math.round(total * .04) : 0,
        history: [{ label: "Khởi tạo hồ sơ minh họa", actor: "Hệ thống demo", at: "2026-11-16T09:00:00+07:00" }],
      };
    }));
    return { orders, packs: {}, checklists: {}, feedback: [] };
  }
  return { companies, stages, tracks, packs, modules, questions, initialState };
})();

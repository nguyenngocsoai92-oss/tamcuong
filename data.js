const DEMO = (() => {
  const companies = {
    TC: { name: "Tam Cường", initials: "TC", color: "#1d6956", focus: "Đơn hàng, tiến độ và bàn giao" },
    NC: { name: "Nam Cường", initials: "NC", color: "#345779", focus: "Đơn hàng, tiến độ và bàn giao" },
    HC: { name: "Hùng Cường", initials: "HC", color: "#875333", focus: "Đơn hàng, tiến độ và bàn giao" },
  };
  const stages = [
    { name: "Tiếp nhận", owner: "Kinh doanh", action: "Xác nhận tiếp nhận", input: ["Nhu cầu và thông tin đối tác", "Loại đơn hàng, thời hạn và người phụ trách"], task: "Đối chiếu đối tác, làm rõ phạm vi và chọn quy trình phù hợp.", gate: "Đã xác minh nhu cầu và giao người phụ trách.", output: "Phiếu tiếp nhận và mã hồ sơ", link: "partners" },
    { name: "Khảo sát", owner: "Kỹ thuật", action: "Xác nhận hiện trạng", input: ["Phiếu tiếp nhận", "Địa điểm, lịch và điều kiện tiếp cận"], task: "Đo đạc, chụp ảnh và ghi các giới hạn kỹ thuật.", gate: "Đã kiểm tra số đo, ảnh và điều kiện hiện trường.", output: "Biên bản khảo sát hiện trạng" },
    { name: "Thiết kế", owner: "Kỹ thuật / Quản lý dự án", action: "Chốt phương án", input: ["Biên bản khảo sát", "Yêu cầu kỹ thuật của khách hàng"], task: "Lập phương án, soát kỹ thuật và lấy xác nhận cho đúng phiên bản.", gate: "Đã lưu phiên bản được xác nhận.", output: "Bản vẽ chốt và xác nhận thiết kế" },
    { name: "Báo giá", owner: "Kinh doanh / Người duyệt giá", action: "Xác nhận báo giá", input: ["Phạm vi hoặc bản vẽ chốt", "Số lượng, đơn giá và điều kiện giao hàng"], task: "Lập báo giá, trình duyệt và lưu phản hồi của khách hàng.", gate: "Báo giá đã duyệt, còn hiệu lực và được khách hàng chấp thuận.", output: "Báo giá đã duyệt và xác nhận đặt hàng" },
    { name: "Hợp đồng", owner: "Kinh doanh / Người có thẩm quyền", action: "Xác nhận hợp đồng", input: ["Báo giá đã chấp thuận", "Thông tin pháp nhân, phạm vi và lịch thanh toán"], task: "Soạn, rà soát và lưu hợp đồng đã ký cùng các phụ lục.", gate: "Đã có bản ký, ngày hiệu lực và lịch thanh toán.", output: "Hợp đồng, phụ lục và các mốc thanh toán" },
    { name: "Tạm ứng", owner: "Kế toán / Người duyệt ngoại lệ", action: "Đối soát tạm ứng", input: ["Hợp đồng và đề nghị tạm ứng", "Chứng từ thu hoặc sao kê"], task: "So số thực nhận với mốc đã thỏa thuận và ghi nhận ngoại lệ nếu có.", gate: "Đủ mốc tạm ứng hoặc có tham chiếu phê duyệt ngoại lệ.", output: "Kết quả đối soát và điều kiện mở việc", link: "finance" },
    { name: "Mua hàng và kho", owner: "Mua hàng / Thủ kho", action: "Xác nhận sẵn sàng vật tư", input: ["Nhu cầu vật tư và tồn khả dụng", "Đề xuất mua và chứng từ nhận hàng nếu có"], task: "Giữ tồn, mua phần thiếu, kiểm hàng nhận và xác nhận xuất kho.", gate: "Đã kiểm tra nguồn vật tư và có chứng từ xuất hoặc giao phù hợp.", output: "Hồ sơ mua hàng và phiếu nhập, xuất kho", link: "inventory" },
    { name: "Sản xuất và thi công", owner: "Quản lý dự án / Đội triển khai", action: "Xác nhận hoàn thành", input: ["Bản vẽ hiệu lực và lệnh triển khai", "Vật tư đã cấp, lịch và tiêu chí chất lượng"], task: "Thực hiện, cập nhật tiến độ và xử lý kết quả kiểm tra chất lượng.", gate: "Đã hoàn thành phần việc và kiểm tra chất lượng.", output: "Phiếu triển khai và kết quả kiểm tra" },
    { name: "Giao hàng và nghiệm thu", owner: "Giao nhận / Quản lý dự án", action: "Ghi nhận đợt bàn giao", input: ["Kết quả kiểm tra và lịch giao", "Phiếu giao, khối lượng và người nhận"], task: "Ghi thực nhận, ký nghiệm thu, bàn giao hồ sơ và theo dõi phần cần khắc phục.", gate: "Có xác nhận theo từng đợt. Hoàn tất đủ đợt để chuyển bước.", output: "Phiếu giao, biên bản nghiệm thu và bàn giao", link: "reminders" },
    { name: "Thanh lý và công nợ", owner: "Kinh doanh / Kế toán", action: "Xác nhận thanh lý", input: ["Hợp đồng, phụ lục và biên bản bàn giao", "Số đã thu, phải thu và khoản giữ lại"], task: "Đối chiếu số liệu, ghi nhận thanh lý và giao người theo dõi khoản còn mở.", gate: "Đã đối chiếu số liệu và lưu nội dung thanh lý.", output: "Biên bản thanh lý và kết quả đối chiếu", link: "finance" },
    { name: "Bảo hành", owner: "Chăm sóc khách hàng", action: "Hoàn tất theo dõi bảo hành", input: ["Điều khoản bảo hành và hồ sơ bàn giao", "Danh sách yêu cầu và kết quả xử lý"], task: "Theo dõi thời hạn, giao người xử lý và xác nhận hoàn tất.", gate: "Đã xử lý yêu cầu còn mở và kiểm tra thời hạn.", output: "Hồ sơ bảo hành và lịch sử xử lý", link: "reminders" },
    { name: "Đã hoàn tất", owner: "Quản lý dự án", input: ["Hồ sơ giao dịch và lịch sử thực hiện"], task: "Tra cứu tài liệu theo mã hồ sơ và theo dõi nghĩa vụ còn mở nếu có.", output: "Hồ sơ lưu và nhật ký truy vết" },
  ];
  const tracks = {
    project: { label: "Sản xuất và thi công", path: [0,1,2,3,4,5,6,7,8,9,10,11] },
    direct: { label: "Bán hàng có sẵn", path: [0,3,4,5,6,8,9,10,11] },
  };
  const packs = {
    sales: {
      label: "Bán hàng và bàn giao", prefix: "BH",
      recipient: "Khách hàng",
      outward: ["bao-gia","hop-dong","tam-ung","giao","nghiem-thu","ban-giao","thanh-ly"],
      items: [
        ["bao-gia","Báo giá","Hồ sơ giao dịch",4], ["hop-dong","Hợp đồng","Hồ sơ giao dịch",5],
        ["tam-ung","Đề nghị tạm ứng","Hồ sơ giao dịch",6], ["giao","Phiếu giao hàng","Giao nhận",9],
        ["nghiem-thu","Biên bản nghiệm thu","Giao nhận",9], ["ban-giao","Biên bản bàn giao","Giao nhận",9],
        ["thanh-ly","Biên bản thanh lý","Hồ sơ giao dịch",10],
      ],
      evidence: "Đã kiểm tra tham chiếu hóa đơn điện tử bán ra theo tình huống demo.",
    },
    buying: {
      label: "Mua hàng – thanh toán", prefix: "MH",
      recipient: "Nhà cung cấp",
      outward: ["dat-mua","nhan"],
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

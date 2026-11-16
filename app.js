"use strict";

const {companies, stages, tracks, packs, modules, questions, initialState} = DEMO;
const app = document.querySelector("#app");
const modal = document.querySelector("#modal");
const storeKey = "tamcuong-demo-v1";
let savedLocally = true;
let data = readData();
let session = null;
let view = "home";
const initialSelection = () => ({company:"all",search:"",kind:"sales",order:null,track:"project",stage:null});
let selected = initialSelection();
let pendingRoute = null;
let timer;

const icons = {
  logo:'<path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"/><path d="m3 7 9 5 9-5M12 12v10M7.5 4.5l9 5"/>',
  board:'<path d="M3 20h18M5 16v-4m7 4V4m7 12V8"/>', grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>', back:'<path d="M20 12H5m6-6-6 6 6 6"/>',
  doc:'<path d="M6 2h9l4 4v16H6V2Z"/><path d="M14 2v5h5M9 12h7m-7 4h7"/>', wallet:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M21 10h-6a2 2 0 0 0 0 4h6"/>',
  box:'<path d="M12 2 3 7v10l9 5 9-5V7l-9-5ZM3 7l9 5 9-5m-9 5v10"/>',
  users:'<circle cx="9" cy="7" r="3"/><path d="M2 20v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2m1-16a3 3 0 0 1 0 6m4 10v-2a4 4 0 0 0-3-4"/>',
  settings:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
  bell:'<path d="M5 17h14l-2-3V9a5 5 0 1 0-10 0v5l-2 3Zm5 4h4"/>',
  message:'<path d="M4 4h16v13h-9l-7 4V4Zm4 5h8m-8 4h5"/>',
  check:'<path d="m5 12 4 4L19 6"/>', plus:'<path d="M5 12h14M12 5v14"/>', close:'<path d="m6 6 12 12M6 18 18 6"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  down:'<path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  link:'<path d="M10 13a4 4 0 0 0 6 .5l4-4a4 4 0 0 0-6-6l-2 2m2 5a4 4 0 0 0-6-.5l-4 4a4 4 0 0 0 6 6l2-2"/>',
  steps:'<path d="M4 20h4v-5h5v-5h5V5h3M6 7h2m-2 4h2"/>',
};
function icon(name) {
  return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.doc}</svg>`;
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
}
function readData() {
  try {
    const stored = JSON.parse(localStorage.getItem(storeKey));
    if (stored && Array.isArray(stored.orders) && stored.packs && stored.checklists && Array.isArray(stored.feedback)) return stored;
  } catch (_) { /* Storage may be unavailable on a local preview. */ }
  return initialState();
}
function save() {
  try { localStorage.setItem(storeKey, JSON.stringify(data)); }
  catch (_) { savedLocally = false; }
}
function notify(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(timer);
  timer = setTimeout(() => toast.classList.remove("visible"), 4200);
}
const number = new Intl.NumberFormat("vi-VN");
const money = (amount) => number.format(amount) + " ₫";
const million = (amount) => number.format(Math.round(amount / 100000) / 10) + " tr";
const date = (value) => value ? new Intl.DateTimeFormat("vi-VN",{dateStyle:"short",timeZone:"Asia/Ho_Chi_Minh"}).format(new Date(value)) : "—";
const when = (value) => new Intl.DateTimeFormat("vi-VN",{dateStyle:"short",timeStyle:"short",timeZone:"Asia/Ho_Chi_Minh"}).format(new Date(value));
const chip = (value, type = "") => `<span class="chip ${type}">${esc(value)}</span>`;
function btn(text, action, options = {}) {
  return `<button type="button" class="btn ${options.style || ""}" data-action="${action}"${options.value === undefined ? "" : ` data-value="${esc(options.value)}"`}${options.disabled ? " disabled" : ""}>${options.icon ? icon(options.icon) : ""}${esc(text)}</button>`;
}
function linkBtn(text, route, options = {}) {
  return `<a class="btn ${options.style || "light"}" href="#${route}" data-route="${route}">${options.icon ? icon(options.icon) : ""}${esc(text)}</a>`;
}
const companyRoute = (id) => "cong-ty/" + id;
const orderRoute = (o, board = false) => (board ? "hdqt" : companyRoute(o.company)) + "/ho-so/" + encodeURIComponent(o.id);
const packRoute = (o, kind = "sales") => "ke-toan/" + o.company + "/ho-so/" + encodeURIComponent(o.id) + "/" + (kind==="sales" ? "ban-hang" : "mua-hang");
const viewSlug = {
  dashboard:"tong-quan", orders:"ho-so", process:"quy-trinh", pi:"bao-cao",
  partners:"doi-tac", inventory:"mua-hang-kho", finance:"tai-chinh",
  people:"nhan-su", admin:"quan-tri", reminders:"nhac-viec", feedback:"gop-y",
};
const viewForSlug = Object.fromEntries(Object.entries(viewSlug).map(([key,value]) => [value,key]));
function secureOrder(id) {
  return data.orders.find((order) => order.id === id && session && (session.area === "board" || order.company === session.company));
}
function listOrders(company) {
  if (!session) return [];
  const scope = session.area === "board" ? company : session.company;
  return data.orders.filter((item) => scope === "all" || item.company === scope);
}
function canWork(order) { return order && session?.area === "company" && order.company === session.company; }
function canAccount(order) { return order && session?.area === "accounting" && order.company === session.company; }
function companyName(id) { return companies[id]?.name || "Cả ba công ty"; }
function stageLabel(order) { return order.paused ? "Tạm dừng" : stages[order.step].name; }
function stateChip(order) { return chip(stageLabel(order), order.paused || order.step === 5 ? "warn" : ""); }
function totalValue(orders) { return orders.reduce((sum, item) => sum + (item.step >= 5 ? item.total : 0), 0); }
function openBalance(order) { return order.step >= 5 ? Math.max(0, order.total - order.paid) : 0; }
function section(title, content, subtitle = "", actions = "") {
  return `<section class="panel"><div class="panel-heading"><div><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ""}</div>${actions}</div>${content}</section>`;
}
function header() {
  return `<header class="header"><div class="wrap header-row">
    <a class="brand" href="#trang-chu" data-action="home" aria-label="Tam Cường, về trang chủ"><span class="mark">${icon("logo")}</span><span>Tam Cường<small>Điều hành doanh nghiệp</small></span></a>
    <div class="header-actions"><span class="badge">Dữ liệu minh họa</span>${session ? btn("Đổi khu làm việc","home",{style:"light",icon:"back"}) : linkBtn("Góp ý nghiệp vụ","gop-y",{style:"light",icon:"message"})}</div>
  </div></header>`;
}
function portal(id, title, description, graphic) {
  const route = id === "board" ? "hdqt" : id === "accounting" ? "ke-toan" : companyRoute(id);
  return `<a class="portal" href="#${route}" data-route="${route}" data-value="${id}">
    <div class="portal-top"><span style="--portal:${companies[id]?.color || "#245a45"}">${graphic}</span>${icon("arrow")}</div>
    <div class="portal-bottom"><div><h3>${title}</h3><p>${description}</p></div></div>
  </a>`;
}
function home() {
  return `<main id="content" class="wrap home">
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-copy"><div class="kicker">Tam Cường · Nam Cường · Hùng Cường</div><h1 id="hero-title">Cổng điều hành<br>doanh nghiệp</h1><p>Quản lý đơn hàng, theo dõi tiến độ và gửi bộ chứng từ từ cùng một hồ sơ nghiệp vụ.</p>
    <a class="btn hero-cta" href="#khu-lam-viec">Chọn khu làm việc ${icon("arrow")}</a></div>
    <div class="hero-picture" aria-hidden="true"></div>
  </section>
  <section id="khu-lam-viec" class="access-section" aria-labelledby="access-title">
    <div class="section-head"><div><h2 id="access-title">Khu làm việc</h2></div></div>
    <div class="portal-grid">
      ${portal("board","Báo cáo HĐQT","Tổng hợp kết quả và tiến độ theo công ty.",icon("board"))}
      ${Object.entries(companies).map(([id,c]) => portal(id,"Công ty " + c.name,c.focus,c.initials)).join("")}
    </div>
    <a class="account-portal" href="#ke-toan" data-route="ke-toan" data-value="accounting">
      <span class="account-mark">${icon("mail")}</span><span><strong>Dành cho kế toán</strong><small>Lập, duyệt và gửi bộ chứng từ theo từng công ty.</small></span><span class="account-go">Mở khu kế toán ${icon("arrow")}</span>
    </a>
  </section>
  <footer class="foot"><span>Bản demo · Thay đổi được lưu trên trình duyệt này.</span>${linkBtn("Các câu hỏi cần xác nhận","gop-y",{style:"quiet",icon:"arrow"})}</footer></main>`;
}
function heading(title, description, actions = "") {
  const scope = session?.area === "board" ? "Hội đồng quản trị" : session?.area === "accounting" ? "Kế toán / " + companyName(session.company) : session ? "Công ty " + companyName(session.company) : "Góp ý và xác nhận";
  return `<header class="work-head"><div><div class="kicker">${esc(scope)}</div><h1>${title}</h1>${description ? `<p>${description}</p>` : ""}</div><div class="actions">${actions}</div></header>`;
}
function navItem(id, label, graphic) {
  const active = view === id || (view === "detail" && id === "orders");
  const root = session?.area === "board" ? "hdqt" : session?.area === "company" ? companyRoute(session.company) : "";
  const href = id==="feedback" ? "gop-y" : id==="accounting" ? "ke-toan/"+session.company : root+"/"+viewSlug[id];
  return `<a class="nav ${active ? "active" : ""}" href="#${href}" data-route="${href}" ${active?'aria-current="page"':""}>${icon(graphic)}${label}</a>`;
}
function workspace(body) {
  let nav = "";
  if (session?.area === "board") nav = navItem("dashboard","Báo cáo điều hành","board") + navItem("orders","Đơn hàng","box") + navItem("pi","Báo cáo và Cây PI","grid");
  if (session?.area === "company") nav = navItem("dashboard","Tổng quan","board") + navItem("orders","Đơn hàng và dự án","box") + navItem("process","Quy trình nghiệp vụ","steps") + Object.entries(modules).map(([id, entry]) => navItem(id,entry.name,entry.icon)).join("") + navItem("pi","Báo cáo và Cây PI","grid");
  if (session?.area === "accounting") nav = navItem("accounting","Hồ sơ chứng từ","doc");
  return `<div class="workspace"><nav class="side" aria-label="Khu làm việc"><p>${session?.account || "Bản demo"}</p>${nav}${navItem("feedback","Góp ý & xác nhận","message")}</nav><main class="work" id="content">${body}${savedLocally ? "" : '<p class="notice warn">Trình duyệt đang chặn lưu dữ liệu. Thay đổi chỉ tồn tại trong phiên mở này.</p>'}</main></div>`;
}
function table(headers, rows) {
  return `<div class="table-scroll"><table><thead><tr>${headers.map((name) => `<th scope="col">${esc(name)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.join("") : `<tr><td colspan="${headers.length}" class="empty">Chưa có dữ liệu phù hợp.</td></tr>`}</tbody></table></div>`;
}
function orderTable(orders, short = false) {
  const visible = short ? orders.slice(0,5) : orders;
  return table(["Hồ sơ", "Công ty", "Đang ở bước", "Giá trị mẫu", ""], visible.map((order) => `<tr>
    <td><strong>${esc(order.title)}</strong><small>${esc(order.id)} · ${esc(order.customer)}</small></td>
    <td>${companyName(order.company)}</td><td>${stateChip(order)}</td><td class="text-right">${money(order.total)}</td>
    <td>${linkBtn("Mở hồ sơ",orderRoute(order,session.area==="board"),{style:"light compact",icon:"arrow"})}</td></tr>`));
}
function orgPicker() {
  return session.area === "board" ? `<label class="field">Công ty<select class="input picker" id="board-company">${[["all","Cả ba công ty"],...Object.entries(companies).map(([k,v])=>[k,v.name])].map(([id,label])=>`<option value="${id}" ${selected.company===id?"selected":""}>${label}</option>`).join("")}</select></label>` : "";
}
function dashboard() {
  const orders = listOrders(selected.company);
  const board = session.area === "board";
  const scoped = board && selected.company === "all" ? Object.keys(companies) : [board ? selected.company : session.company];
  const cards = [
    ["Đơn đang theo dõi",orders.filter((o)=>o.step<11).length,"Gồm các hồ sơ chờ duyệt","box"],
    ["Giá trị hợp đồng",million(totalValue(orders)),"Hồ sơ đã qua bước hợp đồng","doc"],
    ["Đã thu",million(orders.reduce((sum,o)=>sum+o.paid,0)),"Theo số thực nhận demo","wallet"],
    ["Số còn phải thu",million(orders.reduce((sum,o)=>sum+openBalance(o),0)),"Gồm số giữ lại nếu có","board"],
  ];
  const stats = scoped.map((id)=>[companyName(id),totalValue(orders.filter((o)=>o.company===id))]);
  const peak = Math.max(1,...stats.map((x)=>x[1]));
  const waiting = orders.filter((o)=>o.paused||[3,5,8,9].includes(o.step)).slice(0,5);
  return heading(board ? "Báo cáo điều hành" : "Tổng quan " + companyName(session.company),
    board ? "Số liệu quản trị minh họa theo công ty. Giá trị tổng là cộng gộp các công ty được chọn." : "Tiến độ, thu tiền và các mốc cần theo dõi tại công ty.",
    orgPicker() + (board ? "" : linkBtn("Xem quy trình",companyRoute(session.company)+"/quy-trinh",{icon:"steps"})+btn("Tạo đơn hàng","new-order",{icon:"plus"}))) +
    `<div class="kpis">${cards.map(([label,value,context,graphic])=>`<article class="kpi"><span>${label}${icon(graphic)}</span><strong>${value}</strong><small>${context}</small></article>`).join("")}</div>
    <div class="duo"><section class="panel panel-pad"><h2>Giá trị hợp đồng theo công ty</h2><div class="bars">${stats.map(([label,value])=>`<div><div class="bar-label"><span>${label}</span><span>${money(value)}</span></div><div class="bar" aria-hidden="true"><i style="width:${value*100/peak}%"></i></div></div>`).join("")}</div></section>
    <section class="panel panel-pad"><h2>Việc cần theo dõi</h2><ul class="sublist">${waiting.length ? waiting.map((o)=>`<li>${btn(o.id,"order",{value:o.id,style:"quiet compact"})} ${esc(stageLabel(o))}<small>${companyName(o.company)} · Mốc demo ${date(o.due)}</small></li>`).join("") : "<li>Chưa có việc chờ ở các mốc đang theo dõi.</li>"}</ul></section></div>` +
    section("Đơn hàng gần đây",orderTable(orders,true),"",btn("Tất cả đơn hàng","nav",{value:"orders",style:"light compact",icon:"arrow"}));
}
function ordersPage() {
  const source = listOrders(selected.company);
  const filter = selected.search.toLocaleLowerCase("vi");
  const rows = source.filter((o) => [o.id,o.title,o.customer,stageLabel(o)].some((v)=>v.toLocaleLowerCase("vi").includes(filter)));
  return heading("Đơn hàng và dự án","Theo dõi từng hồ sơ từ tiếp nhận đến bảo hành.",orgPicker()+(session.area==="company"?btn("Tạo đơn hàng","new-order",{icon:"plus"}):"")) +
    section("Danh sách hồ sơ",orderTable(rows),`${rows.length} hồ sơ`,`<form id="order-search" class="actions"><input class="input picker" name="search" aria-label="Tìm hồ sơ" placeholder="Mã đơn, tên hoặc bước" value="${esc(selected.search)}"><button class="btn light" type="submit">Tìm</button>${selected.search ? btn("Xóa bộ lọc","clear-search",{style:"quiet compact"}) : ""}</form>`);
}
function stageContent(stage) {
  return `<dl class="stage-content">
    <div><dt>Đầu vào</dt><dd><ul>${stage.input.map((item)=>`<li>${esc(item)}</li>`).join("")}</ul></dd></div>
    <div><dt>Thực hiện</dt><dd>${esc(stage.task)}</dd></div>
    <div><dt>Đầu ra</dt><dd>${esc(stage.output)}</dd></div>
  </dl>`;
}
function processPage() {
  const track = tracks[selected.track];
  const root = companyRoute(session.company);
  return heading("Quy trình nghiệp vụ","Chọn loại đơn hàng để xem người phụ trách, điều kiện chuyển bước và hồ sơ đầu ra.",
    linkBtn("Danh sách hồ sơ",root+"/ho-so",{icon:"box"}))+
    `<div class="track-picker" role="group" aria-label="Loại quy trình">
    ${Object.entries(tracks).map(([id,t])=>`<button type="button" class="${selected.track===id?"active":""}" data-action="track" data-value="${id}" aria-pressed="${selected.track===id}">${t.label}</button>`).join("")}</div>
    <div class="process-list">${track.path.map((index,i)=>{
      const stage=stages[index];
      return `<details class="panel process-stage"${i===0?" open":""}><summary><span class="stage-number">${String(i+1).padStart(2,"0")}</span><span><strong>${stage.name}</strong><small>${stage.owner}</small></span><span class="summary-chevron" aria-hidden="true">+</span></summary>
      <div class="process-body">${stageContent(stage)}${stage.gate?`<p class="gate-line"><strong>Điều kiện chuyển bước</strong> ${esc(stage.gate)}</p>`:""}
      ${stage.link? linkBtn(modules[stage.link].name,root+"/"+viewSlug[stage.link],{style:"quiet compact",icon:"arrow"}):""}</div></details>`;
    }).join("")}</div>`;
}
function detail() {
  const o = secureOrder(selected.order);
  if (!o) return heading("Hồ sơ chưa có trong phạm vi","Chọn lại hồ sơ từ danh sách.",btn("Danh sách","nav",{value:"orders",style:"light"}));
  const stage = stages[o.step];
  const active = canWork(o);
  const track = tracks[o.type];
  const inspected = track.path.includes(selected.stage) ? selected.stage : o.step;
  const readStage = stages[inspected];
  const root = session.area==="board" ? "hdqt" : companyRoute(o.company);
  const received = o.records?.[inspected];
  const previousIndex = track.path[track.path.indexOf(inspected)-1];
  const previous = o.records?.[previousIndex];
  return heading(esc(o.title),`${esc(o.id)} · ${companyName(o.company)} · ${esc(o.customer)} · ${track.label}`,linkBtn("Danh sách hồ sơ",root+"/ho-so",{icon:"back"}))+
    `<div class="kpis">
    <article class="kpi"><span>Giá trị hồ sơ</span><strong>${million(o.total)}</strong><small>Giá trị mẫu</small></article>
    <article class="kpi"><span>Đã nhận</span><strong>${million(o.paid)}</strong><small>Dự kiến ứng ${money(o.deposit)}</small></article>
    <article class="kpi"><span>Còn phải thu</span><strong>${million(openBalance(o))}</strong><small>Giữ lại mẫu ${money(o.retention)}</small></article>
    <article class="kpi"><span>Đợt đã bàn giao</span><strong>${o.delivered}/${o.batches}</strong><small>Mốc theo dõi ${date(o.due)}</small></article></div>
    <section class="panel panel-pad"><h2>Quy trình hồ sơ</h2><div class="timeline">${track.path.map((index,i)=>`<button type="button" data-action="inspect-stage" data-value="${index}" aria-pressed="${index===inspected}" class="step ${index===o.step?"current":index<o.step?"done":""}"><span>${index<o.step ? icon("check") : String(i+1).padStart(2,"0")}</span>${stages[index].name}</button>`).join("")}</div></section>
    <div class="detail-grid"><section class="panel panel-pad gate">
    <div class="detail-stage-title"><div><div class="kicker">${inspected===o.step?"Bước hiện tại":"Chi tiết bước"}</div><h2>${esc(readStage.name)}</h2><p class="muted">${esc(readStage.owner)}</p></div>${o.paused&&inspected===o.step?chip("Tạm dừng","warn"):""}</div>
    ${stageContent(readStage)}${readStage.gate?`<p class="gate-line"><strong>Điều kiện chuyển bước</strong> ${esc(readStage.gate)}</p>`:""}
    ${previous?`<p class="gate-line"><strong>Đầu ra tiếp nhận từ bước trước</strong> ${esc(previous.reference)} ${btn("Xem bước trước","inspect-stage",{value:previousIndex,style:"quiet compact",icon:"back"})}</p>`:""}
    ${received?`<p class="gate-line"><strong>Hồ sơ đã ghi</strong> ${esc(received.reference)} · ${when(received.at)}</p>`:""}
    ${inspected===8?`<p>Đã xác nhận ${o.delivered}/${o.batches} đợt bàn giao.</p>`:""}
    <div class="actions">
    ${active && inspected===o.step && o.step<11 ? (o.paused ? btn("Tiếp tục xử lý","resume",{value:o.id}) : btn(stage.action,"advance",{value:o.id,icon:"check"})+btn("Tạm dừng","pause",{value:o.id,style:"light"})) : ""}
    ${active && readStage.link ? linkBtn(modules[readStage.link].name,root+"/"+viewSlug[readStage.link],{style:"light",icon:"arrow"}) : ""}</div>
    </section>
    <div><section class="panel panel-pad related"><h2>Hồ sơ liên quan</h2><ul class="sublist">
    ${Object.entries(packs).map(([key,pack])=>`<li>${linkBtn(pack.label,packRoute(o,key),{style:"quiet compact",icon:"link"})}<small>${packStatus(data.packs[packKey(o,key)]?.status)}</small></li>`).join("")}
    </ul></section><section class="panel panel-pad"><h2>Nhật ký nghiệp vụ</h2><ul class="sublist">${o.history.slice().reverse().slice(0,6).map((entry)=>`<li>${esc(entry.label)}<small>${esc(entry.actor)} · ${when(entry.at)}</small></li>`).join("")}</ul></section></div></div>`;
}
function modulePage(key) {
  const module = modules[key];
  const entries = data.checklists[session.company + ":" + key] || {};
  return heading(module.name,"Danh sách mẫu theo phạm vi công ty.",linkBtn("Hồ sơ nghiệp vụ",companyRoute(session.company)+"/ho-so",{icon:"box"}))+
    section("Danh sách theo dõi",table([...module.fields,"Trạng thái",""],module.rows.map(([name,info,owner,status],i) => {
      const latest = entries[i];
      return `<tr><td><strong>${name}</strong></td><td>${info}</td><td>${owner}</td><td>${chip(latest?.status || status, (latest?.status || status).startsWith("Đã")?"":"warn")}${latest ? `<small>${when(latest.at)}</small>` : ""}</td><td>${btn("Xác nhận","check-module",{value:i,style:"light compact",disabled:!!latest || status.startsWith("Đã")})}</td></tr>`;
    })),"Có thể xác nhận một dòng để xem cách ghi nhận trạng thái.");
}
function piPage() {
  const orders = listOrders(selected.company);
  const delivered = orders.filter((o)=>o.delivered===o.batches);
  const groups = [...new Set(orders.map(o=>o.customer))];
  return heading("Báo cáo và Cây PI","Các chỉ số minh họa để khách hàng xác nhận định nghĩa và người được xem.",orgPicker())+
    `<div class="notice">“Cây PI” đang chờ xác nhận ý nghĩa, cấu trúc theo đối tác hoặc nhân viên và cách tính.</div>`+
    section("Báo cáo quản trị theo khách hàng",table(["Khách hàng","Số hồ sơ","Giá trị hợp đồng","Còn phải thu"],groups.map((name)=>{
      const subset=orders.filter((o)=>o.customer===name);
      return `<tr><td>${esc(name)}</td><td>${subset.length}</td><td>${money(totalValue(subset))}</td><td>${money(subset.reduce((n,o)=>n+openBalance(o),0))}</td></tr>`;
    })))+
    section("Báo cáo quản trị theo nhà cung cấp",table(["Đơn vị","Nhà cung cấp","Số bộ mua đã duyệt","Tổng giá trị mua mẫu"],Object.keys(companies)
      .filter((id)=>session.area==="board" ? selected.company==="all"||id===selected.company : id===session.company)
      .map((id)=>{
        const snapshots=orders.filter((o)=>o.company===id).map((o)=>data.packs[packKey(o,"buying")])
          .filter((bundle)=>bundle?.status==="approved").map((bundle)=>bundle.snapshot);
        return `<tr><td>${companyName(id)}</td><td>Nhà cung cấp mẫu A</td><td>${snapshots.length}</td><td>${money(snapshots.reduce((sum,o)=>sum+Math.round(o.total*.38),0))}</td></tr>`;
      })),"Hiển thị theo bộ mua mẫu đã duyệt.")+
    section("Chỉ tiêu bàn giao minh họa",`<div class="panel-pad muted">Hồ sơ đã giao đủ đợt trên số hồ sơ đã ký hợp đồng: <strong>${delivered.length}/${orders.filter(o=>o.step>=5).length}</strong>.</div>`);
}

function packKey(order, kind) { return order.company + ":" + order.id + ":" + kind; }
function packStatus(value) {
  return { draft: "Bản nháp", pending: "Chờ duyệt", approved: "Đã duyệt", returned: "Trả bổ sung" }[value] || "Chưa lập";
}
function packHistory(bundle) {
  return bundle?.history?.slice().reverse().map((item)=>`<li>${esc(item.label)}<small>${esc(item.actor)} · ${when(item.at)}</small></li>`).join("") || "<li>Chưa có thao tác.</li>";
}
function packMilestones(bundle) {
  const states = [
    ["Lập hồ sơ",!!bundle],
    ["Kiểm tra và duyệt",bundle?.status==="approved"],
    ["Gửi hồ sơ qua email",!!bundle?.dispatches?.length],
  ];
  const next = states.findIndex(([,done])=>!done);
  return `<ol class="pack-milestones">${states.map(([label,done],i)=>`<li class="${done?"done":i===next?"current":""}"><span>${done?icon("check"):i+1}</span>${label}</li>`).join("")}</ol>`;
}
function accountingPage() {
  const list = listOrders(session.company);
  if (!list.length) return heading("Bộ chứng từ","Công ty chưa có hồ sơ mẫu để lập bộ chứng từ.");
  const o = list.find((item)=>item.id===selected.order) || list.find((item)=>item.step>=10) || list[0];
  const kind = selected.kind;
  const pack = packs[kind];
  const bundle = data.packs[packKey(o,kind)];
  const locked = ["pending","approved"].includes(bundle?.status);
  const reviewer = session.role === "reviewer";
  const chosen = new Set(bundle?.docs ?? pack.items.filter((item)=>o.step>=item[3]).map((item)=>item[0]));
  const controls = `<div class="form-grid"><label class="field">Hồ sơ nghiệp vụ
      <select class="input" id="account-order">${list.map((item)=>`<option value="${esc(item.id)}" ${item.id===o.id?"selected":""}>${esc(item.id + " · " + item.title)}</option>`).join("")}</select></label>
    <label class="field">Loại bộ chứng từ<select class="input" id="pack-kind">${Object.entries(packs).map(([k,p])=>`<option value="${k}" ${k===kind?"selected":""}>${p.label}</option>`).join("")}</select></label></div>`;
  const documents = pack.items.map(([id,label,labelType,minimum])=>{
    const ready = o.step >= minimum || (locked && chosen.has(id));
    return `<div class="document"><label><input type="checkbox" name="doc" value="${id}" ${chosen.has(id) && ready?"checked":""} ${!ready||locked||reviewer?"disabled":""}> <span>${label} <small>${ready?labelType:"Chờ hồ sơ đầu ra"}</small></span></label>${btn("Xem chứng từ","document",{value:id,style:"light compact",disabled:!ready})}</div>`;
  }).join("");
  const actions = reviewer
    ? (bundle?.status==="pending" ? btn("Yêu cầu bổ sung","return-pack",{style:"light"})+btn("Duyệt hồ sơ","approve-pack",{icon:"check"}) : "")
    : (!locked ? '<button type="submit" class="btn light" name="intent" value="draft">Lưu bản nháp</button><button type="submit" class="btn" name="intent" value="submit">Gửi phê duyệt</button>' : "");
  const lastDispatch = bundle?.dispatches?.at(-1);
  const emailAction = bundle?.status==="approved" && !reviewer
    ? btn(lastDispatch ? "Soạn lại email" : "Soạn email gửi hồ sơ","compose-email",{icon:"mail"})
    : "";
  return heading("Hồ sơ chứng từ",`Công ty ${companyName(session.company)} · ${reviewer?"Người duyệt hồ sơ":"Người lập và gửi hồ sơ"}.`,
    btn(reviewer ? "Đổi sang người lập" : "Đổi sang người duyệt","account-signin",{style:"light",value:reviewer?"maker":"reviewer"}))+
    `${packMilestones(bundle)}
    <div class="pack-grid"><section class="panel panel-pad"><h2>Danh mục chứng từ</h2>${controls}
    <div class="pack-meta"><div class="actions">${chip(packStatus(bundle?.status),bundle?.status==="returned"?"warn":"")}${stateChip(o)}</div>${linkBtn("Mở hồ sơ nguồn",orderRoute(o),{style:"quiet compact",icon:"link"})}</div>
    <form id="pack-form" data-order="${esc(o.id)}">
      <div class="checklist">${documents}</div>
      <label class="check"><input type="checkbox" name="evidence" ${bundle?.evidence?"checked":""} ${locked||reviewer?"disabled":""}> ${pack.evidence}</label>
      ${!locked?'<p class="muted">Kiểm tra đủ chứng từ và xác nhận đối soát trước khi gửi phê duyệt.</p>':""}
      <p class="error" id="pack-error" aria-live="polite"></p>
      <div class="actions">${actions}${bundle?.status==="approved" ? btn("Tải bộ hồ sơ nội bộ","download-pack",{icon:"down",style:"light"}) : ""}</div>
    </form></section>
    <div>
    <section class="panel panel-pad dispatch-panel"><div class="dispatch-icon">${icon("mail")}</div><h2>Email gửi hồ sơ</h2>
    <p class="muted">${bundle?.status==="approved"?(reviewer?"Người lập hồ sơ có thể soạn thư sau khi duyệt.":"Kiểm tra người nhận và chứng từ đính kèm trước khi gửi thử."):"Tính năng soạn email mở sau khi hồ sơ được duyệt."}</p>
    ${emailAction?`<div class="actions dispatch-actions">${emailAction}</div>`:""}
    ${lastDispatch?`<ul class="sublist"><li>${chip("Đã mô phỏng gửi")}<small>${esc(lastDispatch.recipient)} · ${when(lastDispatch.at)}</small></li></ul>`:""}
    </section><section class="panel panel-pad"><h2>Nhật ký xử lý</h2><ul class="sublist">${packHistory(bundle)}</ul>
    <hr class="rule"><h2>Hồ sơ nguồn</h2><ul class="sublist"><li>${esc(o.id)} · ${esc(o.title)}<small>${companyName(o.company)} · ${pack.label}</small></li></ul></section></div></div>`;
}
function currentPack() {
  if (session?.area !== "accounting") return {};
  const list = listOrders(session.company);
  const order = secureOrder(selected.order) || list.find((item)=>item.step>=10) || list[0];
  if (!canAccount(order)) return {};
  const key = packKey(order, selected.kind);
  return {order, key, bundle:data.packs[key], template:packs[selected.kind]};
}
function documentDetails(order, item, bundle) {
  const [id,title] = item;
  const beingBought = selected.kind === "buying";
  const subject = beingBought ? "Nhà cung cấp mẫu A" : order.customer;
  const source = bundle?.snapshot ?? order;
  const samplePurchase = Math.round(source.total * .38);
  let facts;
  if (beingBought) facts = ["nhan","nhap"].includes(id)
    ? [["Kết quả kiểm hàng mẫu","Theo hồ sơ mua và phiếu nhận"]]
    : [["Giá trị mua minh họa",money(samplePurchase)]];
  else if (["giao","nghiem-thu","ban-giao"].includes(id)) facts = [["Tiến độ bàn giao",source.delivered+"/"+source.batches+" đợt"]];
  else if (id==="tam-ung") facts = [["Mốc tạm ứng minh họa",money(source.deposit)],["Tổng số đã thu",money(source.paid)]];
  else if (id==="thanh-ly") facts = [["Giá trị hồ sơ",money(source.total)],["Đã thu",money(source.paid)],
    ["Số còn phải thu",money(openBalance(source))],["Trong đó giữ lại theo hồ sơ",money(source.retention)]];
  else facts = [["Giá trị hồ sơ minh họa",money(source.total)]];
  const sourceStage = Math.max(0,item[3]-1);
  const sourceReference = source.records?.[sourceStage]?.reference || (source.step>=item[3] ? source.id + "-B" + String(sourceStage+1).padStart(2,"0") : "Chờ hồ sơ đầu ra");
  return { title, rows:[
    ["Số hiệu mẫu",`DEMO-${order.id}-${packs[selected.kind].prefix}-${item[0].toUpperCase()}`],
    ["Ngày lập bộ mẫu",date(bundle?.createdAt || "2026-11-16")],
    ["Công ty lập",companyName(order.company) + " (minh họa)"], ["Đối tác",subject+" (giả định)"],
    ["Hồ sơ liên quan",source.id+" · "+source.title], ["Tham chiếu hồ sơ nguồn",sourceReference], ["Nội dung",title+" cho hồ sơ "+source.id],
    ...facts,
    ["Người lập",bundle?.maker || "Chờ lập"], ["Người duyệt",bundle?.reviewer || "Chờ duyệt"],
    ["Chữ ký", "Chỗ dành cho người có thẩm quyền ký khi sử dụng mẫu thật"],
  ] };
}
function documentMarkup(order, item, bundle) {
  const {title,rows} = documentDetails(order,item,bundle);
  return `<article class="preview-paper">${chip("BẢN MẪU · DỮ LIỆU GIẢ ĐỊNH","warn")}<h3>${esc(title)}</h3>
  <hr class="rule">${rows.map(([label,value])=>`<p><strong>${esc(label)}</strong> · ${esc(value)}</p>`).join("")}</article>`;
}
function documentFile(order,item,bundle) {
  const {title,rows} = documentDetails(order,item,bundle);
  return `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title>
  <style>body{max-width:760px;margin:40px auto;padding:0 20px;font:14px/1.55 Arial,sans-serif;color:#192b25}header{border-top:5px solid #1d624e;border-bottom:1px solid #d3dfd5;padding:17px 0 12px}h1{font-size:30px;letter-spacing:-.02em;margin:8px 0 0}dl>div{display:grid;grid-template-columns:minmax(140px,31%) 1fr;gap:10px;padding:9px 2px;border-bottom:1px solid #e3eae4;break-inside:avoid}dt{font-weight:bold;color:#345b4b}dd{margin:0;overflow-wrap:anywhere}.demo{font-size:11px;color:#754516;font-weight:bold;font-variant:small-caps}.company{font-size:12px;color:#376451;font-weight:bold}footer{margin-top:22px;color:#506359;font-size:12px}@media(max-width:520px){dl>div{grid-template-columns:1fr;gap:2px}}@media print{body{margin:0}footer{color:#333}}</style>
  <header><div class="company">Công ty ${esc(companyName(order.company))}</div><div class="demo">BẢN MẪU · DỮ LIỆU GIẢ ĐỊNH · DÙNG ĐỂ RÀ SOÁT</div><h1>${esc(title)}</h1></header>
  <dl>${rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
  <footer>Tệp HTML mẫu. Hồ sơ chính thức cần mẫu đã chốt, thông tin pháp nhân, chứng từ gốc và chữ ký theo thẩm quyền.</footer></html>`;
}
function triggerDownload(blob,name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download=name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function zip(files) {
  const encoding = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  const checksum = (value) => {
    let crc = 0xffffffff;
    for (const byte of value) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };
  function bytes(length, fields) {
    const array = new Uint8Array(length);
    const view = new DataView(array.buffer);
    for (const [index,value,wide] of fields) {
      if (wide) view.setUint32(index,value,true);
      else view.setUint16(index,value,true);
    }
    return array;
  }
  for (const [filename, content] of files) {
    const name = encoding.encode(filename);
    const input = encoding.encode(content);
    const crc = checksum(input);
    const header = bytes(30,[[0,0x04034b50,1],[4,20],[6,0x0800],[12,0x5d70],[14,crc,1],[18,input.length,1],[22,input.length,1],[26,name.length]]);
    chunks.push(header,name,input);
    central.push(bytes(46,[[0,0x02014b50,1],[4,20],[6,20],[8,0x0800],[14,0x5d70],[16,crc,1],[20,input.length,1],[24,input.length,1],[28,name.length],[42,offset,1]]),name);
    offset += header.length + name.length + input.length;
  }
  const centralSize = central.reduce((n,b)=>n+b.length,0);
  const end = bytes(22,[[0,0x06054b50,1],[8,files.length],[10,files.length],[12,centralSize,1],[16,offset,1]]);
  return new Blob([...chunks,...central,end],{type:"application/zip"});
}
function packageFiles(order,bundle,template,external = false) {
  const docs = template.items.filter(([id])=>bundle.docs.includes(id) && (!external || template.outward.includes(id)));
  const manifest = {
    label:"Dữ liệu minh họa", company:companyName(order.company), order:order.id,
    kind:template.label, ...(!external ? {preparedBy:bundle.maker, approvedBy:bundle.reviewer, approvedAt:bundle.approvedAt, referencesChecked:bundle.evidence} : {}),
    files:docs.map((item)=>item[0]+".html"),
  };
  const rendered = external ? {...bundle, maker:"Bộ phận kế toán",reviewer:"Người có thẩm quyền"} : bundle;
  return {
    names: docs.map(([id,label])=>[id+".html",label]),
    filename:`DEMO-${order.id}-${template.prefix}${external?"-gui-doi-tac":""}.zip`,
    blob:zip([["danh-muc.json",JSON.stringify(manifest,null,2)],...docs.map((item)=>[item[0]+".html",documentFile(order,item,rendered)])]),
  };
}
function exportBundle() {
  const {order,bundle,template} = currentPack();
  if (!bundle || bundle.status!=="approved") return;
  const file = packageFiles(order,bundle,template);
  triggerDownload(file.blob,file.filename);
  bundle.history.push(log("Đã tải bộ chứng từ mẫu", session.account));
  save(); render(); notify("Đã tạo bộ ZIP để tải xuống.");
}
function draftMessage(order, template) {
  const buying = selected.kind==="buying";
  const company = companyName(order.company);
  return {
    to: `${buying?"nhacungcap":"khachhang"}.${order.company.toLowerCase()}@example.test`,
    subject: `[${company}] Gửi hồ sơ ${order.id} · ${template.label}`,
    body: `Kính gửi ${buying?"Quý Nhà cung cấp":"Quý Khách hàng"},\n\nBộ phận Kế toán Công ty ${company} gửi kèm bộ hồ sơ ${template.label.toLowerCase()} cho mã ${order.id}.\n\nVui lòng kiểm tra các chứng từ đính kèm và phản hồi nếu cần bổ sung.\n\nTrân trọng,\nBộ phận Kế toán Công ty ${company}\n\nBản minh họa nghiệp vụ.`,
  };
}
function composeEmail() {
  const {order,bundle,template} = currentPack();
  if (session?.role!=="maker" || bundle?.status!=="approved") return;
  const last = bundle.dispatches?.at(-1);
  const message = last ? {to:last.recipient,subject:last.subject,body:last.body} : draftMessage(order,template);
  const attached = template.items.filter(([id])=>bundle.docs.includes(id)&&template.outward.includes(id));
  if (!attached.length) return notify("Hồ sơ chưa có giấy tờ được phép gửi trong demo.");
  openDialog("Soạn email gửi hồ sơ",`<form id="dispatch-form" data-key="${esc(packKey(order,selected.kind))}">
    <div class="form-grid"><label class="field wide">Email ${template.recipient.toLowerCase()}<input class="input" type="email" name="to" value="${esc(message.to)}" required maxlength="160"></label>
    <label class="field wide">Tiêu đề<input class="input" name="subject" value="${esc(message.subject)}" required maxlength="180"></label>
    <label class="field wide">Nội dung<textarea class="input mail-body" name="body" rows="7" required maxlength="3500">${esc(message.body)}</textarea></label></div>
    <div class="mail-attachment">${icon("doc")}<div><strong>Bộ chứng từ đính kèm (.zip)</strong><small>${attached.map(([,label])=>esc(label)).join(", ")}</small></div></div>
    <p class="mail-note">Gửi thử ghi nhật ký trong trình duyệt. Tệp .eml chứa bộ ZIP đính kèm. Chỉ sử dụng địa chỉ mẫu có đuôi .test.</p>
    <p class="error" id="dialog-error" aria-live="polite"></p><div class="actions">
    <button type="submit" class="btn" name="intent" value="simulate">${icon("mail")} Gửi thử</button>
    <button type="submit" class="btn light" name="intent" value="eml">${icon("down")} Tải email .eml</button></div>
  </form>`);
}
function base64(bytes) {
  let binary = "";
  for (let i=0;i<bytes.length;i+=8192) binary += String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(binary);
}
function emailSubject(text,encoder) {
  const words=[];
  let group="";
  for (const character of text) {
    if (encoder.encode(group+character).length>36) {
      words.push(group); group="";
    }
    group+=character;
  }
  if (group) words.push(group);
  return words.map((word)=>"=?UTF-8?B?"+base64(encoder.encode(word))+"?=").join("\r\n ");
}
async function saveEmail(form,intent,key) {
  const {order,bundle,template,key:activeKey}=currentPack();
  if (session?.role!=="maker" || bundle?.status!=="approved" || activeKey!==key) return;
  const to=String(form.get("to")||"").trim();
  const subject=String(form.get("subject")||"").trim();
  const body=String(form.get("body")||"").trim();
  if (!/^[a-z0-9._+-]+@(?:[a-z0-9]+(?:-[a-z0-9]+)*\.)+test$/i.test(to) || !subject || !body) {
    fieldError("dialog-error","Nhập địa chỉ mẫu .test, tiêu đề và nội dung thư."); return;
  }
  if (intent==="eml") {
    const file=packageFiles(order,bundle,template,true);
    if (!file.names.length) return;
    const enc=new TextEncoder();
    const boundary="tamcuong-demo-"+crypto.randomUUID();
    const wrapped=(bytes)=>base64(bytes).match(/.{1,76}/g)?.join("\r\n") || "";
    const headers=[
      "X-Unsent: 1", "Date: "+new Date().toUTCString().replace("GMT","+0000"),
      "From: ke-toan."+order.company.toLowerCase()+"@example.test", "To: "+to,
      "Subject: "+emailSubject(subject,enc), "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`, "",
      "--"+boundary, 'Content-Type: text/plain; charset="UTF-8"', "Content-Transfer-Encoding: base64", "",
      wrapped(enc.encode(body.replace(/\r?\n/g,"\r\n"))), "--"+boundary,
      `Content-Type: application/zip; name="${file.filename}"`,
      `Content-Disposition: attachment; filename="${file.filename}"`, "Content-Transfer-Encoding: base64", "",
      wrapped(new Uint8Array(await file.blob.arrayBuffer())), "--"+boundary+"--", "",
    ];
    triggerDownload(new Blob([headers.join("\r\n")],{type:"message/rfc822"}),file.filename.replace(/\.zip$/,".eml"));
    notify("Đã tải email mẫu kèm bộ chứng từ."); return;
  }
  if (intent!=="simulate") return;
  const last=bundle.dispatches?.at(-1);
  if (last?.recipient.toLowerCase()===to.toLowerCase() && last.subject===subject && last.body===body) {
    fieldError("dialog-error","Email này đã được ghi nhận gửi thử. Có thể tải lại tệp .eml."); return;
  }
  const attachments=template.items.filter(([id])=>bundle.docs.includes(id)&&template.outward.includes(id)).map(([id])=>id);
  if (!attachments.length) return;
  bundle.dispatches ||= [];
  bundle.dispatches.push({recipient:to,subject,body,attachments,at:new Date().toISOString(),actor:session.account});
  bundle.history.push(log("Đã mô phỏng gửi hồ sơ qua email · "+to));
  modal.close(); save(); render(); notify("Đã ghi nhận gửi thử. Email chưa được gửi ra ngoài.");
}
function feedbackPage() {
  return heading("Góp ý và xác nhận","Lưu góp ý trong trình duyệt, rồi tải tệp để gửi lại người phụ trách.",btn("Tải góp ý","download-feedback",{icon:"down",disabled:!data.feedback.length}))+
    `<div class="questions">${questions.map(([id,title,q])=>{
      const feedback = [...data.feedback].reverse().find((item)=>item.question===id && item.scope===feedbackScope());
      return `<article class="panel question">${chip(id)}<h3>${title}</h3><p>${q}</p>${feedback ? `<p class="notice" style="margin-top:9px">${esc(feedback.status)} · ${esc(feedback.notes)}</p>` : ""}<div class="actions" style="margin-top:10px">${btn(feedback?"Sửa góp ý":"Ghi góp ý","feedback-item",{value:id,style:"light compact"})}</div></article>`;
    }).join("")}</div>`;
}
function feedbackScope() {
  return session?.company ? companyName(session.company) : session?.area==="board" ? "HĐQT" : "Góp ý chung";
}
function render() {
  if (view==="home") { app.innerHTML=header()+home(); return; }
  let body;
  if (view==="feedback") body=feedbackPage();
  else if (!session) { show("home"); return; }
  else if (view==="dashboard" && session.area!=="accounting") body=dashboard();
  else if (view==="orders" && session.area!=="accounting") body=ordersPage();
  else if (view==="detail" && session.area!=="accounting") body=detail();
  else if (view==="process" && session.area==="company") body=processPage();
  else if (view==="accounting" && session.area==="accounting") body=accountingPage();
  else if (view==="pi" && session.area!=="accounting") body=piPage();
  else if (session.area==="company" && Object.hasOwn(modules,view)) body=modulePage(view);
  else { show(session.area==="accounting"?"accounting":"dashboard"); return; }
  app.innerHTML=header()+workspace(body);
}
function activeRoute() {
  if (view==="home") return "trang-chu";
  if (view==="feedback") return "gop-y";
  if (!session) return "trang-chu";
  if (session.area==="accounting") {
    const order=currentPack().order;
    return order ? packRoute(order,selected.kind) : "ke-toan/"+session.company;
  }
  const root=session.area==="board" ? "hdqt" : companyRoute(session.company);
  return view==="detail" && selected.order ? root+"/ho-so/"+encodeURIComponent(selected.order) : root+"/"+(viewSlug[view]||viewSlug.dashboard);
}
function syncRoute() {
  const next="#"+activeRoute();
  if (location.hash!==next) history.pushState(null,"",next);
}
function show(next) { view=next; syncRoute(); render(); window.scrollTo(0,0); }
function route(routeText) {
  const clean=routeText.replace(/^#/,"");
  if (clean==="khu-lam-viec" || clean==="content") return;
  if (!clean || clean==="trang-chu") {actionHandlers.home();return;}
  if (clean==="gop-y") {show("feedback");return;}
  const [area,companyOrView,destination,orderID,suffix,extra]=clean.split("/");
  let target;
  if (area==="hdqt" && !orderID) target={area:"board",view:viewForSlug[companyOrView]||"dashboard",order:companyOrView==="ho-so"?destination:null};
  if (area==="cong-ty" && Object.hasOwn(companies,companyOrView) && !suffix) {
    target={area:"company",company:companyOrView,view:viewForSlug[destination]||"dashboard",order:destination==="ho-so"?orderID:null};
  }
  if (area==="ke-toan" && (!companyOrView || Object.hasOwn(companies,companyOrView)) && !extra) {
    target={area:"accounting",company:companyOrView,view:"accounting",order:destination==="ho-so"?orderID:null,kind:suffix==="mua-hang"?"buying":"sales"};
  }
  if (!target) {actionHandlers.home(); return;}
  if (target.order) {
    try { target.order=decodeURIComponent(target.order); }
    catch (_) { target.order=null; }
  }
  if (session?.area!==target.area || (target.company && session?.company!==target.company)) {
    pendingRoute=target;
    signin(target.area==="company"?target.company:target.area,"maker",target.company);
    return;
  }
  openRoute(target);
}
function openRoute(target) {
  if (target.order) {
    const o=secureOrder(target.order);
    if (o && (!target.company || o.company===target.company)) {
      selected.order=o.id; selected.stage=null;
      if (target.area==="accounting") {selected.kind=target.kind;show("accounting");}
      else show("detail");
      return;
    }
    notify("Hồ sơ chưa có trong phạm vi công ty.");
    selected.order=null; selected.stage=null;
  }
  if (target.area==="accounting") {
    if (target.order===undefined || !target.order) selected.order=null;
    selected.kind=target.kind || "sales";
  }
  const allowed=target.area==="board"?["dashboard","orders","pi"]:["dashboard","orders","process","pi",...Object.keys(modules)];
  show(target.area==="accounting"?"accounting":allowed.includes(target.view)?target.view:"dashboard");
}
function log(label,actor=session?.account||"Người dùng demo") { return {label,actor,at:new Date().toISOString()}; }
function openDialog(title,body) {
  if (modal.open) modal.close();
  modal.innerHTML=`<header class="dialog-head"><h2 id="modal-title">${title}</h2><button class="btn light compact" data-action="close" aria-label="Đóng">${icon("close")}</button></header><div class="dialog-body">${body}</div>`;
  modal.showModal();
}
function signin(area, preferredRole = "maker", companyHint = null) {
  const account = area==="accounting";
  const role = preferredRole==="reviewer"?"reviewer":"maker";
  const company = account ? (companyHint || session?.company || "TC") : area==="board" ? "" : area;
  const title = account?"Đăng nhập khu kế toán":area==="board"?"Đăng nhập khu HĐQT":"Đăng nhập Công ty "+companyName(company);
  const choices = account ? `<label class="field">Công ty<select class="input" name="company">${Object.entries(companies).filter(([key])=>!companyHint||key===companyHint).map(([key,item])=>`<option value="${key}" ${key===company?"selected":""}>${item.name}</option>`).join("")}</select></label>
    <label class="field">Tài khoản mẫu<select class="input" name="role"><option value="maker">Kế toán lập hồ sơ</option><option value="reviewer" ${role==="reviewer"?"selected":""}>Kế toán duyệt hồ sơ</option></select></label>` :
    `<label class="field wide">Tài khoản mẫu<input class="input" value="${company ? company.toLowerCase()+".vanhanh.demo" : "hdqt.demo"}" readonly></label>`;
  openDialog(title,`<p>Dùng tài khoản mẫu để xem dữ liệu minh họa theo phạm vi được chọn.</p><form id="login-form" data-area="${area}"><div class="form-grid">${choices}</div>
  <div class="actions"><button class="btn" type="submit">${icon("lock")} Vào khu làm việc</button></div></form>`);
}
function newOrder() {
  if (session?.area!=="company") return;
  openDialog("Tiếp nhận đơn hàng",`<form id="create-order"><p>Sử dụng thông tin minh họa để chạy thử quy trình.</p><div class="form-grid">
    <label class="field wide">Tên yêu cầu<input class="input" name="title" maxlength="100" value="Đơn mẫu mới" required></label>
    <label class="field wide">Khách hàng mẫu<input class="input" name="customer" maxlength="70" value="Khách minh họa" required></label>
    <label class="field">Loại đơn<select class="input" name="track">${Object.entries(tracks).map(([key,v])=>`<option value="${key}">${v.label}</option>`).join("")}</select></label>
    <label class="field">Giá trị giả định (₫)<input class="input" name="amount" type="number" step="1" min="1" max="100000000000" value="50000000" required></label>
    <label class="field">Số đợt giao<input class="input" name="batches" type="number" min="1" max="10" value="1" required></label>
    <label class="field">Hạn giả định<input class="input" name="due" type="date"></label></div>
    <p class="error" id="dialog-error" aria-live="polite"></p><div class="actions"><button class="btn" type="submit">Tạo hồ sơ</button></div></form>`);
}
function advanceDialog(order) {
  if (!canWork(order) || order.paused || order.step>=11) return;
  const step = stages[order.step];
  const deposit = order.step===5;
  const settle = order.step===9;
  openDialog(step.action,`<form id="advance-form" data-order="${esc(order.id)}" data-step="${order.step}">
   ${stageContent(step)}<p class="gate-line"><strong>Điều kiện chuyển bước</strong> ${esc(step.gate)}</p>
   ${deposit ? `<div class="form-grid"><label class="field wide">Tổng số tiền thực nhận (₫)<input class="input" name="paid" type="number" step="1" min="0" max="${order.total}" value="${order.paid}" required></label><label class="field wide">Mã duyệt ngoại lệ nếu chưa đủ ứng<input class="input" name="approval" maxlength="80"></label></div><p class="muted">Mốc giả định ${money(order.deposit)}. Có thể lưu số thực nhận và tiếp tục chờ.</p>` : ""}
   ${settle ? `<div class="form-grid"><label class="field">Tổng số đã thu (₫)<input class="input" name="paid" type="number" min="0" max="${order.total}" value="${order.paid}" required></label><label class="field">Tiền giữ lại (₫)<input class="input" name="retention" type="number" min="0" max="${order.total}" value="${order.retention}" required></label></div>` : ""}
   <label class="field">Mã tham chiếu hồ sơ đầu ra<input class="input" name="reference" maxlength="90" value="${esc(order.id+"-B"+String(order.step+1).padStart(2,"0")+(order.step===8?"-D"+(order.delivered+1):""))}" required></label>
   <label class="field extra-field">Ghi chú đối soát<textarea class="input" name="note" maxlength="240" ${settle?"required":""}></textarea></label>
   <label class="check"><input type="checkbox" name="confirm" required> Đã kiểm tra đầu vào và xác nhận kết quả bước này.</label>
   <p class="error" id="dialog-error" aria-live="polite"></p><div class="actions"><button class="btn" type="submit">Xác nhận</button></div></form>`);
}
function noteDialog(title,action,order) {
  openDialog(title,`<form id="${action}" data-order="${esc(order?.id||"")}"><label class="field">Lý do hoặc mã tham chiếu<textarea class="input" name="note" maxlength="240" required></textarea></label>
  <p class="error" id="dialog-error" aria-live="polite"></p><div class="actions"><button class="btn" type="submit">Xác nhận</button></div></form>`);
}
function feedbackDialog(id) {
  const question = questions.find((q)=>q[0]===id);
  if (!question) return;
  const saved = data.feedback.find((item)=>item.question===id && item.scope===feedbackScope());
  openDialog(question[1],`<p>${question[2]}</p><form id="feedback-form" data-question="${id}"><div class="form-grid">
  <label class="field">Phạm vi<input class="input" value="${esc(feedbackScope())}" readonly></label>
  <label class="field">Phản hồi<select class="input" name="status">${["Đồng ý","Cần sửa","Bổ sung"].map(v=>`<option ${saved?.status===v?"selected":""}>${v}</option>`).join("")}</select></label>
  <label class="field wide">Ý kiến hoặc câu trả lời<textarea class="input" name="notes" maxlength="600" required>${esc(saved?.notes)}</textarea></label></div>
  <p class="error" id="dialog-error" aria-live="polite"></p><div class="actions"><button type="submit" class="btn">Lưu góp ý</button></div></form>`);
}

function fieldError(id, message) {
  const target = document.getElementById(id);
  if (target) target.textContent = message;
}
function createOrder(form) {
  if (session?.area!=="company") return;
  const title = String(form.get("title")).trim();
  const customer = String(form.get("customer")).trim();
  const type = form.get("track");
  const total = Number(form.get("amount"));
  const batches = Number(form.get("batches"));
  if (!title || !customer || !Object.hasOwn(tracks,type) || !Number.isSafeInteger(total) || total<1 || total>100000000000 ||
      !Number.isInteger(batches) || batches<1 || batches>10) {
    fieldError("dialog-error","Kiểm tra tên, giá trị và số đợt giao.");
    return;
  }
  const id = session.company + "-M" + String(Date.now());
  data.orders.unshift({id,company:session.company,title,customer,type,total,batches,due:form.get("due"),step:0,paid:0,
    delivered:0,deposit:Math.round(total*.3),retention:0,records:{},history:[log("Đã tạo hồ sơ đơn hàng")]});
  selected.order=id;selected.stage=null;
  modal.close(); save(); show("detail"); notify("Đã tạo đơn mẫu.");
}
function advanceOrder(order,step,form) {
  if (!canWork(order) || order.paused || order.step!==step || step>=11 || !form.has("confirm")) return;
  const note=String(form.get("note")||"").trim();
  const reference=String(form.get("reference")||"").trim();
  if (!reference) {fieldError("dialog-error","Điền mã tham chiếu hồ sơ đầu ra.");return;}
  let label=stages[step].action;
  if (step===5 || step===9) {
    const paid=Number(form.get("paid"));
    if (!Number.isSafeInteger(paid) || paid<order.paid || paid>order.total) {
      fieldError("dialog-error","Số đã thu phải từ số đã ghi nhận đến tổng giá trị hợp đồng. Điều chỉnh giảm cần xử lý đối soát riêng.");
      return;
    }
    if (step===9) {
      const retention=Number(form.get("retention"));
      if (!note || !Number.isSafeInteger(retention) || retention<0 || retention>order.total-paid) {
        fieldError("dialog-error","Ghi mã hoặc ghi chú đối chiếu. Số giữ lại phải nằm trong dư nợ."); return;
      }
      order.retention=retention;
    }
    order.paid=paid;
    if (step===5 && paid<order.deposit) {
      const approval=String(form.get("approval")||"").trim();
      if (!approval) {
        order.history.push(log("Ghi thực nhận " + money(paid) + ". Hồ sơ vẫn chờ tạm ứng."));
        modal.close(); save(); render(); notify("Đã lưu thực nhận. Đơn vẫn chờ đủ ứng."); return;
      }
      label += " theo duyệt ngoại lệ " + approval;
    }
  }
  if (step===8) {
    order.delivered++;
    label += ` ${order.delivered}/${order.batches}`;
    if (order.delivered<order.batches) {
      order.history.push(log(label + " · " + reference + (note ? " · " + note : "")));
      modal.close(); save(); render(); notify("Đã lưu đợt bàn giao. Hồ sơ còn đợt chưa xác nhận."); return;
    }
  }
  const path=tracks[order.type].path;
  order.records ||= {};
  order.records[step]={reference,at:new Date().toISOString(),actor:session.account};
  order.step=path[path.indexOf(step)+1];
  selected.stage=null;
  order.history.push(log(label + " · " + reference + (note ? " · " + note : "")));
  modal.close(); save(); render(); notify("Hồ sơ đã chuyển bước.");
}
function savePack(form, orderID, intent) {
  const order=secureOrder(orderID);
  if (!canAccount(order) || session.role!=="maker") return;
  const kind=selected.kind;
  const key=packKey(order,kind);
  const bundle=data.packs[key];
  if (["pending","approved"].includes(bundle?.status)) return;
  const docs=form.getAll("doc");
  const eligible=packs[kind].items.filter((item)=>order.step>=item[3]).map((item)=>item[0]);
  const evidence=form.has("evidence");
  if (docs.some((id)=>!eligible.includes(id))) return;
  const submit=intent==="submit";
  if (submit && (new Set(docs).size!==packs[kind].items.length || !evidence)) {
    fieldError("pack-error","Cần đủ danh sách chứng từ và xác nhận đã đối soát tham chiếu.");
    return;
  }
  const next = {
    status:submit?"pending":"draft", docs:[...new Set(docs)], evidence, maker:session.account,
    createdAt:bundle?.createdAt||new Date().toISOString(),
    history:[...(bundle?.history||[]),log(submit?"Đã gửi duyệt":"Đã lưu nháp")],
  };
  if (submit) next.snapshot=JSON.parse(JSON.stringify(order));
  data.packs[key]=next;
  save(); render(); notify(submit?"Đã trình người duyệt.":"Đã lưu bộ nháp.");
}
function reviewPack(approve,note) {
  const {bundle}=currentPack();
  if (session?.role!=="reviewer" || bundle?.status!=="pending" || bundle.maker===session.account) return;
  if (!approve && !note) { fieldError("dialog-error","Ghi nội dung cần bổ sung."); return; }
  bundle.status=approve?"approved":"returned";
  if (approve) { bundle.reviewer=session.account; bundle.approvedAt=new Date().toISOString(); }
  bundle.history.push(log(approve?"Đã duyệt bộ chứng từ mẫu":"Trả bổ sung · "+note));
  modal.close(); save(); render(); notify(approve?"Bộ mẫu đã duyệt và có thể tải.":"Đã trả lại cho người lập.");
}
function openOrder(id) {
  if (!secureOrder(id) || session.area==="accounting") return;
  selected.order=id; selected.stage=null; show("detail");
}
const actionHandlers={
  home:()=>{ session=null; pendingRoute=null; selected=initialSelection(); show("home"); },
  close:()=>{pendingRoute=null;modal.close();},
  nav:(value)=>show(value),
  feedback:()=>show("feedback"),
  "new-order":newOrder,
  order:openOrder,
  track:(value)=>{if(view==="process"&&Object.hasOwn(tracks,value)){selected.track=value;render();}},
  "inspect-stage":(value)=>{
    const order=secureOrder(selected.order);
    const index=Number(value);
    if (view==="detail"&&order&&tracks[order.type].path.includes(index)) {
      selected.stage=index; render();
      document.querySelector(`[data-action="inspect-stage"][data-value="${index}"]`)?.focus();
    }
  },
  "clear-search":()=>{selected.search="";render();},
  advance:(value)=>advanceDialog(secureOrder(value)),
  pause:(value)=>{
    const o=secureOrder(value);
    if (canWork(o) && !o.paused && o.step<11) noteDialog("Ghi lý do tạm dừng","pause-form",o);
  },
  resume:(value)=>{
    const o=secureOrder(value);
    if (canWork(o) && o.paused) noteDialog("Ghi lý do tiếp tục","resume-form",o);
  },
  "check-module":(value)=>{
    if (session?.area!=="company" || !Object.hasOwn(modules,view)) return;
    const id=Number(value);
    const module=modules[view];
    const key=session.company+":"+view;
    if (!module.rows[id] || module.rows[id][3].startsWith("Đã") || data.checklists[key]?.[id]) return;
    data.checklists[key] ||= {};
    data.checklists[key][id]={status:module.next,at:new Date().toISOString(),actor:session.account};
    save(); render(); notify(module.next + ".");
  },
  "account-signin":(value)=>{ if (session?.area==="accounting") signin("accounting", value,session.company); },
  document:(value)=>{
    const {order,bundle,template}=currentPack();
    const item=template?.items.find((x)=>x[0]===value);
    if (item && (order.step>=item[3] || bundle?.docs.includes(value))) openDialog("Chi tiết chứng từ",documentMarkup(order,item,bundle));
  },
  "approve-pack":()=>{
    const {bundle}=currentPack();
    if (session?.role==="reviewer" && bundle?.status==="pending") openDialog("Duyệt bộ chứng từ mẫu",
      '<form id="approve-form"><label class="check"><input type="checkbox" name="confirm" required> Tôi đã rà danh sách và tham chiếu trong tình huống giả định.</label><div class="actions"><button type="submit" class="btn">Xác nhận duyệt</button></div></form>');
  },
  "return-pack":()=>{ if (session?.role==="reviewer" && currentPack().bundle?.status==="pending") noteDialog("Trả bổ sung","return-form"); },
  "download-pack":exportBundle,
  "compose-email":composeEmail,
  "feedback-item":feedbackDialog,
  "download-feedback":()=>triggerDownload(new Blob([JSON.stringify(data.feedback,null,2)],{type:"application/json;charset=utf-8"}),"gop-y-tam-cuong-demo.json"),
};
document.addEventListener("click",(event)=>{
  const link=event.target.closest("a[data-route]");
  if (link) {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {event.preventDefault();route(link.dataset.route);}
    return;
  }
  const control=event.target.closest("[data-action]");
  if (!control || control.disabled) return;
  const action=actionHandlers[control.dataset.action];
  if (action) { event.preventDefault(); action(control.dataset.value); }
});
document.addEventListener("change",(event)=>{
  const {id,value}=event.target;
  if (id==="board-company" && session?.area==="board" && (value==="all"||companies[value])) selected.company=value;
  else if (id==="account-order" && canAccount(secureOrder(value))) selected.order=value;
  else if (id==="pack-kind" && session?.area==="accounting" && Object.hasOwn(packs,value)) selected.kind=value;
  else return;
  if (view==="accounting") syncRoute();
  render(); document.getElementById(id)?.focus();
});
document.addEventListener("submit",(event)=>{
  const el=event.target;
  if (!(el instanceof HTMLFormElement)) return;
  event.preventDefault();
  const form=new FormData(el);
  const value=(key)=>String(form.get(key)||"").trim();
  switch(el.id){
    case "login-form": {
      const area=el.dataset.area;
      const target=pendingRoute;
      pendingRoute=null;
      if (area==="board") session={area:"board",company:null,account:"hdqt.demo",role:"reader"};
      else if (companies[area]) session={area:"company",company:area,account:area.toLowerCase()+".vanhanh.demo",role:"operator"};
      else if (area==="accounting" && companies[value("company")] && ["maker","reviewer"].includes(value("role"))) {
        const company=value("company");
        const role=value("role");
        const old=session;
        session={area:"accounting",company,role,account:company.toLowerCase()+".ketoan."+(role==="maker"?"lap":"duyet")+".demo"};
        if (old?.company!==company) selected.order=null;
      } else return;
      modal.close();
      if (target && target.area===session.area && (!target.company || target.company===session.company)) openRoute(target);
      else show(session.area==="accounting"?"accounting":"dashboard");
      break;
    }
    case "order-search": selected.search=value("search");render();break;
    case "create-order": createOrder(form);break;
    case "advance-form": advanceOrder(secureOrder(el.dataset.order),Number(el.dataset.step),form);break;
    case "pause-form":
    case "resume-form": {
      const order=secureOrder(el.dataset.order);
      const pause=el.id==="pause-form";
      if (!canWork(order) || order.step>=11 || !!order.paused===pause) return;
      const note=value("note");
      if (!note) { fieldError("dialog-error","Vui lòng nhập lý do.");return; }
      order.paused=pause;
      order.history.push(log((pause?"Tạm dừng":"Tiếp tục") + " · " + note));
      modal.close(); save();render();notify(pause?"Đã tạm dừng hồ sơ.":"Đã mở lại hồ sơ.");break;
    }
    case "pack-form": savePack(form,el.dataset.order,event.submitter?.value);break;
    case "approve-form": if (form.has("confirm")) reviewPack(true,"");break;
    case "return-form": reviewPack(false,value("note"));break;
    case "dispatch-form": {
      const submit=event.submitter;
      if (!submit || submit.disabled) break;
      submit.disabled=true;
      void saveEmail(form,submit.value,el.dataset.key)
        .catch(()=>fieldError("dialog-error","Chưa tạo được email. Vui lòng thử lại."))
        .finally(()=>{submit.disabled=false;});
      break;
    }
    case "feedback-form": {
      const id=el.dataset.question;
      const scope=feedbackScope();
      const notes=value("notes");
      const status=value("status");
      if (!questions.some((q)=>q[0]===id) || !["Đồng ý","Cần sửa","Bổ sung"].includes(status)) return;
      if (!notes) {fieldError("dialog-error","Vui lòng nhập ý kiến.");return;}
      data.feedback=data.feedback.filter((f)=>f.question!==id||f.scope!==scope);
      data.feedback.push({question:id,scope,status,notes,at:new Date().toISOString()});
      modal.close();save();render();notify("Đã lưu góp ý.");
      break;
    }
  }
});
modal.addEventListener("cancel",()=>{pendingRoute=null;});
window.addEventListener("hashchange",()=>route(location.hash));
render();
if (location.hash) route(location.hash);

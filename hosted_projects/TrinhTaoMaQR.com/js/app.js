const qrTypeEl = document.getElementById("qrType");
const inputMainEl = document.getElementById("inputMain");
const inputExtraEl = document.getElementById("inputExtra");
const wifiPasswordGroup = document.getElementById("wifiPasswordGroup");
const modalEl = document.getElementById("qrModal");
const container = document.getElementById("modalQrImage");
const charCount = document.getElementById("charCount");
const verifiedBadge = document.getElementById("verifiedBadge");

// Ẩn khung mật khẩu WiFi khi khởi chạy
window.addEventListener("DOMContentLoaded", () => {
  wifiPasswordGroup.style.display = "none";
});

// Đếm ký tự realtime cho khung văn bản
inputMainEl.addEventListener("input", () => {
  charCount.textContent = `${inputMainEl.value.length} / 500 ký tự`;
});

// Cập nhật giao diện theo loại QR
qrTypeEl.addEventListener("change", () => {
  if (qrTypeEl.value === "text") {
    wifiPasswordGroup.style.display = "none";
    inputMainEl.placeholder = "Nhập văn bản, giới hạn 500 ký tự";
  } else {
    wifiPasswordGroup.style.display = "block";
    inputMainEl.placeholder = "Tên WiFi";
    inputExtraEl.placeholder = "Mật khẩu WiFi";
  }
});

// Tạo QR thường / WiFi
function handleCreate() {
  const btn = document.querySelector("button[onclick='handleCreate()']");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Đang tạo...`;
  verifiedBadge.style.display = "none";

  const type = qrTypeEl.value;
  const main = inputMainEl.value.trim();
  const extra = inputExtraEl.value.trim();
  let data = "";

  if (type === "text" && main) {
    data = main;
  } else if (type === "wifi") {
    if (!main || !extra || extra.length < 8) {
      alert("Vui lòng nhập tên WiFi và mật khẩu (tối thiểu 8 ký tự).");
      resetGenerateButton();
      return;
    }
    data = `WIFI:T:WPA;S:${main};P:${extra};;`;
  } else {
    resetGenerateButton();
    return;
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=250x250`;

  container.innerHTML = `<p>Đang tạo mã QR...</p>`;
  const img = new Image();
  img.onload = () => {
    container.innerHTML = "";
    container.appendChild(img);
    modalEl.style.display = "flex";
    document.body.style.overflow = "hidden";
    resetGenerateButton();
  };
  img.onerror = () => {
    container.innerHTML = "<p>Lỗi khi tải mã QR.</p>";
    resetGenerateButton();
  };
  img.src = qrUrl;
}

function resetGenerateButton() {
  const btn = document.querySelector("button[onclick='handleCreate()']");
  btn.disabled = false;
  btn.innerHTML = "Tạo mã QR";
}

function closeModal() {
  modalEl.style.display = "none";
  document.body.style.overflow = "";
}

function getCurrentQRUrl() {
  const img = container.querySelector("img");
  return img ? img.src : null;
}

function downloadQR() {
  const url = getCurrentQRUrl();
  if (!url) return;

  let type = "unknown";

  if (document.getElementById("qrNormalForm").style.display !== "none") {
    if (qrTypeEl.value === "text") {
      type = "text";
    } else {
      const wifiName = inputMainEl.value.trim().toLowerCase().replace(/\s+/g, "_") || "wifi";
      type = `wifi-${wifiName}`;
    }
  } else {
    const bankCode = document.getElementById("bankCode").value.trim().toLowerCase() || "bank";
    type = bankCode;
  }

  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `qrcode_${type}_d4m-dev.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    })
    .catch(() => alert("Không thể tải ảnh QR."));
}

function printQR() {
  const url = getCurrentQRUrl();
  if (!url) return;
  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <body style="text-align:center;">
        <img src="${url}" style="max-width:90%;">
        <script>window.onload = function() { window.print(); }</script>
      </body>
    </html>
  `);
  win.document.close();
}

function smartShare() {
  const url = getCurrentQRUrl();
  if (!url) return;
  if (navigator.share) {
    navigator.share({
      title: "Mã QR",
      text: "Chia sẻ mã QR của bạn",
      url: url
    }).catch(() => alert("Không thể chia sẻ."));
  } else {
    alert("Thiết bị không hỗ trợ chia sẻ.");
  }
}

// Chuyển giữa 2 chế độ QR
function toggleQRMode() {
  const normalForm = document.getElementById("qrNormalForm");
  const bankForm = document.getElementById("qrBankForm");
  const btnText = document.querySelector("#btnSwitchMode button");

  if (normalForm.style.display !== "none") {
    normalForm.style.display = "none";
    bankForm.style.display = "block";
    btnText.innerHTML = `<i class="fas fa-sync-alt"></i> Chuyển sang QR văn bản`;
    verifiedBadge.style.display = "none";
  } else {
    bankForm.style.display = "none";
    normalForm.style.display = "block";
    btnText.innerHTML = `<i class="fas fa-sync-alt"></i> Chuyển sang QR ngân hàng`;
    charCount.textContent = `${inputMainEl.value.length} / 500 ký tự`;
  }
}

// Dark Mode toggle
document.getElementById("darkToggle").addEventListener("change", () => {
  document.body.classList.toggle("dark-mode");
});

// Tạo QR ngân hàng qua AJAX
document.getElementById("qrForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const bank = document.getElementById("bankCode").value.trim();
  const account = document.getElementById("accountNumber").value.trim();
  const name = encodeURIComponent(document.getElementById("accountName").value.trim());
  const amount = document.getElementById("amount").value.trim();
  const note = encodeURIComponent(document.getElementById("note").value.trim());

  if (!bank || !account || !name) {
    alert("Vui lòng nhập đủ thông tin ngân hàng.");
    return;
  }

  let qrURL = `https://img.vietqr.io/image/${bank}-${account}-compact2.png`;
  const query = [];
  if (amount) query.push(`amount=${amount}`);
  if (note) query.push(`addInfo=${note}`);
  if (name) query.push(`accountName=${name}`);
  if (query.length) qrURL += "?" + query.join("&");

  const btnBank = document.querySelector("#qrForm button[type='submit']");
  btnBank.disabled = true;
  btnBank.innerHTML = `<span class="spinner"></span> Đang tạo...`;
  container.innerHTML = `<p>Đang tạo mã QR...</p>`;

  try {
    const res = await fetch(qrURL);
    if (!res.ok) throw new Error("Không thể tải ảnh.");
    const blob = await res.blob();
    const objectURL = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      container.innerHTML = "";
      container.appendChild(img);
      modalEl.style.display = "flex";
      document.body.style.overflow = "hidden";
      verifiedBadge.style.display = "flex";
      btnBank.disabled = false;
      btnBank.innerHTML = "Tạo mã QR ngân hàng";
    };
    img.onerror = () => {
      container.innerHTML = `<p>Ảnh không thể hiển thị.</p>`;
      btnBank.disabled = false;
      btnBank.innerHTML = "Tạo mã QR ngân hàng";
    };
    img.src = objectURL;
  } catch (err) {
    container.innerHTML = `<p>Lỗi khi tạo mã QR.</p>`;
    btnBank.disabled = false;
    btnBank.innerHTML = "Tạo mã QR ngân hàng";
  }
});

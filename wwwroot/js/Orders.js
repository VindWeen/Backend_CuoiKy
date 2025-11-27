const API_BASE = 'http://localhost:5114/api';
let allOrders = [];
let sortAscending = false; // mặc định: mới → cũ (phù hợp khách hàng hay xem đơn mới nhất)

// Format ngày giờ
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  }) + ' lúc ' + date.toLocaleTimeString('vi-VN', { 
    hour: '2-digit', minute: '2-digit' 
  });
}

// Lấy thông tin user từ token
function getCustomerId() {
  const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
  return userData.customerID || null;
}

async function renderOrders() {
  const container = document.getElementById('ordersList');
  const token = localStorage.getItem('token');

  if (!token) {
    container.innerHTML = `
      <div class="no-orders">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
        <p>Vui lòng <a href="LogReg.html" style="color:#6366f1;font-weight:600;">đăng nhập</a> để xem đơn hàng</p>
      </div>`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/orders/my-orders`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) throw new Error("Không thể tải đơn hàng");

    allOrders = await res.json();

    if (allOrders.length === 0) {
      container.innerHTML = `
        <div class="no-orders">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <p>Chưa có đơn hàng nào</p>
          <a href="index.html" style="margin-top:20px; color:#6366f1; font-weight:600;">Tiếp tục mua sắm →</a>
        </div>`;
      return;
    }

    // Sắp xếp
    allOrders.sort((a, b) => sortAscending 
      ? new Date(a.orderDate) - new Date(b.orderDate)
      : new Date(b.orderDate) - new Date(a.orderDate)
    );

    container.innerHTML = allOrders.map(order => `
      <div class="order-card">
        <div class="header">
          <div class="order-id">#${order.id}</div>
          <div class="status ${getStatusClass(order.status)}">${order.status}</div>
        </div>
        <div class="info">
          <div><strong>Ngày đặt:</strong> ${formatDate(order.orderDate)}</div>
          <div><strong>Tổng tiền:</strong> ${order.totalAmount.toLocaleString('vi-VN')} ₫</div>
        </div>
        <button class="btn-detail" onclick="openOrderDetail(${order.id})">
          Xem chi tiết
        </button>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = `<p style="color:red;">Lỗi: ${err.message}</p>`;
  }
}

function getStatusClass(status) {
  if (status === "Đang xử lý" || status === "Processing") return "processing";
  if (status === "Đã xử lý" || status === "Completed") return "completed";
  return "processing";
}

function toggleSort() {
  sortAscending = !sortAscending;
  const text = document.getElementById('sortText');
  const icon = document.getElementById('sortIcon');

  if (sortAscending) {
    text.textContent = "Cũ → Mới";
    icon.classList.remove('asc');
  } else {
    text.textContent = "Mới → Cũ";
    icon.classList.add('asc');
  }

  renderOrders();
}

// Chi tiết đơn – KHÔNG có phần cập nhật trạng thái
async function openOrderDetail(orderId) {
  const modal = document.getElementById('orderModal');
  const body = document.getElementById('modalBody');
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) throw new Error("Không tải được chi tiết đơn hàng");

    const order = await res.json();

    const itemsHtml = await Promise.all(order.items.map(async (item) => {
      let productName = `Sản phẩm #${item.productId}`;
      let imgUrl = 'https://via.placeholder.com/80';

      try {
        const prodRes = await fetch(`${API_BASE}/product/${item.productId}`);
        if (prodRes.ok) {
          const prod = await prodRes.json();
          productName = prod.name || productName;
          imgUrl = `http://localhost:5114/Images/${item.productId}.jpg`;
        }
      } catch {}

      const subtotal = item.quantity * item.unitPrice;
      return `
        <div class="item">
          <img src="${imgUrl}" alt="${productName}" onerror="this.src='https://via.placeholder.com/80?text=SP'" />
          <div class="item-details">
            <h4>${productName}</h4>
            <p>Số lượng: <strong>${item.quantity}</strong> × ${item.unitPrice.toLocaleString()} ₫</p>
          </div>
          <div class="item-total">${subtotal.toLocaleString()} ₫</div>
        </div>
      `;
    }));

    const subtotal = order.totalAmount - 30000;

    body.innerHTML = `
      <div class="order-header">
        <h2>Đơn hàng #${order.id}</h2>
        <p style="margin-top:8px; color:#64748b;">${formatDate(order.orderDate)}</p>
      </div>

      <!-- Hiển thị trạng thái đẹp (chỉ xem) -->
      <div style="margin: 24px 0; text-align:center;">
        <div class="status ${getStatusClass(order.status)}" style="display:inline-block; padding:10px 24px; font-size:1rem;">
          ${order.status}
        </div>
      </div>

      <div class="order-items">
        <h3>Sản phẩm đã mua</h3>
        ${itemsHtml.join('')}
      </div>

      <div class="order-summary">
        <div class="summary-row"><span>Tạm tính</span><strong>${subtotal.toLocaleString()} ₫</strong></div>
        <div class="summary-row"><span>Phí vận chuyển</span><strong>30.000 ₫</strong></div>
        <div class="summary-row total">
          <span>Tổng cộng</span>
          <strong class="final-total">${order.totalAmount.toLocaleString()} ₫</strong>
        </div>
      </div>
    `;

    modal.classList.add('active');
  } catch (err) {
    alert("Lỗi: " + err.message);
  }
}

// Đóng modal
document.querySelector('.close-btn').addEventListener('click', () => {
  document.getElementById('orderModal').classList.remove('active');
});

document.getElementById('orderModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('orderModal')) {
    document.getElementById('orderModal').classList.remove('active');
  }
});

// Load khi mở trang
document.addEventListener('DOMContentLoaded', renderOrders);
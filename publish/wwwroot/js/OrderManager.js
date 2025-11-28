const API_BASE = 'http://localhost:5114/api';
let allOrders = [];

// Format ngày giờ đẹp
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN') + ', ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// Render danh sách đơn hàng 
let sortAscending = true; // true = cũ → mới, false = mới → cũ

async function renderOrders() {
  const container = document.getElementById('ordersList');
  const token = localStorage.getItem('token');

  if (!token) {
    container.innerHTML = `<p style="color:red; font-size:1.2rem;">Bạn cần đăng nhập với tài khoản Admin!</p>`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) throw new Error("Không có quyền hoặc lỗi server");

    allOrders = await res.json();

    if (allOrders.length === 0) {
      container.innerHTML = `<p>Chưa có đơn hàng nào.</p>`;
      return;
    }

    // SẮP XẾP THEO CHIỀU ĐÃ CHỌN
    allOrders.sort((a, b) => sortAscending ? a.id - b.id : b.id - a.id);

    container.innerHTML = allOrders.map(order => `
      <div class="order-card">
        <div class="header">
          <div class="order-id">#${order.id}</div>
          <div class="status ${getStatusClass(order.status)}">${order.status}</div>
        </div>
        <div class="info">
          <div><strong>Khách hàng ID:</strong> ${order.customerId}</div>
          <div><strong>Ngày đặt:</strong> ${formatDate(order.orderDate)}</div>
        </div>
        <div class="total">${order.totalAmount.toLocaleString('vi-VN')} ₫</div>
        <button class="btn-detail" onclick="openOrderDetail(${order.id})">
          Xem chi tiết
        </button>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = `<p style="color:red;">Lỗi: ${err.message}</p>`;
  }
}

// Hàm đổi chiều sắp xếp
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

  renderOrders(); // Render lại danh sách
}

// Trả về class CSS theo trạng thái
function getStatusClass(status) {
  if (status.includes('Đã giao') || status === 'Delivered') return 'delivered';
  if (status.includes('Đang xử lý') || status === 'Processed') return 'processed';
  return 'pending';
}

// Mở popup chi tiết - ĐÃ SỬA ĐẸP + HIỂN THỊ ẢNH + TÊN SẢN PHẨM
async function openOrderDetail(orderId) {
  const modal = document.getElementById('orderModal');
  const body = document.getElementById('modalBody');
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) throw new Error("Không tải được chi tiết");

    const order = await res.json();

    // Lấy tên khách hàng
    let customerName = "Khách vãng lai";
    try {
      const custRes = await fetch(`${API_BASE}/customer/${order.customerId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (custRes.ok) {
        const cust = await custRes.json();
        customerName = cust.name || "Chưa có tên";
      }
    } catch {}

    // Tải từng sản phẩm để lấy tên + ảnh
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
        <div class="order-id">Đơn hàng #${order.id}</div>
        <div class="order-status success">${order.status}</div>
      </div>

      <div class="order-info">
        <div class="info-row">
          <span>Khách hàng</span>
          <strong>${customerName}</strong>
        </div>
        <div class="info-row">
          <span>Ngày đặt hàng</span>
          <strong>${formatDate(order.orderDate)}</strong>
        </div>
      </div>

      <div class="order-items">
        <h3>Sản phẩm đã mua</h3>
        ${itemsHtml.join('')}
      </div>

      <div class="order-summary">
        <div class="summary-row">
          <span>Tạm tính</span>
          <strong>${subtotal.toLocaleString()} ₫</strong>
        </div>
        <div class="summary-row">
          <span>Phí vận chuyển</span>
          <strong>30.000 ₫</strong>
        </div>
        <div class="summary-row total">
          <span>Tổng cộng</span>
          <strong class="final-total">${order.totalAmount.toLocaleString()} ₫</strong>
        </div>
      </div>
    `;

    modal.classList.add('active');
  } catch (err) {
    alert("Lỗi tải chi tiết đơn hàng: " + err.message);
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
document.addEventListener('DOMContentLoaded', () => {
  renderOrders();
});
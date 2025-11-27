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
  if (status === "Đang xử lý" || status === "Processing") return "processing";
  if (status === "Đã xử lý" || status === "Completed") return "completed";
  return "processing";
}

// Mở popup chi tiết + cho phép cập nhật trạng thái
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
    } catch { }

    // Tải sản phẩm cho danh sách
    const itemsHtml = await Promise.all(order.items.map(async (item) => {
      let productName = `Sản phẩm #${item.productId}`;
      let imgUrl = 'https://via.placeholder.com/80';

      try {
        const prodRes = await fetch(`${API_BASE}/product/${item.productId}`);
        if (prodRes.ok) {
          const prod = await prodRes.json();
          productName = prod.name;
          imgUrl = `http://localhost:5114/Images/${item.productId}.jpg`;
        }
      } catch { }

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

    // THÊM PHẦN CẬP NHẬT TRẠNG THÁI Ở ĐÂY
    body.innerHTML = `
      <div class="order-header">
        <div class="order-id">Đơn hàng #${order.id}</div>
      </div>

      <div class="status-update-section" style="margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 16px; border: 2px dashed #e0e7ff;">
        <p style="margin-bottom: 12px; font-weight: 600; color: #1e293b;">Trạng thái đơn hàng:</p>
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          <select id="statusSelect" style="
            padding: 10px 16px; 
            border: 2px solid #e0e7ff; 
            border-radius: 12px; 
            font-size: 1rem; 
            min-width: 180px;
            background: white;
            ">
            ">
            <option value="Đang xử lý" ${order.status === 'Đang xử lý' ? 'selected' : ''}>Đang xử lý</option>
            <option value="Đã xử lý" ${order.status === 'Đã xử lý' ? 'selected' : ''}>Đã xử lý</option>
          </select>
          <button onclick="updateOrderStatus(${order.id})" style="
            padding: 10px 24px; 
            background: linear-gradient(135deg, #6366f1, #8b5cf6); 
            color: white; 
            border: none; 
            border-radius: 12px; 
            font-weight: 600; 
            cursor: pointer;
            ">
            Cập nhật
          </button>
        </div>
      </div>

      <div class="order-info">
        <div class="info-row"><span>Khách hàng</span><strong>${customerName}</strong></div>
        <div class="info-row"><span>Ngày đặt</span><strong>${formatDate(order.orderDate)}</strong></div>
      </div>

      <div class="order-items">
        <h3>Sản phẩm đã mua</h3>
        ${itemsHtml.join('')}
      </div>

      <div class="order-summary">
        <div class="summary-row"><span>Tạm tính</span><strong>${subtotal.toLocaleString()} ₫</strong></div>
        <div class="summary-row"><span>Phí vận chuyển</span><strong>30.000 ₫</strong></div>
        <div class="summary-row total"><span>Tổng cộng</span><strong class="final-total">${order.totalAmount.toLocaleString()} ₫</strong></div>
      </div>
    `;

    modal.classList.add('active');
  } catch (err) {
    alert("Lỗi: " + err.message);
  }
}

// HÀM MỚI: Cập nhật trạng thái
async function updateOrderStatus(orderId) {
  const select = document.getElementById('statusSelect');
  const newStatus = select.value;
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      alert("Cập nhật trạng thái thành công!");
      renderOrders(); // refresh lại danh sách
      openOrderDetail(orderId); // reload lại popup để thấy thay đổi
    } else {
      const error = await res.text();
      alert("Lỗi: " + error);
    }
  } catch (err) {
    alert("Lỗi kết nối: " + err.message);
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
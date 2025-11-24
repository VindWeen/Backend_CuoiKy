// ==================== Cart.js – PHIÊN BẢN HOÀN CHỈNH: GIỎ HÀNG RIÊNG CHO TỪNG USER ====================
const API_BASE = 'http://localhost:5114/api';
let cart = [];                    // Giỏ hàng hiện tại (sẽ được load theo user)
let currentCustomer = null;

// ==================== LOAD GIỎ HÀNG RIÊNG CỦA USER ====================
function loadCart() {
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (user && user.userID) {
    const saved = localStorage.getItem(`cart_${user.userID}`);
    cart = saved ? JSON.parse(saved) : [];
  } else {
    cart = [];
  }
}

// ==================== LƯU GIỎ HÀNG RIÊNG CỦA USER ====================
function saveCart() {
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (user && user.userID) {
    localStorage.setItem(`cart_${user.userID}`, JSON.stringify(cart));
  }
}

// ==================== RENDER GIỎ HÀNG – GIỮ NGUYÊN GIAO DIỆN ĐẸP ====================
function renderCart() {
  const container = document.getElementById('cartItems');

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <div class="empty-icon">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="9" cy="21" r="2"/>
            <circle cx="20" cy="21" r="2"/>
            <path d="M1 1h4l2.5 13.5a2 2 0 0 0 2 1.5h9a2 2 0 0 0 2-1.5L23 6H6"/>
          </svg>
        </div>
        <h2>Giỏ hàng trống</h2>
        <p>Chưa có sản phẩm nào trong giỏ của bạn</p>
        <button class="btn-shop-now" onclick="window.location.href='Product.html'">
          Lựa đồ ngay
        </button>
      </div>
    `;
    updateSummary();
    updateCartBadge(); // Cập nhật badge
    return;
  }

  container.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <input type="checkbox" class="select-item" data-index="${index}" ${item.checked ? 'checked' : ''}>
      <img src="${item.imageUrl || 'https://via.placeholder.com/80'}" 
           alt="${item.name}" 
           onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
      <div class="item-info">
        <h3>${item.name}</h3>
        <div class="price">${item.price.toLocaleString('vi-VN')} ₫</div>
      </div>
      <div class="quantity-controls">
        <button onclick="updateQuantity(${index}, -1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="updateQuantity(${index}, 1)">+</button>
      </div>
      <button class="remove-item" onclick="removeItem(${index})">×</button>
    </div>
  `).join('');

  // Gắn lại sự kiện checkbox
  document.querySelectorAll('.select-item').forEach(cb => {
    cb.addEventListener('change', function () {
      cart[this.dataset.index].checked = this.checked;
      saveCart();
      updateSummary();
      updateCartBadge();
    });
  });

  updateSummary();
  updateCartBadge(); // Cập nhật badge mỗi khi render
}

// Cập nhật số lượng
function updateQuantity(index, change) {
  cart[index].quantity = Math.max(1, cart[index].quantity + change);
  saveCart();
  renderCart();
}

// Xóa sản phẩm
function removeItem(index) {
  if (confirm('Xóa sản phẩm này khỏi giỏ hàng?')) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
  }
}

// Cập nhật tổng tiền
function updateSummary() {
  const checkedItems = cart.filter(item => item.checked);
  const subtotal = checkedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 0 ? 30000 : 0;
  const total = subtotal + shipping;

  document.getElementById('subtotal').textContent = subtotal.toLocaleString('vi-VN') + ' ₫';
  document.getElementById('total').textContent = total.toLocaleString('vi-VN') + ' ₫';
  document.getElementById('payBtn').disabled = checkedItems.length === 0;
}

// Cập nhật badge số lượng trên menu (nếu có)
function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (badge) {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalQty;
    badge.style.display = totalQty > 0 ? 'flex' : 'none';
  }
}

// ==================== LOAD + SAVE THÔNG TIN KHÁCH HÀNG ====================
async function loadCustomerInfo() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Vui lòng đăng nhập!');
    window.location.href = 'LogReg.html';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/customer`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) return;

    const customers = await res.json();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    currentCustomer = customers.find(c => c.userId === user?.userID);

    if (currentCustomer) {
      document.getElementById('fullName').value = currentCustomer.name || '';
      document.getElementById('phone').value = currentCustomer.phoneNumber || '';
      document.getElementById('email').value = currentCustomer.email || '';
      document.getElementById('address').value = currentCustomer.address || '';
    }
  } catch (err) {
    console.log("Không tải được thông tin khách hàng:", err);
  }
}

async function saveCustomerInfo() {
  const name = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const address = document.getElementById('address').value.trim();

  if (!name || !phone || !address) {
    alert('Vui lòng điền đầy đủ Họ tên, SĐT và Địa chỉ!');
    return false;
  }

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('currentUser'));
  const data = { name, phoneNumber: phone, email: email || null, address, userId: user?.userID };

  try {
    if (currentCustomer) {
      await fetch(`${API_BASE}/customer/${currentCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(data)
      });
    }
    return true;
  } catch (err) {
    alert('Lỗi lưu thông tin khách hàng!');
    return false;
  }
}

// ==================== TẠO ĐƠN HÀNG ====================
async function createRealOrder() {
  const checked = cart.filter(i => i.checked);
  if (checked.length === 0) return alert('Chọn ít nhất 1 sản phẩm!');

  if (!(await saveCustomerInfo())) return;

  const items = checked.map(p => ({
    productId: p.id,
    quantity: p.quantity
  }));

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({
        customerId: currentCustomer.id,
        items
      })
    });

    if (res.ok) {
      const result = await res.json();
      alert(`Đặt hàng thành công! Mã đơn: ${result.orderId || result.id}`);
      localStorage.setItem("selectedOrderId", result.orderId || result.id);

      // Xóa các món đã đặt khỏi giỏ
      cart = cart.filter(i => !i.checked);
      saveCart();
      renderCart();

      window.location.href = "OrderDetail.html";
    } else {
      const err = await res.text();
      alert('Lỗi: ' + err);
    }
  } catch (err) {
    alert('Lỗi kết nối server!');
  }
}

document.getElementById('payBtn').addEventListener('click', createRealOrder);

// ==================== KHỞI ĐỘNG TRANG ====================
loadCart();           // <-- QUAN TRỌNG: Load giỏ hàng theo user trước
renderCart();         // <-- Sau đó mới render
loadCustomerInfo();   // <-- Load thông tin khách hàng
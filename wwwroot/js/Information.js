const API_BASE = 'http://localhost:5114/api';

document.addEventListener('DOMContentLoaded', async () => {
  // Kiểm tra đăng nhập
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Vui lòng đăng nhập để xem thông tin cá nhân!');
    window.location.href = 'LogReg.html';
    return;
  }

  // Load thông tin khách hàng
  await loadCustomerInfo();

  // Cập nhật badge giỏ hàng
  updateCartBadge();

  // Xử lý form submit
  document.getElementById('infoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveCustomerInfo();
  });
});

async function loadCustomerInfo() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/customer`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) throw new Error('Không tải được dữ liệu');

    const customers = await res.json();
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const customer = customers.find(c => c.userId === user.userID);

    if (customer) {
      document.getElementById('fullName').value = customer.name || '';
      document.getElementById('phone').value = customer.phoneNumber || '';
      document.getElementById('email').value = customer.email || '';
      document.getElementById('address').value = customer.address || '';
    }
  } catch (err) {
    console.error(err);
    alert('Lỗi tải thông tin. Vui lòng thử lại!');
  }
}

async function saveCustomerInfo() {
  const name = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const address = document.getElementById('address').value.trim();

  if (!name || !phone || !address) {
    alert('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ!');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const payload = {
      name,
      phoneNumber: phone,
      email: email || null,
      address,
      userId: user.userID
    };

    // Lấy danh sách để tìm ID (vì PUT cần ID)
    const listRes = await fetch(`${API_BASE}/customer`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const customers = await listRes.json();
    const existing = customers.find(c => c.userId === user.userID);

    let method = 'POST';
    let url = `${API_BASE}/customer`;
    if (existing) {
      method = 'PUT';
      url = `${API_BASE}/customer/${existing.id}`;
    }

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      document.getElementById('successMsg').style.display = 'block';
      setTimeout(() => {
        document.getElementById('successMsg').style.display = 'none';
      }, 4000);
    } else {
      throw new Error('Cập nhật thất bại');
    }
  } catch (err) {
    console.error(err);
    alert('Lỗi cập nhật thông tin. Vui lòng thử lại!');
  }
}

// Cập nhật badge giỏ hàng (giống Cart.js)
function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (!badge) return;

  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (user.userID) {
    const userCart = JSON.parse(localStorage.getItem(`cart_${user.userID}`) || '[]');
    const total = userCart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
  }
}
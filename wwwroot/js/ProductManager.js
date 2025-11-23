const API = "http://localhost:5114/api/product";
let products = [];
let editId = null;

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: #ef4444; color: white; padding: 12px 24px; border-radius: 8px;
        z-index: 9999; font-size: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============ BẢO VỆ TRANG ADMIN – PHIÊN BẢN HOÀN HẢO ============
(function checkAdminAccess() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const token = localStorage.getItem('token');

    if (!token || !user || user.role !== 'Admin') {
        // Xóa hết nội dung trang ngay lập tức
        document.body.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px;font-family:sans-serif;">
                <h2 style="color:#ef4444;">
                    ${!token || !user ? 'Bạn cần đăng nhập!' : 'Bạn không có quyền truy cập trang này!'}
                </h2>
                <p>Đang chuyển hướng...</p>
            </div>
        `;

        setTimeout(() => {
            window.location.href = (!token || !user) ? 'LogReg.html' : 'Product.html';
        }, 1500);

        // DỪNG HOÀN TOÀN việc thực thi JS phía dưới
        throw new Error('Stop script execution');
    }

    console.log('Chào Admin:', user.role);
})();

// Load danh sách sản phẩm khi mở trang
async function loadProducts() {
  try {
    const res = await fetch(API, {
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      }
    });

    if (!res.ok) throw new Error("Không tải được danh sách sản phẩm");
    
    products = await res.json();
    renderTable();
  } catch (err) {
    console.error(err);
    alert("Lỗi kết nối server. Vui lòng kiểm tra lại!");
  }
}

// Hiển thị bảng sản phẩm
function renderTable() {
  const tbody = document.getElementById("productList");
  tbody.innerHTML = "";

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 3rem; color: #94a3b8;">Chưa có sản phẩm nào</td></tr>`;
    return;
  }

  products.forEach(p => {
    const tr = document.createElement("tr");

    // Đường dẫn ảnh: /Images/{id}.jpg
    const imageUrl = p.id ? `/Images/${p.id}.jpg` : 'https://via.placeholder.com/80';

    tr.innerHTML = `
      <td data-label="Ảnh">
        <img src="${imageUrl}?t=${Date.now()}" 
             class="product-img" 
             alt="${p.name}" 
             onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
      </td>
      <td data-label="Tên"><strong>${p.name || 'Chưa đặt tên'}</strong></td>
      <td data-label="Giá" class="price">${Number(p.price).toLocaleString('vi-VN')} ₫</td>
      <td data-label="Mô tả">${p.description || '<em style="color:#94a3b8">Chưa có mô tả</em>'}</td>
      <td data-label="Số lượng"><strong>${p.stock}</strong></td>
      <td data-label="Chức năng" class="actions">
        <button class="btn btn-edit" onclick="editProduct(${p.id})">Sửa</button>
        <button class="btn btn-danger" onclick="deleteProduct(${p.id})">Xóa</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Thêm hoặc cập nhật sản phẩm
async function addOrUpdateProduct() {
  const name = document.getElementById("name").value.trim();
  const price = document.getElementById("price").value;
  const description = document.getElementById("description").value.trim();
  const stock = document.getElementById("quantity").value;
  const fileInput = document.getElementById("image");
  const file = fileInput.files[0];

  if (!name || !price || !stock) {
    alert("Vui lòng nhập đầy đủ Tên, Giá và Số lượng!");
    return;
  }

  const formData = new FormData();
  formData.append("Name", name);
  formData.append("Price", price);
  formData.append("Description", description);
  formData.append("Stock", stock);
  if (file) formData.append("file", file);

  try {
    let url = API;
    let method = "POST";

    if (editId !== null) {
      url += `/${editId}`;
      method = "PUT";
    }

    const res = await fetch(url, {
      method,
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: formData
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Lỗi khi lưu sản phẩm");
    }

    // Thành công
    alert(editId ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm thành công!");
    editId = null;
    document.getElementById("addBtn").textContent = "Thêm sản phẩm";
    clearForm();
    await loadProducts(); // Reload để cập nhật ảnh mới

  } catch (err) {
    console.error(err);
    alert("Lỗi: " + err.message);
  }
}

// Sửa sản phẩm – điền dữ liệu vào form
function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  document.getElementById("name").value = p.name;
  document.getElementById("price").value = p.price;
  document.getElementById("description").value = p.description || "";
  document.getElementById("quantity").value = p.stock;

  editId = id;
  document.getElementById("addBtn").textContent = "Cập nhật sản phẩm";

  // Hiển thị ảnh hiện tại (preview)
  document.querySelectorAll(".current-preview").forEach(el => el.remove());
  if (p.id) {
    const preview = document.createElement("img");
    preview.src = `/Images/${p.id}.jpg?t=${Date.now()}`;
    preview.className = "current-preview";
    preview.onerror = function() { this.src = "https://via.placeholder.com/120?text=Ảnh+gốc"; };
    document.querySelector(".file-input-wrapper").appendChild(preview);
  }
}

// Xóa sản phẩm
async function deleteProduct(id) {
  if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này? Hành động không thể hoàn tác!")) return;

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      }
    });

    if (!res.ok) throw new Error("Xóa thất bại");

    alert("Xóa sản phẩm thành công!");
    await loadProducts();
  } catch (err) {
    alert("Lỗi khi xóa: " + err.message);
  }
}

// Xóa form
function clearForm() {
  document.getElementById("name").value = "";
  document.getElementById("price").value = "";
  document.getElementById("description").value = "";
  document.getElementById("quantity").value = "";
  document.getElementById("image").value = "";
  document.querySelectorAll(".current-preview").forEach(el => el.remove());

  editId = null;
  document.getElementById("addBtn").textContent = "Thêm sản phẩm";
}

// === Khởi chạy khi trang load ===
document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addBtn");
  addBtn.addEventListener("click", addOrUpdateProduct);

  // Load danh sách sản phẩm ngay khi mở trang
  loadProducts();
  // === Thêm đoạn xử lý hiển thị tên file ===
  const fileInput = document.getElementById("image");
  const fileLabel = document.querySelector(".file-input-label");

  fileInput.addEventListener("change", function() {
    if (this.files && this.files.length > 0) {
      let fileName = this.files[0].name;
      // Rút gọn nếu tên quá dài
      if (fileName.length > 25) {
        const ext = fileName.split('.').pop();
        fileName = fileName.slice(0, 22) + '...' + ext;
      }
      fileLabel.textContent = fileName;
    } else {
      fileLabel.textContent = "Chọn ảnh sản phẩm"; // Reset nếu xóa file
    }
  });
});

// Export hàm global để onclick trong HTML gọi được
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
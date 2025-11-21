// ============= Load sản phẩm từ API =============
async function loadProducts() {
  const list = document.getElementById("product-list");
  list.innerHTML = "<h3>Đang tải sản phẩm...</h3>";

  try {
    const res = await fetch("http://localhost:5114/api/product");

    if (!res.ok) {
      list.innerHTML = "<h3>Không thể tải danh sách sản phẩm.</h3>";
      return;
    }

    const data = await res.json(); // list sản phẩm từ SQL

    list.innerHTML = "";

    data.forEach(p => {
      const imageUrl = `http://localhost:5114/Images/${p.id}.jpg`;

      list.innerHTML += `
        <div class="card">
          <img src="${imageUrl}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x200';" />
          
          <h3>${p.name}</h3>

          <div class="price">${p.price.toLocaleString()} đ</div>

          <div class="desc">${p.description || "Không có mô tả"}</div>

          <div class="stock">
            Tồn kho: 
            ${
              p.stock > 0
                ? p.stock
                : "<span style='color:red'>Hết hàng</span>"
            }
          </div>

          <button onclick="addToCart(${p.id}, '${p.name}', ${p.price}, '${imageUrl}')" 
            ${p.stock === 0 ? "disabled" : ""}>
            Thêm vào giỏ
          </button>
        </div>
      `;
    });

  } catch (err) {
    console.error("Lỗi tải sản phẩm:", err);
    list.innerHTML = "<h3>Có lỗi xảy ra khi tải sản phẩm.</h3>";
  }
}

loadProducts();

// ================== Giỏ hàng ==================
function addToCart(id, name, price, imageUrl) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const exist = cart.find(x => x.id === id);

  if (exist) {
    exist.quantity += 1;
  } else {
    cart.push({
      id,
      name,
      price,
      imageUrl,
      quantity: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert(`Đã thêm "${name}" vào giỏ hàng!`);
}

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

    const data = await res.json();
    list.innerHTML = "";

    data.forEach(p => {
      const imageUrl = `http://localhost:5114/Images/${p.id}.jpg`;

      // Giới hạn mô tả: chỉ 60 ký tự đầu + ...
      const maxLength = 60;
      const shortDesc = p.description && p.description.length > maxLength
        ? p.description.slice(0, maxLength) + "..."
        : p.description || "Không có mô tả";

      // Card
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${imageUrl}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x200';" />
        <h3>${p.name}</h3>
        <div class="price">${p.price.toLocaleString()} đ</div>
        <div class="desc" id="desc-${p.id}">
          ${shortDesc}
          ${p.description && p.description.length > maxLength
            ? `<span class="toggle-btn" id="toggle-${p.id}">Xem thêm</span>`
            : ""}
        </div>
        <div class="stock">
          Tồn kho: ${p.stock > 0 ? p.stock : "<span style='color:red'>Hết hàng</span>"}
        </div>
        <button onclick="addToCart(${p.id}, '${p.name}', ${p.price}, '${imageUrl}')" 
          ${p.stock === 0 ? "disabled" : ""}>
          Thêm vào giỏ
        </button>
      `;
      list.appendChild(card);

      // Gắn sự kiện Xem thêm / Rút gọn
      if (p.description && p.description.length > maxLength) {
        const toggleBtn = document.getElementById(`toggle-${p.id}`);
        const descDiv = document.getElementById(`desc-${p.id}`);
        let expanded = false;

        toggleBtn.addEventListener("click", () => {
          if (!expanded) {
            descDiv.innerHTML = `${p.description} <span class="toggle-btn">Rút gọn</span>`;
          } else {
            descDiv.innerHTML = `${shortDesc} <span class="toggle-btn">Xem thêm</span>`;
          }

          // gắn lại sự kiện sau khi đổi nội dung
          const newBtn = descDiv.querySelector(".toggle-btn");
          newBtn.addEventListener("click", toggleBtn.click.bind(toggleBtn));
          expanded = !expanded;
        });
      }
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

const apiBase = "http://localhost:5114/api";

const orderId = localStorage.getItem("selectedOrderId");

// Nếu không có id → báo lỗi
if (!orderId) {
  alert("Không tìm thấy ID đơn hàng!");
}


// Hàm load dữ liệu đơn hàng
async function loadOrderDetail() {
  try {
    // 1) Gọi API lấy đơn hàng
    const resOrder = await fetch(`${apiBase}/orders/${orderId}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (!resOrder.ok) {
      document.body.innerHTML = "<h2>Không thể tải đơn hàng</h2>";
      return;
    }

    const order = await resOrder.json();

    // 2) Gọi API lấy thông tin customer
    const resCustomer = await fetch(`${apiBase}/customer/${order.customerId}`);
    const customer = await resCustomer.json();

    // ---- Fill thông tin đơn hàng ----
    document.querySelector(".order-id").textContent = `Đơn hàng #${order.id}`;
    document.querySelector(".order-status").textContent = order.status;
    document.querySelector(".order-status").classList.add(order.status === "Đã giao" ? "success" : "pending");

    document.querySelector(".order-info .info-row:nth-child(1) strong").textContent = customer.name;
    document.querySelector(".order-info .info-row:nth-child(2) strong").textContent = new Date(order.orderDate).toLocaleString();
    document.querySelector(".order-info .info-row:nth-child(4) strong").textContent = customer.address;

    // --- Hiển thị sản phẩm ---
    const itemsContainer = document.querySelector(".order-items");
    itemsContainer.innerHTML = "<h3>Sản phẩm đã mua</h3>";

    let totalMoney = 0;

    for (const item of order.items) {

      // Gọi API lấy sản phẩm
      const resProduct = await fetch(`${apiBase}/product/${item.productId}`);
      const product = await resProduct.json();

      const imgUrl = `http://localhost:5114/Images/${product.id}.jpg`;

      const itemHtml = `
        <div class="item">
          <img src="${imgUrl}" onerror="this.src='https://via.placeholder.com/80'" />

          <div class="item-details">
            <h4>${product.name}</h4>
            <p>Số lượng: <strong>${item.quantity}</strong> × ${Number(item.unitPrice).toLocaleString()} ₫</p>
          </div>

          <div class="item-total">${(item.unitPrice * item.quantity).toLocaleString()} ₫</div>
        </div>
      `;

      itemsContainer.insertAdjacentHTML("beforeend", itemHtml);

      totalMoney += item.quantity * item.unitPrice;
    }

    // ---- Tổng tiền ----
    document.querySelector(".summary-row:nth-child(1) strong").textContent =
      totalMoney.toLocaleString() + " ₫";
    document.querySelector(".final-total").textContent =
      (totalMoney + 30000).toLocaleString() + " ₫";

  } catch (err) {
    console.log(err);
  }
}

loadOrderDetail();
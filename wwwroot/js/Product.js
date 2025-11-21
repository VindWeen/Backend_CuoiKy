// Demo data — sau này bạn có thể fetch API backend
const products = [
  {
    name: "Áo thun form rộng",
    price: "199.000đ",
    desc: "Chất cotton mềm, thoáng mát.",
    qty: 12,
    img: "https://via.placeholder.com/300x200"
  },
  {
    name: "Giày thể thao",
    price: "890.000đ",
    desc: "Êm chân, phù hợp chạy bộ.",
    qty: 0,
    img: "https://via.placeholder.com/300x200"
  },
  {
    name: "Túi đeo chéo",
    price: "320.000đ",
    desc: "Chống nước tốt, tiện lợi.",
    qty: 7,
    img: "https://via.placeholder.com/300x200"
  },
  {
    name: "Mũ lưỡi trai",
    price: "150.000đ",
    desc: "Phong cách trẻ trung.",
    qty: 20,
    img: "https://via.placeholder.com/300x200"
  }
];

function renderProducts() {
  const list = document.getElementById("product-list");
  list.innerHTML = "";

  products.forEach((p, i) => {
    list.innerHTML += `
      <div class="card">
        <img src="${p.img}" alt="${p.name}" />
        <h3>${p.name}</h3>
        <div class="price">${p.price}</div>
        <div class="desc">${p.desc}</div>
        <div class="stock">Tồn kho: ${p.qty > 0 ? p.qty : "<span style='color:red'>Hết hàng</span>"}</div>
        <button onclick="addToCart(${i})" ${p.qty === 0 ? "disabled" : ""}>
          Thêm vào giỏ
        </button>
      </div>
    `;
  });
}

function addToCart(i) {
  alert(`Đã thêm "${products[i].name}" vào giỏ hàng!`);
}

renderProducts();

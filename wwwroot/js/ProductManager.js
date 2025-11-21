let products = [
  { name: "Sản phẩm 1", price: "490.000đ", desc: "Mô tả mẫu", qty: 10, img: "https://via.placeholder.com/80" },
  { name: "Sản phẩm 2", price: "690.000đ", desc: "Mô tả mẫu", qty: 5, img: "https://via.placeholder.com/80" },
];

let editIndex = null;

function renderTable() {
  const table = document.getElementById("product-table");
  table.innerHTML = "";

  products.forEach((p, i) => {
    table.innerHTML += `
      <tr>
        <td><img src="${p.img}" width="70" /></td>
        <td>${p.name}</td>
        <td>${p.price}</td>
        <td>${p.desc}</td>
        <td>${p.qty}</td>
        <td>
          <button class="action-btn edit" onclick="editProduct(${i})">Sửa</button>
          <button class="action-btn delete" onclick="deleteProduct(${i})">Xoá</button>
        </td>
      </tr>
    `;
  });
}

function addProduct() {
  const name = document.getElementById("name").value;
  const price = document.getElementById("price").value;
  const desc = document.getElementById("desc").value;
  const qty = document.getElementById("qty").value;
  const file = document.getElementById("img").files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      saveProduct(name, price, desc, qty, e.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    saveProduct(name, price, desc, qty, "");
  }
}

function saveProduct(name, price, desc, qty, img) {
  if (editIndex !== null) {
    products[editIndex] = { 
      name, 
      price, 
      desc, 
      qty, 
      img: img || products[editIndex].img 
    };
    editIndex = null;
    alert("Cập nhật thành công!");
  } else {
    products.push({ name, price, desc, qty, img });
    alert("Thêm sản phẩm thành công!");
  }

  document.getElementById("name").value = "";
  document.getElementById("price").value = "";
  document.getElementById("desc").value = "";
  document.getElementById("qty").value = "";
  document.getElementById("img").value = "";

  renderTable();
}

function editProduct(i) {
  document.getElementById("name").value = products[i].name;
  document.getElementById("price").value = products[i].price;
  document.getElementById("desc").value = products[i].desc;
  document.getElementById("qty").value = products[i].qty;

  editIndex = i;
}

function deleteProduct(i) {
  if (confirm("Bạn có chắc muốn xoá sản phẩm?")) {
    products.splice(i, 1);
    renderTable();
  }
}

renderTable();

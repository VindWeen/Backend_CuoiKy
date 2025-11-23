// ================= Hiệu ứng trượt Form =================
const container = document.getElementById('container');
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');

signUpButton.addEventListener('click', () => {
  container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
  container.classList.remove("right-panel-active");
});

// ================= Register =================
document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const fullName = document.getElementById('regFullName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const address = document.getElementById('regAddress').value.trim();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;

  if (!fullName || !email || !phone || !address || !username || !password) {
    alert('Vui lòng điền đầy đủ thông tin!');
    return;
  }

  try {
    // Bước 1: Tạo User (AuthController)
    const authRes = await fetch('http://localhost:5114/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username,
        password: password,
        role: "Customer"
      })
    });

    if (!authRes.ok) {
      const err = await authRes.text();
      alert('Đăng ký thất bại: ' + err);
      return;
    }

    const authData = await authRes.json();
    const userId = authData.userId;

    // Bước 2: Tạo Customer (CustomerController)
    const custRes = await fetch('http://localhost:5114/api/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fullName,
        email: email,
        phonenumber: phone,
        address: address,
        userid: userId
      })
    });

    if (custRes.ok) {
      alert(`Đăng ký thành công! Chào mừng ${fullName} đến với cửa hàng!`);
      document.getElementById('registerForm').reset();
      container.classList.remove("right-panel-active");
    } else {
      const err = await custRes.text();
      alert('Lưu thông tin khách hàng thất bại: ' + err);
    }

  } catch (err) {
    console.error(err);
    alert('Lỗi kết nối server!');
  }
});

// ================= Login =================
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch('http://localhost:5114/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      const data = await response.json();

      alert(`Đăng nhập thành công! Xin chào ${username}`);

      // Lưu token + thông tin
      localStorage.setItem('token', data.token);
      localStorage.setItem('currentUser', JSON.stringify({
        userID: data.userID,
        customerID: data.customerId,
        role: data.role
      }));

      // Chuyển hướng theo role
      if (data.role === "Admin") {
        window.location.href = 'ProductManager.html';
      } else {
        window.location.href = 'Product.html'; //trang cho customer
      }
    } else {
      const error = await response.text();
      alert('Sai thông tin đăng nhập: ' + error);
    }
  } catch (err) {
    console.error(err);
    alert('Có lỗi xảy ra khi đăng nhập.');
  }

  document.getElementById('loginForm').reset();
});

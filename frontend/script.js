const productList = document.getElementById("productList");
const translations = {
  tr: {
    brand: "Marka",
    price: "Fiyat",
    stock: "Stok",
    inStock: "Var",
    outOfStock: "Yok",
    addToCart: "SEPETE EKLE",
    cart: "Sepetiniz boş",
    total: "Toplam",
    checkout: "Satın Al",
    emptyCart: "Sepetiniz boş",
  },
  fr: {
    brand: "Marque",
    price: "Prix",
    stock: "Stock",
    inStock: "En stock",
    outOfStock: "Rupture",
    addToCart: "AJOUTER AU PANIER",
    cart: "Votre panier est vide",
    total: "Total",
    checkout: "Acheter",
    emptyCart: "Votre panier est vide",
  },
  nl: {
    brand: "Merk",
    price: "Prijs",
    stock: "Voorraad",
    inStock: "Op voorraad",
    outOfStock: "Niet op voorraad",
    addToCart: "IN WINKELWAGEN",
    cart: "Uw winkelwagen is leeg",
    total: "Totaal",
    checkout: "Afrekenen",
    emptyCart: "Uw winkelwagen is leeg",
  },
  en: {
    brand: "Brand",
    price: "Price",
    stock: "Stock",
    inStock: "In stock",
    outOfStock: "Out of stock",
    addToCart: "ADD TO CART",
    cart: "Your cart is empty",
    total: "Total",
    checkout: "Checkout",
    emptyCart: "Your cart is empty",
  }
};

// Mevcut dili localStorage'dan yükle veya TR varsayılan yap
let currentLang = localStorage.getItem("lang") || "tr";
document.getElementById("languageSelect").value = currentLang;

// Dil değiştiğinde sayfayı çevir
document.getElementById("languageSelect").addEventListener("change", (e) => {
  currentLang = e.target.value;
  localStorage.setItem("lang", currentLang);
  renderProducts(allProducts);
  updateCartDisplay();
});

const searchInput = document.getElementById("searchInput");
let allProducts = [];

// LocalStorage'dan sepeti yükle
let cart = JSON.parse(localStorage.getItem("cart")) || [];



// Ürünleri getir
async function fetchProducts() {
  try {
    const response = await fetch("https://belclim-all.onrender.com");
    if (!response.ok) throw new Error("Sunucudan ürünler alınamadı");

    allProducts = await response.json();
    renderProducts(allProducts);
  } catch (error) {
    productList.innerHTML = `<p style="color:red;">${error.message}</p>`;
  }
}

// Görsel fallback
function getImageUrl(p) {
  if (p.imageUrl && p.imageUrl.trim()) {
    if (p.imageUrl.startsWith("http")) {
      return p.imageUrl;
    } else {
      return `https://belclim-all.onrender.com/uploads/${p.imageUrl}`;
    }
  } else {
    return "https://via.placeholder.com/800x600?text=No+Image";
  }
}

function renderProducts(products) {
  productList.innerHTML = "";
  products.forEach((product) => {
    const existingItem = cart.find((item) => item._id === product._id);
    const quantity = existingItem ? existingItem.quantity : 0;

    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <img src="${getImageUrl(product)}" alt="${product.name}" class="product-img" />
      <h2><a href="product.html?id=${product._id}">${product.name}</a></h2>
      <p>${translations[currentLang].brand}: ${product.brand || "-"}</p>
      <p>${translations[currentLang].price}: ${product.price} €</p>
      <p>${translations[currentLang].stock}: ${product.inStock ? translations[currentLang].inStock : translations[currentLang].outOfStock}</p>
      <div class="product-actions">
        <button onclick='addToCart("${product._id}")'>${translations[currentLang].addToCart}</button>
        <span class="product-qty" id="qty-${product._id}" style="display:${quantity > 0 ? 'inline-block' : 'none'}">${quantity}</span>
      </div>
    `;
    productList.appendChild(div);
  });
}
// Arama filtresi
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = allProducts.filter((p) =>
    p.name.toLowerCase().includes(query)
  );
  renderProducts(filtered);
});

// Sepete ürün ekle
function addToCart(productId) {
  const existingItem = cart.find((item) => item._id === productId);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    const selectedProduct = allProducts.find((p) => p._id === productId);
    if (selectedProduct) {
      cart.push({ ...selectedProduct, quantity: 1 });
    }
  }
  updateCartDisplay();

  // Sayaç güncelle
  const qtyElement = document.getElementById(`qty-${productId}`);
  if (qtyElement) {
    const item = cart.find((p) => p._id === productId);
    if (item && item.quantity > 0) {
      qtyElement.textContent = item.quantity;
      qtyElement.style.display = "inline-block";
    } else {
      qtyElement.style.display = "none";
    }
  }
}
function updateCartDisplay() {
  const cartList = document.getElementById("cartList");
  if (cartList) {
    cartList.innerHTML = "";

    cart.forEach((item) => {
      const li = document.createElement("li");
      li.className = "cart-item"; // yeni class ekliyoruz

      li.innerHTML = `
        <div class="cart-item-left">
          <img src="${getImageUrl(item)}" alt="${item.name}" class="cart-item-img"/>
          <span class="cart-item-name">${item.name}</span>
        </div>
        <div class="cart-item-right">
          <span class="cart-item-price">${item.price} €</span>
          <div class="cart-item-qty">
            <button class="qty-btn minus" onclick="decreaseQuantity('${item._id}')">−</button>
            <span>${item.quantity}</span>
            <button class="qty-btn plus" onclick="increaseQuantity('${item._id}')">+</button>
          </div>
          <button class="remove-btn" onclick="removeFromCart('${item._id}')">✕</button>
        </div>
      `;
      cartList.appendChild(li);
    });

    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    document.getElementById("cartTotal").textContent = `Toplam: ${total.toFixed(2)} €`;
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  const cartCount = document.getElementById("cart-count");
  if (cartCount) {
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalQuantity;
  }
}



function updateCartPreview() {
  if (!cartCount || !cartPreview) return; // Bu HTML yoksa atla

  cartCount.textContent = cart.length;
  cartPreview.innerHTML = "";

  if (cart.length === 0) {
    cartPreview.innerHTML = `<li>${translations[currentLang].emptyCart}</li>`;
    return;
  }

  cart.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <img src="${getImageUrl(item)}" alt="${
      item.name
    }" style="width:40px; height:40px; object-fit:cover; margin-right:5px;">
      ${item.name} (${item.quantity}x)
    `;
    cartPreview.appendChild(li);
  });
}

// Miktar artır
function increaseQuantity(productId) {
  const item = cart.find((p) => p._id === productId);
  if (item) {
    item.quantity++;
    updateCartDisplay();
  }
}

function decreaseQuantity(productId) {
  const item = cart.find((p) => p._id === productId);
  if (item && item.quantity > 1) {
    item.quantity--;
  } else {
    cart = cart.filter((p) => p._id !== productId);
  }
  updateCartDisplay();

  // Sayaç güncelle
  const qtyElement = document.getElementById(`qty-${productId}`);
  if (qtyElement) {
    const updatedItem = cart.find((p) => p._id === productId);
    if (updatedItem && updatedItem.quantity > 0) {
      qtyElement.textContent = updatedItem.quantity;
    } else {
      qtyElement.style.display = "none";
    }
  }
}

function removeFromCart(productId) {
  cart = cart.filter((p) => p._id !== productId);
  updateCartDisplay();

  // Sayaç tamamen silindi
  const qtyElement = document.getElementById(`qty-${productId}`);
  if (qtyElement) qtyElement.style.display = "none";
}

// Sipariş gönder
const checkoutBtn = document.getElementById("checkoutBtn");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", async () => {
    if (cart.length === 0) {
      alert("Sepetiniz boş!");
      return;
    }

    const orderData = {
      items: cart.map(({ _id, name, price, quantity }) => ({
        productId: _id,
        name,
        price,
        quantity,
      })),
      totalPrice: cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    };

    try {
      const response = await fetch("https://belclim-all.onrender.com/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert("Sipariş gönderilemedi: " + error.message);
        return;
      }

      const data = await response.json();
      alert(`Siparişiniz alındı! Sipariş ID: ${data.orderId}`);

      cart = [];
      updateCartDisplay();
    } catch (error) {
      alert("Sipariş gönderilirken hata oluştu.");
      console.error(error);
    }
  });
}

// PayPal butonları (sadece ödeme sayfasında çalışır)
if (document.getElementById("paypal-button-container")) {
  paypal
    .Buttons({
      createOrder: function (data, actions) {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: cart
                  .reduce((sum, item) => sum + item.price * item.quantity, 0)
                  .toFixed(2),
              },
            },
          ],
        });
      },
      onApprove: function (data, actions) {
        return actions.order.capture().then(function (details) {
          alert("Ödeme tamamlandı: " + details.payer.name.given_name);
          cart = [];
          updateCartDisplay();
        });
      },
      onError: function (err) {
        console.error(err);
        alert("Ödeme sırasında bir hata oluştu.");
      },
    })
    .render("#paypal-button-container");
}

// Sayfa yüklendiğinde ürünleri ve sepeti göster
window.onload = () => {
  fetchProducts();
  updateCartDisplay();
};
// Butonu seç
const backToTopBtn = document.getElementById("backToTopBtn");

// Sayfa kaydırıldığında kontrol et
window.onscroll = function () {
  if (
    document.body.scrollTop > 300 ||
    document.documentElement.scrollTop > 300
  ) {
    backToTopBtn.style.display = "block"; // 300px’den fazla kaydırınca göster
  } else {
    backToTopBtn.style.display = "none"; // Yukarı gelince gizle
  }
};

// Butona tıklandığında sayfayı yukarı kaydır
backToTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});
const cartIconWrapper = document.getElementById("cart-icon-wrapper");
const cartPanel = document.getElementById("cart");

// Sepet ikonuna tıklayınca aç/kapat
cartIconWrapper.addEventListener("click", (e) => {
  e.stopPropagation(); // başka tıklamaları engelle
  cartPanel.classList.toggle("open"); // sınıfı aç/kapat
});


// Sayfanın başka bir yerine tıklanınca kapat
document.addEventListener("click", (e) => {
  if (!cartPanel.contains(e.target) && !cartIconWrapper.contains(e.target)) {
    cartPanel.classList.remove("open");
  }
});
// Sepet paneline tıklayınca panel kapanmasın
cartPanel.addEventListener("click", (e) => {
  e.stopPropagation();
});
// Tüm "Yukari Cik" butonları için
document.querySelectorAll("#backToTopBtn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation(); // tıklayınca sepet kapanmasın
  });
});

cart-item-left
// Tüm "Yukari Cik" butonları için
document.querySelectorAll(".cart-item-left").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation(); // tıklayınca sepet kapanmasın
  });
});
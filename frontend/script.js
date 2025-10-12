const API_URL = "https://belclim-all.onrender.com"; // Render URL'i

const productList = document.getElementById("productList");
const translations = {
  tr: { brand: "Marka", price: "Fiyat", stock: "Stok", inStock: "Var", outOfStock: "Yok", addToCart: "SEPETE EKLE", cart: "Sepetiniz boş", total: "Toplam", checkout: "Satın Al", emptyCart: "Sepetiniz boş" },
  fr: { brand: "Marque", price: "Prix", stock: "Stock", inStock: "En stock", outOfStock: "Rupture", addToCart: "AJOUTER AU PANIER", cart: "Votre panier est vide", total: "Total", checkout: "Acheter", emptyCart: "Votre panier est vide" },
  nl: { brand: "Merk", price: "Prijs", stock: "Voorraad", inStock: "Op voorraad", outOfStock: "Niet op voorraad", addToCart: "IN WINKELWAGEN", cart: "Uw winkelwagen is leeg", total: "Totaal", checkout: "Afrekenen", emptyCart: "Uw winkelwagen is leeg" },
  en: { brand: "Brand", price: "Price", stock: "Stock", inStock: "In stock", outOfStock: "Out of stock", addToCart: "ADD TO CART", cart: "Your cart is empty", total: "Total", checkout: "Checkout", emptyCart: "Your cart is empty" }
};

// Mevcut dili localStorage'dan yükle veya TR varsayılan yap
let currentLang = localStorage.getItem("lang") || "tr";
document.getElementById("languageSelect").value = currentLang;

document.getElementById("languageSelect").addEventListener("change", (e) => {
  currentLang = e.target.value;
  localStorage.setItem("lang", currentLang);
  renderProducts(allProducts);
  updateCartDisplay();
});

const searchInput = document.getElementById("searchInput");
let allProducts = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Ürünleri getir
async function fetchProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
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
    return p.imageUrl.startsWith("http") ? p.imageUrl : `${API_URL}/uploads/${p.imageUrl}`;
  } else {
    return "https://via.placeholder.com/800x600?text=No+Image";
  }
}

// Ürünleri render et
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
        <span class="product-qty" id="qty-${product._id}" style="display:${quantity>0?'inline-block':'none'}">${quantity}</span>
      </div>
    `;
    productList.appendChild(div);
  });
}

// Arama filtresi
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = allProducts.filter((p) => p.name.toLowerCase().includes(query));
  renderProducts(filtered);
});

// Sepete ekleme
function addToCart(productId) {
  const existingItem = cart.find((item) => item._id === productId);
  if (existingItem) existingItem.quantity++;
  else {
    const selectedProduct = allProducts.find((p) => p._id === productId);
    if (selectedProduct) cart.push({...selectedProduct, quantity:1});
  }
  updateCartDisplay();
  const qtyElement = document.getElementById(`qty-${productId}`);
  if (qtyElement) {
    const item = cart.find(p=>p._id===productId);
    if(item && item.quantity>0) { qtyElement.textContent=item.quantity; qtyElement.style.display="inline-block"; }
    else qtyElement.style.display="none";
  }
}

// Sepeti güncelle
function updateCartDisplay() {
  const cartList = document.getElementById("cartList");
  if(cartList){
    cartList.innerHTML="";
    cart.forEach((item)=>{
      const li=document.createElement("li");
      li.className="cart-item";
      li.innerHTML=`
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
    const total=cart.reduce((sum,item)=>sum+item.price*item.quantity,0);
    document.getElementById("cartTotal").textContent=`Toplam: ${total.toFixed(2)} €`;
  }
  localStorage.setItem("cart",JSON.stringify(cart));
  const cartCount=document.getElementById("cart-count");
  if(cartCount) cartCount.textContent=cart.reduce((sum,item)=>sum+item.quantity,0);
}

// Sipariş gönderme
const checkoutBtn=document.getElementById("checkoutBtn");
if(checkoutBtn){
  checkoutBtn.addEventListener("click",async()=>{
    if(cart.length===0){ alert("Sepetiniz boş!"); return; }
    const orderData={items:cart.map(({_id,name,price,quantity})=>({productId:_id,name,price,quantity})),totalPrice:cart.reduce((sum,item)=>sum+item.price*item.quantity,0)};
    try{
      const response=await fetch(`${API_URL}/api/orders`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(orderData)});
      if(!response.ok){ const error=await response.json(); alert("Sipariş gönderilemedi: "+error.message); return; }
      const data=await response.json();
      alert(`Siparişiniz alındı! Sipariş ID: ${data.orderId}`);
      cart=[]; updateCartDisplay();
    }catch(error){ alert("Sipariş gönderilirken hata oluştu."); console.error(error); }
  });
}

// PayPal ve diğer mevcut kodlar aynı kalacak...

window.onload = ()=>{ fetchProducts(); updateCartDisplay(); };

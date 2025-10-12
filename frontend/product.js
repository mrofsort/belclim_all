// URL'den ürün id'sini al
const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

const productDetailDiv = document.getElementById('product-detail');

// Görsel fallback fonksiyonu
function getImageUrl(p) {
  if (p.imageUrl && p.imageUrl.trim()) {
    if (p.imageUrl.startsWith('http')) {
      return p.imageUrl;
    } else {
      return `http://localhost:5000/uploads/${p.imageUrl}`;
    }
  } else {
    return 'https://via.placeholder.com/800x600?text=No+Image';
  }
}

if (!productId) {
  productDetailDiv.innerHTML = '<p>Geçersiz ürün ID.</p>';
} else {
  fetch(`http://localhost:5000/api/products/${productId}`)
    .then((res) => {
      if (!res.ok) throw new Error('Ürün bulunamadı');
      return res.json();
    })
    .then((product) => {
      productDetailDiv.innerHTML = `
        <img src="${getImageUrl(product)}" alt="${product.name}" style="max-width:400px; display:block; margin-bottom:20px;" />
        <h2>${product.name}</h2>
        <p><strong>Marka:</strong> ${product.brand || '-'}</p>
        <p><strong>Fiyat:</strong> ${product.price} €</p>
        <p><strong>Stok:</strong> ${product.inStock ? 'Stokta var' : 'Stokta yok'}</p>
        <p><strong>Açıklama:</strong> ${product.description || 'Yok'}</p>
      `;
    })
    .catch((err) => {
      productDetailDiv.innerHTML = `<p style="color:red;">Hata: ${err.message}</p>`;
    });
}

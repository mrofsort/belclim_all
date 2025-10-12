const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/productModel');

const PAYPAL_API_BASE =
  (process.env.PAYPAL_MODE === 'live')
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

// PayPal access token al
async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('PayPal token alınamadı: ' + err);
  }
  const data = await res.json();
  return data.access_token;
}

/**
 * POST /api/orders/paypal
 * Body: { orderId, items: [{productId, quantity}] }
 * - PayPal order’ı doğrular
 * - Sunucuda toplamı hesaplar, PayPal tutarıyla karşılaştırır
 * - Doğruysa siparişi DB'ye kaydeder
 */

router.post('/paypal', async (req, res) => {
  try {
    const { orderId, items } = req.body;
    if (!orderId || !items || !items.length) {
      return res.status(400).json({ message: 'Eksik veri.' });
    }

    // 1) Sunucuda toplamı hesapla (fiyat güvenliği)
    const ids = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: ids } });

    const productMap = new Map(products.map(p => [String(p._id), p]));
    let serverTotal = 0;
    const normalizedItems = [];

    for (const it of items) {
      const prod = productMap.get(String(it.productId));
      if (!prod) {
        return res.status(400).json({ message: 'Geçersiz ürün: ' + it.productId });
      }
      const lineTotal = Number(prod.price) * Number(it.quantity);
      serverTotal += lineTotal;

      normalizedItems.push({
        productId: prod._id,
        name: prod.name,
        price: prod.price,
        quantity: it.quantity
      });
    }

    serverTotal = Number(serverTotal.toFixed(2));

    // 2) PayPal order detayını doğrula (client capture ettiyse status "COMPLETED" olur)
    const accessToken = await getPayPalAccessToken();

    // Eğer client tarafında capture yapılmadıysa burada capture da yapabilirsiniz:
    // await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, { ... })
    // Biz mevcut details ile doğrulayacağız:
    const ppRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!ppRes.ok) {
      const errTxt = await ppRes.text();
      return res.status(400).json({ message: 'PayPal order getirilemedi', detail: errTxt });
    }

    const orderDetails = await ppRes.json();

    // 3) PayPal tutarı ve durum kontrolü
    const status = orderDetails.status; // APPROVED / COMPLETED
    // capture edilmişse captures altında amount gelir
    let paypalAmount = 0;

    // purchase_units[0].amount.value (APPROVED aşamasında)
    // veya CAPTURE sonrası captures[0].amount.value
    try {
      if (
        orderDetails.purchase_units &&
        orderDetails.purchase_units[0] &&
        orderDetails.purchase_units[0].payments &&
        orderDetails.purchase_units[0].payments.captures &&
        orderDetails.purchase_units[0].payments.captures[0]
      ) {
        paypalAmount = Number(orderDetails.purchase_units[0].payments.captures[0].amount.value);
      } else if (orderDetails.purchase_units && orderDetails.purchase_units[0]) {
        paypalAmount = Number(orderDetails.purchase_units[0].amount.value);
      }
    } catch (_) {}

    // Tutar karşılaştırma (küçük yuvarlama farkları için tolerans)
    const diff = Math.abs(Number(paypalAmount.toFixed(2)) - serverTotal);
    if (diff > 0.01) {
      return res.status(400).json({
        message: 'Tutar eşleşmiyor',
        paypalAmount,
        serverTotal
      });
    }

    if (!(status === 'COMPLETED' || status === 'APPROVED')) {
      return res.status(400).json({ message: 'PayPal order durumu geçersiz: ' + status });
    }

    // 4) DB'ye kaydet
    const order = await Order.create({
      items: normalizedItems,
      totalPrice: serverTotal,
      paypalOrderId: orderDetails.id,
      paypalStatus: status,
      payerEmail: orderDetails?.payer?.email_address,
      payerId: orderDetails?.payer?.payer_id
    });

    return res.status(201).json({
      message: 'Sipariş kaydedildi',
      orderId: order._id
    });
  } catch (err) {
    console.error('PayPal sipariş doğrulama hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});
// Tüm siparişleri listele (Admin)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Siparişler alınamadı", error: err.message });
  }
});

module.exports = router;

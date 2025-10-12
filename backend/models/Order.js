const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: String,
      price: Number,
      quantity: Number,
    }
  ],
  totalPrice: Number,

  // PayPal alanları
  paypalOrderId: String,
  paypalStatus: String,
  payerEmail: String,
  payerId: String,

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);

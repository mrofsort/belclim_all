const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: String,
  price: { type: Number, required: true },
  inStock: { type: Boolean, default: true },
  description: String,
  imageUrl: String          // 👈 YENİ
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

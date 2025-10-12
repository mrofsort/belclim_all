const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');

// Ürün ekle
router.post('/', async (req, res) => {
  try {
    const { name, brand, price, inStock, description, imageUrl } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Eksik alanlar var!' });
    }

    const newProduct = new Product({
      name,
      brand,
      price,
      inStock,
      description,
      imageUrl
    });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(400).json({ message: 'Ürün eklenemedi', error: err.message });
  }
});

// Tüm ürünleri getir
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Ürünler alınamadı', error: err.message });
  }
});
// Tüm ürünlerin resmini aynı anda güncelle
router.put('/set-image-all', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ message: 'imageUrl gerekli' });
    }

    const result = await Product.updateMany({}, { $set: { imageUrl } });
    res.json({
      message: `${result.modifiedCount} ürün güncellendi.`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ message: 'Ürünler güncellenemedi', error: err.message });
  }
});

// Belirli ürünü getir
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Ürün bulunamadı' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Ürün alınamadı', error: err.message });
  }
});

// Ürün güncelle
router.put('/:id', async (req, res) => {
  try {
    const { name, brand, price, inStock, description, imageUrl } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, brand, price, inStock, description, imageUrl },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: 'Ürün güncellenemedi', error: err.message });
  }
});
// Birden fazla ürünü aynı anda sil
router.delete('/bulk', async (req, res) => {
  try {
    let { ids } = req.body;

    // 1. Liste var mı ve array mi?
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Silinecek ürün ID listesi gerekli' });
    }

    // 2. Sadece geçerli ObjectId formatındaki ID'leri al
    ids = ids.filter(id => mongoose.Types.ObjectId.isValid(id));

    if (ids.length === 0) {
      return res.status(400).json({ message: 'Geçerli formatta ürün ID bulunamadı' });
    }

    // 3. Silme işlemi
    const result = await Product.deleteMany({ _id: { $in: ids } });

    res.json({
      message: `${result.deletedCount} ürün silindi.`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ message: 'Ürünler silinemedi', error: err.message });
  }
});

// Tüm ürünleri sil
/*router.delete('/', async (req, res) => {
  try {
    const result = await Product.deleteMany({});
    res.json({ message: `Tüm ürünler silindi (${result.deletedCount} adet)` });
  } catch (err) {
    res.status(500).json({ message: 'Tüm ürünler silinemedi', error: err.message });
  }
});*/


// Ürün sil
router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }
    res.json({ message: 'Ürün başarıyla silindi' });
  } catch (err) {
    res.status(500).json({ message: 'Ürün silinemedi', error: err.message });
  }
});

const mongoose = require('mongoose');



module.exports = router;

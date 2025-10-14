console.log("🚀 server.js başlatılıyor...");
require("dotenv").config();
console.log("MONGO_URI:", process.env.MONGO_URI);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const basicAuth = require("express-basic-auth");

const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

// ==================== 🌐 CORS AYARLARI ====================
app.use(
  cors({
    origin: ["https://belclim-all.onrender.com", "http://localhost:5500",  "https://www.belclim.eu","https://belclim-backend.onrender.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ==================== 🔧 MIDDLEWARE ====================
app.use(express.json());

// 📦 Ürün görselleri (backend içindeki uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 📌 İkonlar ve logolar (e-satis root içindeki icons)
app.use("/icons", express.static(path.join(__dirname, "../icon")));

// ==================== 🔐 ADMIN PANEL ====================
app.get(
  "/admin-orders.html",
  basicAuth({
    users: { admin: "1234" },
    challenge: true
  }),
  (req, res) => {
    res.sendFile(path.join(__dirname, "admin", "admin-orders.html"));
  }
);

// ==================== 🧾 API ROTALARI ====================

// 🧾 Sipariş rotası (şifre korumalı)
app.use(
  "/api/orders",
  basicAuth({
    users: { admin: "1234" },
    challenge: true
  }),
  orderRoutes
);

// 🛒 Ürün rotası (herkese açık)
app.use("/api/products", productRoutes);

// ==================== 🖼 FRONTEND SERVİS ====================
app.use(express.static(path.join(__dirname, "../frontend")));

// Ana sayfa isteği
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ==================== ⚙️ SUNUCU & DATABASE ====================
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB bağlantısı başarılı");
    app.listen(PORT, () => {
      console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
      console.log(`🌍 Backend aktif: https://belclim-backend.onrender.com`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB bağlantı hatası:", err.message);
    process.exit(1);
  });

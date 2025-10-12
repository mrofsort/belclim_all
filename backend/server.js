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

// Middleware
app.use(cors());
app.use(express.json());

// 📦 Ürün görselleri 
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// 📌 İkonlar ve logolar
app.use("/icons", express.static(path.join(__dirname, "../icons")));


// 📌 1. Admin HTML sayfasını şifreli servis et
app.get(
  "/admin-orders.html",
  basicAuth({
    users: { admin: "1234" }, // kullanıcı adı: şifre
    challenge: true
  }),
  (req, res) => {
    res.sendFile(path.join(__dirname, "admin", "admin-orders.html"));
  }
);

// 📌 2. /api/orders rotasını şifreli yap
app.use(
  "/api/orders",
  basicAuth({
    users: { admin: "1234" },
    challenge: true
  }),
  orderRoutes
);

// 📌 3. Diğer API rotaları
app.use("/api/products", productRoutes);

// 📌 4. Frontend klasörünü servis et (diğer HTML, JS, CSS dosyaları)
app.use(express.static(path.join(__dirname, "../frontend")));

// Basit kök endpoint
app.get("/", (req, res) => {
  res.send("E-Ticaret API çalışıyor!");
});

// Port
const PORT = process.env.PORT || 5000;

// DB bağlantısı ve sunucuyu başlat
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("✅ MongoDB bağlantısı başarılı");
    app.listen(PORT, () => {
      console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB bağlantı hatası:", err.message);
    process.exit(1);
  });

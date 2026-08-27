require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");

const app = express();

/* =====================================================
   CONFIG
===================================================== */

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI is missing from .env");
    process.exit(1);
}

/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(cors());

app.use(
    helmet({
        contentSecurityPolicy: false
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =====================================================
   STATIC FRONTEND
===================================================== */

const publicPath = path.join(__dirname, "public");

app.use(express.static(publicPath));

/* =====================================================
   DATABASE
===================================================== */

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");
    })
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:");
        console.error(err.message);
    });

/* =====================================================
   ROUTES
===================================================== */

try {
    const authRoutes = require("./routes/auth");
    app.use("/api/auth", authRoutes);
    console.log("✅ Auth routes loaded");
} catch (err) {
    console.error("⚠️ Auth routes not loaded:", err.message);
}

try {
    const paymentRoutes = require("./routes/payment");
    app.use("/api/payment", paymentRoutes);
    console.log("✅ Payment routes loaded");
} catch (err) {
    console.error("⚠️ Payment routes not loaded:", err.message);
}

try {
    const walletRoutes = require("./routes/wallet");
    app.use("/api/wallet", walletRoutes);
    console.log("✅ Wallet routes loaded");
} catch (err) {
    console.error("⚠️ Wallet routes not loaded:", err.message);
}

try {
    const botRoutes = require("./routes/bots");
    app.use("/api/bots", botRoutes);
    console.log("✅ Bot routes loaded");
} catch (err) {
    console.error("⚠️ Bot routes not loaded:", err.message);
}

/* =====================================================
   HEALTH CHECK
===================================================== */

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "SCORPIO MORDE API ONLINE",
        timestamp: new Date().toISOString()
    });
});

/* =====================================================
   FRONTEND ROUTES
===================================================== */

app.get("/", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(publicPath, "register.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(publicPath, "login.html"));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(publicPath, "dashboard.html"));
});

/* =====================================================
   404 API HANDLER
===================================================== */

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found",
        path: req.originalUrl
    });
});

/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

app.use((err, req, res, next) => {
    console.error("❌ SERVER ERROR:", err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

/* =====================================================
   START SERVER
===================================================== */

app.listen(PORT, "0.0.0.0", () => {
    console.log("========================================");
    console.log("🚀 SCORPIO MORDE SERVER ONLINE");
    console.log(`🌐 PORT: ${PORT}`);
    console.log(`📁 PUBLIC: ${publicPath}`);
    console.log("========================================");
});

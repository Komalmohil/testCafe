const express = require("express");
const router = express.Router();

/* ================= CONTROLLERS ================= */
const productController = require("../controllers/productController");
const orderController = require("../controllers/ordercontroller");

/* ================= AUTH MIDDLEWARE ================= */
const { requireAuth } = require("../middleware/authMiddleware");

/* =====================================================
   PRODUCTS & MENU
===================================================== */
router.get("/", productController.getAllProducts);

/* =====================================================
   CART
===================================================== */
router.get("/cart", productController.getCart);
router.post("/add-to-cart", productController.addToCart);

/* =====================================================
   ORDERS (PROTECTED)
===================================================== */

// ✅ Checkout (only logged-in users)
router.post("/checkout", requireAuth, orderController.checkout);

// ✅ My Orders page
router.get("/my-orders", requireAuth, orderController.getMyOrders);

// ✅ Live orders API
router.get("/my-orders-data", requireAuth, orderController.getMyOrdersData);

// ✅ Reorder
router.post("/reorder/:orderId", requireAuth, orderController.reorder);

module.exports = router;
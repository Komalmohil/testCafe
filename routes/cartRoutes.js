const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartcontroller");
const orderController = require("../controllers/ordercontroller");

const authMiddleware = require("../middleware/authMiddleware");
const checkAuth = authMiddleware.checkAuth;
const requireAuth = authMiddleware.requireAuth;

/* ================= CART PAGE ================= */
router.get("/", checkAuth, cartController.getCartPage);

/* ================= SYNC CART ================= */
// ✅ Allow route but handle auth inside controller
router.post("/sync", checkAuth, cartController.syncCart);

/* ================= FETCH CART ================= */
// ✅ Allow route but return empty if not logged in
router.get("/fetch", checkAuth, cartController.fetchSavedCart);

/* ================= CONFIRM ORDER ================= */
// ✅ MUST be protected
router.post("/confirm", checkAuth, requireAuth, orderController.checkout);

module.exports = router;
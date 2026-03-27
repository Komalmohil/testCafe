const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartcontroller");
const orderController = require("../controllers/ordercontroller");

const authMiddleware = require("../middleware/authmiddleware");
const checkAuth = authMiddleware.checkAuth;
const requireAuth = authMiddleware.requireAuth;

/* ================= CART PAGE ================= */
// GET /cart - Renders the cart page
router.get("/", checkAuth, cartController.getCartPage);

/* ================= ADD TO CART ================= */
// POST /cart/add - Called from the "Add to Cart" buttons
// Note: If your main app.js uses app.use('/cart', cartRoutes), 
// then the frontend fetch should be to /cart/add
router.post("/add", checkAuth, cartController.addToCart);

/* ================= SYNC CART ================= */
// POST /cart/sync - Syncs LocalStorage/UI state with MongoDB
router.post("/sync", checkAuth, cartController.syncCart);

/* ================= REMOVE FROM CART ================= */
// POST /cart/remove - Explicitly deletes an item from the DB
router.post("/remove", checkAuth, cartController.removeFromCart);

/* ================= FETCH CART ================= */
// GET /cart/fetch - Returns the current user's saved items
router.get("/fetch", checkAuth, cartController.fetchSavedCart);

/* ================= CONFIRM ORDER ================= */
// POST /cart/confirm - Processes the checkout
router.post("/confirm", checkAuth, requireAuth, orderController.checkout);

module.exports = router;
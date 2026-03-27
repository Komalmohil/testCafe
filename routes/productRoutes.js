const express = require("express");
const router = express.Router();

/* ================= CONTROLLERS ================= */
const productController = require("../controllers/productController");
const orderController = require("../controllers/ordercontroller");

/* ================= AUTH MIDDLEWARE ================= */
const { requireAuth } = require("../middleware/authmiddleware");

/* =====================================================
   PRODUCTS & MENU
===================================================== */
// GET /products - Displays the main menu
router.get("/", productController.getAllProducts);

/* =====================================================
   CART
===================================================== */
// Page to view the cart summary
router.get("/cart", productController.getCart);

// API to add items from the products page
router.post("/add-to-cart", productController.addToCart);

/**
 * ✅ CART SYNC ROUTE
 * This route is called by the frontend (products.ejs) to keep the 
 * server-side session in sync with localStorage.
 * CRITICAL: This must return JSON to prevent page flickering.
 */
router.post("/sync", (req, res) => {
    try {
        // Update the session cart with data from the frontend
        req.session.cart = req.body.cartItems || [];
        
        // Use save() to ensure the session is written to MongoDB 
        // before sending the response back to the browser
        req.session.save((err) => {
            if (err) {
                console.error("Session Save Error:", err);
                return res.status(500).json({ success: false, message: "Session save failed" });
            }
            // Send JSON only. DO NOT res.redirect()
            return res.status(200).json({ 
                success: true, 
                message: "Cart synced successfully",
                cartCount: req.session.cart.length 
            });
        });
    } catch (error) {
        console.error("Sync Route Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to sync cart" 
        });
    }
});

/* =====================================================
   ORDERS (PROTECTED)
===================================================== */

// Checkout (only logged-in users)
router.post("/checkout", requireAuth, orderController.checkout);

// My Orders page
router.get("/my-orders", requireAuth, orderController.getMyOrders);

// Live orders API for real-time updates
router.get("/my-orders-data", requireAuth, orderController.getMyOrdersData);

// Reorder functionality
router.post("/reorder/:orderId", requireAuth, orderController.reorder);

module.exports = router;
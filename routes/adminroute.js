const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admincontroller");
const { requireAuth } = require("../middleware/authmiddleware");
const upload = require("../middleware/multer");

/* ================= ADMIN CHECK MIDDLEWARE ================= */
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }
    return res.status(403).render("error", {
        message: "Admin access required"
    });
};

// Apply these to all routes below to save space
router.use(requireAuth);
router.use(adminOnly);

/* ================= DASHBOARD ROUTES ================= */

// Main Dashboard Page
router.get("/dashboard", adminController.getAdminDashboard);

// Dashboard API Data (for auto-refresh)
router.get("/dashboard-data", adminController.getDashboardData);


/* ================= PRODUCT MANAGEMENT ================= */

// Open Add Product Page
router.get("/add-product", adminController.getAddProduct);

// Save Product (Multipart for Image Upload)
router.post("/add-product", upload.single("image"), adminController.postAddProduct);

// Delete Product
router.post("/products/delete/:id", adminController.deleteProduct);

// Toggle Availability Status (Active/Inactive)
router.patch("/product/toggle-status/:id", adminController.toggleProductStatus);

// ✅ NEW: Update Product Stock Quantity
router.post("/update-stock/:id", adminController.updateProductStock);


/* ================= ORDER MANAGEMENT ================= */

// Update Order Status (Pending/Preparing/Completed)
router.post("/update-order-status/:id", adminController.updateOrderStatus);

// Optional: Specific status update route for body-based requests
router.post("/order/status", adminController.updateOrderStatus);


module.exports = router;
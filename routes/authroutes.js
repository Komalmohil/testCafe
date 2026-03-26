const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller");
const { requireAuth } = require("../controllers/authcontroller");

/* ================= VIEW ROUTES ================= */

// Signup Page
router.get("/signup", (req, res) => {
    res.render("signup");
});

// Login Page
router.get("/login", (req, res) => {
    res.render("login");
});

// OTP Verification Page (NEW)
// This route will render the verify-otp.ejs file
router.get("/verify-otp", (req, res) => {
    const email = req.query.email || ""; // Capture email if passed in URL
    res.render("verify-otp", { email, error: null });
});

/* ================= AUTH LOGIC ================= */

// Signup
router.post("/signup", authController.signup);

// Verify OTP (NEW)
// This matches the verifyOTP function we added to the controller
router.post("/verify-otp", authController.verifyOTP);

// Login
router.post("/login", authController.login);

// Logout (only logged-in users)
router.get("/logout", requireAuth, authController.logout);

/* ================= DEFAULT ================= */

router.get("/auth", (req, res) => {
    res.redirect("/products");
});

module.exports = router;
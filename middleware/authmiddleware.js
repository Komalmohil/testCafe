const User = require("../models/User");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY || "supersecretkey";

/* ================= 1. CHECK AUTH ================= */
exports.checkAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            req.user = null;
            res.locals.user = null;
            return next();
        }

        const decoded = jwt.verify(token, SECRET_KEY);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            req.user = null;
            res.locals.user = null;
            res.clearCookie("token");
            return next();
        }

        req.user = user;
        res.locals.user = user;

        next();

    } catch (err) {
        console.error("Auth Error:", err.message);

        req.user = null;
        res.locals.user = null;
        res.clearCookie("token");

        next();
    }
};

/* ================= 2. REQUIRE AUTH ================= */
exports.requireAuth = (req, res, next) => {
    if (!req.user) {
        if (req.headers.accept && req.headers.accept.includes("application/json")) {
            return res.status(401).json({
                success: false,
                message: "Please login first"
            });
        }
        return res.redirect("/login");
    }
    next();
};
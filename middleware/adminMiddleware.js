// ================= ADMIN MIDDLEWARE (JWT BASED) =================

const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.redirect("/login");
    }

    if (req.user.role !== "admin") {
        return res.status(403).render("error", {
            message: "Access Denied: Admin Only"
        });
    }

    next();
};

module.exports = isAdmin;
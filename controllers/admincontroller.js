const Order = require("../models/order");
const Product = require("../models/product");

/* ================= HELPER: CALCULATE STATS ================= */
const calculateStats = (orders) => {
    const totalRevenue = orders
        .filter(order => order && (order.status === "Completed" || order.status === "Delivered"))
        .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    const activeOrders = orders.filter(order =>
        order && ["Pending", "Preparing", "Out for Delivery"].includes(order.status)
    ).length;

    return {
        totalRevenue: totalRevenue.toFixed(2),
        orderCount: orders.length,
        activeOrders
    };
};

/* ================= ADMIN DASHBOARD PAGE ================= */
exports.getAdminDashboard = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "username email") 
            .sort({ createdAt: -1 });

        const products = await Product.find().sort({ name: 1 });

        const stats = calculateStats(orders);

        res.render("admin/adminDashboard", { 
            user: req.user,
            orders: orders || [],
            products: products || [],
            stats
        });

    } catch (err) {
        console.error("Dashboard Render Error:", err);
        res.status(500).render("error", { 
            message: "Dashboard Error: " + err.message 
        });
    }
};

/* ================= DASHBOARD AUTO REFRESH DATA ================= */
exports.getDashboardData = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "username email")
            .sort({ createdAt: -1 });

        const stats = calculateStats(orders);

        res.json({
            success: true,
            orders,
            stats
        });

    } catch (err) {
        console.error("Dashboard Data API Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ================= UPDATE ORDER STATUS (WITH REAL-TIME NOTIF) ================= */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        // 1. Update the order in DB
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // 2. TRIGGER REAL-TIME NOTIFICATION
        // We get the Socket.io instance from the app object
        const io = req.app.get('socketio');
        
        if (io && updatedOrder.user) {
            // Send notification ONLY to the specific user who owns this order
            io.to(updatedOrder.user.toString()).emit('orderUpdate', {
                orderId: updatedOrder._id,
                status: status,
                message: `Order #${orderId.slice(-6)} is now ${status}!`
            });
        }

        res.json({
            success: true,
            message: `Order status changed to ${status}`,
            status: updatedOrder.status
        });

    } catch (err) {
        console.error("Order Status Update Error:", err);
        res.status(500).json({ success: false, message: "Update failed" });
    }
};

/* ================= TOGGLE PRODUCT STATUS ================= */
exports.toggleProductStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if (!product.isActive && (product.stock === undefined || product.stock <= 0)) {
            product.stock = 10;
        }

        product.isActive = !product.isActive;
        await product.save();

        res.json({
            success: true,
            isAvailable: product.isActive,
            stock: product.stock
        });

    } catch (err) {
        console.error("Toggle Product Error:", err);
        res.status(500).json({ success: false });
    }
};

/* ================= UPDATE PRODUCT STOCK ================= */
exports.updateProductStock = async (req, res) => {
    try {
        const { stock } = req.body;
        const productId = req.params.id;

        const product = await Product.findByIdAndUpdate(
            productId,
            { stock: parseInt(stock) || 0 },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.json({
            success: true,
            message: "Stock updated successfully",
            productName: product.name,
            stock: product.stock
        });
    } catch (err) {
        console.error("Update Stock Error:", err);
        res.status(500).json({ success: false });
    }
};

/* ================= SHOW ADD PRODUCT PAGE ================= */
exports.getAddProduct = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });

        res.render("admin/addProduct", {
            user: req.user,
            products: products || [],
            pageTitle: "Manage Products"
        });
    } catch (err) {
        console.error("GET Add Product Error:", err);
        res.status(500).render("error", { 
            message: "Error loading management page: " + err.message 
        });
    }
};

/* ================= ADD PRODUCT (POST) ================= */
exports.postAddProduct = async (req, res) => {
    try {
        const { name, price, category, description, stock } = req.body;

        const product = new Product({
            name,
            price: parseFloat(price),
            category,
            description,
            stock: parseInt(stock) || 0,
            image: req.file ? "/uploads/" + req.file.filename : "/uploads/default-food.jpg"
        });

        await product.save();
        res.redirect("/admin/dashboard");

    } catch (err) {
        console.error("POST Add Product Error:", err);
        const products = await Product.find().sort({ createdAt: -1 });

        res.status(500).render("admin/addProduct", {
            user: req.user,
            products: products || [], 
            error: "Failed to add product: " + err.message
        });
    }
};

/* ================= DELETE PRODUCT ================= */
exports.deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect("/admin/dashboard");
    } catch (err) {
        console.error("Delete Product Error:", err);
        res.status(500).render("error", { message: "Delete failed" });
    }
};
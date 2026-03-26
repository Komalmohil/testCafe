const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

/* ================= CHECKOUT (STOCKS UPDATED) ================= */
const checkout = async (req, res) => {
    try {
        if (!req.user) {
            return res.json({ success: false, message: "Login required" });
        }

        const cartItems = req.body.cartItems;
        if (!cartItems || cartItems.length === 0) {
            return res.json({ success: false, message: "Cart is empty" });
        }

        let totalAmount = 0;
        const validItems = [];
        const stockUpdates = []; // To store bulk update operations

        for (const item of cartItems) {
            const product = await Product.findById(item.productId);

            if (!product) continue;

            // Check if enough stock exists before placing order
            if (product.stock < item.quantity) {
                return res.json({
                    success: false,
                    message: `Only ${product.stock} items available for ${product.name}`
                });
            }

            totalAmount += item.price * item.quantity;

            validItems.push({
                productId: product._id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            });

            // ✅ Prepare stock decrement for BulkWrite
            stockUpdates.push({
                updateOne: {
                    filter: { _id: product._id },
                    update: { $inc: { stock: -item.quantity } }
                }
            });
        }

        if (validItems.length === 0) {
            return res.json({ success: false, message: "No valid items to order" });
        }

        // ✅ CREATE ORDER
        const order = new Order({
            user: req.user._id,
            items: validItems,
            totalAmount,
            status: "Pending"
        });

        await order.save();

        // ✅ EXECUTE STOCK UPDATES IN DATABASE
        if (stockUpdates.length > 0) {
            await Product.bulkWrite(stockUpdates);
        }

        // ✅ CLEAR DB CART
        await Cart.findOneAndDelete({ user: req.user._id });

        res.json({ success: true, message: "Order placed successfully!" });

    } catch (err) {
        console.error("Checkout Error:", err);
        res.status(500).json({ success: false, message: "Checkout failed" });
    }
};

/* ================= MY ORDERS ================= */
const getMyOrders = async (req, res) => {
    try {
        if (!req.user) return res.redirect("/login");

        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        res.render("orders/my-orders", {
            orders: orders || [],
            user: req.user
        });

    } catch (err) {
        console.error("Fetch Orders Error:", err);
        res.status(500).send("Error loading orders");
    }
};

/* ================= MY ORDERS API ================= */
const getMyOrdersData = async (req, res) => {
    try {
        if (!req.user) {
            return res.json({ success: false, message: "Not logged in" });
        }

        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        res.json({ success: true, orders });

    } catch (err) {
        console.error("Orders API Error:", err);
        res.status(500).json({ success: false });
    }
};

/* ================= REORDER ================= */
const reorder = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Login required" });
        }

        const oldOrder = await Order.findOne({
            _id: req.params.orderId,
            user: req.user._id
        });

        if (!oldOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = new Cart({
                user: req.user._id,
                items: []
            });
        }

        oldOrder.items.forEach(item => {
            if (!item.productId) return;

            const exist = cart.items.find(i =>
                i.productId && i.productId.toString() === item.productId.toString()
            );

            if (exist) {
                exist.quantity += item.quantity;
            } else {
                cart.items.push({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    quantity: item.quantity
                });
            }
        });

        await cart.save();

        res.json({
            success: true,
            items: cart.items
        });

    } catch (err) {
        console.error("REORDER ERROR:", err);
        res.status(500).json({ success: false });
    }
};

module.exports = { checkout, getMyOrders, getMyOrdersData, reorder };
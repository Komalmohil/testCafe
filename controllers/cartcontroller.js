const Cart = require("../models/Cart");
const Product = require("../models/Product");

/* ================= CART PAGE ================= */
exports.getCartPage = async (req, res) => {
    try {
        // If user is not logged in, pass an empty cart array
        if (!req.user) {
            return res.render("cart", { 
                user: null, 
                cart: [] 
            });
        }

        // Fetch the actual cart from DB for logged-in users
        const userCart = await Cart.findOne({ user: req.user._id });

        res.render("cart", { 
            user: req.user, 
            cart: userCart ? userCart.items : [] 
        });
    } catch (err) {
        console.error("Cart Page Load Error:", err);
        res.status(500).render("error", { message: "Failed to load your cart." });
    }
};

/* ================= ADD TO CART ================= */
exports.addToCart = async (req, res) => {
    try {
        const { id, quantity } = req.body;
        const qtyToAdd = parseInt(quantity) || 1;

        if (!id || qtyToAdd < 1) {
            return res.status(400).json({ success: false, message: "Invalid product data" });
        }

        // Check stock from DB
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if (product.stock < qtyToAdd) {
            return res.json({ 
                success: false, 
                message: `Only ${product.stock} items left in stock.` 
            });
        }

        // Guest mode: frontend handles LocalStorage, server just validates
        if (!req.user) {
            return res.json({ success: true, guest: true });
        }

        // Logged-in user cart logic
        const userId = req.user._id;
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({
                user: userId,
                items: [{ productId: id, name: product.name, price: product.price, image: product.image, quantity: qtyToAdd }]
            });
        } else {
            const itemIndex = cart.items.findIndex(item => item.productId && item.productId.toString() === id);
            
            if (itemIndex > -1) {
                const newQty = cart.items[itemIndex].quantity + qtyToAdd;
                if (newQty > product.stock) {
                    return res.json({ 
                        success: false, 
                        message: `Cannot add more. You already have ${cart.items[itemIndex].quantity} in cart and only ${product.stock} are available.` 
                    });
                }
                cart.items[itemIndex].quantity = newQty;
            } else {
                cart.items.push({
                    productId: id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: qtyToAdd
                });
            }
        }

        await cart.save();
        const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);

        res.json({ 
            success: true, 
            cartCount: totalItems 
        });

    } catch (err) {
        console.error("Add to Cart Error:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/* ================= SYNC CART ================= */
exports.syncCart = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { cartItems } = req.body;
        if (!Array.isArray(cartItems)) {
            return res.status(400).json({ success: false, message: "Invalid cart data" });
        }

        // Validate stock for each item before saving
        for (const item of cartItems) {
            if (!item.productId || !item.quantity) continue;

            const product = await Product.findById(item.productId);
            if (!product) continue;

            if (item.quantity > product.stock) {
                return res.json({
                    success: false,
                    message: `Stock changed for ${product.name}. Only ${product.stock} available.`
                });
            }
        }

        let cart = await Cart.findOne({ user: req.user._id });

        if (cart) {
            cart.items = cartItems;
            await cart.save();
        } else {
            cart = await Cart.create({ user: req.user._id, items: cartItems });
        }

        res.json({ success: true, items: cart.items });

    } catch (err) {
        console.error("Sync Cart Error:", err);
        res.status(500).json({ success: false, message: "Sync failed" });
    }
};

/* ================= FETCH CART ================= */
exports.fetchSavedCart = async (req, res) => {
    try {
        if (!req.user) {
            return res.json({ success: true, items: [] });
        }

        const cart = await Cart.findOne({ user: req.user._id });

        res.json({
            success: true,
            items: cart ? cart.items : []
        });

    } catch (err) {
        console.error("Fetch Cart Error:", err);
        res.status(500).json({ success: false, items: [] });
    }
};
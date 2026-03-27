const Cart = require("../models/Cart");
const Product = require("../models/product");

/* ================= CART PAGE ================= */
exports.getCartPage = async (req, res) => {
    try {
        if (!req.user) {
            return res.render("cart", { 
                user: null, 
                cart: [] 
            });
        }

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

        if (!req.user) {
            return res.json({ success: true, guest: true });
        }

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
                        message: `Cannot add more. You have ${cart.items[itemIndex].quantity} in cart and only ${product.stock} available.` 
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
            cartCount: totalItems,
            items: cart.items // Returning items helps frontend stay in sync
        });

    } catch (err) {
        console.error("Add to Cart Error:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/* ================= DELETE FROM CART ================= */
// NEW: Added this to handle explicit deletions from the DB
exports.removeFromCart = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { productId } = req.body;
        let cart = await Cart.findOne({ user: req.user._id });

        if (cart) {
            cart.items = cart.items.filter(item => item.productId.toString() !== productId);
            await cart.save();
        }

        res.json({ success: true, cartCount: cart ? cart.items.length : 0 });
    } catch (err) {
        console.error("Remove Error:", err);
        res.status(500).json({ success: false });
    }
};

/* ================= SYNC CART ================= */
exports.syncCart = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { cartItems } = req.body;
        
        // If frontend sends an empty array, it means the user deleted everything.
        // We must respect that and empty the DB cart too.
        let cart = await Cart.findOne({ user: req.user._id });

        if (cart) {
            cart.items = cartItems || [];
            await cart.save();
        } else {
            cart = await Cart.create({ user: req.user._id, items: cartItems || [] });
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
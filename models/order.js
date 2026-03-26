const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        index: true
    },

    items: [{
        // ❌ REMOVE required: true
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            default: null // ✅ allow null (VERY IMPORTANT)
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        image: {
            type: String,
            default: "/images/default-food.png"
        }
    }],

    totalAmount: { 
        type: Number, 
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: ["Pending", "Preparing", "Delivered", "Cancelled"],
        default: "Pending"
    },

    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid"],
        default: "Pending"
    },

    deliveredAt: {
        type: Date,
        default: null
    }

}, { 
    timestamps: true 
});

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
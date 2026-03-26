const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: [true, "Please provide a food name"],
        trim: true,
        unique: true
    },

    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price cannot be negative"]
    },

    category: {
        type: String,
        required: [true, "Category is required"],
        enum: [
            "junkfood",
            "coffee",
            "drinks",
            "icecream",
            "southindian",
            "snacks",
            "dessert",
            "meal"
        ],
        lowercase: true,
        trim: true
    },

    // ✅ Store full image path for frontend
    image: {
        type: String,
        default: "/images/default-food.png"
    },

    description: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"],
        default: "Delicious freshly prepared food."
    },

    // ✅ STOCK CONTROL
    stock: {
        type: Number,
        required: [true, "Stock quantity is required"],
        min: [0, "Stock cannot be negative"],
        default: 0
    },

    // ✅ Manual override + auto-toggle via middleware
    isAvailable: {
        type: Boolean,
        default: true
    }

},
{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


/* ================= VIRTUAL FIELD ================= */
/* This helps your frontend logic: item is only 'inStock' if stock > 0 AND manual toggle is true */
productSchema.virtual("inStock").get(function () {
    return this.stock > 0 && this.isAvailable;
});


/* ================= AUTO-UPDATE AVAILABILITY ================= */
/* If stock falls to 0, automatically set isAvailable to false.
   If stock is added, it keeps the previous availability status.
*/
productSchema.pre('save', function(next) {
    if (this.stock <= 0) {
        this.isAvailable = false;
    }
    next();
});


/* ================= EXPORT ================= */
module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
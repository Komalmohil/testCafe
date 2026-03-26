const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    items: [
        {
            // Allowed to be null for legacy orders/reorders
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: false,   
                default: null
            },

            name: {
                type: String,
                required: true
            },

            price: {
                type: Number,
                required: true
            },

            image: {
                type: String,
                default: "/images/default-food.png"
            },

            quantity: {
                type: Number,
                default: 1,
                min: 1
            }
        }
    ],

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

/* ================= AUTO UPDATE TIME ================= */
// Using a standard function to keep 'this' context, 
// but removing 'next' to let Mongoose handle completion automatically.
cartSchema.pre('save', function() {
    this.updatedAt = Date.now();
});

// If you ever switch to an async hook, it would look like this:
// cartSchema.pre('save', async function() {
//    this.updatedAt = Date.now();
// });

module.exports = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
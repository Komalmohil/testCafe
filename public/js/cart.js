// Use a more specific selector to match the class we added in header.ejs
const cartButtons = document.querySelectorAll(".cart-btn");
const cartBadge = document.querySelector(".cart-count-badge");

// Named function for the event listener to allow proper removal/addition
async function handleAddToCart(e) {
    e.preventDefault();
    e.stopImmediatePropagation(); // CRITICAL: Prevents double-firing if other scripts exist

    const button = e.currentTarget;
    const productId = button.dataset.id; 
    const itemName = button.dataset.name;

    if (!productId) {
        console.error("Product ID missing from data-id attribute.");
        return;
    }

    const itemData = {
        id: productId,
        quantity: 1
    };

    try {
        // UI Feedback: Disable to prevent spam clicking
        button.disabled = true;
        const originalText = button.innerText;
        button.innerText = "Adding...";

        // Ensure the URL matches your router (usually /cart/add)
        const response = await fetch("/cart/add", { 
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(itemData)
        });

        const data = await response.json();

        if (data.success) {
            // Update the badge with the EXACT count from the server
            if (cartBadge && typeof data.cartCount !== 'undefined') {
                cartBadge.innerText = data.cartCount;
                
                // Trigger the animation function defined in header.ejs if available
                if (typeof window.updateCartBadge === 'function') {
                    window.updateCartBadge(data.cartCount);
                }
            }
            
            showToast(`✅ ${itemName} added to cart!`);
        } else {
            alert(data.message || "Failed to add item.");
        }

        // Reset button state
        button.disabled = false;
        button.innerText = originalText;

    } catch (err) {
        console.error("Add to Cart Error:", err);
        button.disabled = false;
        button.innerText = "Add To Cart";
    }
}

// Attach listeners
cartButtons.forEach(button => {
    button.removeEventListener("click", handleAddToCart); 
    button.addEventListener("click", handleAddToCart);
});

// Improved Toast Notification
function showToast(message) {
    const existing = document.querySelector(".cart-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "cart-toast";
    toast.style = `
        position: fixed; 
        bottom: 20px; 
        right: 20px; 
        background: #4a3728; 
        color: white; 
        padding: 12px 24px; 
        border-radius: 8px; 
        z-index: 10000; 
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        transition: opacity 0.4s ease;
    `;
    toast.innerText = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}
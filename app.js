/* ================= ENVIRONMENT ================= */
require("dotenv").config();

/* ================= IMPORTS ================= */
const express = require("express");
const http = require("http"); // Required for Socket.io
const { Server } = require("socket.io"); // Required for Socket.io
const path = require("path");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");

let MongoStore = require("connect-mongo");
if (typeof MongoStore !== 'function' && MongoStore.default) {
    MongoStore = MongoStore.default;
}

const connectDB = require("./config/db");
const { checkAuth } = require("./controllers/authcontroller");

/* ================= APP & SERVER INIT ================= */
const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server); // Initialize Socket.io
const PORT = process.env.PORT || 3000;

/* ================= DATABASE ================= */
connectDB();

/* ================= VIEW ENGINE ================= */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* ================= GLOBAL MIDDLEWARE ================= */
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ================= STATIC FILES ================= */
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

/* ================= SESSION ================= */
app.use(session({
    secret: process.env.SESSION_SECRET || "cafe_secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fullstackCafe",
        collectionName: "sessions"
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true
    }
}));

/* ================= SOCKET.IO CONFIG ================= */
// Make 'io' accessible in all controllers via req.app.get('socketio')
app.set('socketio', io);

io.on("connection", (socket) => {
    // When a user connects, they join a private room named after their User ID
    socket.on("join", (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`User connected to notification room: ${userId}`);
        }
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected from notifications");
    });
});

/* 🔥 APPLY AUTH GLOBALLY */
app.use(checkAuth);

/* ================= GLOBAL EJS VARIABLES ================= */
app.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }

    res.locals.session = req.session;
    res.locals.user = req.user || null;
    res.locals.cartCount = req.session.cart.length;

    next();
});

/* ================= ROUTES ================= */
app.use("/", require("./routes/authroutes"));
app.get("/", (req, res) => res.redirect("/products"));
app.use("/support", require("./routes/supportroutes"));
app.use("/products", require("./routes/productRoutes"));
app.use("/admin", require("./routes/adminroute"));
app.use("/cart", require("./routes/cartRoutes"));

/* ================= ERROR HANDLERS ================= */
app.use((req, res) => res.status(404).render("error", { message: "Page Not Found" }));

app.use((err, req, res, next) => {
    console.error("Server Error:", err);
    res.status(500).render("error", { message: "Something went wrong!" });
});

/* ================= START SERVER ================= */
// CRITICAL: Use server.listen, NOT app.listen
server.listen(PORT, () => {
    console.log(`✅ Server & Socket running at http://localhost:${PORT}`);
});
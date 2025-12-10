// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const productsRouter = require("./routes/products");
const salesRouter = require("./routes/sales");
const dashboardRouter = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors());            // allow frontend (Netlify) to call backend
app.use(express.json());    // parse JSON body
app.use(morgan("dev"));     // request logging

// Health-check route
app.get("/", (req, res) => {
  res.send("Inventory backend is running");
});

// API routes
app.use("/api/products", productsRouter);
app.use("/api/sales", salesRouter);
app.use("/api/dashboard", dashboardRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

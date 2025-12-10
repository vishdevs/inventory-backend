import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Inventory backend running");
});

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching products");
  }
});

// Dashboard metrics
app.get("/api/metrics/dashboard", async (req, res) => {
  try {
    const products = await pool.query("SELECT COUNT(*) FROM products");
    const lowStock = await pool.query("SELECT COUNT(*) FROM products WHERE stock <= 5");

    res.json({
      totalProducts: Number(products.rows[0].count),
      lowStockItems: Number(lowStock.rows[0].count)
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Metrics error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

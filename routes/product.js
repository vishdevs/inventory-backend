// routes/products.js
const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/products  - list all products
router.get("/", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, name, category, buying_price, selling_price, stock
       FROM products
       ORDER BY id`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id  - get single product
router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `SELECT id, name, category, buying_price, selling_price, stock
       FROM products
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/products  - create product
router.post("/", async (req, res, next) => {
  const { name, category, buying_price, selling_price, stock } = req.body;

  if (!name || !category) {
    return res
      .status(400)
      .json({ message: "name and category are required fields" });
  }

  try {
    const result = await db.query(
      `INSERT INTO products (name, category, buying_price, selling_price, stock)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, category, buying_price, selling_price, stock`,
      [name, category, buying_price || 0, selling_price || 0, stock || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id  - update product
router.put("/:id", async (req, res, next) => {
  const { id } = req.params;
  const { name, category, buying_price, selling_price, stock } = req.body;

  try {
    const result = await db.query(
      `UPDATE products
         SET name = $1,
             category = $2,
             buying_price = $3,
             selling_price = $4,
             stock = $5
       WHERE id = $6
       RETURNING id, name, category, buying_price, selling_price, stock`,
      [name, category, buying_price, selling_price, stock, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id  - delete product
router.delete("/:id", async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM products
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// routes/sales.js
const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/sales/recent?limit=5
router.get("/recent", async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 5;

  try {
    const result = await db.query(
      `SELECT id,
              customer_name,
              total_amount,
              created_at
       FROM sales
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/sales  - create sale, update stock
router.post("/", async (req, res, next) => {
  const { customerName, items } = req.body;

  if (!customerName || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "customerName and at least one item are required",
    });
  }

  const client = await db.pool.connect?.() || null;

  // If db.js does not expose pool, we will use pool transaction differently.
  // To keep it simple for you, we will use a manual BEGIN / COMMIT on the same pool.

  try {
    // Start transaction
    await db.query("BEGIN");

    let totalAmount = 0;

    // Insert sale header (temporary zero total)
    const saleResult = await db.query(
      `INSERT INTO sales (customer_name, total_amount)
       VALUES ($1, 0)
       RETURNING id`,
      [customerName]
    );

    const saleId = saleResult.rows[0].id;

    // Handle each item
    for (const item of items) {
      const productId = item.productId;
      const quantity = item.quantity;

      // Get product info
      const productResult = await db.query(
        `SELECT id, selling_price, stock
         FROM products
         WHERE id = $1
         FOR UPDATE`,
        [productId]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${productId} not found`);
      }

      const product = productResult.rows[0];

      if (product.stock < quantity) {
        throw new Error(`Not enough stock for product ${productId}`);
      }

      const unitPrice = Number(product.selling_price);
      const lineTotal = unitPrice * quantity;
      totalAmount += lineTotal;

      // Insert sale item
      await db.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [saleId, productId, quantity, unitPrice]
      );

      // Decrease stock
      await db.query(
        `UPDATE products
         SET stock = stock - $1
         WHERE id = $2`,
        [quantity, productId]
      );
    }

    // Update sale total
    await db.query(
      `UPDATE sales
       SET total_amount = $1
       WHERE id = $2`,
      [totalAmount, saleId]
    );

    // Commit transaction
    await db.query("COMMIT");

    res.status(201).json({
      id: saleId,
      customerName,
      totalAmount,
    });
  } catch (err) {
    // Rollback on error
    try {
      await db.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError);
    }

    console.error("Create sale error:", err.message);
    res.status(400).json({ message: err.message });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;

// routes/dashboard.js
const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/dashboard/summary
router.get("/summary", async (req, res, next) => {
  try {
    const [
      totalProductsResult,
      itemsInStockResult,
      lowStockResult,
      todayRevenueResult,
      ordersTodayResult,
      revenueLast7DaysResult,
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) AS count FROM products`),
      db.query(`SELECT COALESCE(SUM(stock), 0) AS total FROM products`),
      db.query(
        `SELECT COUNT(*) AS count
         FROM products
         WHERE stock <= 5`
      ),
      db.query(
        `SELECT COALESCE(SUM(total_amount), 0) AS total
         FROM sales
         WHERE created_at::date = CURRENT_DATE`
      ),
      db.query(
        `SELECT COUNT(*) AS count
         FROM sales
         WHERE created_at::date = CURRENT_DATE`
      ),
      db.query(
        `SELECT created_at::date AS date,
                SUM(total_amount) AS total
         FROM sales
         WHERE created_at >= (CURRENT_DATE - INTERVAL '6 days')
         GROUP BY created_at::date
         ORDER BY date`
      ),
    ]);

    const summary = {
      totalProducts: Number(totalProductsResult.rows[0].count || 0),
      itemsInStock: Number(itemsInStockResult.rows[0].total || 0),
      reorderAlerts: Number(lowStockResult.rows[0].count || 0),
      todayRevenue: Number(todayRevenueResult.rows[0].total || 0),
      ordersToday: Number(ordersTodayResult.rows[0].count || 0),
      lowStockItems: Number(lowStockResult.rows[0].count || 0),
      revenueLast7Days: revenueLast7DaysResult.rows.map((row) => ({
        date: row.date,
        total: Number(row.total),
      })),
    };

    res.json(summary);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

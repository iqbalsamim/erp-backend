const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/db");

// 📊 ENTERPRISE DASHBOARD
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    // 👨‍🎓 Total Students
    const students = await pool.request().query(`
      SELECT COUNT(*) as total FROM Students
    `);

    // 💰 Fees Summary
    const fees = await pool.request().query(`
      SELECT 
        ISNULL(SUM(total_amount),0) as total,
        ISNULL(SUM(paid_amount),0) as paid,
        ISNULL(SUM(total_amount - paid_amount),0) as due
      FROM Fees
    `);

    // 📊 Attendance Summary
    const attendance = await pool.request().query(`
      SELECT status, COUNT(*) as count
      FROM Attendance
      GROUP BY status
    `);

    // 📅 Monthly Revenue Trend
    const monthlyFees = await pool.request().query(`
      SELECT 
        FORMAT(created_at, 'yyyy-MM') as month,
        SUM(paid_amount) as total
      FROM Fees
      GROUP BY FORMAT(created_at, 'yyyy-MM')
      ORDER BY month
    `);

    // 🏫 Class-wise Revenue
    const classRevenue = await pool.request().query(`
      SELECT 
        c.name as class,
        SUM(f.paid_amount) as revenue
      FROM Fees f
      JOIN Students s ON f.student_id = s.id
      JOIN Classes c ON s.class_id = c.id
      GROUP BY c.name
      ORDER BY revenue DESC
    `);

    // ⚠️ Top Defaulters (Highest Due)
    const defaulters = await pool.request().query(`
      SELECT TOP 5
        u.name,
        (f.total_amount - f.paid_amount) as due
      FROM Fees f
      JOIN Students s ON f.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      WHERE f.total_amount > ISNULL(f.paid_amount,0)
      ORDER BY due DESC
    `);

    // 🧾 Recent Transactions
    const recentPayments = await pool.request().query(`
      SELECT TOP 10
        u.name,
        f.paid_amount,
        f.total_amount,
        f.created_at
      FROM Fees f
      JOIN Students s ON f.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      ORDER BY f.created_at DESC
    `);

    // 📈 Collection Rate (%)
    const collectionRate =
      fees.recordset[0].total > 0
        ? (
            (fees.recordset[0].paid /
              fees.recordset[0].total) *
            100
          ).toFixed(2)
        : 0;

    // 🚀 Final Response (Frontend Ready)
    res.json({
      kpis: {
        totalStudents: students.recordset[0].total,
        totalFees: fees.recordset[0].total,
        totalCollected: fees.recordset[0].paid,
        totalDue: fees.recordset[0].due,
        collectionRate: collectionRate + "%"
      },

      attendance: attendance.recordset,

      charts: {
        monthlyRevenue: monthlyFees.recordset,
        classRevenue: classRevenue.recordset
      },

      insights: {
        topDefaulters: defaulters.recordset,
        recentPayments: recentPayments.recordset
      }
    });

  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
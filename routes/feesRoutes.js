const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/db");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");


// ✅ GET ALL FEES
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        f.*,
        u.name,
        s.id AS student_ref
      FROM Fees f
      JOIN Students s ON f.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      ORDER BY f.id DESC
    `);

    res.json(result.recordset);

  } catch (err) {
    res.status(500).json(err.message);
  }
});


// ✅ CREATE FEE (WITH INVOICE SYSTEM)
router.post("/", auth, role(["admin"]), async (req, res) => {
  try {
    const { student_id, total_amount, paid_amount } = req.body;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("student_id", student_id)
      .input("total_amount", total_amount || 0)
      .input("paid_amount", paid_amount || 0)
      .query(`
        INSERT INTO Fees (student_id, total_amount, paid_amount, created_at)
        OUTPUT INSERTED.id
        VALUES (@student_id, @total_amount, @paid_amount, GETDATE())
      `);

    const id = result.recordset[0].id;

    const invoiceNo = `INV-${new Date().getFullYear()}-${id}`;

    res.json({
      id,
      invoiceNo
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
});


// ✅ PAY FEE
router.post("/pay", auth, role(["admin"]), async (req, res) => {
  try {
    const { fee_id, amount } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("fee_id", fee_id)
      .input("amount", amount)
      .query(`
        UPDATE Fees
        SET paid_amount = ISNULL(paid_amount,0) + @amount
        WHERE id = @fee_id
      `);

    res.json({ message: "Payment successful" });

  } catch (err) {
    res.status(500).json(err.message);
  }
});


// ✅ PAYMENT HISTORY (🔥 NEW FEATURE)
router.get("/history/:student_id", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("student_id", req.params.student_id)
      .query(`
        SELECT 
          f.id,
          f.total_amount,
          f.paid_amount,
          f.due_amount,
          f.status,
          f.created_at
        FROM Fees f
        WHERE f.student_id = @student_id
        ORDER BY f.created_at DESC
      `);

    res.json(result.recordset);

  } catch (err) {
    res.status(500).json(err.message);
  }
});


// ✅ UPDATE FEE
router.put("/:id", auth, role(["admin"]), async (req, res) => {
  try {
    const { student_id, total_amount } = req.body;
    const { id } = req.params;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("student_id", student_id)
      .input("total_amount", total_amount)
      .query(`
        UPDATE Fees
        SET student_id = @student_id,
            total_amount = @total_amount
        WHERE id = @id
      `);

    res.json({ message: "Fee updated successfully" });

  } catch (err) {
    res.status(500).json(err.message);
  }
});


// ✅ DELETE FEE
router.delete("/:id", auth, role(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .query(`DELETE FROM Fees WHERE id = @id`);

    res.json({ message: "Fee deleted successfully" });

  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../config/db");

// 📥 Get notifications
router.get("/:userId", async (req, res) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("userId", sql.Int, req.params.userId)
    .query(`
      SELECT * FROM Notifications
      WHERE user_id = @userId OR user_id IS NULL
      ORDER BY created_at DESC
    `);

  res.json(result.recordset);
});

// ➕ Create notification
router.post("/", async (req, res) => {
    const { user_id, title, message, type } = req.body;
  
    const pool = await poolPromise;
  
    await pool.request()
      .input("user_id", sql.Int, user_id || null)
      .input("title", sql.VarChar, title)
      .input("message", sql.Text, message)
      .input("type", sql.VarChar, type)
      .query(`
        INSERT INTO Notifications (user_id, title, message, type)
        VALUES (@user_id, @title, @message, @type)
      `);
  
    // 🔴 REAL-TIME PUSH
    global.io.emit("new-notification", {
      user_id,
      title,
      message,
      type
    });
  
    res.json({ message: "Notification sent" });
  });

module.exports = router;
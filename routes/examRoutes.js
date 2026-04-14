const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/db");

// ➕ CREATE EXAM
router.post("/", async (req, res) => {
  const { name, year } = req.body;

  const pool = await poolPromise;

  await pool.request()
    .input("name", name)
    .input("year", year)
    .query(`
      INSERT INTO Exams (name, year)
      VALUES (@name, @year)
    `);

  res.json({ message: "Exam created" });
});

// 📋 GET ALL EXAMS
router.get("/", async (req, res) => {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT * FROM Exams ORDER BY id DESC
  `);

  res.json(result.recordset);
});

module.exports = router;
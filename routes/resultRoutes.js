const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/db");


// ==========================
// CLASS RANKING (EXAM WISE)
// ==========================
router.get("/ranking/:class_id/:exam_id", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("class_id", req.params.class_id)
      .input("exam_id", req.params.exam_id)
      .query(`
        SELECT 
          s.id,
          s.name,
          SUM(m.marks) AS totalMarks
        FROM Marks m
        JOIN Students s ON m.student_id = s.id
        WHERE s.class_id = @class_id
        AND m.exam_id = @exam_id
        GROUP BY s.id, s.name
        ORDER BY totalMarks DESC
      `);

    const ranked = result.recordset.map((r, i) => ({
      rank: i + 1,
      ...r
    }));

    res.json(ranked);

  } catch (err) {
    res.status(500).json(err.message);
  }
});
const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/db");

// ✅ ASSIGN TEACHER TO SUBJECT
router.post("/", async (req, res) => {
  const { teacher_id, subject_id } = req.body;
  const pool = await poolPromise;

  await pool.request()
    .input("teacher_id", teacher_id)
    .input("subject_id", subject_id)
    .query(`
      INSERT INTO TeacherSubjects (teacher_id, subject_id)
      VALUES (@teacher_id, @subject_id)
    `);

  res.json({ message: "Assigned successfully" });
});

// ✅ GET ALL ASSIGNMENTS
router.get("/", async (req, res) => {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT ts.id,
           t.name AS teacher,
           s.name AS subject
    FROM TeacherSubjects ts
    JOIN Teachers t ON ts.teacher_id = t.id
    JOIN Subjects s ON ts.subject_id = s.id
  `);

  res.json(result.recordset);
});

// ✅ DELETE ASSIGNMENT
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const pool = await poolPromise;

  await pool.request()
    .input("id", id)
    .query("DELETE FROM TeacherSubjects WHERE id = @id");

  res.json({ message: "Assignment removed" });
});

module.exports = router;
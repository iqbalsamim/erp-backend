const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/db");
// 🔐 Middlewares
const auth = require("../middleware/authMiddleware");
const adminScope = require("../middleware/adminScope");
// ✅ GET ALL SUBJECTS
router.get("/", async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query("SELECT * FROM Subjects");
  res.json(result.recordset);
});

// ✅ CREATE SUBJECT
router.post("/", async (req, res) => {
  const { name } = req.body;
  const pool = await poolPromise;

  await pool.request()
    .input("name", name)
    .query("INSERT INTO Subjects (name) VALUES (@name)");

  res.json({ message: "Subject added" });
});

// 🔥 OPTIONAL: UPDATE SUBJECT
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const pool = await poolPromise;

  await pool.request()
    .input("id", id)
    .input("name", name)
    .query("UPDATE Subjects SET name=@name WHERE id=@id");

  res.json({ message: "Subject updated" });
});

// ❌ DELETE SUBJECT
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const pool = await poolPromise;

  await pool.request()
    .input("id", id)
    .query("DELETE FROM Subjects WHERE id=@id");

  res.json({ message: "Subject deleted" });
});
router.get("/with-teachers", async (req, res) => {
    const pool = await poolPromise;
  
    const result = await pool.request().query(`
      SELECT 
        s.id,
        s.name AS subject,
        t.name AS teacher
      FROM Subjects s
      LEFT JOIN TeacherSubjects ts ON s.id = ts.subject_id
      LEFT JOIN Teachers t ON ts.teacher_id = t.id
    `);
  
    res.json(result.recordset);
  });
  router.post("/subjects", auth, adminScope, async (req, res) => {
    const { name } = req.body;
    const pool = await poolPromise;
  
    await pool.request()
      .input("name", name)
      .query("INSERT INTO Subjects (name) VALUES (@name)");
  
    res.json({ message: "Subject added by admin only" });
  });

module.exports = router;
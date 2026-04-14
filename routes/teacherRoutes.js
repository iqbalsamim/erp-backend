const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/db");

// ✅ GET ALL TEACHERS
router.get("/", async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query("SELECT * FROM Teachers");
  res.json(result.recordset);
});

// ✅ CREATE TEACHER
router.post("/", async (req, res) => {
  const { name, phone, email } = req.body;
  const pool = await poolPromise;

  await pool.request()
    .input("name", name)
    .input("phone", phone)
    .input("email", email)
    .query(`
      INSERT INTO Teachers (name, phone, email)
      VALUES (@name, @phone, @email)
    `);

  res.json({ message: "Teacher added" });
});

// 🔥 UPDATE TEACHER
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, email } = req.body;
  const pool = await poolPromise;

  await pool.request()
    .input("id", id)
    .input("name", name)
    .input("phone", phone)
    .input("email", email)
    .query(`
      UPDATE Teachers
      SET name=@name,
          phone=@phone,
          email=@email
      WHERE id=@id
    `);

  res.json({ message: "Teacher updated" });
});

// ❌ DELETE TEACHER
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const pool = await poolPromise;

  await pool.request()
    .input("id", id)
    .query("DELETE FROM Teachers WHERE id=@id");

  res.json({ message: "Teacher deleted" });
});
// ✅ ASSIGN SUBJECT TO TEACHER
// ASSIGN SUBJECT TO TEACHER
router.post("/assign-subject", async (req, res) => {
    const { teacher_id, subject_id } = req.body;
  
    const pool = await poolPromise;
  
    await pool.request()
      .input("teacher_id", teacher_id)
      .input("subject_id", subject_id)
      .query(`
        INSERT INTO TeacherSubjects (teacher_id, subject_id)
        VALUES (@teacher_id, @subject_id)
      `);
  
    res.json({ message: "Subject assigned to teacher" });
  });
  
  // ✅ GET ASSIGNED SUBJECTS
  router.get("/assigned-subjects", async (req, res) => {
    const pool = await poolPromise;
  
    const result = await pool.request().query(`
      SELECT 
        t.name AS teacher,
        s.name AS subject
      FROM TeacherSubjects ts
      JOIN Teachers t ON ts.teacher_id = t.id
      JOIN Subjects s ON ts.subject_id = s.id
    `);
  
    res.json(result.recordset);
  });
  // ASSIGN SUBJECT TO TEACHER (MULTI ASSIGNMENT)
router.post("/assign", async (req, res) => {
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
  
  // GET TEACHERS WITH SUBJECTS
  router.get("/with-subjects", async (req, res) => {
    const pool = await poolPromise;
  
    const result = await pool.request().query(`
      SELECT 
        t.name AS teacher,
        s.name AS subject
      FROM TeacherSubjects ts
      JOIN Teachers t ON ts.teacher_id = t.id
      JOIN Subjects s ON ts.subject_id = s.id
    `);
  
    res.json(result.recordset);
  });
  // ASSIGN SUBJECT TO TEACHER
router.post("/assign", async (req, res) => {
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
  
  
  // GET TEACHER SUBJECTS
  router.get("/:teacher_id/subjects", async (req, res) => {
    const pool = await poolPromise;
  
    const result = await pool.request()
      .input("teacher_id", req.params.teacher_id)
      .query(`
        SELECT sub.name
        FROM TeacherSubjects ts
        JOIN Subjects sub ON ts.subject_id = sub.id
        WHERE ts.teacher_id = @teacher_id
      `);
  
    res.json(result.recordset);
  });

module.exports = router;
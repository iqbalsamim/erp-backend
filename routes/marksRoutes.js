const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/db");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const teacherScope = require("../middleware/teacherScope");

// ======================================================
// ADD MARKS (ADMIN + TEACHER)
// ======================================================
router.post(
  "/",
  auth,
  role(["admin", "teacher"]),
  teacherScope,
  async (req, res) => {
    try {
      const { student_id, subject_id, exam_id, marks } = req.body;

      if (!student_id || !subject_id || !exam_id || marks === undefined) {
        return res.status(400).json("All fields are required");
      }

      const pool = await poolPromise;

      await pool.request()
        .input("student_id", student_id)
        .input("subject_id", subject_id)
        .input("exam_id", exam_id)
        .input("marks", marks)
        .query(`
          INSERT INTO Marks (student_id, subject_id, exam_id, marks)
          VALUES (@student_id, @subject_id, @exam_id, @marks)
        `);

      res.json({ message: "Marks added successfully" });

    } catch (err) {
      console.error(err);
      res.status(500).json("Error adding marks");
    }
  }
);

// ======================================================
// GET MARKS (ADMIN + TEACHER)
// ======================================================
router.get(
    "/",
    auth,
    role(["admin", "teacher"]),
    teacherScope,
    async (req, res) => {
      try {
        const pool = await poolPromise;
  
        let query = `
          SELECT 
            m.id,
            m.student_id,
            m.subject_id,
            m.exam_id,
            u.name AS student,
            sub.name AS subject,
            e.name AS exam,
            m.marks,
            s.class_id
          FROM Marks m
          JOIN Students s ON m.student_id = s.id
          JOIN Users u ON s.user_id = u.id
          JOIN Subjects sub ON m.subject_id = sub.id
          JOIN Exams e ON m.exam_id = e.id
        `;
  
        const request = pool.request();
  
        if (req.user.role === "teacher") {
          query += `
            WHERE s.class_id IN (
              SELECT class_id 
              FROM TeacherClasses 
              WHERE teacher_id = @teacher_id
            )
          `;
          request.input("teacher_id", req.user.id);
        }
  
        query += " ORDER BY m.id DESC";
  
        const result = await request.query(query);
        res.json(result.recordset);
  
      } catch (err) {
        res.status(500).json(err.message);
      }
    }
  );

// ======================================================
// MARKSHEET (STUDENT SUBJECT-WISE)
// ======================================================
router.get(
  "/marksheet/:student_id/:exam_id",
  auth,
  role(["admin", "teacher"]),
  async (req, res) => {
    try {
      const { student_id, exam_id } = req.params;

      const pool = await poolPromise;

      const result = await pool.request()
        .input("student_id", student_id)
        .input("exam_id", exam_id)
        .query(`
          SELECT 
            u.name AS student,
            sub.name AS subject,
            m.marks
          FROM Marks m
          JOIN Students s ON m.student_id = s.id
          JOIN Users u ON s.user_id = u.id
          JOIN Subjects sub ON m.subject_id = sub.id
          WHERE m.student_id = @student_id 
            AND m.exam_id = @exam_id
        `);

      res.json(result.recordset);

    } catch (err) {
      console.error(err);
      res.status(500).json("Error fetching marksheet");
    }
  }
);

// ======================================================
// RESULT / GPA (SINGLE STUDENT)
// ======================================================
router.get(
  "/result/:student_id/:exam_id",
  auth,
  role(["admin", "teacher"]),
  async (req, res) => {
    try {
      const { student_id, exam_id } = req.params;

      const pool = await poolPromise;

      const result = await pool.request()
        .input("student_id", student_id)
        .input("exam_id", exam_id)
        .query(`
          SELECT marks 
          FROM Marks
          WHERE student_id = @student_id 
            AND exam_id = @exam_id
        `);

      const marks = result.recordset.map(m => Number(m.marks || 0));

      if (marks.length === 0) {
        return res.json({ total: 0, avg: 0, grade: "F", status: "NO DATA" });
      }

      const total = marks.reduce((a, b) => a + b, 0);
      const avg = total / marks.length;

      let grade = "F";
      if (avg >= 90) grade = "A+";
      else if (avg >= 80) grade = "A";
      else if (avg >= 70) grade = "B";
      else if (avg >= 60) grade = "C";
      else if (avg >= 50) grade = "D";

      res.json({
        total,
        avg: avg.toFixed(2),
        grade,
        status: avg >= 50 ? "PASS" : "FAIL"
      });

    } catch (err) {
      console.error(err);
      res.status(500).json("Error calculating result");
    }
  }
);

// ======================================================
// CLASS RESULT (RANK + GPA)
// ======================================================
router.get(
  "/class-result/:exam_id/:class_id",
  auth,
  role(["admin", "teacher"]),
  async (req, res) => {
    try {
      const { exam_id, class_id } = req.params;
      const pool = await poolPromise;

      const result = await pool.request()
        .input("exam_id", exam_id)
        .input("class_id", class_id)
        .query(`
          SELECT 
            u.name AS student,
            s.id AS student_id,
            SUM(m.marks) AS total
          FROM Marks m
          JOIN Students s ON m.student_id = s.id
          JOIN Users u ON s.user_id = u.id
          WHERE m.exam_id = @exam_id
            AND s.class_id = @class_id
          GROUP BY u.name, s.id
          ORDER BY total DESC
        `);

      const ranked = result.recordset.map((d, index) => {
        let gpa = (d.total / 100) * 4;

        let grade = "F";
        if (gpa >= 3.6) grade = "A+";
        else if (gpa >= 3.0) grade = "A";
        else if (gpa >= 2.5) grade = "B";
        else if (gpa >= 2.0) grade = "C";
        else if (gpa >= 1.0) grade = "D";

        return {
          ...d,
          rank: index + 1,
          gpa: gpa.toFixed(2),
          grade
        };
      });

      res.json(ranked);

    } catch (err) {
      console.error(err);
      res.status(500).json("Error fetching class result");
    }
  }
);

module.exports = router;
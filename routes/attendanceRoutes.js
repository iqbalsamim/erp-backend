const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/db");

// ✅ ADD THESE
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// ✅ Mark attendance
router.post("/", auth, role(["admin", "teacher"]), async (req, res) => {
    try {
        const { records, date } = req.body;

        const pool = await poolPromise;

        for (let r of records) {
            await pool.request()
                .input("student_id", r.student_id)
                .input("date", date)
                .input("status", r.status)
                .query(`
                    IF NOT EXISTS (
                        SELECT 1 FROM Attendance 
                        WHERE student_id=@student_id AND date=@date
                    )
                    INSERT INTO Attendance (student_id, date, status)
                    VALUES (@student_id, @date, @status)
                `);
        }

        res.json({ message: "Attendance saved" });

    } catch (err) {
        res.status(500).json(err.message);
    }
});


// ✅ Get attendance by date
router.get("/:date", async (req, res) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("date", req.params.date)
        .query(`
            SELECT a.*, u.name
            FROM Attendance a
            JOIN Students s ON a.student_id = s.id
            JOIN Users u ON s.user_id = u.id
            WHERE a.date=@date
        `);

    res.json(result.recordset);
});

module.exports = router;
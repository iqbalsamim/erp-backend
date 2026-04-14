const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/db");

router.get("/", async (req, res) => {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Classes");
    res.json(result.recordset);
});

module.exports = router;
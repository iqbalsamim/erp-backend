const { poolPromise } = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const pool = await poolPromise;

        await pool.request()
            .input("name", name)
            .input("email", email)
            .input("password", hashedPassword)
            .input("role", role)
            .query(`
                INSERT INTO Users (name, email, password, role)
                VALUES (@name, @email, @password, @role)
            `);

        res.json({ message: "User registered successfully" });

    } catch (err) {
        res.status(500).json(err.message);
    }
};

// LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const pool = await poolPromise;

        const result = await pool.request()
            .input("email", email)
            .query("SELECT * FROM Users WHERE email=@email");

        const user = result.recordset[0];

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            "secretkey",   // later move to .env
            { expiresIn: "1d" }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role
            }
        });

    } catch (err) {
        res.status(500).json(err.message);
    }
};
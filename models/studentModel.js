const { poolPromise } = require("../config/db");
const bcrypt = require("bcrypt");

class StudentModel {

    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                s.id,
                s.user_id,
                s.class_id,
                s.roll_no,
                s.phone,
                s.address,
                s.permanent_address,
                s.guardian_name,
                ISNULL(u.name, '') AS first_name,
                ISNULL(u.last_name, '') AS last_name,
                ISNULL(u.father_name, '') AS father_name,
                ISNULL(u.grandfather_name, '') AS grandfather_name,
                ISNULL(u.email, '') AS email,
                u.date_of_birth,
                u.gender,
                ISNULL(c.name, 'Not Assigned') AS class_name
            FROM Students s
            JOIN Users u ON s.user_id = u.id
            LEFT JOIN Classes c ON s.class_id = c.id
            WHERE u.role = 'student'
            ORDER BY ISNULL(s.roll_no, 999999) ASC
        `);
        return result.recordset;
    }

    static async getById(id) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input("id", parseInt(id))
                .query(`
                    SELECT 
                        s.id,
                        s.user_id,
                        s.class_id,
                        s.roll_no,
                        s.phone,
                        s.address,
                        s.permanent_address,
                        s.guardian_name,
                        ISNULL(u.name, '') AS first_name,
                        ISNULL(u.last_name, '') AS last_name,
                        ISNULL(u.father_name, '') AS father_name,
                        ISNULL(u.grandfather_name, '') AS grandfather_name,
                        ISNULL(u.email, '') AS email,
                        u.date_of_birth,
                        u.gender,
                        ISNULL(c.name, '') AS class_name
                    FROM Students s
                    JOIN Users u ON s.user_id = u.id
                    LEFT JOIN Classes c ON s.class_id = c.id
                    WHERE s.id = @id
                `);
            
            console.log("getById result:", result.recordset[0]); // Debug log
            return result.recordset[0];
        } catch (error) {
            console.error("Error in getById:", error);
            throw error;
        }
    }

    static async create(data) {
        const pool = await poolPromise;
    
        // 🔐 Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);
    
        // Insert user with all new fields
        const userResult = await pool.request()
            .input("first_name", data.first_name || '')
            .input("last_name", data.last_name || '')
            .input("father_name", data.father_name || '')
            .input("grandfather_name", data.grandfather_name || '')
            .input("email", data.email || '')
            .input("password", hashedPassword)
            .input("role", "student")
            .input("date_of_birth", data.date_of_birth || null)
            .input("gender", data.gender || null)
            .query(`
                INSERT INTO Users (name, last_name, father_name, grandfather_name, email, password, role, date_of_birth, gender)
                OUTPUT INSERTED.id
                VALUES (@first_name, @last_name, @father_name, @grandfather_name, @email, @password, @role, @date_of_birth, @gender)
            `);
    
        const userId = userResult.recordset[0].id;
    
        // Insert student with all new fields
        await pool.request()
            .input("user_id", userId)
            .input("class_id", data.class_id || null)
            .input("roll_no", data.roll_no ? parseInt(data.roll_no) : null)
            .input("phone", data.phone || '')
            .input("address", data.address || '')
            .input("permanent_address", data.permanent_address || '')
            .input("guardian_name", data.guardian_name || '')
            .query(`
                INSERT INTO Students (user_id, class_id, roll_no, phone, address, permanent_address, guardian_name)
                VALUES (@user_id, @class_id, @roll_no, @phone, @address, @permanent_address, @guardian_name)
            `);
    
        return { message: "Student created successfully" };
    }

    static async delete(id) {
        const pool = await poolPromise;
        
        // First get the user_id
        const studentResult = await pool.request()
            .input("id", id)
            .query("SELECT user_id FROM Students WHERE id = @id");
        
        if (studentResult.recordset[0]) {
            const userId = studentResult.recordset[0].user_id;
            
            // Delete from Students table
            await pool.request()
                .input("id", id)
                .query("DELETE FROM Students WHERE id = @id");
            
            // Delete from Users table
            await pool.request()
                .input("user_id", userId)
                .query("DELETE FROM Users WHERE id = @user_id");
        }

        return { message: "Student deleted successfully" };
    }

    static async update(id, data) {
        const pool = await poolPromise;
    
        // First get the user_id
        const studentResult = await pool.request()
            .input("id", id)
            .query("SELECT user_id FROM Students WHERE id = @id");
        
        if (!studentResult.recordset[0]) {
            throw new Error("Student not found");
        }
        
        const userId = studentResult.recordset[0].user_id;
    
        // Update Users table with all new fields
        await pool.request()
            .input("user_id", userId)
            .input("first_name", data.first_name || '')
            .input("last_name", data.last_name || '')
            .input("father_name", data.father_name || '')
            .input("grandfather_name", data.grandfather_name || '')
            .input("email", data.email || '')
            .input("date_of_birth", data.date_of_birth || null)
            .input("gender", data.gender || null)
            .query(`
                UPDATE Users
                SET 
                    name = @first_name,
                    last_name = @last_name,
                    father_name = @father_name,
                    grandfather_name = @grandfather_name,
                    email = @email,
                    date_of_birth = @date_of_birth,
                    gender = @gender
                WHERE id = @user_id
            `);
    
        // Update Students table with all new fields
        await pool.request()
            .input("id", id)
            .input("class_id", data.class_id || null)
            .input("roll_no", data.roll_no ? parseInt(data.roll_no) : null)
            .input("phone", data.phone || '')
            .input("address", data.address || '')
            .input("permanent_address", data.permanent_address || '')
            .input("guardian_name", data.guardian_name || '')
            .query(`
                UPDATE Students
                SET 
                    class_id = @class_id, 
                    roll_no = @roll_no,
                    phone = @phone,
                    address = @address,
                    permanent_address = @permanent_address,
                    guardian_name = @guardian_name
                WHERE id = @id
            `);
    
        return { message: "Student updated successfully" };
    }

    static async getStudentsByClass(classId) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("class_id", classId)
            .query(`
                SELECT 
                    s.id,
                    s.roll_no,
                    s.phone,
                    s.address,
                    ISNULL(u.name, '') AS first_name,
                    ISNULL(u.last_name, '') AS last_name,
                    ISNULL(u.father_name, '') AS father_name,
                    ISNULL(u.email, '') AS email,
                    ISNULL(c.name, '') AS class_name
                FROM Students s
                JOIN Users u ON s.user_id = u.id
                LEFT JOIN Classes c ON s.class_id = c.id
                WHERE s.class_id = @class_id AND u.role = 'student'
                ORDER BY ISNULL(s.roll_no, 999999) ASC
            `);
        return result.recordset;
    }

    static async searchStudents(searchTerm) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("search", `%${searchTerm}%`)
            .query(`
                SELECT 
                    s.id,
                    s.user_id,
                    s.class_id,
                    s.roll_no,
                    s.phone,
                    s.address,
                    s.permanent_address,
                    s.guardian_name,
                    ISNULL(u.name, '') AS first_name,
                    ISNULL(u.last_name, '') AS last_name,
                    ISNULL(u.father_name, '') AS father_name,
                    ISNULL(u.grandfather_name, '') AS grandfather_name,
                    ISNULL(u.email, '') AS email,
                    u.date_of_birth,
                    u.gender,
                    ISNULL(c.name, 'Not Assigned') AS class_name
                FROM Students s
                JOIN Users u ON s.user_id = u.id
                LEFT JOIN Classes c ON s.class_id = c.id
                WHERE u.role = 'student'
                AND (
                    u.name LIKE @search OR 
                    u.last_name LIKE @search OR 
                    u.father_name LIKE @search OR 
                    u.email LIKE @search OR
                    CAST(s.roll_no AS VARCHAR) LIKE @search
                )
                ORDER BY ISNULL(s.roll_no, 999999) ASC
            `);
        return result.recordset;
    }
}

module.exports = StudentModel;
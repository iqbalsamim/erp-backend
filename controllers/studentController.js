const StudentModel = require("../models/studentModel");

exports.getStudents = async (req, res) => {
    try {
        const data = await StudentModel.getAll();
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// ADD THIS FUNCTION - Get single student by ID
exports.getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Fetching student with ID:", id);
        
        const student = await StudentModel.getById(id);
        
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        res.json(student);
    } catch (err) {
        console.error("Error in getStudentById:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.createStudent = async (req, res) => {
    try {
        const result = await StudentModel.create(req.body);
        res.json(result);
    } catch (err) {
        console.error("Error in createStudent:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const result = await StudentModel.delete(req.params.id);
        res.json(result);
    } catch (err) {
        console.error("Error in deleteStudent:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const result = await StudentModel.update(req.params.id, req.body);
        res.json(result);
    } catch (err) {
        console.error("Error in updateStudent:", err);
        res.status(500).json({ message: err.message });
    }
};
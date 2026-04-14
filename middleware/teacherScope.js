module.exports = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  
    if (req.user.role === "teacher") {
      req.teacherOnly = true;
    }
  
    next();
  };
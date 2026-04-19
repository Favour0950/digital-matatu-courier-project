const express = require("express");
const router = express.Router();
const { getClerkDashboardData } = require("../controllers/adminController");
const { verifyToken } = require("../middleware/authMiddleware"); // Import authentication middleware
//this route only needs verifyToken
router.get('/stats', verifyToken, getClerkDashboardData)
module.exports = router
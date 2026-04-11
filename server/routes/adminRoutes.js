const express = require('express')
const router  = express.Router()

// Import all admin controller functions
const {
  getDashboardStats,
  getAllClerks,
  createClerk,
  getAllOffices,
  createOffice,
  getReports,
  getRoutes,
  createRoute
} = require('../controllers/adminController')

// Import both middleware functions
// verifyToken — checks user is logged in
// verifyAdmin — checks user has admin role
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware')

// All admin routes require BOTH middlewares
// They run in order: verifyToken first, then verifyAdmin, then the controller

// Dashboard stats
router.get('/stats',   verifyToken, verifyAdmin, getDashboardStats)

// Clerk management
router.get('/clerks',  verifyToken, verifyAdmin, getAllClerks)
router.post('/clerks', verifyToken, verifyAdmin, createClerk)


// Office management
router.get('/offices',  verifyToken, verifyAdmin, getAllOffices)
router.post('/offices', verifyToken, verifyAdmin, createOffice)

// Route management
router.get('/routes',  verifyToken, verifyAdmin, getRoutes)
router.post('/routes', verifyToken, verifyAdmin, createRoute)

// Reports
router.get('/reports', verifyToken, verifyAdmin, getReports)

module.exports = router
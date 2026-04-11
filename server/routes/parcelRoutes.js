const express = require('express')
const router = express.Router()

// Import the controller function
const { registerParcel } = require('../controllers/parcelController')

// Import auth middleware — only logged-in users can access these routes
const { verifyToken } = require('../middleware/authMiddleware')

// POST /api/parcels — register a new parcel
// verifyToken runs first, then registerParcel
router.post('/', verifyToken, registerParcel)

module.exports = router
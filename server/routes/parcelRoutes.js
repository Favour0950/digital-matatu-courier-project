const express = require('express')
const router  = express.Router()
// This file defines all routes related to parcel operations: registering a new parcel, searching for a parcel by tracking number, and updating parcel status. Each route is protected by the verifyToken middleware to ensure only authenticated users can access them.
const { registerParcel } = require('../controllers/parcelController')
const { searchParcel }   = require('../controllers/searchController')
const { updateStatus }   = require('../controllers/statusController')
const { verifyToken }    = require('../middleware/authMiddleware')

// POST   /api/parcels                          — register new parcel
router.post('/',                      verifyToken, registerParcel)

// GET    /api/parcels/:tracking_number         — search parcel
router.get('/:tracking_number',       verifyToken, searchParcel)

// PUT    /api/parcels/:tracking_number/status  — update status
router.put('/:tracking_number/status',verifyToken, updateStatus)

module.exports = router
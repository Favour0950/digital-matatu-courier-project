const express = require('express')
const router  = express.Router()
const pool = require('../db')

const { registerParcel } = require('../controllers/parcelController')
const { searchParcel }   = require('../controllers/searchController')
const { updateStatus, batchUpdateStatus } = require('../controllers/statusController')
const { verifyToken }    = require('../middleware/authMiddleware')

// POST   /api/parcels                  — register new parcel
router.post('/', verifyToken, registerParcel)

// GET    /api/parcels/batch            — query parcels for batch manifest
// Note: Placed ABOVE /:tracking_number so Express doesn't treat the word "batch" as a tracking ID parameter
router.get('/batch', verifyToken, async (req, res) => {
  const { origin, destination, status } = req.query
  try {
    let query = `
      SELECT p.tracking_number, p.current_status,
             s.name AS sender_name, r.name AS receiver_name
      FROM parcels p
      JOIN customers s ON p.sender_id   = s.customer_id
      JOIN customers r ON p.receiver_id = r.customer_id
      WHERE p.origin_office_id = $1 AND p.destination_office_id = $2
    `
    const params = [origin, destination]
    if (status) {
      query += ` AND p.current_status = $3`
      params.push(status)
    }
    query += ' ORDER BY p.created_at DESC'
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Batch query error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// PUT    /api/parcels/batch-status     — execute batch update transaction
router.put('/batch-status', verifyToken, batchUpdateStatus)

// GET    /api/parcels/:tracking_number — search individual parcel details
router.get('/:tracking_number', verifyToken, searchParcel)

// PUT    /api/parcels/:tracking_number/status — individual status gate update
router.put('/:tracking_number/status', verifyToken, updateStatus)

module.exports = router
const express = require('express')
const router = express.Router()

const { recordPayment, getParcelForPayment } = require('../controllers/paymentController')
const { verifyToken } = require('../middleware/authMiddleware')


// GET  /api/payments/parcel/:tracking_number — get parcel summary for payment form
router.get('/parcel/:tracking_number', verifyToken, getParcelForPayment)

// POST /api/payments                         — record a payment
router.post('/', verifyToken, recordPayment)

module.exports = router
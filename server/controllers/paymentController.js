const pool = require('../db')
// RECORD PAYMENT
// Handles POST /api/ payments
const recordPayment = async (req, res) => {

  const { tracking_number, amount, payment_method, mpesa_ref } = req.body

  try {
    // Find the parcel by tracking number
    const parcelResult = await pool.query(
      'SELECT parcel_id, amount_charged, current_status FROM parcels WHERE tracking_number = $1',
      [tracking_number]
    )

    if (parcelResult.rows.length === 0) {
      return res.status(404).json({ message: 'Parcel not found' })
    }

    const parcel = parcelResult.rows[0]

    // Check if payment already exists for this parcel
    const existingPayment = await pool.query(
      'SELECT payment_id FROM payments WHERE parcel_id = $1',
      [parcel.parcel_id]
    )

    if (existingPayment.rows.length > 0) {
      return res.status(400).json({ message: 'Payment already recorded for this parcel' })
    }

    // Save the payment record
    // mpesa_ref is stored in a notes-style field if provided
    const paymentResult = await pool.query(
      `INSERT INTO payments (parcel_id, amount, payment_method, payment_status)
       VALUES ($1, $2, $3, 'Paid')
       RETURNING *`,
      [parcel.parcel_id, amount, payment_method]
    )

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment: paymentResult.rows[0]
    })

  } catch (error) {
    console.error('Record payment error:', error)
    res.status(500).json({ message: 'Server error while recording payment' })
  }
}

// ── GET PARCEL FOR PAYMENT PAGE ──
// Handles GET /api/payments/parcel/:tracking_number
// Returns parcel summary so the payment form can show it
const getParcelForPayment = async (req, res) => {

  const { tracking_number } = req.params

  try {
    const result = await pool.query(`
      SELECT 
        p.tracking_number,
        p.amount_charged,
        p.current_status,
        s.name AS sender_name,
        o2.office_name AS destination_office,
        -- Check if payment exists already
        CASE WHEN pay.payment_id IS NOT NULL THEN 'Paid' ELSE 'Unpaid' END AS payment_status
      FROM parcels p
      JOIN customers s ON p.sender_id = s.customer_id
      JOIN offices o2 ON p.destination_office_id = o2.office_id
      LEFT JOIN payments pay ON p.parcel_id = pay.parcel_id
      WHERE p.tracking_number = $1
    `, [tracking_number])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Parcel not found' })
    }

    res.json(result.rows[0])

  } catch (error) {
    console.error('Get parcel for payment error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { recordPayment, getParcelForPayment }
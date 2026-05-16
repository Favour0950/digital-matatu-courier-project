const express = require("express");
const router = express.Router();
const pool = require('../db'); // CRITICAL: Added this to prevent "pool is not defined" error
const { getClerkDashboardData } = require("../controllers/adminController");
const { verifyToken } = require("../middleware/authMiddleware");

// This route handles the 4 stat cards and the top 5 "Live Feed" items
router.get('/stats', verifyToken, getClerkDashboardData)

// GET /api/clerk/parcels?days=7
// This handles the new "My Activity History" section
router.get('/parcels', verifyToken, async (req, res) => {
  const clerk_id = req.user.user_id
  const days = parseInt(req.query.days) || 7

  try {
    const result = await pool.query(`
      SELECT
        p.tracking_number, p.current_status, p.amount_charged, p.created_at,
        s.name AS sender_name, r.name AS receiver_name,
        o1.office_name AS origin_office, o2.office_name AS destination_office,
        COALESCE(pay.amount, 0) AS amount_paid,
        COALESCE(pay.payment_status, 'Unpaid') AS payment_status
      FROM parcels p
      JOIN customers s  ON p.sender_id            = s.customer_id
      JOIN customers r  ON p.receiver_id           = r.customer_id
      JOIN offices   o1 ON p.origin_office_id      = o1.office_id
      JOIN offices   o2 ON p.destination_office_id = o2.office_id
      LEFT JOIN payments pay ON p.parcel_id        = pay.parcel_id
      WHERE p.registered_by = $1
        AND p.created_at >= NOW() - INTERVAL '${days} days'
      ORDER BY p.created_at DESC
    `, [clerk_id])

    res.json(result.rows)
  } catch (error) {
    console.error('Clerk parcels error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
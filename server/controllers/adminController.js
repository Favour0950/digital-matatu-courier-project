const pool = require('../db')

// ADMIN CONTROLLER
// Handles all admin-only data: stats, users, offices, reports
// Every function here requires verifyToken + verifyAdmin middleware

// ── GET /api/admin/stats ──
// Returns the 4 numbers shown on the admin dashboard stat cards
const getDashboardStats = async (req, res) => {
  try {

    // We run 4 separate queries and collect results with Promise.all which shows them at the same time instead of waiting for each one sequentially
    const [parcelsResult, revenueResult, clerksResult, officesResult] = await Promise.all([

      // Total parcels registered in the last 30 days
      pool.query(`
        SELECT COUNT(*) AS total 
        FROM parcels
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `),

      // Total revenue collected in the last 30 days (sum of all payments)
      pool.query(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM payments
        WHERE payment_date >= NOW() - INTERVAL '30 days'
      `),

      // Count of active clerk accounts
      pool.query(`
        SELECT COUNT(*) AS total
        FROM users
        WHERE role = 'clerk'
      `),

      // Count of offices
      pool.query(`
        SELECT COUNT(*) AS total
        FROM offices
      `)
    ])

    // .rows[0] gets the first (and only) row from each result
    res.json({
      total_parcels:  parseInt(parcelsResult.rows[0].total),
      total_revenue:  parseFloat(revenueResult.rows[0].total),
      active_clerks:  parseInt(clerksResult.rows[0].total),
      active_offices: parseInt(officesResult.rows[0].total)
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ message: 'Server error fetching stats' })
  }
}

// ── GET /api/admin/clerks ──
// Returns list of all clerk accounts with their office name
const getAllClerks = async (req, res) => {
  try {

    // JOIN users with offices so we get the office name and id, not just the FK
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        u.office_id,
        o.office_name,
        u.is_active,
        --count parcels by that clerk
        COUNT(p.parcel_id) AS parcel_count
      FROM users u
      LEFT JOIN offices o ON u.office_id = o.office_id
      LEFT JOIN parcels p ON p.registered_by = u.user_id
      WHERE u.role = 'clerk'
      GROUP BY u.user_id, o.office_name
      ORDER BY u.created_at DESC
    `)

    res.json(result.rows)

  } catch (error) {
    console.error('Get clerks error:', error)
    res.status(500).json({ message: 'Server error fetching clerks' })
  }
}

// ── POST /api/admin/clerks ──
// Creates a new clerk account
// Expects: name, email, password, office_id in request body
const createClerk = async (req, res) => {
  const bcrypt = require('bcryptjs')
  const { name, email, password, office_id } = req.body

  // Basic validation — all fields required
  if (!name || !email || !password || !office_id) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  try {

    // Check if email already exists — prevent duplicates
    const existing = await pool.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already in use' })
    }

    // Hash the password before saving — never store plain text passwords
    // 10 is the "salt rounds" — higher = more secure but slower
    const password_hash = await bcrypt.hash(password, 10)

    // Insert the new clerk
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, office_id)
       VALUES ($1, $2, $3, 'clerk', $4)
       RETURNING user_id, name, email, role`,
      [name, email, password_hash, office_id]
    )

    res.status(201).json({
      message: 'Clerk created successfully',
      clerk: result.rows[0]
    })

  } catch (error) {
    console.error('Create clerk error:', error)
    res.status(500).json({ message: 'Server error creating clerk' })
  }
}

// ── GET /api/admin/offices ──
// Returns all offices
const getAllOffices = async (req, res) => {
  try {

    // Also count how many clerks are assigned to each office
    const result = await pool.query(`
      SELECT 
        o.office_id,
        o.office_name,
        o.location,
        o.created_at,
        COUNT(u.user_id) AS clerk_count
      FROM offices o
      LEFT JOIN users u ON o.office_id = u.office_id AND u.role = 'clerk'
      GROUP BY o.office_id
      ORDER BY o.office_name
    `)

    res.json(result.rows)

  } catch (error) {
    console.error('Get offices error:', error)
    res.status(500).json({ message: 'Server error fetching offices' })
  }
}

// ── POST /api/admin/offices ──
// Creates a new office
const createOffice = async (req, res) => {
  const { office_name, location } = req.body

  if (!office_name || !location) {
    return res.status(400).json({ message: 'Office name and location are required' })
  }

  try {

    const result = await pool.query(
      `INSERT INTO offices (office_name, location)
       VALUES ($1, $2)
       RETURNING *`,
      [office_name, location]
    )

    res.status(201).json({
      message: 'Office created successfully',
      office: result.rows[0]
    })

  } catch (error) {
    console.error('Create office error:', error)
    res.status(500).json({ message: 'Server error creating office' })
  }
}

// ── PUT /api/admin/offices/:id ──
// Updates an existing office's name and location
const updateOffice = async (req, res) => {
  const { id } = req.params
  const { office_name, location } = req.body

  if (!office_name || !location) {
    return res.status(400).json({ message: 'Office name and location are required' })
  }

  try {
    const result = await pool.query(
      'UPDATE offices SET office_name = $1, location = $2 WHERE office_id = $3 RETURNING *',
      [office_name, location, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Office not found' })
    }

    res.json({ message: 'Office updated successfully', office: result.rows[0] })
  } catch (error) {
    console.error('Update office error:', error)
    res.status(500).json({ message: 'Server error updating office' })
  }
}

// ── DELETE /api/admin/offices/:id ──
// Deletes an office (only if no clerks are assigned to it)
const deleteOffice = async (req, res) => {
  const { id } = req.params

  try {
    const clerksCheck = await pool.query(
      'SELECT COUNT(*) AS total FROM users WHERE office_id = $1 AND role = $2',
      [id, 'clerk']
    )

    if (parseInt(clerksCheck.rows[0].total) > 0) {
      return res.status(400).json({
        message: 'Cannot delete office: clerks are still assigned to it.'
      })
    }

    await pool.query('DELETE FROM offices WHERE office_id = $1', [id])
    res.json({ message: 'Office deleted successfully' })
  } catch (error) {
    console.error('Delete office error:', error)
    res.status(500).json({ message: 'Server error deleting office' })
  }
}

// ── PUT /api/admin/routes/:id ──
// Updates an existing route's pricing and distance
const updateRoute = async (req, res) => {
  const { id } = req.params
  const { origin_office_id, destination_office_id, distance_km, base_price, price_per_kg } = req.body

  if (origin_office_id == null || destination_office_id == null) {
    return res.status(400).json({ message: 'Origin and destination offices are required' })
  }

  try {
    const result = await pool.query(
      `UPDATE routes
       SET origin_office_id = $1, destination_office_id = $2,
           distance_km = $3, base_price = $4, price_per_kg = $5
       WHERE route_id = $6
       RETURNING *`,
      [origin_office_id, destination_office_id, distance_km || null, base_price || null, price_per_kg || null, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Route not found' })
    }

    res.json({ message: 'Route updated successfully', route: result.rows[0] })
  } catch (error) {
    console.error('Update route error:', error)
    res.status(500).json({ message: 'Server error updating route' })
  }
}

// ── DELETE /api/admin/routes/:id ──
// Deletes a route
const deleteRoute = async (req, res) => {
  const { id } = req.params

  try {
    const result = await pool.query(
      'DELETE FROM routes WHERE route_id = $1 RETURNING route_id',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Route not found' })
    }

    res.json({ message: 'Route deleted successfully' })
  } catch (error) {
    console.error('Delete route error:', error)
    res.status(500).json({ message: 'Server error deleting route' })
  }
}

// ── GET /api/admin/reports ──
// Returns parcel and revenue data for the reports page
// Accepts optional query params: ?start_date=2026-01-01&end_date=2026-04-30&office_id=1
const getReports = async (req, res) => {
  try {

    // Read filter values from URL query string — all optional
    // e.g. /api/admin/reports?start_date=2026-04-01&end_date=2026-04-30
    const { start_date, end_date, office_id } = req.query

    // Build the WHERE clause dynamically based on which filters were provided
    // $1, $2 etc. are placeholders — values go in the params array below
    let whereConditions = []
    let params = []
    let paramCount = 1

    if (start_date) {
      whereConditions.push(`p.created_at >= $${paramCount}`)
      params.push(start_date)
      paramCount++
    }

    if (end_date) {
      whereConditions.push(`p.created_at <= $${paramCount}`)
      params.push(end_date + ' 23:59:59')  // include the whole end day
      paramCount++
    }

    if (office_id) {
      whereConditions.push(`p.origin_office_id = $${paramCount}`)
      params.push(office_id)
      paramCount++
    }

    // Join all conditions with AND, or use empty string if no filters
    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : ''

    // Main query — get all parcels with sender, receiver, office, clerk, payment info
    const parcelsResult = await pool.query(`
      SELECT
        p.parcel_id,
        p.tracking_number,
        p.description,
        p.current_status,
        p.amount_charged,
        p.created_at,
        s.name         AS sender_name,
        r.name         AS receiver_name,
        o1.office_name AS origin_office,
        o2.office_name AS destination_office,
        u.name         AS registered_by,
        COALESCE(pay.amount, 0)         AS amount_paid,
        COALESCE(pay.payment_method, 'Unpaid') AS payment_method
      FROM parcels p
      JOIN customers s  ON p.sender_id            = s.customer_id
      JOIN customers r  ON p.receiver_id           = r.customer_id
      JOIN offices   o1 ON p.origin_office_id      = o1.office_id
      JOIN offices   o2 ON p.destination_office_id = o2.office_id
      JOIN users     u  ON p.registered_by         = u.user_id
      LEFT JOIN payments pay ON p.parcel_id        = pay.parcel_id
      ${whereClause}
      ORDER BY p.created_at DESC
    `, params)

    // Summary stats for the 4 stat cards on the reports page
    const summaryResult = await pool.query(`
      SELECT
        COUNT(*)                                          AS total_parcels,
        COALESCE(SUM(pay.amount), 0)                     AS total_revenue,
        COUNT(CASE WHEN p.current_status = 'Arrived'   THEN 1 END) AS arrived_count,
        COUNT(CASE WHEN p.current_status = 'Collected' THEN 1 END) AS collected_count
      FROM parcels p
      LEFT JOIN payments pay ON p.parcel_id = pay.parcel_id
      ${whereClause}
    `, params)

    res.json({
      summary: summaryResult.rows[0],
      parcels: parcelsResult.rows
    })

  } catch (error) {
    console.error('Reports error:', error)
    res.status(500).json({ message: 'Server error fetching reports' })
  }
}
// ── GET /api/admin/routes ──
const getRoutes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.route_id,
        r.origin_office_id,
        r.destination_office_id,
        r.distance_km,
        r.base_price,
        r.price_per_kg,
        o1.office_name AS origin_name,
        o2.office_name AS destination_name
      FROM routes r
      JOIN offices o1 ON r.origin_office_id      = o1.office_id
      JOIN offices o2 ON r.destination_office_id = o2.office_id
      ORDER BY o1.office_name
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Get routes error:', error)
    res.status(500).json({ message: 'Server error fetching routes' })
  }
}

// ── POST /api/admin/routes ──
const createRoute = async (req, res) => {
  const { origin_office_id, destination_office_id, distance_km, base_price, price_per_kg } = req.body

  if (origin_office_id == null || destination_office_id == null) {
    return res.status(400).json({ message: 'Origin and destination offices are required' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO routes (origin_office_id, destination_office_id, distance_km, base_price, price_per_kg)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [origin_office_id, destination_office_id, distance_km || null, base_price || null, price_per_kg || null]
    )
    res.status(201).json({ message: 'Route created successfully', route: result.rows[0] })
  } catch (error) {
    console.error('Create route error:', error)
    res.status(500).json({ message: 'Server error creating route' })
  }
}
// PUT /api/admin/clerks/:id — update a clerk's name and office
const updateClerk = async (req, res) => {
  const { id } = req.params
  const { name, office_id } = req.body
  try {
    await pool.query(
      'UPDATE users SET name = $1, office_id = $2 WHERE user_id = $3 AND role = $4',
      [name, office_id, id, 'clerk']
    )
    res.json({ message: 'Clerk updated successfully' })
  } catch (error) {
    console.error('Update clerk error:', error)
    res.status(500).json({ message: 'Server error updating clerk' })
  }
}

// DELETE /api/admin/clerks/:id — remove a clerk account
const deleteClerk = async (req, res) => {
  const { id } = req.params
  
  try {
    // Soft delete — set is_active = false instead of removing the row
    // This preserves all parcel history linked to this clerk
    await pool.query(
      'UPDATE users SET is_active = false WHERE user_id = $1 AND role = $2',
      [id, 'clerk']
    )
    res.json({ message: 'Clerk deactivated successfully' })
  } catch (error) {
    console.error('Deactivate clerk error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}




// PUT /api/admin/clerks/:id/reactivate
const reactivateClerk = async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('UPDATE users SET is_active = true WHERE user_id = $1', [id])
    res.json({ message: 'Clerk reactivated' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}


// ── GET /api/clerk/stats — clerk dashboard data ──
// Returns only parcels registered by this specific clerk
const getClerkDashboardData = async (req, res) => {
  const clerk_id = req.user.user_id  // from the JWT token

  try {
    const [statsResult, recentResult] = await Promise.all([
      // Summary counts for this clerk's parcels
      pool.query(`
        SELECT
          COUNT(*)                                                    AS total_parcels,
          COALESCE(SUM(pay.amount), 0)                               AS total_revenue,
          COUNT(CASE WHEN p.current_status IN ('Registered', 'Dispatched') THEN 1 END) AS pending_count,
          COUNT(CASE WHEN p.current_status = 'Arrived' THEN 1 END)  AS arrived_count
        FROM parcels p
        LEFT JOIN payments pay ON p.parcel_id = pay.parcel_id
        WHERE p.registered_by = $1
      `, [clerk_id]),

      // 5 most recent parcels registered by this clerk
      pool.query(`
        SELECT
          p.tracking_number, p.current_status, p.created_at,
          s.name AS sender_name,
          r.name AS receiver_name,
          o1.office_name AS origin_office,
          o2.office_name AS destination_office
        FROM parcels p
        JOIN customers s  ON p.sender_id            = s.customer_id
        JOIN customers r  ON p.receiver_id           = r.customer_id
        JOIN offices   o1 ON p.origin_office_id      = o1.office_id
        JOIN offices   o2 ON p.destination_office_id = o2.office_id
        WHERE p.registered_by = $1
        ORDER BY p.created_at DESC
        LIMIT 5
      `, [clerk_id])
    ])

    res.json({
      stats:   statsResult.rows[0],
      parcels: recentResult.rows
    })

  } catch (error) {
    console.error('Clerk dashboard error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}


// Export all functions so routes can use them
module.exports = {
  getDashboardStats,
  getRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  updateClerk,
  deleteClerk,
  getAllClerks,
  createClerk,
  getAllOffices,
  createOffice,
  updateOffice,
  deleteOffice,
  getClerkDashboardData,
  reactivateClerk,
  getReports
}
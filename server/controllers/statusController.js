const pool = require('../db')

// ── UPDATE PARCEL STATUS ──
// Handles PUT /api/parcels/:tracking_number/status
// tracking_number comes from the URL (:tracking_number)
// status and notes come from the request body (JSON)
const updateStatus = async (req, res) => {

  // req.params contains URL segments — the :tracking_number from the route definition
  const { tracking_number } = req.params

  // req.body contains the JSON data sent in the request body
  const { status, notes } = req.body

  // req.user is set by authMiddleware after verifying the JWT token
  const updated_by = req.user.user_id

  // Only these exact values are valid statuses — anything else is rejected
  const validStatuses = ['Registered', 'Dispatched', 'In Transit', 'Arrived', 'Collected']

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' })
  }

  let client

  try {
    client = await pool.connect()
    await client.query('BEGIN')

    // Step 1: Find the parcel by tracking number to get its parcel_id
    const parcelResult = await client.query(
      'SELECT parcel_id FROM parcels WHERE tracking_number = $1',
      [tracking_number]
    )

    if (parcelResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Parcel not found' })
    }

    const parcel_id = parcelResult.rows[0].parcel_id

    // Step 2: Update the current_status column on the parcel record
    await client.query(
      'UPDATE parcels SET current_status = $1 WHERE parcel_id = $2',
      [status, parcel_id]
    )

    // Step 3: Log this change to parcel_status_history
    // Every status change is recorded — this gives you a full audit trail
    await client.query(
      `INSERT INTO parcel_status_history (parcel_id, status, updated_by, notes)
       VALUES ($1, $2, $3, $4)`,
      [parcel_id, status, updated_by, notes || '']
    )

    await client.query('COMMIT')
    res.json({ message: 'Status updated successfully', status })

  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError)
      }
    }
    console.error('Update status error:', error)
    res.status(500).json({ message: 'Server error while updating status' })
  } finally {
    if (client) {
      client.release()
    }
  }
}

module.exports = { updateStatus }
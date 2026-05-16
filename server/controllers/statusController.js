const pool = require('../db')

const updateStatus = async (req, res) => {
  const { tracking_number } = req.params
  const { status, notes ,collected_by_name, collected_by_id } = req.body
  const updated_by = req.user.user_id

  const validStatuses = ['Registered', 'Dispatched', 'In Transit', 'Arrived', 'Collected']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' })
  }

  let client

  try {
    client = await pool.connect()
    await client.query('BEGIN')

    const parcelResult = await client.query(
      'SELECT parcel_id FROM parcels WHERE tracking_number = $1',
      [tracking_number]
    )

    if (parcelResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Parcel not found' })
    }

    const parcel_id = parcelResult.rows[0].parcel_id

    // ============================================================
    // START OF CHANGE: NEW PAYMENT GATE LOGIC
    // This replaces the old 'restrictedStatuses' block.
    // It now ONLY blocks the 'Collected' status if a balance is owed.
    // ============================================================
    if (status === 'Collected') {
      const paymentCheck = await client.query(
        `SELECT COALESCE(balance_due, amount_charged) AS balance_due 
         FROM parcels WHERE parcel_id = $1`,
        [parcel_id]
      )
      const balanceDue = parseFloat(paymentCheck.rows[0].balance_due)

      if (balanceDue > 0) {
        await client.query('ROLLBACK')
        return res.status(402).json({
          message: `Cannot collect parcel. Outstanding balance: KES ${balanceDue.toLocaleString()}. Please complete payment first.`,
          balance_due: balanceDue,
          tracking_number: tracking_number
        })
      }
    }
    // ============================================================
    // END OF CHANGE
    // ============================================================

    // Step 2: Update current_status
    await client.query(
      'UPDATE parcels SET current_status = $1 WHERE parcel_id = $2',
      [status, parcel_id]
    )
    if (status === 'Collected' && collected_by_name) {
      await client.query(
        'UPDATE parcels SET collected_by_name = $1, collected_by_id = $2 WHERE parcel_id = $3',
        [collected_by_name, collected_by_id, parcel_id]
      )
    }

    // Step 3: Log to history
    const historyNotes = status === 'Collected' && collected_by_name
    ? `Collected by: ${collected_by_name} (ID: ${collected_by_id}). ${notes || ''}`
    : notes || ''
    await client.query(
      `INSERT INTO parcel_status_history (parcel_id, status, updated_by, notes)
       VALUES ($1, $2, $3, $4)`,
      [parcel_id, status, updated_by, historyNotes]
    )

    await client.query('COMMIT')

    // --- STEP 5: SMS TRIGGER START ---
    try {
      const { sendSMS } = require('../services/smsService') 
      
      const phoneQuery = await pool.query(`
        SELECT s.phone_number AS sender_phone, r.phone_number AS receiver_phone, 
               p.tracking_number
        FROM parcels p
        JOIN customers s ON p.sender_id = s.customer_id
        JOIN customers r ON p.receiver_id = r.customer_id
        WHERE p.parcel_id = $1
      `, [parcel_id])

      if (phoneQuery.rows.length > 0) {
        const { sender_phone, receiver_phone, tracking_number } = phoneQuery.rows[0]
        const message = `SwiftCourier: Your parcel ${tracking_number} status is now "${status}". Thank you.`
        
        // Send to both — non-blocking
        sendSMS([sender_phone, receiver_phone], message).catch(console.error)
      }
    } catch (smsError) {
      console.error('SMS trigger error:', smsError) 
    }
    // --- SMS TRIGGER END ---

    // Final Success Response
    res.json({ 
        message: 'Status updated successfully', 
        status,
        sms_attempted: true  
      })

  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK') } catch (rollbackError) { console.error('Rollback error:', rollbackError) }
    }
    console.error('Update status error:', error)
    res.status(500).json({ message: 'Server error while updating status' })
  } finally {
    if (client) { client.release() }
  }
}
// ── BATCH STATUS UPDATE ──
// Updates multiple parcels to the same new status at once
// Used when a vehicle arrives and the clerk needs to update all parcels on that route
const batchUpdateStatus = async (req, res) => {
  // tracking_numbers is an array of tracking numbers to update
  const { tracking_numbers, status, notes } = req.body
  const updated_by = req.user.user_id

  if (!Array.isArray(tracking_numbers) || tracking_numbers.length === 0) {
    return res.status(400).json({ message: 'No tracking numbers provided' })
  }

  const validStatuses = ['Registered', 'Dispatched', 'In Transit', 'Arrived', 'Collected']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' })
  }

  let client
  try {
    client = await pool.connect()
    await client.query('BEGIN')

    const results = { updated: [], failed: [] }

    for (const tracking of tracking_numbers) {
      // Find each parcel
      const parcelRes = await client.query(
        'SELECT parcel_id FROM parcels WHERE tracking_number = $1',
        [tracking]
      )

      if (parcelRes.rows.length === 0) {
        results.failed.push({ tracking, reason: 'Not found' })
        continue
      }

      const parcel_id = parcelRes.rows[0].parcel_id

      // Update status
      await client.query(
        'UPDATE parcels SET current_status = $1 WHERE parcel_id = $2',
        [status, parcel_id]
      )

      // Log to history
      await client.query(
        `INSERT INTO parcel_status_history (parcel_id, status, updated_by, notes)
         VALUES ($1, $2, $3, $4)`,
        [parcel_id, status, updated_by, notes || 'Batch update']
      )

      results.updated.push(tracking)
    }

    await client.query('COMMIT')
    res.json({
      message: `${results.updated.length} parcels updated successfully`,
      updated: results.updated,
      failed:  results.failed
    })

  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(console.error)
    console.error('Batch update error:', error)
    res.status(500).json({ message: 'Server error during batch update' })
  } finally {
    if (client) client.release()
  }
}

module.exports = { updateStatus, batchUpdateStatus }


const pool = require('../db')

const updateStatus = async (req, res) => {
  const { tracking_number } = req.params
  const { status, notes } = req.body
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

    // Payment Required Check
    const restrictedStatuses = ['In Transit', 'Arrived', 'Collected'];
    if (restrictedStatuses.includes(status)) {
        const paymentCheck = await client.query(
            'SELECT payment_id FROM payments WHERE parcel_id = $1 AND payment_status = $2',
            [parcel_id, 'Paid']
        );

        if (paymentCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(402).json({ 
                message: 'Payment required',
                parcel_id: parcel_id 
            });
        }
    }

    // Step 2: Update current_status
    await client.query(
      'UPDATE parcels SET current_status = $1 WHERE parcel_id = $2',
      [status, parcel_id]
    )

    // Step 3: Log to history
    await client.query(
      `INSERT INTO parcel_status_history (parcel_id, status, updated_by, notes)
       VALUES ($1, $2, $3, $4)`,
      [parcel_id, status, updated_by, notes || '']
    )

    await client.query('COMMIT')

    // --- STEP 5: SMS TRIGGER START ---
    try {
      const { sendSMS } = require('../services/smsService') //
      
      // Get sender and receiver phone numbers
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
      console.error('SMS trigger error:', smsError) // Don't block the response
    }
    // --- SMS TRIGGER END ---

    // Final Success Response
    res.json({ 
        message: 'Status updated successfully', 
        status,
        sms_attempted: true  // frontend can show a notification based on this
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

module.exports = { updateStatus }
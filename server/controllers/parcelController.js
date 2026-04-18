const pool = require('../db')

// ── REGISTER PARCEL ──
// This handles POST /api/parcels
// It saves the sender, receiver, and parcel to the database
const registerParcel = async (req, res) => {

  // Destructure everything we expect from the form submission
  const {
    sender_name, sender_phone, sender_id_number,
    receiver_name, receiver_phone,
    destination_office_id,
    description, weight
  } = req.body

  // req.user comes from the auth middleware — it has the logged-in clerk's info
  const registered_by = req.user.user_id

  try {

    // ── Step 1: Save or find the sender in the customers table ──
    // We check if this phone number already exists — no duplicate customers
    let senderResult = await pool.query(
      'SELECT * FROM customers WHERE phone_number = $1',
      [sender_phone]
    )

    let sender_db_id

    if (senderResult.rows.length > 0) {
      // Sender already exists — just use their existing ID
      sender_db_id = senderResult.rows[0].customer_id
    } else {
      // Sender is new — insert them and get back their new ID
      const newSender = await pool.query(
        `INSERT INTO customers (name, phone_number, national_id) 
         VALUES ($1, $2, $3) RETURNING customer_id`,
        [sender_name, sender_phone, sender_id_number]
      )
      sender_db_id = newSender.rows[0].customer_id
    }

    // ── Step 2: Save or find the receiver ──
    let receiverResult = await pool.query(
      'SELECT * FROM customers WHERE phone_number = $1',
      [receiver_phone]
    )

    let receiver_db_id

    if (receiverResult.rows.length > 0) {
      receiver_db_id = receiverResult.rows[0].customer_id
    } else {
      const newReceiver = await pool.query(
        `INSERT INTO customers (name, phone_number) 
         VALUES ($1, $2) RETURNING customer_id`,
        [receiver_name, receiver_phone]
      )
      receiver_db_id = newReceiver.rows[0].customer_id
    }

    // ── Step 3: Generate a unique tracking number ──
    // Format: PKG-2026-XXXX
    // Try up to MAX_ATTEMPTS times to find a number not already in the database.
    // Using a flag instead of checking inside the loop prevents continuing with
    // a duplicate if the loop exits for any other reason.
    const MAX_ATTEMPTS = 10
    let tracking_number
    let trackingFound = false

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const year   = new Date().getFullYear()
      const random = Math.floor(Math.random() * 9000) + 1000
      const candidate = `PKG-${year}-${random}`

      // Check if this tracking number already exists
      const existing = await pool.query(
        'SELECT parcel_id FROM parcels WHERE tracking_number = $1',
        [candidate]
      )

      // If no rows found, this number is unique — use it
      if (existing.rows.length === 0) {
        tracking_number = candidate
        trackingFound = true
        break
      }
    }

    // If all attempts were exhausted without finding a unique number, fail fast
    if (!trackingFound) {
      return res.status(500).json({ message: 'Could not generate a unique tracking number. Please try again.' })
    }

    // ── Step 4: Calculate estimated cost ──
    // Simple formula for now — we'll improve this with real route pricing later
    const base_price = 300
    const per_kg_rate = 50
    const amount_charged = base_price + (parseFloat(weight) * per_kg_rate)

    // ── Step 5: Get the clerk's office as the origin office ──
    const clerkResult = await pool.query(
      'SELECT office_id FROM users WHERE user_id = $1',
      [registered_by]
    )
    const origin_office_id = clerkResult.rows[0].office_id

    // ── Step 6: Save the parcel record ──
    const parcelResult = await pool.query(
      `INSERT INTO parcels 
        (tracking_number, sender_id, receiver_id, description, weight,
         origin_office_id, destination_office_id, amount_charged, registered_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        tracking_number, sender_db_id, receiver_db_id, description,
        weight, origin_office_id, destination_office_id,
        amount_charged, registered_by
      ]
    )

    const parcel = parcelResult.rows[0]

    // ── Step 7: Log the initial status in parcel_status_history ──
    // Every status change gets recorded — this is the first one: Registered
    await pool.query(
      `INSERT INTO parcel_status_history (parcel_id, status, updated_by, notes)
       VALUES ($1, $2, $3, $4)`,
      [parcel.parcel_id, 'Registered', registered_by, 'Parcel registered at origin office']
    )

    // ── Step 8: Send success response back to the frontend ──
    res.status(201).json({
      message: 'Parcel registered successfully',
      tracking_number: parcel.tracking_number,
      amount_charged: parcel.amount_charged,
      parcel_id: parcel.parcel_id
    })

  } catch (error) {
    console.error('Register parcel error:', error)
    res.status(500).json({ message: 'Server error while registering parcel' })
  }
}

module.exports = { registerParcel }
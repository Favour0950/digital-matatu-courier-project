const pool = require("../db");
// ── POST /api/payments ──
// Records a payment (full or partial) against a parcel
// Updates the parcel's running balance_due after each payment
const recordPayment = async (req, res) => {
  const { tracking_number, amount, payment_method, mpesa_ref } = req.body;

  if (!tracking_number || !amount || !payment_method) {
    return res.status(400).json({
      message: "Tracking number, amount and payment method are required.",
    });
  }

  try {
    // Get parcel with its current outstanding balance
    const parcelResult = await pool.query(
      `SELECT parcel_id, amount_charged,
              COALESCE(balance_due, amount_charged) AS balance_due
       FROM parcels WHERE tracking_number = $1`,
      [tracking_number],
    );

    if (parcelResult.rows.length === 0) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    const parcel = parcelResult.rows[0];
    const totalOwed = parseFloat(parcel.amount_charged);
    const balanceDue = parseFloat(parcel.balance_due);
    const paidNow = parseFloat(amount);

    // Validate amount
    if (paidNow <= 0) {
      return res
        .status(400)
        .json({ message: "Amount must be greater than 0." });
    }
    if (paidNow > balanceDue) {
      return res.status(400).json({
        message: `Amount exceeds outstanding balance. Only KES ${balanceDue.toLocaleString()} is owed.`,
      });
    }

    // Calculate new balance after this payment
    const newBalance = Math.max(0, balanceDue - paidNow);
    const isFullyPaid = newBalance <= 0;

    // payment_type: 'full' = paid everything at once, 'partial' = still owes, 'balance' = cleared remaining
    const payment_type =
      isFullyPaid && balanceDue === totalOwed
        ? "full"
        : isFullyPaid
          ? "balance"
          : "partial";

    // Insert the payment record
    const paymentResult = await pool.query(
      `INSERT INTO payments (parcel_id, amount, payment_method, mpesa_ref, payment_status, payment_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        parcel.parcel_id,
        paidNow,
        payment_method,
        mpesa_ref || null,
        isFullyPaid ? "Paid" : "Partial",
        payment_type,
      ],
    );

    // Update the parcel's outstanding balance
    await pool.query(
      "UPDATE parcels SET balance_due = $1 WHERE parcel_id = $2",
      [newBalance, parcel.parcel_id],
    );

    res.status(201).json({
      message: isFullyPaid
        ? "Payment complete. Parcel is fully paid."
        : "Partial payment recorded.",
      payment: paymentResult.rows[0],
      balance_due: newBalance,
      fully_paid: isFullyPaid,
    });
  } catch (error) {
    console.error("Record payment error:", error);
    res.status(500).json({ message: "Server error recording payment" });
  }
};

// ── GET /api/payments/parcel/:tracking_number ──
// Returns parcel summary for the payment form, including current balance
const getParcelForPayment = async (req, res) => {
  const { tracking_number } = req.params;

  try {
    const result = await pool.query(`
  SELECT
    p.tracking_number,
    p.amount_charged,
    COALESCE(p.balance_due, p.amount_charged) AS balance_due,
    s.name           AS sender_name,
    o2.office_name   AS destination_office,
    CASE
      WHEN COALESCE(p.balance_due, p.amount_charged) <= 0
           AND EXISTS (SELECT 1 FROM payments pay WHERE pay.parcel_id = p.parcel_id)
        THEN 'Paid'
      WHEN COALESCE(p.balance_due, p.amount_charged) < p.amount_charged
           AND COALESCE(p.balance_due, p.amount_charged) > 0
        THEN 'Partial'
      ELSE 'Unpaid'
    END AS payment_status
  FROM parcels p
  JOIN customers s  ON p.sender_id            = s.customer_id
  JOIN offices   o2 ON p.destination_office_id = o2.office_id
  WHERE p.tracking_number = $1
`, [tracking_number],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get parcel for payment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { recordPayment, getParcelForPayment };

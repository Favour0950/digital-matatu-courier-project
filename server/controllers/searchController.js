const pool = require('../db');
//search parcel by tracking number
//handles GET /api/parcels/:tracking_number
const searchParcel =  async (req, res) => {
    //the tracking number comes from the url
    //req.params.tracking_number will capture it
    const {tracking_number} = req.params
    try{
       //use a JOIN to pull data from multiple tables at a go 
       const result = await pool.query(`
      SELECT 
        p.parcel_id,
        p.tracking_number,
        p.description,
        p.weight,
        p.amount_charged,
        p.current_status,
        p.created_at,
        s.name         AS sender_name,
        s.phone_number AS sender_phone,
        r.name         AS receiver_name,
        r.phone_number AS receiver_phone,
        o1.office_name AS origin_office,
        o2.office_name AS destination_office
      FROM parcels p
      JOIN customers s  ON p.sender_id             = s.customer_id
      JOIN customers r  ON p.receiver_id            = r.customer_id
      JOIN offices   o1 ON p.origin_office_id       = o1.office_id
      JOIN offices   o2 ON p.destination_office_id  = o2.office_id
      WHERE p.tracking_number = $1
    `, [tracking_number])
    // If no parcel found with that tracking number
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Parcel not found' })
    }
    const parcel= result.rows[0]
    //also get full parcel status history that powers the frontend tracking timeline

    const historyResult = await pool.query(`
      SELECT 
        psh.status,
        psh.notes,
        psh.updated_at,
        u.name AS updated_by
      FROM parcel_status_history psh
      LEFT JOIN users u ON psh.updated_by = u.user_id
      WHERE psh.parcel_id = $1
      ORDER BY psh.updated_at ASC
    `, [parcel.parcel_id]) //use the parcel_id from the first query to get the status history

    // Send parcel details + history together
    res.json({
      parcel,
      history: historyResult.rows
    })
    } catch (error) {
    console.error('Search parcel error:', error)
    res.status(500).json({ message: 'Server error while searching parcel' })
  }
}
module.exports = {searchParcel}
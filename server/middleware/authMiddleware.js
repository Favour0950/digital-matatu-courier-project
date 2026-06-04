const jwt = require('jsonwebtoken')
const pool = require('../db')
require('dotenv').config()

// This function runs BEFORE any protected route handler
// It checks if the request carries a valid token
const verifyToken = (req, res, next) => {

  // The token comes in the request headers under "Authorization"
  // It looks like: "Bearer eyJhbGci..."
  const authHeader = req.headers['authorization']

  // If no header at all, reject immediately
  if (!authHeader) {
    return res.status(403).json({ message: 'No token provided' })
  }

  // Split "Bearer eyJhbGci..." into ["Bearer", "eyJhbGci..."]
  // We only want the second part — the actual token
  const token = authHeader.split(' ')[1]

  if (!token) {
    return res.status(403).json({ message: 'No token provided' })
  }

  // jwt.verify checks if the token is valid and not expired
  // If valid, it decodes the payload we stored at login (user_id, role, name)
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }

    try {
      // CHANGE START: Re-check the user's active status on every protected request.
      // This means a deactivated clerk is blocked immediately, even if they still
      // have an old JWT token stored in the browser from before deactivation.
      const result = await pool.query(
        'SELECT is_active FROM users WHERE user_id = $1',
        [decoded.user_id]
      )

      if (result.rows.length === 0 || result.rows[0].is_active === false) {
        return res.status(403).json({
          message: 'This account has been deactivated. Please contact your administrator.'
        })
      }
      // CHANGE END

      // Attach the decoded user info to the request object
      // Now any route handler can access req.user.role, req.user.user_id etc
      req.user = decoded
      next() // move on to the actual route handler
    } catch (error) {
      console.error('Token active-status check error:', error)
      return res.status(500).json({ message: 'Server error verifying account status' })
    }
  })
}

// Middleware that only allows admins through
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

module.exports = { verifyToken, verifyAdmin }

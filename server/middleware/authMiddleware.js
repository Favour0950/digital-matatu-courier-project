const jwt = require('jsonwebtoken')
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
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }

    // Attach the decoded user info to the request object
    // Now any route handler can access req.user.role, req.user.user_id etc
    req.user = decoded
    next() // move on to the actual route handler
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
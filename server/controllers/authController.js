const pool = require('../db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config()

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body

  try {
    // Find user by email in database
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    )

    // If no user found, reject
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const user = result.rows[0]

    // Compare submitted password with stored hash
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Create a JWT token containing user info
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    // Send token and user info back to frontend
    res.json({
      token,
      role: user.role,
      name: user.name,
      email: user.email
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { login }
const pool = require('../db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config()

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body

  try {
    // Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const user = result.rows[0]

    // Compare password with stored hash
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Sign JWT token
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, name: user.name, office_id: user.office_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      token,
      role: user.role,
      name: user.name,
      email: user.email,
      office_id: user.office_id
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// CHANGE PASSWORD
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const user_id = req.user.user_id

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters.' })
  }

  try {
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE user_id = $1', [user_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash)
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect.' })
    }

    const newHash = await bcrypt.hash(newPassword, 10)
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE user_id = $2',
      [newHash, user_id]
    )

    res.json({ message: 'Password updated successfully' })

  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { login, changePassword }
const express = require('express')
const cors = require('cors')// Import the database connection pool
require('dotenv').config() // Load environment variables from .env file

const app = express()
//middleware
app.use(cors())
app.use(express.json()) // Middleware to parse JSON request bodies

// Routes
const authRoutes = require('./routes/authRoutes')
const parcelRoutes = require('./routes/parcelRoutes')
app.use('/api/auth', authRoutes)// Use auth routes for authentication-related endpoints
app.use('/api/parcels', parcelRoutes)// Use parcel routes for parcel-related endpoints
//test route
app.get('/', (req, res) => {
  res.json({ message: 'SwiftCourier API is running!' })
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

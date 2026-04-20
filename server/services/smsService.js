const AfricasTalking = require('africastalking')

// Initialise with sandbox credentials from .env
const AT = AfricasTalking({
  apiKey:   process.env.AT_API_KEY,
  username: process.env.AT_USERNAME  // use 'sandbox' for testing
})

const sms = AT.SMS

// sendSMS sends a message to one or more phone numbers
async function sendSMS(to, message) {
  try {
    // 'to' can be a single number string or array of strings
    // Numbers must be in international format: +254712345678
    const result = await sms.send({
      to:      Array.isArray(to) ? to : [to],
      message: message,
      from:    'SwiftCourier'  // sender name (sandbox ignores this)
    })
    console.log('SMS sent:', result)
    return result
  } catch (error) {
    console.error('SMS error:', error)
    throw error
  }
}

module.exports = { sendSMS }
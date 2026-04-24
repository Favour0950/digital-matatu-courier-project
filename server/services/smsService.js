const AfricasTalking = require('africastalking')

const AT = AfricasTalking({
  apiKey:   process.env.AT_API_KEY,
  username: process.env.AT_USERNAME 
})

const sms = AT.SMS

// ADD THIS: Helper to convert 07xx to +2547xx
function formatPhone(phone) {
  if (phone.startsWith('+')) return phone;
  if (phone.startsWith('0')) return '+254' + phone.slice(1);
  return '+254' + phone;
}

async function sendSMS(to, message) {
  try {
    // FORMAT the numbers before sending
    const recipients = (Array.isArray(to) ? to : [to]).map(formatPhone);

    const result = await sms.send({
      to:      recipients,
      message: message,
      from:    'SwiftCourier' 
    })
    console.log('SMS sent:', result)
    return result
  } catch (error) {
    console.error('SMS error:', error)
    throw error
  }
}

module.exports = { sendSMS }
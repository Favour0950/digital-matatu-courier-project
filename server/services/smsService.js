const AfricasTalking = require('africastalking');

// 1. Log to verify credentials load correctly in Render
console.log('SMS Service: Initializing with Username:', process.env.AT_USERNAME);
console.log('SMS Service: API Key present:', !!process.env.AT_API_KEY);

const AT = AfricasTalking({
  apiKey:   process.env.AT_API_KEY,
  username: process.env.AT_USERNAME 
});

const sms = AT.SMS;

function formatPhone(phone) {
  if (!phone) return null; // Handle missing numbers
  if (phone.startsWith('+')) return phone;
  if (phone.startsWith('0')) return '+254' + phone.slice(1);
  return '+254' + phone;
}

async function sendSMS(to, message) {
  try {
    const recipients = (Array.isArray(to) ? to : [to])
      .map(formatPhone)
      .filter(Boolean); // Only send to valid formatted strings

    console.log('Attempting SMS to:', recipients);
    
    const result = await sms.send({
      to:      recipients,
      message: message,
      //from:    'SwiftCourier' 
    });

    // 2. This log is vital—it shows the API response in your Render dashboard
    console.log('SMS API Response:', JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('SMS Service Error:', error.message);
    throw error;
  }
}

module.exports = { sendSMS };
// server.js
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

/**
 * Send a message using WhatsApp Cloud API.
 * @param {Object} payload - JSON payload for the message.
 * @returns {Promise}
 */
async function sendMessage(payload) {
  try {
    const response = await axios({
      method: 'post',
      url: `https://graph.facebook.com/${process.env.VERSION}/${process.env.PHONE_NUMBER_ID}/messages`,
      headers: {
        'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: payload
    });
    console.log('Message sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Create a text message payload.
 * @param {string} recipient - WhatsApp number of recipient.
 * @param {string} text - Message text.
 * @returns {Object} Payload object.
 */
function createTextMessage(recipient, text) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "text",
    text: {
      body: text
    }
  };
}

/**
 * Immediately after startup, send an alert to the admin.
 */
async function sendAdminAlert() {
  const adminText = `FY'S PROPERTY Bot is LIVE on port ${PORT}.`;
  try {
    await sendMessage(createTextMessage(process.env.ADMIN_WAID, adminText));
    console.log("Admin alert sent successfully.");
  } catch (error) {
    console.error("Failed to send admin alert.");
  }
}

/**
 * Webhook endpoint to process incoming messages.
 * Every incoming message triggers an immediate reply and is forwarded to the admin.
 */
app.post('/webhook', async (req, res) => {
  try {
    // Expecting a JSON body: { "from": "<sender_number>", "message": "<user_message>" }
    const { from, message } = req.body;
    if (!from || !message) {
      console.error("Invalid payload. Must include 'from' and 'message'.");
      return res.status(400).send("Invalid payload. Must include 'from' and 'message'.");
    }
    
    console.log(`Received message from ${from}: ${message}`);
    
    // Create a reply message
    const reply = `Thank you for contacting FY'S PROPERTY. We have received your message: "${message}". One of our agents will get back to you shortly.`;
    
    // Send reply to the user
    await sendMessage(createTextMessage(from, reply));
    console.log(`Replied to ${from}.`);
    
    // Forward the user's message to admin (for immediate alert)
    const forward = `User ${from} sent: "${message}"`;
    await sendMessage(createTextMessage(process.env.ADMIN_WAID, forward));
    console.log("Forwarded user message to admin.");
    
    res.sendStatus(200);
  } catch (error) {
    console.error("Error in /webhook:", error.response ? error.response.data : error.message);
    res.sendStatus(500);
  }
});

// A simple endpoint to check that the server is running
app.get('/', (req, res) => {
  res.send("FY'S PROPERTY WhatsApp Bot is running.");
});

// Start the server and send admin alert
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  sendAdminAlert();
});

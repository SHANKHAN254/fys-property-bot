// server.js
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

/**
 * Sends a message via WhatsApp Cloud API.
 * @param {Object} data - The payload for the API call.
 * @returns {Promise}
 */
function sendMessage(data) {
  const config = {
    method: 'post',
    url: `https://graph.facebook.com/${process.env.VERSION}/${process.env.PHONE_NUMBER_ID}/messages`,
    headers: {
      'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    data: data
  };
  return axios(config);
}

/**
 * Returns a JSON payload for a text message.
 * @param {string} recipient - The recipient’s WhatsApp number.
 * @param {string} text - The message body.
 * @returns {Object} JSON payload.
 */
function getTextMessageInput(recipient, text) {
  return {
    "messaging_product": "whatsapp",
    "preview_url": false,
    "recipient_type": "individual",
    "to": recipient,
    "type": "text",
    "text": {
      "body": text
    }
  };
}

/**
 * Sends an alert message to the admin after the server starts.
 */
function sendAdminAlert() {
  const adminNumber = process.env.ADMIN_WAID;
  const alertText = `FY'S PROPERTY Bot has been successfully deployed and is running on port ${PORT}.`;
  sendMessage(getTextMessageInput(adminNumber, alertText))
    .then(() => {
      console.log('Admin alert message sent.');
    })
    .catch((error) => {
      console.error('Failed to send admin alert message:', error.response ? error.response.data : error.message);
    });
}

/**
 * Webhook endpoint to process incoming messages.
 * Every message from a user receives an immediate reply.
 * Expected POST body: { from: 'sender_phone', message: 'user input' }
 */
app.post('/webhook', async (req, res) => {
  try {
    // Get the sender's phone number and message from the request body.
    const from = req.body.from;
    const message = req.body.message || '';
    
    // Log the incoming message.
    console.log(`Received message from ${from}: ${message}`);

    // Prepare a generic, sensitive reply for any incoming message.
    const replyText = `Thank you for contacting FY'S PROPERTY. We have received your message: "${message}". Our team will respond to you shortly.`;

    // Send the reply immediately.
    await sendMessage(getTextMessageInput(from, replyText));
    console.log(`Replied to ${from} with: ${replyText}`);

    // Optionally, forward the user's message to admin as well.
    const adminForwardText = `User ${from} sent: "${message}"`;
    sendMessage(getTextMessageInput(process.env.ADMIN_WAID, adminForwardText))
      .then(() => console.log(`Forwarded user message to admin.`))
      .catch(err => console.error('Error forwarding to admin:', err.response ? err.response.data : err.message));
    
    // Respond to the webhook request.
    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing webhook:', error.response ? error.response.data : error.message);
    res.sendStatus(500);
  }
});

// Simple GET endpoint to confirm the server is running.
app.get('/', (req, res) => {
  res.send("FY'S PROPERTY WhatsApp Bot is running.");
});

// Start the server and immediately send an alert message to the admin.
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  sendAdminAlert();
});

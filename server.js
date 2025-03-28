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
 * Sends an alert message to the admin after successful deployment.
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
 * Main webhook endpoint to process incoming messages.
 * Expected POST body: { from: 'sender_phone', message: 'user input' }
 */
app.post('/webhook', async (req, res) => {
  try {
    const from = req.body.from; // sender's WhatsApp number
    const userMessage = req.body.message ? req.body.message.trim().toLowerCase() : "";
    console.log(`Received message from ${from}: ${userMessage}`);

    let replyText = '';

    // Main menu and options
    if (userMessage === 'menu' || userMessage === 'start') {
      replyText = `Welcome to FY'S PROPERTY – Your gateway to dream properties!
Please choose an option:
1. View Property Listings
2. Buy a Property
3. Sell Your Property
4. Contact Admin
5. FAQs / Help
Reply with the option number.`;
    } else if (userMessage === '1') {
      replyText = `Our current property listings:
1. Cozy Apartment - $250,000
2. Modern Villa - $750,000
3. Luxury Condo - $500,000
Reply with the property number for more details.`;
    } else if (userMessage === '2') {
      replyText = `You've chosen to buy a property.
Please reply with the property number you wish to purchase, and we'll guide you through the next steps.`;
    } else if (userMessage === '3') {
      replyText = `To sell your property, please send us the details (address, price, photos).
Our team will review your submission and get back to you shortly.`;
    } else if (userMessage === '4') {
      // Forward the user's request to the admin
      const adminNumber = process.env.ADMIN_WAID;
      const forwardText = `User ${from} has requested to contact admin. Message: "${req.body.message}"`;
      await sendMessage(getTextMessageInput(adminNumber, forwardText));
      replyText = `Your message has been forwarded to our admin. They will contact you shortly.`;
    } else if (userMessage === '5' || userMessage === 'faqs') {
      replyText = `FAQs:
Q: How do I view listings? A: Reply "1" from the main menu.
Q: How do I buy? A: Reply "2" and follow the instructions.
For further help, type "menu" to return to the main options.`;
    } else {
      replyText = `Thank you for your message. To see options, please type "menu".`;
    }

    // Send the reply back to the user
    await sendMessage(getTextMessageInput(from, replyText));
    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing webhook:', error.response ? error.response.data : error.message);
    res.sendStatus(500);
  }
});

// A simple GET endpoint to confirm the server is running.
app.get('/', (req, res) => {
  res.send("FY'S PROPERTY WhatsApp Bot is running.");
});

// Start the server and send an admin alert once it's up.
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  sendAdminAlert();
});

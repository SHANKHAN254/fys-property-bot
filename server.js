// server.js
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

/**
 * Sends a message via the WhatsApp Cloud API.
 * @param {Object} payload - The JSON payload to send.
 * @returns {Promise} Axios promise.
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
    console.log('Message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Creates a plain text message payload.
 * @param {string} recipient - The recipient’s WhatsApp number.
 * @param {string} text - The text of the message.
 * @returns {Object} The JSON payload.
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
 * Creates an interactive button message payload.
 * This message includes buttons for the following flows:
 * 1. View Property Listings
 * 2. Buy a Property
 * 3. Sell Your Property
 * 4. Contact Admin
 * 5. FAQs/Help
 *
 * @param {string} recipient - The recipient’s WhatsApp number.
 * @returns {Object} The JSON payload.
 */
function createInteractiveMessage(recipient) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: "FY'S PROPERTY Bot is LIVE. Please choose an option to test:"
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "option1",
              title: "View Property Listings"
            }
          },
          {
            type: "reply",
            reply: {
              id: "option2",
              title: "Buy a Property"
            }
          },
          {
            type: "reply",
            reply: {
              id: "option3",
              title: "Sell Your Property"
            }
          },
          {
            type: "reply",
            reply: {
              id: "option4",
              title: "Contact Admin"
            }
          },
          {
            type: "reply",
            reply: {
              id: "option5",
              title: "FAQs/Help"
            }
          }
        ]
      }
    }
  };
}

/**
 * Sends an admin alert message (with interactive buttons) immediately after the server starts.
 */
async function sendAdminAlert() {
  const adminNumber = process.env.ADMIN_WAID;
  try {
    await sendMessage(createInteractiveMessage(adminNumber));
    console.log('Admin interactive menu sent successfully.');
  } catch (error) {
    console.error('Failed to send admin interactive menu:', error.response ? error.response.data : error.message);
  }
}

/**
 * Webhook endpoint to process incoming messages.
 * Expects a JSON body: { "from": "<sender_phone>", "message": "<user_message>" }
 * Replies immediately to the sender and forwards the message to the admin.
 */
app.post('/webhook', async (req, res) => {
  try {
    const { from, message } = req.body;
    if (!from || !message) {
      console.error("Invalid payload received. 'from' and 'message' are required.");
      return res.status(400).send("Invalid payload. 'from' and 'message' are required.");
    }
    
    console.log(`Received message from ${from}: ${message}`);
    
    // Immediate reply to the user.
    const replyText = `Thank you for contacting FY'S PROPERTY. We received your message: "${message}". Our team will get back to you shortly.`;
    await sendMessage(createTextMessage(from, replyText));
    console.log(`Replied to ${from}.`);

    // Forward the user's message to the admin.
    const forwardText = `User ${from} sent: "${message}"`;
    await sendMessage(createTextMessage(process.env.ADMIN_WAID, forwardText));
    console.log(`Forwarded user message from ${from} to admin.`);
    
    res.sendStatus(200);
  } catch (error) {
    console.error("Error processing /webhook:", error.response ? error.response.data : error.message);
    res.sendStatus(500);
  }
});

// A simple GET endpoint to verify the server is running.
app.get('/', (req, res) => {
  res.send("FY'S PROPERTY WhatsApp Bot is running.");
});

// Start the server and send the admin interactive menu alert.
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  sendAdminAlert();
});

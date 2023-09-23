const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
console.log("port", port);

// Parse incoming JSON requests
app.use(bodyParser.json());

// Slack API endpoint for receiving messages
app.post("/slack/message", async (req, res) => {
  const { type, subtype, text, channel, bot_id } = req.body.event;

  // Forward message to ChatGPT
  if (!bot_id && type == "message" && !subtype && channel == "C051F7Y0FAL") {
    console.log("req.body.event: ", req.body.event);
    const chatGPTResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        messages: [{ role: "user", content: text }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Send ChatGPT response back to Slack
    const { choices } = chatGPTResponse.data;
    const {
      message: { content: chatGPTText },
    } = choices[0];
    const message = {
      text: `@ChatGPT\n ${chatGPTText}`,
      channel: channel,
    };

    const response = await axios.post(
      "https://slack.com/api/chat.postMessage",
      message,
      {
        headers: {
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("res", response.data);
  }

  res.status(200).send(req.body.challenge || "");
});

app.listen(port, () => {
  console.log(`Slack bot listening on port ${port}`);
});

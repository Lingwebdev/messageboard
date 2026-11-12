const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "messages.json");

app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

async function readMessages() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const content = await fs.readFile(DATA_FILE, "utf8");
    const messages = JSON.parse(content);
    return Array.isArray(messages) ? messages : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(DATA_FILE, "[]\n", "utf8");
      return [];
    }
    throw error;
  }
}

// Keep writes in sequence so simultaneous submissions are not lost.
let writeQueue = Promise.resolve();

app.get("/api/messages/count", async (req, res) => {
  try {
    const messages = await readMessages();
    res.json({ count: messages.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load message count." });
  }
});

app.post("/api/messages", (req, res) => {
  const message = typeof req.body.message === "string"
    ? req.body.message.trim()
    : "";

  if (!message) {
    return res.status(400).json({ error: "Please enter a message." });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: "Messages must be 2,000 characters or fewer." });
  }

  const newMessage = {
    time: new Date().toISOString(),
    message
  };

  writeQueue = writeQueue.then(async () => {
    const messages = await readMessages();
    messages.push(newMessage);
    await fs.writeFile(DATA_FILE, JSON.stringify(messages, null, 2) + "\n", "utf8");
  });

  writeQueue
    .then(() => res.status(201).json({ success: true }))
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Your message could not be saved. Please try again." });
    });
});

app.listen(PORT, () => {
  console.log(`Message board running at http://localhost:${PORT}`);
});
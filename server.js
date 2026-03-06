const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend build
app.use(express.static(path.join(__dirname, "build")));

/* ─────────────────────────────────────────
   Physiology Route
───────────────────────────────────────── */
app.post("/api/physiology", async (req, res) => {
  try {
    const response = await axios.post(
      `${process.env.PYTHON_ENGINE}/physiology`,
      req.body
    );

    res.json(response.data);

  } catch (error) {
    console.error("Physiology error:", error.message);
    res.status(500).send("Nutrition engine error");
  }
});

/* ─────────────────────────────────────────
   Enhanced Physiology Route
───────────────────────────────────────── */
app.post("/api/physiology-enhanced", async (req, res) => {
  try {

    const response = await axios.post(
      `${process.env.PYTHON_ENGINE}/v1/physiology/sync`,
      req.body
    );

    res.json(response.data);

  } catch (error) {
    console.error("Enhanced physiology error:", error.message);
    res.status(500).json({ error: "Enhanced physiology service unavailable" });
  }
});

/* ─────────────────────────────────────────
   Real-time Vitals
───────────────────────────────────────── */
app.get("/api/vitals-realtime", async (req, res) => {
  try {

    const response = await axios.get(
      `${process.env.PYTHON_ENGINE}/v1/physiology/today`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BACKEND_AUTH_TOKEN}`
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error("Real-time vitals error:", error.message);
    res.status(500).json({ error: "Real-time vitals unavailable" });
  }
});

/* ─────────────────────────────────────────
   AI Chat (Groq)
───────────────────────────────────────── */
app.post('/api/chat', async (req, res) => {
  try {

    const { messages } = req.body;
    const prompt = messages.map(m => m.content).join('\n');

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        }
      }
    );

    const text = response.data.choices[0].message.content;

    res.json({ content: [{ type: 'text', text }] });

  } catch (err) {
    console.error('Chat error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────
   Food Image (Spoonacular)
───────────────────────────────────────── */
app.get('/api/food-image', async (req, res) => {
  try {

    const { query } = req.query;

    const simplified = query
      .replace(/\(.*?\)/g, '')
      .replace(/\bwith\b.*/i, '')
      .replace(/whole wheat|brown rice|grilled|steamed|masala|tikka|lobia|sabzi|curry|dal|roti|chapati|bhurji|tadka|makhani|paneer/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 3)
      .join(' ');

    const response = await axios.get(
      'https://api.spoonacular.com/recipes/complexSearch',
      {
        params: {
          query: simplified,
          number: 1,
          apiKey: process.env.SPOONACULAR_API_KEY,
        }
      }
    );

    const results = response.data.results;

    if (results && results.length > 0) {
      res.json({ image: results[0].image, title: results[0].title });
    } else {
      res.json({ image: null });
    }

  } catch (err) {
    console.error('Image error:', err.response?.data || err.message);
    res.status(500).json({ image: null });
  }
});

/* ─────────────────────────────────────────
   Serve React App
───────────────────────────────────────── */
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

/* ─────────────────────────────────────────
   Start Server (Render Compatible)
───────────────────────────────────────── */
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NutriSync server running on port ${PORT}`);
});
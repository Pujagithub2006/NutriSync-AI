const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/physiology", async (req, res) => {
  try {
    const response = await axios.post(
      "http://localhost:8000/physiology",
      req.body
    );

    res.json(response.data);

  } catch (error) {
    console.error(error);
    res.status(500).send("Nutrition engine error");
  }
});

// ── Enhanced Physiology Route (Python Backend) ─────────────────────────────────────────
app.post("/api/physiology-enhanced", async (req, res) => {
  try {
    // Forward to Python backend's physiology endpoint
    const response = await axios.post(
      "http://localhost:8000/v1/physiology/sync",
      req.body
    );

    res.json(response.data);

  } catch (error) {
    console.error("Enhanced physiology error:", error);
    res.status(500).json({ error: "Enhanced physiology service unavailable" });
  }
});

// ── Real-time Vitals Route (Google Fit Integration) ─────────────────────────────────────
app.get("/api/vitals-realtime", async (req, res) => {
  try {
    // This would integrate with Google Fit ingestion
    const response = await axios.get(
      "http://localhost:8000/v1/physiology/today",
      {
        headers: {
          'Authorization': 'Bearer test-user-123'
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error("Real-time vitals error:", error);
    res.status(500).json({ error: "Real-time vitals unavailable" });
  }
});

// ── AI Chat (Groq) ────────────────────────────────────────────
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

// ── Food Image (Spoonacular) ──────────────────────────────────
app.get('/api/food-image', async (req, res) => {
  try {
    const { query } = req.query;

    // Simplify query — Spoonacular is Western-focused, strip regional/descriptive words
    const simplified = query
      .replace(/\(.*?\)/g, '')        // remove (Black-eyed Pea) style brackets
      .replace(/\bwith\b.*/i, '')     // remove "with ..." onwards
      .replace(/whole wheat|brown rice|grilled|steamed|masala|tikka|lobia|sabzi|curry|dal|roti|chapati|bhurji|tadka|makhani|paneer/gi, '')
      .replace(/\s+/g, ' ')           // collapse extra spaces
      .trim()
      .split(' ')
      .slice(0, 3)                    // max 3 words
      .join(' ');

    console.log(`🍱 Original: "${query}" → Simplified: "${simplified}"`);
    console.log('🔑 Spoonacular key exists:', !!process.env.SPOONACULAR_API_KEY);

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
    console.log('✅ Results found:', results?.length || 0, results?.[0]?.title || '');

    if (results && results.length > 0) {
      res.json({ image: results[0].image, title: results[0].title });
    } else {
      res.json({ image: null });
    }
  } catch (err) {
    console.error('❌ Image error:', err.response?.data || err.message);
    res.status(500).json({ image: null });
  }
});

app.listen(5000, '0.0.0.0', () => console.log('✅ Proxy running on http://localhost:5000'));
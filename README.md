# VICSTA Hackathon – Grand Finale
**VIT College, Kondhwa Campus | 5th – 6th March**

---

## Team Details

- **Team Name:** _DevNauts_
- **Members:** 
Puja Nikam,
Yash kalaskar,
Atharv Dubal,
Shloka Pampattiwar

- **Domain:** Health

---

## Project

**Problem:** **Most diet apps are manual and generic, you get the same meal suggestions as everyone else, regardless of whether your heart rate is elevated, your blood oxygen is low, or you're diabetic. Calories are treated as equal, even when they're not.Basically the physiological data is not considered while suggesting meals.**

**Solution:** **NutriSync AI is a real time nutrition ecosystem that reads your physiological state and recommends meals based on how food will actually interact with your body right now not just how many calories it contains.**

At the core is a **10 parameter dynamic health score** heart rate, SpO₂, HRV, stress, steps, BMI, calorie intake, medical risk, goal alignment, and glycemic index where weights automatically redistribute based on your medical history and live vitals, always summing to 100. This score maps to one of five tiers (Peak → Critical), and each tier sends a completely different prompt to the AI, changing its entire nutritional strategy.

Every meal comes with a **Glycemic Impact Score** that goes beyond GI and GL it factors in protein buffering, fiber content, anti-spike ingredients, medical conditions, and live vitals like cortisol-glucose interaction during high stress. Two meals with identical calories can score 78 and 31, and the app tells you exactly why.

A **Full Day Plan** generates breakfast, lunch, snack, dinner, an exercise schedule, and a hydration plan in one tap all driven by morning vitals. Everything syncs to the cloud in real time so your profile and diary follow you across devices. The architecture is wearable ready simulated vitals swap to Apple HealthKit or Google Fit with a single API change.

---

## Rules to Remember

- All development must happen **during** the hackathon only
- Push code **regularly** — commit history is monitored
- Use only open-source libraries with compatible licenses and **credit them**
- Only **one submission** per team
- All members must be present **both days**

---

## Attribution

- [React](https://reactjs.org) — Frontend UI framework (MIT License)
- [Vite](https://vitejs.dev) — Development build tool (MIT License)
- [Express.js](https://expressjs.com) — Proxy server for API key management (MIT License)
- [Groq API](https://groq.com) — LLaMA 3.1-8b-instant for AI meal, exercise and hydration recommendations
- [Spoonacular API](https://spoonacular.com/food-api) — Food images for meal cards
- [Firebase Authentication](https://firebase.google.com) — User login and signup
- [Firebase Firestore](https://firebase.google.com) — Cloud storage for profiles and food diary
- [cors](https://www.npmjs.com/package/cors) — Cross-origin request handling (MIT License)
- [dotenv](https://www.npmjs.com/package/dotenv) — Environment variable management (BSD-2 License)
- [Google Fonts — Syne & Inter](https://fonts.google.com) — UI typography (Open Font License)

---

> *"The world is not enough, but it is such a perfect place to start."* — James Bond
>
> All the best to every team. Build something great. 🚀

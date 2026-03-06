#!/usr/bin/env bash

echo "Starting NutriSync services..."

# Start Python engine
cd nutricalc-engine
uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# Google Fit ingestion
python google_fit_ingestion.py &

cd ..

# Start Node backend (also serves frontend build)
node server.js
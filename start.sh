#!/usr/bin/env bash

# start python engine
cd nutricalc-engine
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
python google_fit_ingestion.py &

cd ..

# start node backend
node server.js &

# start frontend
npm start
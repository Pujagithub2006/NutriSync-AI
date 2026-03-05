#!/usr/bin/env python3
"""
Google Fit Data Ingestion Script
Fetches health data from Google Fit API and sends it to backend
"""

import os
import json
import asyncio
import aiohttp
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GoogleFitDataIngestor:
    def __init__(self, backend_url: str = "http://localhost:8000", auth_token: str = None):
        self.backend_url = backend_url
        self.auth_token = auth_token
        self.google_client_id = os.getenv("GOOGLE_CLIENT_ID", "464284139607-i4qeo3dpg1pvrqs1kai1qu7n6njd95ak.apps.googleusercontent.com")
        self.scopes = [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email", 
            "https://www.googleapis.com/auth/fitness.activity.read",
            "https://www.googleapis.com/auth/fitness.body.read",
            "https://www.googleapis.com/auth/fitness.heart_rate.read",
            "https://www.googleapis.com/auth/fitness.sleep.read",
            "https://www.googleapis.com/auth/fitness.blood_pressure.read",
        ]
        
    async def get_google_access_token(self) -> str:
        """
        Get Google OAuth2 access token
        For production, use proper OAuth2 flow with refresh tokens
        For testing, you can manually provide a token
        """
        # Check if we have a token in environment
        token = os.getenv("GOOGLE_ACCESS_TOKEN")
        if token:
            return token
            
        # Otherwise, you'll need to implement OAuth2 flow
        # For now, raise error to require token
        raise ValueError(
            "Google access token required. Set GOOGLE_ACCESS_TOKEN environment variable "
            "or implement OAuth2 flow. Get token from: https://developers.google.com/oauthplayground/"
        )
    
    async def fetch_google_fit_data(self, access_token: str, data_type: str, days: int = 7) -> Dict:
        """Fetch specific data type from Google Fit API"""
        
        fitness_api = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate"
        day_ms = 86400000
        now_ms = int((datetime.now(timezone.utc).timestamp() * 1000))
        start_time_ms = now_ms - (days * day_ms)
        
        payload = {
            "aggregateBy": [{"dataTypeName": data_type}],
            "bucketByTime": {"durationMillis": day_ms},
            "startTimeMillis": start_time_ms,
            "endTimeMillis": now_ms,
        }
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(fitness_api, headers=headers, json=payload) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    logger.error(f"Google Fit API error for {data_type}: {response.status} - {error_text}")
                    return {}
    
    async def fetch_all_health_data(self, access_token: str) -> Dict[str, Any]:
        """Fetch all health data from Google Fit"""
        
        data_types = {
            "steps": "com.google.step_count.delta",
            "calories": "com.google.calories.expended", 
            "heart_rate": "com.google.heart_rate.bpm",
            "weight": "com.google.weight",
            "blood_pressure": "com.google.blood_pressure",
            "sleep": "com.google.sleep.segment",
            "active_minutes": "com.google.active_minutes"
        }
        
        logger.info("Fetching health data from Google Fit...")
        results = {}
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            for key, data_type in data_types.items():
                task = self.fetch_google_fit_data(access_token, data_type)
                tasks.append((key, task))
            
            for key, task in tasks:
                try:
                    result = await task
                    results[key] = result
                    logger.info(f"Fetched {key}: {len(result.get('bucket', []))} data points")
                except Exception as e:
                    logger.error(f"Failed to fetch {key}: {e}")
                    results[key] = {}
        
        return results
    
    def parse_steps_data(self, data: Dict) -> List[Dict]:
        """Parse steps data from Google Fit response"""
        steps = []
        for bucket in data.get('bucket', []):
            start_time = bucket.get('startTimeMillis')
            point = bucket.get('dataset', [{}])[0].get('point', [{}])[0]
            value = point.get('value', [{}])[0].get('intVal', 0)
            
            if start_time and value:
                date = datetime.fromtimestamp(int(start_time) / 1000, tz=timezone.utc)
                steps.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'value': value
                })
        return steps
    
    def parse_calories_data(self, data: Dict) -> List[Dict]:
        """Parse calories data from Google Fit response"""
        calories = []
        for bucket in data.get('bucket', []):
            start_time = bucket.get('startTimeMillis')
            point = bucket.get('dataset', [{}])[0].get('point', [{}])[0]
            value = point.get('value', [{}])[0].get('fpVal', 0)
            
            if start_time and value:
                date = datetime.fromtimestamp(int(start_time) / 1000, tz=timezone.utc)
                calories.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'value': round(value, 1)
                })
        return calories
    
    def parse_heart_rate_data(self, data: Dict) -> List[Dict]:
        """Parse heart rate data from Google Fit response"""
        heart_rates = []
        for bucket in data.get('bucket', []):
            start_time = bucket.get('startTimeMillis')
            point = bucket.get('dataset', [{}])[0].get('point', [{}])[0]
            values = point.get('value', [])
            
            if start_time and len(values) >= 3:
                date = datetime.fromtimestamp(int(start_time) / 1000, tz=timezone.utc)
                heart_rates.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'avg': round(values[0].get('fpVal', 0)),
                    'min': round(values[1].get('fpVal', 0)),
                    'max': round(values[2].get('fpVal', 0))
                })
        return heart_rates
    
    def parse_weight_data(self, data: Dict) -> List[Dict]:
        """Parse weight data from Google Fit response"""
        weights = []
        for bucket in data.get('bucket', []):
            start_time = bucket.get('startTimeMillis')
            point = bucket.get('dataset', [{}])[0].get('point', [{}])[0]
            value = point.get('value', [{}])[0].get('fpVal', 0)
            
            if start_time and value:
                date = datetime.fromtimestamp(int(start_time) / 1000, tz=timezone.utc)
                weights.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'value': round(value, 1)
                })
        return weights
    
    def parse_sleep_data(self, data: Dict) -> float:
        """Parse sleep data from Google Fit response"""
        total_minutes = 0
        for bucket in data.get('bucket', []):
            for dataset in bucket.get('dataset', []):
                for point in dataset.get('point', []):
                    sleep_type = point.get('value', [{}])[0].get('intVal')
                    if sleep_type in [72, 73]:  # Sleep types
                        start_nanos = int(point.get('startTimeNanos', 0))
                        end_nanos = int(point.get('endTimeNanos', 0))
                        duration_minutes = (end_nanos - start_nanos) / 1e9 / 60
                        total_minutes += duration_minutes
        
        return round(total_minutes / 60, 1)  # Convert to hours
    
    def transform_for_backend(self, health_data: Dict[str, Any]) -> List[Dict]:
        """Transform Google Fit data to backend schema"""
        
        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        
        # Parse each data type
        steps_data = self.parse_steps_data(health_data.get('steps', {}))
        calories_data = self.parse_calories_data(health_data.get('calories', {}))
        heart_rate_data = self.parse_heart_rate_data(health_data.get('heart_rate', {}))
        weight_data = self.parse_weight_data(health_data.get('weight', {}))
        sleep_hours = self.parse_sleep_data(health_data.get('sleep', {}))
        
        # Get today's data
        today_steps = next((s['value'] for s in steps_data if s['date'] == today), 0)
        today_calories = next((c['value'] for c in calories_data if c['date'] == today), 0)
        today_heart_rate = next((hr['avg'] for hr in heart_rate_data if hr['date'] == today), 0)
        today_weight = next((w['value'] for w in weight_data if w['date'] == today), 0)
        
        # Create payload for backend
        payload = {
            "heart_rate_bpm": today_heart_rate if today_heart_rate > 0 else None,
            "hrv_ms": None,
            "spo2": None,
            "sleep_hours": sleep_hours if sleep_hours > 0 else None,
            "sleep_quality": int(min(max(sleep_hours * 1.14, 1), 10)) if sleep_hours > 0 else None,  # Convert to 1-10 scale
            "steps": today_steps if today_steps > 0 else None,
            "active_calories": int(today_calories) if today_calories > 0 else None,
            "weight_kg": today_weight if today_weight > 0 else None,
            "water_ml": None,
            "blood_glucose_mmol": None,
            "stress_score": None,
            "source": "google_fit_script",
            "logged_at": datetime.now(timezone.utc).isoformat()
        }
        
        return [payload]
    
    async def send_to_backend(self, payloads: List[Dict]) -> bool:
        """Send transformed data to backend"""
        
        if not self.auth_token:
            logger.error("No auth token provided for backend")
            return False
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.auth_token}"
        }
        
        success_count = 0
        async with aiohttp.ClientSession() as session:
            for payload in payloads:
                try:
                    async with session.post(
                        f"{self.backend_url}/v1/physiology/sync",
                        headers=headers,
                        json=payload
                    ) as response:
                        if response.status == 201:
                            result = await response.json()
                            logger.info(f"✅ Data ingested successfully: {result.get('log_id')}")
                            success_count += 1
                        else:
                            error_text = await response.text()
                            logger.error(f"❌ Backend error: {response.status} - {error_text}")
                            
                except Exception as e:
                    logger.error(f"❌ Failed to send data to backend: {e}")
        
        return success_count > 0
    
    async def run_ingestion(self) -> bool:
        """Main ingestion process"""
        
        try:
            # Get Google access token
            access_token = await self.get_google_access_token()
            logger.info("✅ Got Google access token")
            
            # Fetch health data
            health_data = await self.fetch_all_health_data(access_token)
            logger.info("✅ Fetched health data from Google Fit")
            
            # Transform data
            payloads = self.transform_for_backend(health_data)
            logger.info(f"✅ Transformed data: {len(payloads)} records")
            
            # Send to backend
            success = await self.send_to_backend(payloads)
            if success:
                logger.info("🎉 Data ingestion completed successfully!")
            else:
                logger.error("❌ Data ingestion failed")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Ingestion process failed: {e}")
            return False

async def main():
    """Main function"""
    
    # Configuration
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    auth_token = os.getenv("BACKEND_AUTH_TOKEN")
    
    if not auth_token:
        logger.error("❌ BACKEND_AUTH_TOKEN environment variable required")
        logger.info("Set it: export BACKEND_AUTH_TOKEN=your_token_here")
        return
    
    # Create and run ingestor
    ingestor = GoogleFitDataIngestor(backend_url=backend_url, auth_token=auth_token)
    await ingestor.run_ingestion()

if __name__ == "__main__":
    asyncio.run(main())

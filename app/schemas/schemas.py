from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime
from app.models.models import (
    ActivityLevel, UserGoal, DietType,
    MealType, InputMethod, PhysioState
)
import uuid


# ── USER SCHEMAS ──────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    firebase_uid: str
    email: EmailStr
    display_name: Optional[str] = None


class UserOnboarding(BaseModel):
    # Basic biometrics
    age: Optional[int] = Field(None, gt=0, lt=120)
    gender: Optional[str] = None
    height_cm: Optional[float] = Field(None, gt=0, lt=300)
    weight_kg: Optional[float] = Field(None, gt=0, lt=500)
    target_weight_kg: Optional[float] = None
    activity_level: Optional[ActivityLevel] = None

    # Location and culture
    city: Optional[str] = None
    cuisine_region: Optional[str] = None
    diet_type: Optional[DietType] = None
    disliked_foods: Optional[List[str]] = []
    meal_timing: Optional[str] = None

    # Medical
    medical_conditions: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    medications: Optional[str] = None
    family_history: Optional[List[str]] = []

    # Goals
    primary_goal: Optional[UserGoal] = None
    target_weight_kg: Optional[float] = None

    # Wearable
    has_wearable: Optional[bool] = False
    wearable_type: Optional[str] = None
    hrv_baseline: Optional[float] = None
    resting_hr_baseline: Optional[float] = None


class UserResponse(BaseModel):
    user_id: uuid.UUID
    email: str
    display_name: Optional[str]
    age: Optional[int]
    gender: Optional[str]
    height_cm: Optional[float]
    weight_kg: Optional[float]
    activity_level: ActivityLevel
    city: Optional[str]
    cuisine_region: Optional[str]
    diet_type: DietType
    medical_conditions: List[str]
    allergies: List[str]
    primary_goal: UserGoal
    daily_calorie_target: Optional[int]
    has_wearable: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── PHYSIOLOGICAL SCHEMAS ─────────────────────────────────────────────────────

class PhysioSync(BaseModel):
    heart_rate_bpm: Optional[int] = Field(None, gt=0, lt=300)
    hrv_ms: Optional[float] = Field(None, gt=0)
    spo2: Optional[float] = Field(None, gt=0, lt=101)
    sleep_hours: Optional[float] = Field(None, gt=0, lt=24)
    sleep_quality: Optional[int] = Field(None, ge=1, le=10)
    steps: Optional[int] = Field(None, ge=0)
    active_calories: Optional[int] = Field(None, ge=0)
    weight_kg: Optional[float] = Field(None, gt=0)
    water_ml: Optional[int] = Field(None, ge=0)
    blood_glucose_mmol: Optional[float] = Field(None, gt=0)
    stress_score: Optional[int] = Field(None, ge=1, le=10)
    source: Optional[str] = "manual"
    logged_at: Optional[datetime] = None


class PhysioResponse(BaseModel):
    log_id: uuid.UUID
    logged_at: datetime
    heart_rate_bpm: Optional[int]
    hrv_ms: Optional[float]
    spo2: Optional[float]
    sleep_hours: Optional[float]
    steps: Optional[int]
    blood_glucose_mmol: Optional[float]
    physio_state: Optional[PhysioState]
    source: str

    class Config:
        from_attributes = True


class PhysioStateResponse(BaseModel):
    state: PhysioState
    score: int
    reasons: List[str]
    adjusted_calories: int
    base_calories: int


# ── FOOD LOG SCHEMAS ──────────────────────────────────────────────────────────

class FoodItem(BaseModel):
    name: str
    local_name: Optional[str] = None
    quantity_g: float = Field(gt=0)
    unit: Optional[str] = None
    cuisine_type: Optional[str] = None


class NutritionSummary(BaseModel):
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: Optional[float] = None
    sugar_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    glycaemic_index: Optional[float] = None


class TextLogCreate(BaseModel):
    text: str = Field(min_length=2, max_length=500)
    meal_type: MealType
    logged_at: Optional[datetime] = None
    notes: Optional[str] = None


class FoodLogResponse(BaseModel):
    log_id: uuid.UUID
    logged_at: datetime
    meal_type: MealType
    input_method: InputMethod
    foods: List[Any]
    nutrition_summary: Any
    ai_confidence: Optional[float]
    user_verified: bool

    class Config:
        from_attributes = True


class DailySummaryResponse(BaseModel):
    date: str
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    calorie_goal: int
    calories_remaining: int
    log_count: int


# ── MEAL SUGGESTION SCHEMAS ───────────────────────────────────────────────────

class SuggestionRequest(BaseModel):
    meal_type: Optional[MealType] = None
    physio_override: Optional[PhysioSync] = None


class SuggestionResponse(BaseModel):
    suggestion_id: uuid.UUID
    dish_name: str
    components: List[str]
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    sodium_mg: Optional[float]
    glycaemic_index: Optional[float]
    physiological_reason: str
    physio_state: PhysioState
    meal_type: MealType
    confidence: float


class AcceptSuggestionRequest(BaseModel):
    suggestion_id: uuid.UUID
    meal_type: MealType
    logged_at: Optional[datetime] = None


# ── GENERIC ───────────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean,
    DateTime, Text, Enum as SAEnum, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ActivityLevel(str, enum.Enum):
    sedentary = "sedentary"
    lightly_active = "lightly_active"
    active = "active"
    very_active = "very_active"


class UserGoal(str, enum.Enum):
    lose_weight = "lose_weight"
    gain_muscle = "gain_muscle"
    manage_diabetes = "manage_diabetes"
    improve_energy = "improve_energy"
    general_health = "general_health"


class DietType(str, enum.Enum):
    omnivore = "omnivore"
    vegetarian = "vegetarian"
    eggetarian = "eggetarian"
    vegan = "vegan"
    jain = "jain"


class MealType(str, enum.Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"


class InputMethod(str, enum.Enum):
    ai_suggestion = "ai_suggestion"
    image = "image"
    voice = "voice"
    text = "text"
    barcode = "barcode"


class PhysioState(str, enum.Enum):
    high_performance = "high_performance"
    normal = "normal"
    recovery = "recovery"
    stress = "stress"


class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(String(128), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    display_name = Column(String(100), nullable=True)

    # Basic biometrics
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    target_weight_kg = Column(Float, nullable=True)
    activity_level = Column(SAEnum(ActivityLevel), default=ActivityLevel.lightly_active)

    # Location and culture
    city = Column(String(100), nullable=True)
    cuisine_region = Column(String(100), nullable=True)
    diet_type = Column(SAEnum(DietType), default=DietType.omnivore)
    disliked_foods = Column(ARRAY(Text), default=[])
    meal_timing = Column(String(50), default="3_meals")

    # Medical history
    medical_conditions = Column(ARRAY(Text), default=[])
    allergies = Column(ARRAY(Text), default=[])
    medications = Column(Text, nullable=True)
    family_history = Column(ARRAY(Text), default=[])

    # Goals
    primary_goal = Column(SAEnum(UserGoal), default=UserGoal.general_health)
    daily_calorie_target = Column(Integer, nullable=True)

    # Physiological baseline
    has_wearable = Column(Boolean, default=False)
    wearable_type = Column(String(50), nullable=True)
    hrv_baseline = Column(Float, nullable=True)
    resting_hr_baseline = Column(Float, nullable=True)

    # Push notifications
    fcm_token = Column(Text, nullable=True)

    premium_tier = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class PhysiologicalLog(Base):
    __tablename__ = "physiological_logs"

    log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    logged_at = Column(DateTime(timezone=True), nullable=False)

    heart_rate_bpm = Column(Integer, nullable=True)
    hrv_ms = Column(Float, nullable=True)
    spo2 = Column(Float, nullable=True)
    sleep_hours = Column(Float, nullable=True)
    sleep_quality = Column(Integer, nullable=True)
    steps = Column(Integer, nullable=True)
    active_calories = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)
    water_ml = Column(Integer, nullable=True)
    blood_glucose_mmol = Column(Float, nullable=True)
    stress_score = Column(Integer, nullable=True)

    source = Column(String(50), default="manual")
    physio_state = Column(SAEnum(PhysioState), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FoodLog(Base):
    __tablename__ = "food_logs"

    log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    logged_at = Column(DateTime(timezone=True), nullable=False)
    meal_type = Column(SAEnum(MealType), nullable=False)
    input_method = Column(SAEnum(InputMethod), nullable=False)

    foods = Column(JSONB, nullable=False, default=[])
    nutrition_summary = Column(JSONB, nullable=False, default={})

    ai_confidence = Column(Float, nullable=True)
    user_verified = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MealSuggestion(Base):
    __tablename__ = "meal_suggestions"

    suggestion_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    physio_state = Column(SAEnum(PhysioState), nullable=True)
    physio_snapshot = Column(JSONB, nullable=True)
    suggestion_data = Column(JSONB, nullable=False)
    meal_type = Column(SAEnum(MealType), nullable=False)

    was_accepted = Column(Boolean, nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
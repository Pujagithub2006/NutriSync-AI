from app.models.models import User, PhysiologicalLog, PhysioState
from app.schemas.schemas import PhysioSync


def classify_state(physio: PhysioSync, user: User) -> dict:
    score = 100
    reasons = []

    if physio.hrv_ms and user.hrv_baseline:
        drop = (user.hrv_baseline - physio.hrv_ms) / user.hrv_baseline
        if drop > 0.25:
            score -= 30
            reasons.append(f"HRV severely low ({round(drop*100)}% below baseline)")
        elif drop > 0.15:
            score -= 20
            reasons.append(f"HRV low ({round(drop*100)}% below baseline)")
        elif drop < -0.10:
            score += 10
            reasons.append("HRV above baseline — good recovery")

    if physio.spo2:
        if physio.spo2 < 93:
            score -= 35
            reasons.append(f"SpO2 critically low ({physio.spo2}%)")
        elif physio.spo2 < 95:
            score -= 20
            reasons.append(f"SpO2 low ({physio.spo2}%)")

    if physio.sleep_hours:
        if physio.sleep_hours < 5:
            score -= 25
            reasons.append(f"Severe sleep deficit ({physio.sleep_hours} hrs)")
        elif physio.sleep_hours < 6.5:
            score -= 15
            reasons.append(f"Sleep deficit ({physio.sleep_hours} hrs)")
        elif physio.sleep_hours >= 8:
            score += 10
            reasons.append("Well rested")

    if physio.steps:
        if physio.steps < 2000:
            score -= 10
            reasons.append("Very low activity today")
        elif physio.steps > 12000:
            score += 5
            reasons.append("High activity today")

    if physio.blood_glucose_mmol:
        if physio.blood_glucose_mmol > 7.0:
            score -= 20
            reasons.append(f"High blood glucose ({physio.blood_glucose_mmol} mmol/L)")
        elif physio.blood_glucose_mmol > 5.6:
            score -= 10
            reasons.append(f"Elevated blood glucose ({physio.blood_glucose_mmol} mmol/L)")

    score = max(0, min(100, score))

    if score >= 80:
        state = PhysioState.high_performance
    elif score >= 60:
        state = PhysioState.normal
    elif score >= 40:
        state = PhysioState.recovery
    else:
        state = PhysioState.stress

    return {"state": state, "score": score, "reasons": reasons}


def calculate_daily_target(user: User, physio: PhysiologicalLog) -> dict:
    if user.weight_kg and user.height_cm and user.age and user.gender:
        if user.gender.lower() == "male":
            bmr = 88.36 + (13.4 * user.weight_kg) + (4.8 * user.height_cm) - (5.7 * user.age)
        else:
            bmr = 447.6 + (9.25 * user.weight_kg) + (3.1 * user.height_cm) - (4.3 * user.age)
    else:
        bmr = 1800

    multipliers = {
        "sedentary": 1.2,
        "lightly_active": 1.375,
        "active": 1.55,
        "very_active": 1.725,
    }
    activity = user.activity_level.value if user.activity_level else "lightly_active"
    base_target = int(bmr * multipliers.get(activity, 1.375))

    delta = 0

    if physio.sleep_hours:
        if physio.sleep_hours < 6:
            delta -= 100
        elif physio.sleep_hours >= 8:
            delta += 50

    if physio.hrv_ms and user.hrv_baseline:
        drop = (user.hrv_baseline - physio.hrv_ms) / user.hrv_baseline
        if drop > 0.20:
            delta -= 150
        elif drop < -0.10:
            delta += 100

    if physio.steps:
        if physio.steps > 12000:
            delta += 200
        elif physio.steps < 3000:
            delta -= 80

    if physio.spo2 and physio.spo2 < 95:
        delta -= 100

    return {
        "base_target": base_target,
        "final_target": base_target + delta,
        "delta": delta,
    }
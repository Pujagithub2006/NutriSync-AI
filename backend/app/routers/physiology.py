from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.core.auth import get_current_user, FirebaseUser
from app.models.models import User, PhysiologicalLog
from app.schemas.schemas import PhysioSync, PhysioResponse, PhysioStateResponse, MessageResponse
from app.services.physio_service import classify_state, calculate_daily_target
from datetime import datetime, timezone, date
import uuid

router = APIRouter(prefix="/physiology", tags=["Physiology"])


@router.post("/sync", response_model=PhysioResponse, status_code=201)
async def sync_physio(
    payload: PhysioSync,
    current_user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.firebase_uid == current_user.uid)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    state_result = classify_state(payload, user)

    log = PhysiologicalLog(
        user_id=user.user_id,
        logged_at=payload.logged_at or datetime.now(timezone.utc),
        heart_rate_bpm=payload.heart_rate_bpm,
        hrv_ms=payload.hrv_ms,
        spo2=payload.spo2,
        sleep_hours=payload.sleep_hours,
        sleep_quality=payload.sleep_quality,
        steps=payload.steps,
        active_calories=payload.active_calories,
        weight_kg=payload.weight_kg,
        water_ml=payload.water_ml,
        blood_glucose_mmol=payload.blood_glucose_mmol,
        stress_score=payload.stress_score,
        source=payload.source or "manual",
        physio_state=state_result["state"],
    )
    db.add(log)
    await db.flush()
    return log


@router.get("/today", response_model=PhysioResponse)
async def get_today(
    current_user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.firebase_uid == current_user.uid)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    today_start = datetime.combine(date.today(), datetime.min.time())
    log_result = await db.execute(
        select(PhysiologicalLog).where(
            and_(
                PhysiologicalLog.user_id == user.user_id,
                PhysiologicalLog.logged_at >= today_start,
            )
        ).order_by(PhysiologicalLog.logged_at.desc())
    )
    log = log_result.scalars().first()
    if not log:
        raise HTTPException(status_code=404, detail="No physiological data for today.")
    return log


@router.get("/state", response_model=PhysioStateResponse)
async def get_state(
    current_user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.firebase_uid == current_user.uid)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    today_start = datetime.combine(date.today(), datetime.min.time())
    log_result = await db.execute(
        select(PhysiologicalLog).where(
            and_(
                PhysiologicalLog.user_id == user.user_id,
                PhysiologicalLog.logged_at >= today_start,
            )
        ).order_by(PhysiologicalLog.logged_at.desc())
    )
    log = log_result.scalars().first()

    if not log:
        raise HTTPException(status_code=404, detail="No physiological data for today.")

    state_result = classify_state(
        PhysioSync(
            heart_rate_bpm=log.heart_rate_bpm,
            hrv_ms=log.hrv_ms,
            spo2=log.spo2,
            sleep_hours=log.sleep_hours,
            steps=log.steps,
        ),
        user
    )
    target = calculate_daily_target(user, log)

    return PhysioStateResponse(
        state=state_result["state"],
        score=state_result["score"],
        reasons=state_result["reasons"],
        adjusted_calories=target["final_target"],
        base_calories=target["base_target"],
    )


@router.get("/history", response_model=list[PhysioResponse])
async def get_history(
    current_user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.firebase_uid == current_user.uid)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    logs_result = await db.execute(
        select(PhysiologicalLog)
        .where(PhysiologicalLog.user_id == user.user_id)
        .order_by(PhysiologicalLog.logged_at.desc())
        .limit(30)
    )
    return logs_result.scalars().all()
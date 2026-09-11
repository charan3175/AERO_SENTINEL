from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from .main import run_engine_pipeline
    from .engine_simulator import generate_engine_data
    from .database_service import (
        save_engine_telemetry,
        get_recent_telemetry,
    )
    from .fuzzy_health_model import calculate_fuzzy_health
    from .health_model import calculate_engine_health
    from .fault_detector import detect_fault
    from .rul_model import estimate_rul
    from .mission_risk import calculate_mission_risk

except ImportError:
    from main import run_engine_pipeline
    from engine_simulator import generate_engine_data

    from database_service import (
        save_engine_telemetry,
        get_recent_telemetry,
    )
    from fuzzy_health_model import calculate_fuzzy_health
    from health_model import calculate_engine_health
    from fault_detector import detect_fault
    from rul_model import estimate_rul
    from mission_risk import calculate_mission_risk


# ============================================================
# AERO-SENTINEL FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="AERO-SENTINEL API",
    description=(
        "AI-Enabled Digital Twin for "
        "MALE UAV Engine Reliability"
    ),
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "project": "AERO-SENTINEL",
        "status": "API running",
        "message": "Digital Twin backend is online",
    }


# ============================================================
# LIVE ENGINE STATUS
# ============================================================

@app.get("/engine/status")
def engine_status(
    fault: str = "normal"
):
    """
    Generate current engine telemetry and run
    the complete digital-twin pipeline.
    """

    result = run_engine_pipeline(
        fault=fault
    )

    # Store generated telemetry
    save_engine_telemetry(
        result["engine_data"],
        fault
    )

    return result


# ============================================================
# ENGINE HEALTH
# ============================================================

@app.get("/engine/health")
def engine_health():
    """
    Return current engine health result.
    """

    result = run_engine_pipeline(
        fault="normal"
    )

    return result["health"]


# ============================================================
# FAULT TEST
# ============================================================

@app.get("/engine/fault-test")
def engine_fault_test(
    fault: str = "overheating"
):
    """
    Run one simulated engine fault.
    """

    result = run_engine_pipeline(
        fault=fault
    )

    save_engine_telemetry(
        result["engine_data"],
        fault
    )

    return result





# ============================================================
# TELEMETRY HISTORY
# ============================================================

@app.get("/engine/history")
def engine_history(
    limit: int = 50
):
    """
    Return historical telemetry stored in PostgreSQL.
    """

    telemetry = get_recent_telemetry(
        limit
    )

    return {
        "count": len(telemetry),
        "telemetry": telemetry,
    }


# ============================================================
# AVAILABLE FAULTS
# ============================================================

@app.get("/faults")
def available_faults():
    """
    Return all available fault simulation modes.
    """

    return {
        "faults": [
            "normal",
            "overheating",
            "low_oil",
            "high_vibration",
            "misfire",
            "injector",
        ]
    }


# ============================================================
# MISSION REPLAY
# ============================================================

@app.get("/engine/replay")
def engine_replay(
    limit: int = 50
):
    """
    Reconstruct historical engine states from
    PostgreSQL telemetry.
    """

    telemetry = get_recent_telemetry(
        limit
    )

    replay_states = []

    for item in telemetry:

        # --------------------------------------------
        # Reconstruct engine data
        # --------------------------------------------

        engine_data = {
            "timestamp": item["timestamp"],
            "rpm": item["rpm"],
            "egt": item["egt"],
            "cht": item["cht"],
            "oil_pressure": item["oil_pressure"],
            "oil_temperature": item[
                "oil_temperature"
            ],
            "vibration": item[
                "vibration"
            ],
            "fuel_flow": item[
                "fuel_flow"
            ],
            "throttle": item[
                "throttle"
            ],
        }

        # --------------------------------------------
        # Recalculate engine health
        # --------------------------------------------

        health_result = calculate_fuzzy_health(
            engine_data
        )

        # --------------------------------------------
        # Recalculate fault
        # --------------------------------------------

        fault_result = detect_fault(
            engine_data
        )

        # --------------------------------------------
        # Recalculate RUL
        # --------------------------------------------

        rul_result = estimate_rul(
            health_result,
            fault_result
        )

        # --------------------------------------------
        # Recalculate mission risk
        # --------------------------------------------

        mission_risk = calculate_mission_risk(
            health_result,
            fault_result,
            rul_result,
            altitude=4500,
            ambient_temperature=32,
            throttle=engine_data.get(
                "throttle",
                70
            ),
            mission_duration=20,
        )

        # --------------------------------------------
        # Add reconstructed state
        # --------------------------------------------

        replay_states.append(
            {
                "timestamp": item[
                    "timestamp"
                ],

                "engine_data": engine_data,

                "health": health_result,

                "fault": fault_result,

                "rul": rul_result,

                "mission_risk": mission_risk,

                "fault_mode": item[
                    "fault_mode"
                ],
            }
        )

    return {
        "count": len(
            replay_states
        ),
        "replay": replay_states,
    }

@app.get("/engine/mission-scenario")
def engine_mission_scenario(
    fault: str = "normal",
    altitude: float = 4500,
    ambient_temperature: float = 32,
    throttle: float = 70,
    mission_duration: float = 20,
):
    """
    Run a mission-aware engine reliability scenario.

    The scenario combines:
    - Engine telemetry
    - Engine health
    - Fault detection
    - RUL estimation
    - Mission risk assessment

    IMPORTANT:
    This is a prototype decision-support model.
    It is not certified for real flight operations.
    """

    # ---------------------------------------------------------
    # 1. GENERATE ENGINE TELEMETRY
    # ---------------------------------------------------------

    engine_data = generate_engine_data(fault)

    # ---------------------------------------------------------
    # 2. ENGINE HEALTH
    # ---------------------------------------------------------

    health_result = calculate_fuzzy_health(
        engine_data
    )

    # ---------------------------------------------------------
    # 3. FAULT DETECTION
    # ---------------------------------------------------------

    fault_result = detect_fault(
        engine_data
    )

    # ---------------------------------------------------------
    # 4. RUL ESTIMATION
    # ---------------------------------------------------------

    rul_result = estimate_rul(
        health_result,
        fault_result
    )

    # ---------------------------------------------------------
    # 5. MISSION-AWARE RISK
    # ---------------------------------------------------------

    mission_risk = calculate_mission_risk(
        health_result,
        fault_result,
        rul_result,
        altitude=altitude,
        ambient_temperature=ambient_temperature,
        throttle=throttle,
        mission_duration=mission_duration,
    )

    # ---------------------------------------------------------
    # 6. SAVE TELEMETRY
    # ---------------------------------------------------------

    save_engine_telemetry(
        engine_data,
        fault
    )

    # ---------------------------------------------------------
    # 7. RETURN COMPLETE PIPELINE
    # ---------------------------------------------------------

    return {
        "engine_data": engine_data,
        "health": health_result,
        "fault": fault_result,
        "rul": rul_result,
        "mission_risk": mission_risk,
    }
# ============================================================
# SYSTEM INFORMATION
# ============================================================

@app.get("/system/info")
def system_info():
    """
    Return AERO-SENTINEL system information.
    """

    return {
        "system": "AERO-SENTINEL",

        "module": (
            "Digital Twin Engine Monitoring"
        ),

        "version": "1.0.0",

        "status": "ONLINE",

        "modules": [
            "Engine Simulator",
            "Health Monitoring",
            "Fault Detection",
            "RUL Prediction",
            "Mission Risk Assessment",
            "Mission Scenario Simulation",
            "Historical Telemetry",
            "Mission Replay",
            "AI Anomaly Detection",
        ],
    }
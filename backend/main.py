try:
    from .engine_simulator import generate_engine_data
    from .fault_detector import detect_fault
    from .rul_model import estimate_rul
    from .mission_risk import calculate_mission_risk
    from .fuzzy_health_model import calculate_fuzzy_health
    from .anomaly_detector import detect_anomalies
    from .database_service import get_recent_telemetry
except ImportError:  # pragma: no cover - supports running as a script from backend/
    from engine_simulator import generate_engine_data
    from fault_detector import detect_fault
    from rul_model import estimate_rul
    from mission_risk import calculate_mission_risk
    from fuzzy_health_model import calculate_fuzzy_health
    from anomaly_detector import detect_anomalies
    from database_service import get_recent_telemetry


def run_engine_pipeline(
    fault="normal",
    altitude=4500,
    ambient_temperature=32,
    throttle=None,
    mission_duration=20,
):

    engine_data = generate_engine_data(
        fault
    )

    # Use simulator throttle unless
    # mission scenario provides one.
    if throttle is None:
        throttle = engine_data.get(
            "throttle",
            70
        )

    # Keep simulated engine data
    # synchronized with mission throttle.
    engine_data["throttle"] = throttle

    health_result = calculate_fuzzy_health(
        engine_data
    )

    fault_result = detect_fault(
        engine_data
    )

    rul_result = estimate_rul(
        health_result,
        fault_result
    )

    mission_risk = calculate_mission_risk(
        health_result,
        fault_result,
        rul_result,
        altitude=altitude,
        ambient_temperature=ambient_temperature,
        throttle=throttle,
        mission_duration=mission_duration,
    )

    try:

        history = get_recent_telemetry(
            50
        )

        anomaly_result = detect_anomalies(
            history
        )

    except Exception as error:

        anomaly_result = {
            "status": "UNAVAILABLE",
            "anomaly": False,
            "anomaly_score": 0,
            "confidence": 0,
            "severity": "UNKNOWN",
            "message": (
                "Anomaly detection temporarily unavailable."
            ),
            "samples_analyzed": 0,
            "error": str(error),
        }

    return {
        "engine_data": engine_data,
        "health": health_result,
        "fault": fault_result,
        "rul": rul_result,
        "mission_risk": mission_risk,
        "anomaly": anomaly_result,
    }


if __name__ == "__main__":

    result = run_engine_pipeline(
        "normal"
    )

    print(
        "\n========================================"
    )

    print(
        "          AERO-SENTINEL"
    )

    print(
        "   DIGITAL TWIN ENGINE PIPELINE"
    )

    print(
        "========================================"
    )

    print(
        "\nENGINE DATA:"
    )

    print(
        result["engine_data"]
    )

    print(
        "\nENGINE HEALTH:"
    )

    print(
        result["health"]
    )

    print(
        "\nFAULT DETECTION:"
    )

    print(
        result["fault"]
    )

    print(
        "\nRUL ESTIMATION:"
    )

    print(
        result["rul"]
    )

    print(
        "\nMISSION RISK:"
    )

    print(
        result["mission_risk"]
    )

    print(
        "\nAI ANOMALY DETECTION:"
    )

    print(
        result["anomaly"]
    )

    print(
        "\n========================================"
    )

    print(
        "       PIPELINE EXECUTION COMPLETE"
    )

    print(
        "========================================"
    )
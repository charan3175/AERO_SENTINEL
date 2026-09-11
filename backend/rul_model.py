def estimate_rul(health_result, fault_result):
    """
    Prototype Remaining Useful Life (RUL) estimator.

    IMPORTANT:
    This is a simulated prototype model.
    It is NOT a certified prediction of real engine failure.
    """

    health = health_result["health"]
    severity = fault_result["severity"]
    fault = fault_result["fault"]

    # Base RUL range from engine health
    if health >= 90:
        min_rul = 80
        max_rul = 120
    elif health >= 75:
        min_rul = 60
        max_rul = 90
    elif health >= 60:
        min_rul = 40
        max_rul = 65
    elif health >= 40:
        min_rul = 20
        max_rul = 40
    elif health >= 20:
        min_rul = 5
        max_rul = 20
    else:
        min_rul = 1
        max_rul = 5

    # Reduce RUL when a fault is detected
    if severity == "CRITICAL":
        min_rul = max(1, min_rul - 8)
        max_rul = max(2, max_rul - 15)

    elif severity == "HIGH":
        min_rul = max(1, min_rul - 6)
        max_rul = max(2, max_rul - 10)

    elif severity == "MEDIUM":
        min_rul = max(1, min_rul - 3)
        max_rul = max(2, max_rul - 5)

    # Confidence
    if health >= 75:
        confidence = 85
    elif health >= 50:
        confidence = 75
    elif health >= 30:
        confidence = 68
    else:
        confidence = 60

    # RUL status
    if max_rul > 60:
        status = "HEALTHY"
    elif max_rul > 30:
        status = "MONITOR"
    elif max_rul > 10:
        status = "MAINTENANCE REQUIRED"
    else:
        status = "URGENT INSPECTION"

    # Explanation
    if fault == "NO SIGNIFICANT FAULT":
        reason = (
            "Engine condition is currently stable "
            "based on the available telemetry."
        )
    else:
        reason = (
            f"RUL reduced because of detected condition: {fault}"
        )

    # Recommendation
    if max_rul > 60:
        recommendation = "Continue normal monitoring."

    elif max_rul > 30:
        recommendation = (
            "Continue monitoring and plan preventive inspection."
        )

    elif max_rul > 10:
        recommendation = (
            "Schedule maintenance before the next major mission."
        )

    else:
        recommendation = (
            "Perform immediate engine inspection before mission."
        )

    return {
        "rul_min_hours": min_rul,
        "rul_max_hours": max_rul,
        "confidence": confidence,
        "status": status,
        "reason": reason,
        "recommendation": recommendation,
    }


if __name__ == "__main__":
    # Simple standalone test
    health_result = {
        "health": 78
    }

    fault_result = {
        "fault": "NO SIGNIFICANT FAULT",
        "severity": "LOW"
    }

    result = estimate_rul(
        health_result,
        fault_result
    )

    print("\nRUL MODEL TEST")
    print("----------------")
    print(result) 
# ============================================================
# AERO-SENTINEL
# ENGINE HEALTH MODEL
# ============================================================


def calculate_engine_health(data):
    """
    Calculate engine health based on simulated sensor values.

    Input:
        data = engine sensor dictionary

    Output:
        health analysis dictionary
    """

    # --------------------------------------------------------
    # Get sensor values
    # --------------------------------------------------------

    rpm = data["rpm"]
    egt = data["egt"]
    cht = data["cht"]
    oil_pressure = data["oil_pressure"]
    vibration = data["vibration"]

    # Start with perfect health
    health = 100

    problems = []

    # --------------------------------------------------------
    # 1. RPM CHECK
    # --------------------------------------------------------

    if rpm < 2200:
        health -= 15
        problems.append("RPM is significantly below normal")

    elif rpm < 2300:
        health -= 8
        problems.append("RPM is lower than expected")

    # --------------------------------------------------------
    # 2. EGT CHECK
    # --------------------------------------------------------

    if egt > 800:
        health -= 25
        problems.append("Exhaust Gas Temperature is very high")

    elif egt > 750:
        health -= 15
        problems.append("Exhaust Gas Temperature is high")

    elif egt > 720:
        health -= 7
        problems.append("Exhaust Gas Temperature is slightly high")

    # --------------------------------------------------------
    # 3. CHT CHECK
    # --------------------------------------------------------

    if cht > 190:
        health -= 20
        problems.append("Cylinder Head Temperature is very high")

    elif cht > 175:
        health -= 12
        problems.append("Cylinder Head Temperature is high")

    # --------------------------------------------------------
    # 4. OIL PRESSURE CHECK
    # --------------------------------------------------------

    if oil_pressure < 2.0:
        health -= 30
        problems.append("Oil pressure is critically low")

    elif oil_pressure < 3.0:
        health -= 18
        problems.append("Oil pressure is low")

    # --------------------------------------------------------
    # 5. VIBRATION CHECK
    # --------------------------------------------------------

    if vibration > 6.0:
        health -= 25
        problems.append("Engine vibration is very high")

    elif vibration > 4.0:
        health -= 15
        problems.append("Engine vibration is high")

    elif vibration > 3.0:
        health -= 7
        problems.append("Engine vibration is increasing")

    # --------------------------------------------------------
    # Keep health between 0 and 100
    # --------------------------------------------------------

    health = max(0, min(100, health))

    # --------------------------------------------------------
    # Determine status
    # --------------------------------------------------------

    if health >= 85:

        status = "NORMAL"
        severity = "LOW"

    elif health >= 70:

        status = "WARNING"
        severity = "MEDIUM"

    elif health >= 50:

        status = "CRITICAL"
        severity = "HIGH"

    else:

        status = "DANGER"
        severity = "VERY HIGH"

    # --------------------------------------------------------
    # Generate explanation
    # --------------------------------------------------------

    if len(problems) == 0:

        reason = "All monitored engine parameters are within the expected range."

        recommendation = "Continue normal operation and monitoring."

    else:

        reason = "; ".join(problems)

        if health >= 70:

            recommendation = "Continue monitoring and inspect the affected parameters."

        elif health >= 50:

            recommendation = "Schedule engine inspection before the next mission."

        else:

            recommendation = "Immediate engine inspection recommended before mission."

    # --------------------------------------------------------
    # Return analysis
    # --------------------------------------------------------

    return {
        "health": health,
        "status": status,
        "severity": severity,
        "reason": reason,
        "recommendation": recommendation
    }


# ============================================================
# TEST THE HEALTH MODEL
# ============================================================

if __name__ == "__main__":

    # Example normal engine data

    test_data = {
    "rpm": 2150,
    "egt": 810,
    "cht": 195,
    "oil_pressure": 4.0,
    "oil_temperature": 105,
    "vibration": 6.5,
    "fuel_flow": 25,
    "throttle": 75
}
    result = calculate_engine_health(test_data)

    print("\n==============================================")
    print("        AERO-SENTINEL HEALTH MODEL")
    print("==============================================")

    print(f"Engine Health : {result['health']}%")
    print(f"Status        : {result['status']}")
    print(f"Severity      : {result['severity']}")
    print(f"Reason        : {result['reason']}")
    print(f"Recommendation: {result['recommendation']}")

    print("==============================================")
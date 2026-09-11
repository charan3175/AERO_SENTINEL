def detect_fault(data):
    """
    Prototype multi-sensor engine fault detector.

    The detector combines multiple sensor indicators to identify
    possible engine faults.

    IMPORTANT:
    Thresholds are for simulation/prototype demonstration only.
    They are NOT certified real UAV engine limits.
    """

    rpm = float(data["rpm"])
    egt = float(data["egt"])
    cht = float(data["cht"])
    oil_pressure = float(data["oil_pressure"])
    oil_temperature = float(data["oil_temperature"])
    vibration = float(data["vibration"])
    fuel_flow = float(data["fuel_flow"])

    faults = []

    # -----------------------------------
    # 1. OVERHEATING
    # -----------------------------------

    overheating_score = 0
    overheating_evidence = []

    if egt > 750:
        overheating_score += 1
        overheating_evidence.append(
            "EGT is very high"
        )

    elif egt > 720:
        overheating_score += 1
        overheating_evidence.append(
            "EGT is elevated"
        )

    if cht > 190:
        overheating_score += 2
        overheating_evidence.append(
            "Cylinder head temperature is critically high"
        )

    elif cht > 175:
        overheating_score += 1
        overheating_evidence.append(
            "Cylinder head temperature is high"
        )

    if oil_temperature > 120:
        overheating_score += 2
        overheating_evidence.append(
            "Oil temperature is critically high"
        )

    elif oil_temperature > 105:
        overheating_score += 1
        overheating_evidence.append(
            "Oil temperature is high"
        )

    if overheating_score >= 2:
        faults.append({
            "fault": "POSSIBLE OVERHEATING",
            "score": overheating_score,
            "evidence": overheating_evidence,
            "recommendation": (
                "Check cooling system, combustion condition "
                "and thermal loading."
            )
        })

    # -----------------------------------
    # 2. LUBRICATION PROBLEM
    # -----------------------------------

    lubrication_score = 0
    lubrication_evidence = []

    if oil_pressure < 2.0:
        lubrication_score += 2
        lubrication_evidence.append(
            "Oil pressure is critically low"
        )

    elif oil_pressure < 3.0:
        lubrication_score += 1
        lubrication_evidence.append(
            "Oil pressure is low"
        )

    if oil_temperature > 120:
        lubrication_score += 2
        lubrication_evidence.append(
            "Oil temperature is critically high"
        )

    elif oil_temperature > 105:
        lubrication_score += 1
        lubrication_evidence.append(
            "Oil temperature is high"
        )

    if lubrication_score >= 2:
        faults.append({
            "fault": "POSSIBLE LUBRICATION PROBLEM",
            "score": lubrication_score,
            "evidence": lubrication_evidence,
            "recommendation": (
                "Inspect oil level, oil pump, filter "
                "and lubrication system."
            )
        })

    # -----------------------------------
    # 3. ABNORMAL VIBRATION
    # -----------------------------------

    vibration_score = 0
    vibration_evidence = []

    if vibration > 5.0:
        vibration_score += 2
        vibration_evidence.append(
            "Engine vibration is critically high"
        )

    elif vibration > 4.0:
        vibration_score += 1
        vibration_evidence.append(
            "Engine vibration is high"
        )

    if vibration > 3.5 and rpm < 2300:
        vibration_score += 1
        vibration_evidence.append(
            "High vibration combined with low RPM"
        )

    if vibration_score >= 2:
        faults.append({
            "fault": "POSSIBLE MECHANICAL/VIBRATION PROBLEM",
            "score": vibration_score,
            "evidence": vibration_evidence,
            "recommendation": (
                "Inspect engine mounting, rotating components "
                "and mechanical balance."
            )
        })

    # -----------------------------------
    # 4. MISFIRE
    # -----------------------------------

    misfire_score = 0
    misfire_evidence = []

    if rpm < 2250:
        misfire_score += 1
        misfire_evidence.append(
            "RPM is significantly lower than expected"
        )

    if egt > 720:
        misfire_score += 1
        misfire_evidence.append(
            "EGT is elevated"
        )

    if vibration > 3.5:
        misfire_score += 1
        misfire_evidence.append(
            "Engine vibration is elevated"
        )

    if fuel_flow < 16:
        misfire_score += 1
        misfire_evidence.append(
            "Fuel flow is unusually low"
        )

    if misfire_score >= 2:
        faults.append({
            "fault": "POSSIBLE MISFIRE",
            "score": misfire_score,
            "evidence": misfire_evidence,
            "recommendation": (
                "Inspect combustion stability, ignition "
                "and cylinder performance."
            )
        })

    # -----------------------------------
    # 5. INJECTOR PROBLEM
    # -----------------------------------

    injector_score = 0
    injector_evidence = []

    if egt > 740:
        injector_score += 1
        injector_evidence.append(
            "EGT is high"
        )

    if fuel_flow > 23:
        injector_score += 1
        injector_evidence.append(
            "Fuel flow is higher than expected"
        )

    if rpm < 2350:
        injector_score += 1
        injector_evidence.append(
            "RPM is below expected level"
        )

    if injector_score >= 2:
        faults.append({
            "fault": "POSSIBLE INJECTOR PROBLEM",
            "score": injector_score,
            "evidence": injector_evidence,
            "recommendation": (
                "Inspect fuel injector and fuel delivery system."
            )
        })

    # -----------------------------------
    # 6. SENSOR ANOMALY
    # -----------------------------------

    sensor_problems = []

    if rpm <= 0:
        sensor_problems.append(
            "Invalid RPM reading"
        )

    if egt < 300 or egt > 1000:
        sensor_problems.append(
            "EGT reading appears abnormal"
        )

    if cht < 0 or cht > 250:
        sensor_problems.append(
            "CHT reading appears abnormal"
        )

    if oil_pressure < 0:
        sensor_problems.append(
            "Invalid oil pressure reading"
        )

    if vibration < 0:
        sensor_problems.append(
            "Invalid vibration reading"
        )

    if sensor_problems:
        faults.append({
            "fault": "POSSIBLE SENSOR ANOMALY",
            "score": len(sensor_problems) + 2,
            "evidence": sensor_problems,
            "recommendation": (
                "Check sensor health, wiring and "
                "data acquisition system."
            )
        })

    # -----------------------------------
    # NO FAULT
    # -----------------------------------

    if not faults:
        return {
            "fault": "NO SIGNIFICANT FAULT",
            "confidence": 95,
            "severity": "LOW",
            "evidence": [
                "Engine parameters are within prototype normal ranges"
            ],
            "recommendation": (
                "Continue monitoring engine condition."
            )
        }

    # -----------------------------------
    # SELECT MOST LIKELY FAULT
    # -----------------------------------

    best_fault = max(
        faults,
        key=lambda x: x["score"]
    )

    # -----------------------------------
    # CONFIDENCE AND SEVERITY
    # -----------------------------------

    score = best_fault["score"]

    if score >= 4:
        confidence = 95
        severity = "CRITICAL"

    elif score >= 3:
        confidence = 90
        severity = "HIGH"

    else:
        confidence = 80
        severity = "MEDIUM"

    # -----------------------------------
    # RETURN RESULT
    # -----------------------------------

    return {
        "fault": best_fault["fault"],
        "confidence": confidence,
        "severity": severity,
        "evidence": best_fault["evidence"],
        "recommendation": best_fault["recommendation"]
    }


# -----------------------------------
# TEST THE MODULE
# -----------------------------------

if __name__ == "__main__":

    normal_data = {
        "rpm": 2400,
        "egt": 680,
        "cht": 155,
        "oil_pressure": 4.4,
        "oil_temperature": 92,
        "vibration": 2.0,
        "fuel_flow": 20,
        "throttle": 70
    }

    result = detect_fault(normal_data)

    print("\n========== AERO-SENTINEL ==========")
    print("        FAULT DETECTOR")
    print("====================================")

    print(
        "Fault:",
        result["fault"]
    )

    print(
        "Confidence:",
        result["confidence"],
        "%"
    )

    print(
        "Severity:",
        result["severity"]
    )

    print("\nEvidence:")

    for item in result["evidence"]:
        print("-", item)

    print("\nRecommendation:")
    print(result["recommendation"])
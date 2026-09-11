import random
import time
from datetime import datetime


# ============================================================
# AERO-SENTINEL
# MALE UAV PISTON ENGINE SIMULATOR
# ============================================================


def generate_engine_data(fault="normal"):
    """
    Generate simulated engine sensor data.

    fault options:
        normal
        overheating
        low_oil
        high_vibration
        misfire
        injector
    """

    # --------------------------------------------------------
    # 1. NORMAL ENGINE VALUES
    # --------------------------------------------------------

    rpm = random.randint(2350, 2450)

    egt = random.uniform(650, 710)          # Exhaust Gas Temperature
    cht = random.uniform(145, 165)          # Cylinder Head Temperature

    oil_pressure = random.uniform(4.0, 4.8) # bar
    oil_temperature = random.uniform(85, 100)

    vibration = random.uniform(1.5, 2.5)    # mm/s

    fuel_flow = random.uniform(18, 22)      # L/hour

    throttle = random.uniform(65, 80)       # %

    # --------------------------------------------------------
    # 2. FAULT INJECTION
    # --------------------------------------------------------

    if fault == "overheating":

        egt += random.uniform(80, 120)
        cht += random.uniform(25, 40)

    elif fault == "low_oil":

        oil_pressure = random.uniform(1.5, 2.5)
        oil_temperature += random.uniform(15, 30)

    elif fault == "high_vibration":

        vibration = random.uniform(5.0, 8.0)

    elif fault == "misfire":

        rpm -= random.randint(150, 300)
        egt += random.uniform(50, 90)
        vibration += random.uniform(1.5, 3.0)

    elif fault == "injector":

        rpm -= random.randint(80, 180)
        egt += random.uniform(40, 80)
        fuel_flow += random.uniform(3, 6)

    # --------------------------------------------------------
    # 3. RETURN SENSOR DATA
    # --------------------------------------------------------

    return {
        "timestamp": datetime.now().strftime("%H:%M:%S"),

        "rpm": round(rpm, 1),

        "egt": round(egt, 1),

        "cht": round(cht, 1),

        "oil_pressure": round(oil_pressure, 2),

        "oil_temperature": round(oil_temperature, 1),

        "vibration": round(vibration, 2),

        "fuel_flow": round(fuel_flow, 2),

        "throttle": round(throttle, 1)
    }


# ============================================================
# DISPLAY ENGINE DATA
# ============================================================


def display_engine_data(data):

    print("\n" + "=" * 55)

    print("             AERO-SENTINEL")

    print("          ENGINE TELEMETRY")

    print("=" * 55)

    print(f"Timestamp          : {data['timestamp']}")

    print(f"RPM                : {data['rpm']}")

    print(f"EGT                : {data['egt']} °C")

    print(f"CHT                : {data['cht']} °C")

    print(f"Oil Pressure       : {data['oil_pressure']} bar")

    print(f"Oil Temperature    : {data['oil_temperature']} °C")

    print(f"Vibration          : {data['vibration']} mm/s")

    print(f"Fuel Flow          : {data['fuel_flow']} L/hr")

    print(f"Throttle           : {data['throttle']} %")

    print("=" * 55)


# ============================================================
# SELECT ENGINE CONDITION
# ============================================================


def select_fault():

    print("\nSelect Engine Condition")

    print("-----------------------")

    print("1. Normal")

    print("2. Overheating")

    print("3. Low Oil Pressure")

    print("4. High Vibration")

    print("5. Misfire")

    print("6. Injector Problem")

    choice = input("\nEnter your choice (1-6): ")

    fault_options = {

        "1": "normal",

        "2": "overheating",

        "3": "low_oil",

        "4": "high_vibration",

        "5": "misfire",

        "6": "injector"
    }

    return fault_options.get(choice, "normal")


# ============================================================
# MAIN PROGRAM
# ============================================================


def main():

    print("\n")
    print("=" * 55)

    print("              AERO-SENTINEL")

    print("     MALE UAV ENGINE DIGITAL TWIN")

    print("=" * 55)

    print("\nStarting Engine Simulator...")

    fault = select_fault()

    print("\n---------------------------------------")

    print(f"Selected condition : {fault.upper()}")

    print("---------------------------------------")

    print("\nGenerating engine telemetry...")

    # Generate 10 readings

    for reading in range(10):

        data = generate_engine_data(fault)

        display_engine_data(data)

        time.sleep(1)

    print("\n=======================================")

    print("       SIMULATION COMPLETED")

    print("=======================================")


# ============================================================
# PROGRAM START
# ============================================================


if __name__ == "__main__":

    main()
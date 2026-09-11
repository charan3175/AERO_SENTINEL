try:
    from .database import get_connection
except ImportError:  # pragma: no cover - supports running as a script from backend/
    from database import get_connection


def save_engine_telemetry(engine_data, fault_mode="normal"):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        query = """
        INSERT INTO engine_telemetry (
            rpm,
            egt,
            cht,
            oil_pressure,
            oil_temperature,
            vibration,
            fuel_flow,
            throttle,
            fault_mode
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (
            engine_data["rpm"],
            engine_data["egt"],
            engine_data["cht"],
            engine_data["oil_pressure"],
            engine_data["oil_temperature"],
            engine_data["vibration"],
            engine_data["fuel_flow"],
            engine_data["throttle"],
            fault_mode,
        )

        cursor.execute(query, values)
        connection.commit()

        cursor.close()

    finally:
        connection.close()


def get_recent_telemetry(limit=50):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        query = """
        SELECT
            id,
            timestamp,
            rpm,
            egt,
            cht,
            oil_pressure,
            oil_temperature,
            vibration,
            fuel_flow,
            throttle,
            fault_mode
        FROM engine_telemetry
        ORDER BY id DESC
        LIMIT %s
        """

        cursor.execute(query, (limit,))

        rows = cursor.fetchall()

        telemetry = []

        for row in rows:
            telemetry.append({
                "id": row[0],
                "timestamp": row[1].isoformat(),
                "rpm": row[2],
                "egt": row[3],
                "cht": row[4],
                "oil_pressure": row[5],
                "oil_temperature": row[6],
                "vibration": row[7],
                "fuel_flow": row[8],
                "throttle": row[9],
                "fault_mode": row[10],
            })

        cursor.close()

        # Return oldest → newest for charts
        telemetry.reverse()

        return telemetry

    finally:
        connection.close()
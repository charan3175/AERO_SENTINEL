"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BrainCircuit,
  Gauge,
  Home as HomeIcon,
  Plane,
  Settings,
  ShieldCheck,
  Thermometer,
  Wrench,
  Droplets,
  Wind,
  Database,
  Clock3,
  Play,
  Pause,
  RotateCcw,
  Radio,
  History,
  Zap,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/* =========================================================
   DIGITAL TWIN
   ========================================================= */

const DigitalTwin = dynamic(
  () => import("./components/DigitalTwin"),
  {
    ssr: false,
  }
);

/* =========================================================
   TYPES
   ========================================================= */

type EngineData = {
  timestamp?: string;
  rpm?: number;
  egt?: number;
  cht?: number;
  oil_pressure?: number;
  oil_temperature?: number;
  vibration?: number;
  fuel_flow?: number;
  throttle?: number;
};

type HealthData = {
  health?: number;
  health_score?: number;
  status?: string;
  severity?: string;
  reason?: string;
  recommendation?: string;
};

type FaultData = {
  fault?: string;
  confidence?: number;
  severity?: string;
  evidence?: string[];
  recommendation?: string;
};

type RulData = {
  rul_min_hours?: number;
  rul_max_hours?: number;
  confidence?: number;
  status?: string;
  reason?: string;
  recommendation?: string;
};

type MissionRiskData = {
  risk_score?: number;
  risk_level?: string;
  risk_factors?: string[];
  decision?: string;
  recommendation?: string;

  mission_profile?: {
    mission_type?: string;
    altitude?: number;
    ambient_temperature?: number;
    throttle?: number;
    mission_duration?: number;
  };

  engine_condition?: {
    health?: number;
    fault?: string;
    fault_severity?: string;
    rul_min_hours?: number;
    rul_max_hours?: number;
  };
};

type AnomalyData = {
  status?: string;
  anomaly?: boolean;
  anomaly_score?: number;
  confidence?: number;
  severity?: string;
  message?: string;
  samples_analyzed?: number;
  features_used?: string[];
};

type PipelineData = {
  engine_data?: EngineData;
  health?: HealthData;
  fault?: FaultData;
  rul?: RulData;
  mission_risk?: MissionRiskData;
  anomaly?: AnomalyData;
};

type TelemetryHistory = {
  id: number;
  timestamp: string;
  rpm: number;
  egt: number;
  cht: number;
  oil_pressure: number;
  oil_temperature: number;
  vibration: number;
  fuel_flow: number;
  throttle: number;
  fault_mode: string;
};

type ReplayState = {
  timestamp: string;
  engine_data: EngineData;
  health: HealthData;
  fault: FaultData;
  rul: RulData;
  mission_risk: MissionRiskData;
  fault_mode: string;
};

/* =========================================================
   API
   ========================================================= */

const API_BASE_URL = "http://127.0.0.1:8001";

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function HomePage() {
  /* =========================================================
     LIVE DATA
     ========================================================= */

  const [engineData, setEngineData] =
    useState<EngineData | null>(null);

  const [pipelineData, setPipelineData] =
    useState<PipelineData | null>(null);

  const [telemetryHistory, setTelemetryHistory] =
    useState<TelemetryHistory[]>([]);

  const [connected, setConnected] =
    useState(false);

  const [selectedFault, setSelectedFault] =
    useState("normal");

  const [lastUpdate, setLastUpdate] =
    useState("--:--:--");

      /* =========================================================
     MISSION SCENARIO CONTROLS
     ========================================================= */

  const [missionAltitude, setMissionAltitude] =
    useState(4500);

  const [missionTemperature, setMissionTemperature] =
    useState(32);

  const [missionThrottle, setMissionThrottle] =
    useState(70);

  const [missionDuration, setMissionDuration] =
    useState(20);

  const [missionType, setMissionType] =
    useState("ISR");

  const [missionLoading, setMissionLoading] =
    useState(false);

  const [missionMessage, setMissionMessage] =
    useState(
      "Configure mission conditions and run the scenario."
    );

  const [missionResult, setMissionResult] =
    useState<PipelineData | null>(null);

  /* =========================================================
     MISSION REPLAY
     ========================================================= */

  const [replayData, setReplayData] =
    useState<ReplayState[]>([]);

  const [replayIndex, setReplayIndex] =
    useState(0);

  const [isReplayPlaying, setIsReplayPlaying] =
    useState(false);

  const [replayMode, setReplayMode] =
    useState(false);

  const [replaySpeed, setReplaySpeed] =
    useState(1);

  const replayTimerRef =
    useRef<NodeJS.Timeout | null>(null);


      /* =========================================================
     RUN MISSION SCENARIO
     ========================================================= */

  const runMissionScenario = async () => {
    if (missionLoading) {
      return;
    }

    setMissionLoading(true);

    setMissionMessage(
      "Running mission scenario..."
    );

    try {
      const params = new URLSearchParams({
        fault: selectedFault,
        altitude: String(missionAltitude),
        ambient_temperature: String(
          missionTemperature
        ),
        throttle: String(missionThrottle),
        mission_duration: String(
          missionDuration
        ),
        mission_type: missionType,
      });

      const response = await fetch(
        `${API_BASE_URL}/engine/mission-scenario?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Mission scenario failed: ${response.status}`
        );
      }

      const data: PipelineData =
        await response.json();

      setMissionResult(data);

      setPipelineData(data);

      setEngineData(
        data.engine_data ?? null
      );

      setConnected(true);

      setLastUpdate(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );

      setMissionMessage(
        "Mission scenario completed successfully."
      );

    } catch (error) {

      console.error(
        "Mission scenario error:",
        error
      );

      setMissionMessage(
        "Unable to run mission scenario. Check the backend."
      );

    } finally {

      setMissionLoading(false);
    }
  };
  /* =========================================================
     BACKEND CONNECTION
     ========================================================= */

  useEffect(() => {
    let isMounted = true;

    const fetchEngineData = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/engine/status?fault=${selectedFault}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Backend request failed: ${response.status}`
          );
        }

        const data: PipelineData =
          await response.json();

        if (!isMounted) return;

        setPipelineData(data);

        setEngineData(
          data.engine_data ?? null
        );

        setConnected(true);

        setLastUpdate(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      } catch (error) {
        console.error(
          "Backend connection error:",
          error
        );

        if (!isMounted) return;

        setConnected(false);
      }
    };

    const fetchTelemetryHistory = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/engine/history?limit=50`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `History request failed: ${response.status}`
          );
        }

        const data =
          await response.json();

        if (!isMounted) return;

        setTelemetryHistory(
          data.telemetry ?? []
        );
      } catch (error) {
        console.error(
          "Telemetry history error:",
          error
        );
      }
    };

    const fetchReplayData = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/engine/replay?limit=50`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Replay request failed: ${response.status}`
          );
        }

        const data =
          await response.json();

        if (!isMounted) return;

        setReplayData(
          data.replay ?? []
        );

        setReplayIndex(0);
      } catch (error) {
        console.error(
          "Mission replay error:",
          error
        );
      }
    };

    fetchEngineData();
    fetchTelemetryHistory();
    fetchReplayData();

    const engineInterval =
      setInterval(
        fetchEngineData,
        2000
      );

    const historyInterval =
      setInterval(
        fetchTelemetryHistory,
        5000
      );

    return () => {
      isMounted = false;

      clearInterval(
        engineInterval
      );

      clearInterval(
        historyInterval
      );
    };
  }, [selectedFault]);

  /* =========================================================
     MISSION REPLAY TIMER
     ========================================================= */

  useEffect(() => {
    if (!replayMode) {
      return;
    }

    if (!isReplayPlaying) {
      return;
    }

    if (replayData.length === 0) {
      return;
    }

    if (
      replayIndex >=
      replayData.length - 1
    ) {
      setIsReplayPlaying(false);
      return;
    }

    replayTimerRef.current =
      setTimeout(() => {
        setReplayIndex(
          (previous) =>
            previous + 1
        );
      }, 1000 / replaySpeed);

    return () => {
      if (replayTimerRef.current) {
        clearTimeout(
          replayTimerRef.current
        );
      }
    };
  }, [
    replayMode,
    isReplayPlaying,
    replayIndex,
    replaySpeed,
    replayData.length,
  ]);

  /* =========================================================
     REPLAY CONTROLS
     ========================================================= */

  const currentReplay =
    replayData.length > 0
      ? replayData[
          Math.min(
            replayIndex,
            replayData.length - 1
          )
        ]
      : null;

  const startReplay = () => {
    if (replayData.length === 0) {
      return;
    }

    setReplayMode(true);
    setIsReplayPlaying(true);
  };

  const pauseReplay = () => {
    setIsReplayPlaying(false);
  };

  const resetReplay = () => {
    setIsReplayPlaying(false);
    setReplayIndex(0);
  };

  const exitReplay = () => {
    setIsReplayPlaying(false);
    setReplayMode(false);
    setReplayIndex(0);
  };

  /* =========================================================
     ACTIVE DIGITAL TWIN DATA
     ========================================================= */

  const activeEngineData =
    replayMode && currentReplay
      ? currentReplay.engine_data
      : engineData;

  const activeHealth =
    replayMode && currentReplay
      ? currentReplay.health
      : pipelineData?.health;

  const activeFault =
    replayMode && currentReplay
      ? currentReplay.fault
      : pipelineData?.fault;

  const activeRul =
    replayMode && currentReplay
      ? currentReplay.rul
      : pipelineData?.rul;

  const activeMissionRisk =
    replayMode && currentReplay
      ? currentReplay.mission_risk
      : pipelineData?.mission_risk;

  /* =========================================================
     NAVIGATION
     ========================================================= */

  const navigation = [
    {
      name: "Dashboard",
      icon: HomeIcon,
      active: true,
    },
    {
      name: "Engine Health",
      icon: Gauge,
      active: false,
    },
    {
      name: "Sensors",
      icon: Activity,
      active: false,
    },
    {
      name: "Fault Detection",
      icon: AlertTriangle,
      active: false,
    },
    {
      name: "Predictions",
      icon: BrainCircuit,
      active: false,
    },
    {
      name: "Missions",
      icon: Plane,
      active: false,
    },
  ];

  /* =========================================================
     SENSOR DATA
     ========================================================= */

  const sensors = [
    {
      name: "RPM",
      value:
        activeEngineData?.rpm !== undefined
          ? activeEngineData.rpm.toFixed(0)
          : "--",
      unit: "rpm",
    },
    {
      name: "EGT",
      value:
        activeEngineData?.egt !== undefined
          ? activeEngineData.egt.toFixed(1)
          : "--",
      unit: "°C",
    },
    {
      name: "CHT",
      value:
        activeEngineData?.cht !== undefined
          ? activeEngineData.cht.toFixed(1)
          : "--",
      unit: "°C",
    },
    {
      name: "Oil Pressure",
      value:
        activeEngineData?.oil_pressure !== undefined
          ? activeEngineData.oil_pressure.toFixed(2)
          : "--",
      unit: "bar",
    },
    {
      name: "Oil Temperature",
      value:
        activeEngineData?.oil_temperature !== undefined
          ? activeEngineData.oil_temperature.toFixed(1)
          : "--",
      unit: "°C",
    },
    {
      name: "Vibration",
      value:
        activeEngineData?.vibration !== undefined
          ? activeEngineData.vibration.toFixed(2)
          : "--",
      unit: "mm/s",
    },
    {
      name: "Fuel Flow",
      value:
        activeEngineData?.fuel_flow !== undefined
          ? activeEngineData.fuel_flow.toFixed(2)
          : "--",
      unit: "L/hr",
    },
    {
      name: "Throttle",
      value:
        activeEngineData?.throttle !== undefined
          ? activeEngineData.throttle.toFixed(1)
          : "--",
      unit: "%",
    },
  ];

  /* =========================================================
     KPI DATA
     ========================================================= */

  const healthScore =
    activeHealth?.health ??
    activeHealth?.health_score;

  const healthStatus =
    activeHealth?.status ??
    "WAITING FOR DATA";

  const healthSeverity =
    activeHealth?.severity ??
    "UNKNOWN";

  const rulMin =
    activeRul?.rul_min_hours;

  const rulMax =
    activeRul?.rul_max_hours;

  const rulConfidence =
    activeRul?.confidence;

  const faultConfidence =
    activeFault?.confidence;

  const faultName =
    activeFault?.fault ??
    "NO FAULT DETECTED";

  const faultSeverity =
    activeFault?.severity ??
    "LOW";

  const riskLevel =
    activeMissionRisk?.risk_level ??
    "WAITING";

  const riskScore =
    activeMissionRisk?.risk_score;

  const missionDecision =
    activeMissionRisk?.decision ??
    "WAITING FOR ASSESSMENT";

  /* =========================================================
     AI ANOMALY DATA
     ========================================================= */

  const anomalyDetected =
    pipelineData?.anomaly?.anomaly ??
    false;

  const anomalyStatus =
    pipelineData?.anomaly?.status ??
    "WAITING";

  const anomalyScore =
    pipelineData?.anomaly?.anomaly_score ??
    0;

  const anomalyConfidence =
    pipelineData?.anomaly?.confidence ??
    0;

  const anomalySeverity =
    pipelineData?.anomaly?.severity ??
    "LOW";

  const anomalyMessage =
    pipelineData?.anomaly?.message ??
    "AI anomaly detector is waiting for telemetry.";

  const anomalySamples =
    pipelineData?.anomaly?.samples_analyzed ??
    0;

  /* =========================================================
     DIGITAL TWIN STATE
     ========================================================= */

  const twinHealth =
    healthScore !== undefined
      ? Math.round(healthScore)
      : 0;

  let twinState = "NORMAL";

  const activeFaultMode =
    replayMode && currentReplay
      ? currentReplay.fault_mode
      : selectedFault;

  if (
    activeFaultMode ===
      "overheating" ||
    activeFaultMode ===
      "low_oil" ||
    activeFaultMode ===
      "misfire"
  ) {
    twinState = "WARNING";
  }

  if (
    activeFaultMode ===
      "high_vibration" ||
    activeFaultMode ===
      "injector"
  ) {
    twinState = "ATTENTION";
  }

  if (twinHealth < 50) {
    twinState = "CRITICAL";
  }

  /* =========================================================
     PREDICTION MESSAGE
     ========================================================= */

  let predictionMessage =
    "Engine telemetry is being monitored continuously.";

  if (
    activeFaultMode ===
    "normal"
  ) {
    predictionMessage =
      "All monitored engine parameters are currently within the expected prototype operating range.";
  }

  if (
    activeFaultMode ===
    "overheating"
  ) {
    predictionMessage =
      "Elevated thermal behaviour detected. Monitor EGT and CHT closely.";
  }

  if (
    activeFaultMode ===
    "low_oil"
  ) {
    predictionMessage =
      "Low oil-pressure condition detected. Lubrication system requires attention.";
  }

  if (
    activeFaultMode ===
    "high_vibration"
  ) {
    predictionMessage =
      "Abnormal vibration detected. Mechanical condition should be inspected.";
  }

  if (
    activeFaultMode ===
    "misfire"
  ) {
    predictionMessage =
      "Combustion irregularity detected. Engine performance should be monitored.";
  }

  if (
    activeFaultMode ===
    "injector"
  ) {
    predictionMessage =
      "Possible injector abnormality detected. Fuel delivery should be inspected.";
  }

  /* =========================================================
     ALERT
     ========================================================= */

  const alertTitle =
    activeFaultMode === "normal"
      ? "No critical alerts"
      : faultName;

  const alertMessage =
    activeFaultMode === "normal"
      ? "Engine telemetry is being monitored continuously."
      : activeFault?.recommendation ??
        "Inspect engine condition and continue monitoring.";

  /* =========================================================
     CHART DATA
     ========================================================= */

  const chartData =
    telemetryHistory.map(
      (item) => ({
        ...item,

        time: new Date(
          item.timestamp
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      })
    );

  /* =========================================================
     REPLAY CHART DATA
     ========================================================= */

  const replayChartData =
    replayData.map(
      (item, index) => ({
        index,

        time: new Date(
          item.timestamp
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),

        rpm:
          item.engine_data.rpm ?? 0,

        egt:
          item.engine_data.egt ?? 0,

        cht:
          item.engine_data.cht ?? 0,

        health:
          item.health.health ??
          item.health.health_score ??
          0,

        risk:
          item.mission_risk.risk_score ??
          0,
      })
    );

  /* =========================================================
     RETURN UI
     ========================================================= */

  return (
    <main className="dashboard">

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            <Plane size={22} />
          </div>

          <div>
            <h1>AERO</h1>
            <span>SENTINEL</span>
          </div>

        </div>

        {/* SYSTEM STATUS */}

        <div className="system-status">

          <span
            className={`status-dot ${
              connected
                ? "online"
                : "offline"
            }`}
          />

          {connected
            ? "SYSTEM ONLINE"
            : "BACKEND OFFLINE"}

        </div>

        {/* NAVIGATION */}

        <nav className="navigation">

          <p className="nav-title">
            MONITORING
          </p>

          {navigation.map(
            (item) => {

              const Icon =
                item.icon;

              return (
                <div
                  key={item.name}
                  className={`nav-item ${
                    item.active
                      ? "active"
                      : ""
                  }`}
                >

                  <Icon size={18} />

                  <span>
                    {item.name}
                  </span>

                </div>
              );
            }
          )}

          <p className="nav-title secondary-title">
            SYSTEM
          </p>

          <div className="nav-item">
            <Bell size={18} />
            <span>Alerts</span>
          </div>

          <div className="nav-item">
            <Wrench size={18} />
            <span>Maintenance</span>
          </div>

          <div className="nav-item">
            <Settings size={18} />
            <span>Settings</span>
          </div>

        </nav>

        {/* SIDEBAR FOOTER */}

        <div className="sidebar-footer">

          <ShieldCheck size={18} />

          <div>

            <strong>
              Secure Link
            </strong>

            <span>
              Telemetry encrypted
            </span>

          </div>

        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <section className="main-content">

        {/* ===================================================
            HEADER
            =================================================== */}

        <header className="top-header">

          <div>

            <p className="eyebrow">
              UAV ENGINE MONITORING
            </p>

            <h2>
              Mission Overview
            </h2>

          </div>

          <div className="header-right">

            {/* CONNECTION */}

            <div className="connection">

              <span
                className={`status-dot ${
                  connected
                    ? "online"
                    : "offline"
                }`}
              />

              {replayMode
                ? "Mission Replay"
                : connected
                  ? "Live Telemetry"
                  : "Telemetry Offline"}

            </div>

            {/* FAULT SIMULATOR */}

            <div className="fault-selector">

              <label htmlFor="fault-select">
                SIMULATION
              </label>

              <select
                id="fault-select"
                value={selectedFault}
                onChange={(e) =>
                  setSelectedFault(
                    e.target.value
                  )
                }
                disabled={replayMode}
              >

                <option value="normal">
                  Normal Operation
                </option>

                <option value="overheating">
                  Overheating
                </option>

                <option value="low_oil">
                  Low Oil Pressure
                </option>

                <option value="high_vibration">
                  High Vibration
                </option>

                <option value="misfire">
                  Misfire
                </option>

                <option value="injector">
                  Injector Problem
                </option>

              </select>

            </div>

            {/* UAV ID */}

            <div className="uav-id">

              <span>
                UAV
              </span>

              <strong>
                AS-001
              </strong>

            </div>

          </div>

        </header>

        {/* ===================================================
            REPLAY MODE BANNER
            =================================================== */}

        {replayMode && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "12px 16px",
              marginBottom: 18,
              borderRadius: 12,
              background:
                "linear-gradient(90deg, #111827, #1e293b)",
              color: "white",
              border:
                "1px solid #334155",
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >

              <History size={20} />

              <div>

                <strong>
                  MISSION REPLAY MODE
                </strong>

                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.7,
                    marginTop: 3,
                  }}
                >
                  Historical telemetry is driving the
                  Digital Twin
                </div>

              </div>

            </div>

            <button
              onClick={exitReplay}
              style={{
                border: "1px solid #64748b",
                background: "transparent",
                color: "white",
                padding: "7px 12px",
                borderRadius: 7,
                cursor: "pointer",
              }}
            >
              Exit Replay
            </button>

          </div>
        )}

        {/* ===================================================
            KPI CARDS
            =================================================== */}

        <div className="kpi-grid">

          {/* ENGINE HEALTH */}

          <div className="kpi-card health">

            <div className="kpi-header">

              <span>
                ENGINE HEALTH
              </span>

              <Activity size={19} />

            </div>

            <div className="kpi-value">

              {healthScore !== undefined
                ? Math.round(
                    healthScore
                  )
                : "--"}

              <span>
                %
              </span>

            </div>

            <p className="positive">
              ● {healthStatus}
            </p>

          </div>

          {/* RUL */}

          <div className="kpi-card">

            <div className="kpi-header">

              <span>
                RUL ESTIMATE
              </span>

              <Gauge size={19} />

            </div>

            <div className="kpi-value">

              {rulMin !== undefined &&
              rulMax !== undefined
                ? `${rulMin}-${rulMax}`
                : "--"}

              <span>
                hrs
              </span>

            </div>

            <p>
              Confidence{" "}
              {rulConfidence !== undefined
                ? `${rulConfidence}%`
                : "--"}
            </p>

          </div>

          {/* FAULT */}

          <div className="kpi-card">

            <div className="kpi-header">

              <span>
                FAULT CONFIDENCE
              </span>

              <AlertTriangle size={19} />

            </div>

            <div className="kpi-value">

              {faultConfidence !== undefined
                ? Math.round(
                    faultConfidence
                  )
                : "--"}

              <span>
                %
              </span>

            </div>

            <p>
              ● {faultName}
            </p>

          </div>

          {/* MISSION RISK */}

          <div className="kpi-card">

            <div className="kpi-header">

              <span>
                MISSION RISK
              </span>

              <ShieldCheck size={19} />

            </div>

            <div className="kpi-value">

              {riskLevel}

            </div>

            <p>

              ●{" "}

              {riskScore !== undefined
                ? `${riskScore}/100`
                : missionDecision}

            </p>

          </div>

        </div>

        {/* ===================================================
            DIGITAL TWIN + SENSOR OVERVIEW
            =================================================== */}

        <div className="main-grid">

          {/* DIGITAL TWIN */}

          <div className="panel digital-twin">

            <div className="panel-header">

              <div>

                <p className="panel-label">
                  DIGITAL TWIN
                </p>

                <h3>
                  {replayMode
                    ? "Historical Engine State"
                    : "Live Engine State"}
                </h3>

              </div>

              <span className="live-badge">

                {replayMode
                  ? "● REPLAY"
                  : connected
                    ? "● LIVE"
                    : "OFFLINE"}

              </span>

            </div>

            <DigitalTwin
              rpm={
                activeEngineData?.rpm ??
                0
              }

              health={
                twinHealth
              }

              fault={
                faultName
              }
            />

            {/* DIGITAL TWIN INFORMATION */}

            <div className="twin-footer">

              <div>

                <span>
                  Twin Status
                </span>

                <strong>
                  {twinState}
                </strong>

              </div>

              <div>

                <span>
                  RPM
                </span>

                <strong>

                  {activeEngineData?.rpm !== undefined
                    ? activeEngineData.rpm.toFixed(0)
                    : "--"}

                </strong>

              </div>

              <div>

                <span>
                  Health
                </span>

                <strong>

                  {healthScore !== undefined
                    ? `${Math.round(
                        healthScore
                      )}%`
                    : "--"}

                </strong>

              </div>

              <div>

                <span>
                  Model Status
                </span>

                <strong>
                  {replayMode
                    ? "Replay Synced"
                    : connected
                      ? "Synced"
                      : "Waiting"}
                </strong>

              </div>

              <div>

                <span>
                  Update Rate
                </span>

                <strong>
                  {replayMode
                    ? `${replaySpeed}x`
                    : "2 sec"}
                </strong>

              </div>

              <div>

                <span>
                  Last Update
                </span>

                <strong>

                  {replayMode &&
                  currentReplay
                    ? new Date(
                        currentReplay.timestamp
                      ).toLocaleTimeString()
                    : lastUpdate}

                </strong>

              </div>

            </div>

          </div>

          {/* SENSOR OVERVIEW */}

          <div className="panel sensor-panel">

            <div className="panel-header">

              <div>

                <p className="panel-label">
                  {replayMode
                    ? "REPLAY TELEMETRY"
                    : "REAL-TIME TELEMETRY"}
                </p>

                <h3>
                  Sensor Overview
                </h3>

              </div>

              <Activity size={20} />

            </div>

            <div className="sensor-list">

              {sensors.map(
                (sensor) => (

                  <div
                    className="sensor-row"
                    key={sensor.name}
                  >

                    <div className="sensor-name">

                      <div className="sensor-icon">

                        {sensor.name ===
                        "Vibration" ? (

                          <Wind size={16} />

                        ) : sensor.name ===
                          "RPM" ? (

                          <Activity size={16} />

                        ) : sensor.name ===
                            "Oil Pressure" ||
                          sensor.name ===
                            "Oil Temperature" ? (

                          <Droplets size={16} />

                        ) : (

                          <Thermometer
                            size={16}
                          />

                        )}

                      </div>

                      <span>
                        {sensor.name}
                      </span>

                    </div>

                    <div className="sensor-reading">

                      <strong>
                        {sensor.value}
                      </strong>

                      <span>
                        {sensor.unit}
                      </span>

                    </div>

                    <span
                      className={`sensor-status ${
                        replayMode
                          ? "sensor-live"
                          : connected
                            ? "sensor-live"
                            : "sensor-offline"
                      }`}
                    >

                      {replayMode
                        ? "REPLAY"
                        : connected
                          ? "LIVE"
                          : "OFFLINE"}

                    </span>

                  </div>

                )
              )}

            </div>

            <div className="telemetry-footer">

              <span>
                ● Data source:{" "}
                {replayMode
                  ? "PostgreSQL History"
                  : "Engine Simulator"}
              </span>

              <span>
                {replayMode
                  ? "Historical"
                  : connected
                    ? "Streaming"
                    : "Disconnected"}
              </span>

            </div>

          </div>

        </div>

        {/* ===================================================
            MISSION REPLAY
            =================================================== */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <p className="panel-label">
                MISSION ANALYSIS
              </p>

              <h3>
                Mission Replay
              </h3>

            </div>

            <History size={20} />

          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              marginBottom: 18,
            }}
          >

            {!replayMode ? (

              <button
                onClick={startReplay}
                disabled={
                  replayData.length === 0
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding:
                    "9px 15px",
                  border: "none",
                  borderRadius: 8,
                  background:
                    "#111827",
                  color: "white",
                  cursor:
                    replayData.length ===
                    0
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    replayData.length ===
                    0
                      ? 0.5
                      : 1,
                }}
              >
                <Play size={16} />
                Start Replay
              </button>

            ) : (

              <>
                <button
                  onClick={() =>
                    setIsReplayPlaying(
                      (previous) =>
                        !previous
                    )
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding:
                      "9px 15px",
                    border: "none",
                    borderRadius: 8,
                    background:
                      "#111827",
                    color: "white",
                    cursor: "pointer",
                  }}
                >

                  {isReplayPlaying ? (
                    <Pause size={16} />
                  ) : (
                    <Play size={16} />
                  )}

                  {isReplayPlaying
                    ? "Pause"
                    : "Play"}

                </button>

                <button
                  onClick={
                    resetReplay
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding:
                      "9px 15px",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius: 8,
                    background:
                      "white",
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw size={16} />
                  Reset
                </button>

              </>

            )}

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginLeft: 5,
                fontSize: 13,
              }}
            >

              Speed

              <select
                value={replaySpeed}
                onChange={(e) =>
                  setReplaySpeed(
                    Number(
                      e.target.value
                    )
                  )
                }
                style={{
                  padding:
                    "7px 10px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: 7,
                }}
              >

                <option value={0.5}>
                  0.5x
                </option>

                <option value={1}>
                  1x
                </option>

                <option value={2}>
                  2x
                </option>

                <option value={4}>
                  4x
                </option>

              </select>

            </label>

            <span
              style={{
                marginLeft: "auto",
                fontSize: 13,
                color: "#64748b",
              }}
            >
              {replayData.length} historical samples
            </span>

          </div>

          {/* REPLAY TIMELINE */}

          <div
            style={{
              marginBottom: 20,
            }}
          >

            <input
              type="range"
              min={0}
              max={
                Math.max(
                  0,
                  replayData.length - 1
                )
              }
              value={replayIndex}
              onChange={(e) => {
                setReplayMode(true);
                setIsReplayPlaying(false);
                setReplayIndex(
                  Number(
                    e.target.value
                  )
                );
              }}
              disabled={
                replayData.length === 0
              }
              style={{
                width: "100%",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                marginTop: 6,
                fontSize: 12,
                color: "#64748b",
              }}
            >

              <span>
                0
              </span>

              <span>
                Frame{" "}
                {replayData.length > 0
                  ? replayIndex + 1
                  : 0}{" "}
                /{" "}
                {replayData.length}
              </span>

              <span>
                {replayData.length > 0
                  ? new Date(
                      replayData[
                        replayData.length -
                          1
                      ].timestamp
                    ).toLocaleTimeString()
                  : "--:--:--"}
              </span>

            </div>

          </div>

          {/* REPLAY METRICS */}

          {currentReplay ? (

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 12,
              }}
            >

              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                }}
              >

                <span
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                  }}
                >
                  REPLAY RPM
                </span>

                <strong
                  style={{
                    display: "block",
                    fontSize: 22,
                    marginTop: 4,
                  }}
                >
                  {currentReplay.engine_data.rpm?.toFixed(
                    0
                  ) ?? "--"}
                </strong>

              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                }}
              >

                <span
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                  }}
                >
                  ENGINE HEALTH
                </span>

                <strong
                  style={{
                    display: "block",
                    fontSize: 22,
                    marginTop: 4,
                  }}
                >
                  {Math.round(
                    currentReplay.health.health ??
                    currentReplay.health.health_score ??
                    0
                  )}
                  %
                </strong>

              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                }}
              >

                <span
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                  }}
                >
                  FAULT
                </span>

                <strong
                  style={{
                    display: "block",
                    fontSize: 14,
                    marginTop: 7,
                  }}
                >
                  {currentReplay.fault.fault ??
                    "NONE"}
                </strong>

              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                }}
              >

                <span
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                  }}
                >
                  RUL
                </span>

                <strong
                  style={{
                    display: "block",
                    fontSize: 18,
                    marginTop: 5,
                  }}
                >
                  {currentReplay.rul.rul_min_hours ??
                    "--"}
                  -
                  {currentReplay.rul.rul_max_hours ??
                    "--"}{" "}
                  hrs
                </strong>

              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                }}
              >

                <span
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                  }}
                >
                  MISSION RISK
                </span>

                <strong
                  style={{
                    display: "block",
                    fontSize: 18,
                    marginTop: 5,
                  }}
                >
                  {currentReplay.mission_risk.risk_level ??
                    "--"}
                </strong>

              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                }}
              >

                <span
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                  }}
                >
                  FAULT MODE
                </span>

                <strong
                  style={{
                    display: "block",
                    fontSize: 14,
                    marginTop: 7,
                  }}
                >
                  {currentReplay.fault_mode}
                </strong>

              </div>

            </div>

          ) : (

            <div
              style={{
                padding: 25,
                textAlign: "center",
                color: "#64748b",
              }}
            >
              No replay data available.
              Generate telemetry first.
            </div>

          )}

        </div>

        {/* ===================================================
            POSTGRESQL HISTORICAL TELEMETRY
            =================================================== */}

        <div className="panel telemetry-history-panel">

          <div className="panel-header">

            <div>

              <p className="panel-label">
                POSTGRESQL HISTORY
              </p>

              <h3>
                Engine Telemetry Trends
              </h3>

            </div>

            <Database size={20} />

          </div>

          {chartData.length > 0 ? (

            <div
              className="telemetry-chart"
              style={{
                width: "100%",
                height: 320,
              }}
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="time"
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <YAxis />

                  <Tooltip />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="rpm"
                    name="RPM"
                    strokeWidth={2}
                    dot={false}
                  />

                  <Line
                    type="monotone"
                    dataKey="egt"
                    name="EGT"
                    strokeWidth={2}
                    dot={false}
                  />

                  <Line
                    type="monotone"
                    dataKey="cht"
                    name="CHT"
                    strokeWidth={2}
                    dot={false}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          ) : (

            <div className="history-empty">

              <Database size={24} />

              <span>
                Waiting for historical telemetry...
              </span>

            </div>

          )}

          <div className="history-footer">

            <span>

              <Database size={14} />

              PostgreSQL Connected

            </span>

            <span>

              <Clock3 size={14} />

              {telemetryHistory.length} records

            </span>

          </div>

        </div>

        {/* ===================================================
            REPLAY TREND
            =================================================== */}

        {replayData.length > 0 && (

          <div className="panel">

            <div className="panel-header">

              <div>

                <p className="panel-label">
                  MISSION REPLAY ANALYTICS
                </p>

                <h3>
                  Historical Health & Risk
                </h3>

              </div>

              <Zap size={20} />

            </div>

            <div
              style={{
                width: "100%",
                height: 280,
              }}
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={replayChartData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="time"
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <YAxis />

                  <Tooltip />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="health"
                    name="Health %"
                    strokeWidth={2}
                    dot={false}
                  />

                  <Line
                    type="monotone"
                    dataKey="risk"
                    name="Mission Risk"
                    strokeWidth={2}
                    dot={false}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

        )}

        {/* ===================================================
            SENSOR TREND CARDS
            =================================================== */}

        <div className="trend-grid">

          {/* OIL PRESSURE */}

          <div className="panel mini-chart">

            <div className="panel-header">

              <div>

                <p className="panel-label">
                  LUBRICATION
                </p>

                <h3>
                  Oil Pressure
                </h3>

              </div>

              <Droplets size={19} />

            </div>

            <div
              style={{
                width: "100%",
                height: 180,
              }}
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={chartData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="time"
                    hide
                  />

                  <YAxis
                    width={35}
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="oil_pressure"
                    name="Oil Pressure"
                    strokeWidth={2}
                    dot={false}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* VIBRATION */}

          <div className="panel mini-chart">

            <div className="panel-header">

              <div>

                <p className="panel-label">
                  MECHANICAL HEALTH
                </p>

                <h3>
                  Vibration
                </h3>

              </div>

              <Wind size={19} />

            </div>

            <div
              style={{
                width: "100%",
                height: 180,
              }}
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={chartData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="time"
                    hide
                  />

                  <YAxis
                    width={35}
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="vibration"
                    name="Vibration"
                    strokeWidth={2}
                    dot={false}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>

        {/* ===================================================
            AI ANOMALY DETECTION
            =================================================== */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <p className="panel-label">
                ARTIFICIAL INTELLIGENCE
              </p>

              <h3>
                AI Anomaly Detection
              </h3>

            </div>

            <BrainCircuit size={21} />

          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
            }}
          >

            <div
              style={{
                padding: 16,
                borderRadius: 10,
                background:
                  anomalyDetected
                    ? "#fff7ed"
                    : "#f8fafc",
                border:
                  anomalyDetected
                    ? "1px solid #fed7aa"
                    : "1px solid #e2e8f0",
              }}
            >

              <span
                style={{
                  fontSize: 11,
                  color: "#64748b",
                }}
              >
                AI STATUS
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: 7,
                  fontSize: 16,
                }}
              >
                {anomalyStatus}
              </strong>

            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 10,
                background: "#f8fafc",
                border:
                  "1px solid #e2e8f0",
              }}
            >

              <span
                style={{
                  fontSize: 11,
                  color: "#64748b",
                }}
              >
                ANOMALY SCORE
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: 7,
                  fontSize: 22,
                }}
              >
                {anomalyScore}
              </strong>

            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 10,
                background: "#f8fafc",
                border:
                  "1px solid #e2e8f0",
              }}
            >

              <span
                style={{
                  fontSize: 11,
                  color: "#64748b",
                }}
              >
                CONFIDENCE
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: 7,
                  fontSize: 22,
                }}
              >
                {anomalyConfidence}%
              </strong>

            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 10,
                background: "#f8fafc",
                border:
                  "1px solid #e2e8f0",
              }}
            >

              <span
                style={{
                  fontSize: 11,
                  color: "#64748b",
                }}
              >
                SEVERITY
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: 7,
                  fontSize: 16,
                }}
              >
                {anomalySeverity}
              </strong>

            </div>

          </div>

          <div
            style={{
              marginTop: 15,
              padding: 15,
              borderRadius: 9,
              background:
                anomalyDetected
                  ? "#fff7ed"
                  : "#f8fafc",
              border:
                anomalyDetected
                  ? "1px solid #fed7aa"
                  : "1px solid #e2e8f0",
            }}
          >

            <strong>
              {anomalyDetected
                ? "⚠ Abnormal engine behaviour detected"
                : "✓ Engine behaviour is currently consistent"}
            </strong>

            <p
              style={{
                margin:
                  "6px 0 0",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              {anomalyMessage}
            </p>

            <p
              style={{
                margin:
                  "7px 0 0",
                color: "#64748b",
                fontSize: 12,
              }}
            >
              Samples analysed:{" "}
              {anomalySamples}
            </p>

          </div>

        </div>

        {/* ===================================================
            AI + ALERTS
            =================================================== */}

        <div className="bottom-grid">

          {/* PREDICTIVE INSIGHTS */}

          <div className="panel prediction-panel">

            <div className="panel-header">

              <div>

                <p className="panel-label">
                  AI ANALYTICS
                </p>

                <h3>
                  Predictive Insights
                </h3>

              </div>

              <BrainCircuit
                size={21}
              />

            </div>

            <div className="insight">

              <div className="insight-icon">

                <BarChart3
                  size={19}
                />

              </div>

              <div>

                <strong>

                  {activeFaultMode ===
                  "normal"
                    ? "Engine operating normally"
                    : `Potential ${activeFaultMode.replace(
                        "_",
                        " "
                      )} detected`}

                </strong>

                <p>
                  {predictionMessage}
                </p>

              </div>

            </div>

            {/* RUL INFORMATION */}

            <div className="prediction-details">

              <div>

                <span>
                  Estimated RUL
                </span>

                <strong>

                  {rulMin !== undefined &&
                  rulMax !== undefined
                    ? `${rulMin}–${rulMax} hrs`
                    : "--"}

                </strong>

              </div>

              <div>

                <span>
                  Model Confidence
                </span>

                <strong>

                  {rulConfidence !== undefined
                    ? `${rulConfidence}%`
                    : "--"}

                </strong>

              </div>

              <div>

                <span>
                  Recommendation
                </span>

                <strong>

                  {activeRul
                    ?.recommendation ??
                    "Waiting for prediction..."}

                </strong>

              </div>

            </div>

          </div>

          {/* ALERTS */}

          <div className="panel alert-panel">

            <div className="panel-header">

              <div>

                <p className="panel-label">
                  SYSTEM EVENTS
                </p>

                <h3>
                  Latest Alert
                </h3>

              </div>

              <Bell size={20} />

            </div>

            <div className="alert-content">

              <span
                className={`alert-indicator ${
                  activeFaultMode ===
                  "normal"
                    ? "alert-normal"
                    : "alert-warning"
                }`}
              />

              <div>

                <strong>
                  {alertTitle}
                </strong>

                <p>
                  {alertMessage}
                </p>

              </div>

            </div>

            {/* FAULT EVIDENCE */}

            {activeFault
              ?.evidence &&
              activeFault.evidence
                .length > 0 && (

                <div className="fault-evidence">

                  <p>
                    Detection Evidence
                  </p>

                  {activeFault.evidence.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        key={index}
                        className="evidence-item"
                      >
                        • {item}
                      </div>

                    )
                  )}

                </div>

              )}

          </div>

        </div>

        {/* ===================================================
            ENGINE ANALYSIS FOOTER
            =================================================== */}

        <div className="analysis-footer">

          <div>

            <span>
              ENGINE CONDITION
            </span>

            <strong>
              {healthStatus}
            </strong>

          </div>

          <div>

            <span>
              FAULT SEVERITY
            </span>

            <strong>
              {faultSeverity}
            </strong>

          </div>

          <div>

            <span>
              MISSION RISK
            </span>

            <strong>
              {riskLevel}
            </strong>

          </div>

          <div>

            <span>
              MISSION DECISION
            </span>

            <strong>
              {missionDecision}
            </strong>

          </div>

        </div>

      </section>

    </main>
  );
}